const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { startServer, api, registerAndLogin, createAccount } = require('./helpers');

test.before(async () => {
  global.__baseUrl = await startServer();
});
test.after(require('./helpers').stopServer);

const writeTempCSV = (content) => {
  const file = path.join(os.tmpdir(), `import-${Math.random().toString(36).slice(2)}.csv`);
  fs.writeFileSync(file, content);
  return file;
};

const upload = async (token, accountId, content) => {
  const base = global.__baseUrl;
  const file = writeTempCSV(content);
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(file)], { type: 'text/csv' }), 'test.csv');
  form.append('account_id', String(accountId));
  const res = await fetch(`${base}/imports/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  return { status: res.status, data: await res.json() };
};

test('Complete CSV import flow: preview \u2192 validate \u2192 duplicates \u2192 AI \u2192 confirm', async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);

  const csv = [
    'Date,Description,Amount,Type',
    '2026-09-10,Lunch at cafeteria,400,debit',
    '2026-09-11,Bus fare,100,debit',
    '2026-09-12,Stipend received,3000,credit',
    '2026-09-10,Lunch at cafeteria,400,debit',
    'bad-row,,xx,debit'
  ].join('\n');

  // Step 1-4: Upload & preview
  const up = await upload(user.token, account.id, csv);
  assert.strictEqual(up.status, 201, JSON.stringify(up.data));
  const preview = up.data.data;
  assert.strictEqual(preview.total_rows, 5);
  assert.strictEqual(preview.valid_rows, 3);
  assert.strictEqual(preview.duplicate_rows, 1, 'intra-batch duplicate expected');
  assert.strictEqual(preview.invalid_rows, 1);
  assert.ok(preview.preview[0].suggested_category_id, 'AI should suggest categories');

  const importId = preview.import_id;

  // Step 5: user correction on first row
  const detail = await api('GET', `/imports/${importId}`, { token: user.token });
  const firstValid = detail.data.data.rows.find((r) => r.status === 'valid');
  const cats = await api('GET', '/categories?type=expense', { token: user.token });
  const entertainment = cats.data.data.categories.find((c) => c.name === 'Entertainment');
  const corrected = await api('PATCH', `/imports/${importId}/rows/${firstValid.id}`, {
    token: user.token, body: { category_id: entertainment.id, action: 'categorize' }
  });
  assert.strictEqual(corrected.status, 200);

  // Step 6: confirmation — database transaction
  const confirm = await api('POST', `/imports/${importId}/confirm`, { token: user.token, body: { skip_duplicates: true } });
  assert.strictEqual(confirm.status, 200);
  assert.strictEqual(confirm.data.data.imported, 3);
  assert.strictEqual(confirm.data.data.duplicates_skipped, 1);
  assert.strictEqual(confirm.data.data.failed, 1);

  // Transactions actually created with corrected category on row 1
  const txs = await api('GET', '/transactions?search=Lunch', { token: user.token });
  assert.strictEqual(txs.data.data.transactions.length, 1, 'exactly one Lunch row imported (duplicate skipped)');
  assert.strictEqual(txs.data.data.transactions[0].category_name, 'Entertainment', 'user correction applied');

  // Import history recorded
  const history = await api('GET', '/imports', { token: user.token });
  assert.strictEqual(history.data.data.imports[0].status, 'completed');

  // Notification generated
  const notifs = await api('GET', '/notifications?type=import_result', { token: user.token });
  assert.ok(notifs.data.data.notifications.length >= 1, 'import result notification expected');
});

test('Import errors endpoint lists row-level errors', async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const csv = 'Date,Description,Amount\n2026-09-01,Good row,50\n,Missing date,60\n2026-99-99,Bad date,70';
  const up = await upload(user.token, account.id, csv);
  const importId = up.data.data.import_id;
  const errs = await api('GET', `/imports/${importId}/errors`, { token: user.token });
  assert.strictEqual(errs.status, 200);
  assert.ok(errs.data.data.errors.length >= 2);
  assert.ok(errs.data.data.errors[0].error.length > 0);
});

test('Duplicate DB rows are flagged during import (cross-check with existing transactions)', async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const today = new Date().toISOString().split('T')[0];
  // Existing transaction
  await api('POST', '/transactions', {
    token: user.token,
    body: { account_id: account.id, type: 'expense', amount: 500, description: 'Existing coffee', date: today }
  });
  // Same transaction in CSV
  const csv = `Date,Description,Amount,Type\n${today},Existing coffee,500,debit`;
  const up = await upload(user.token, account.id, csv);
  assert.strictEqual(up.data.data.duplicate_rows, 1, 'should detect duplicate against DB history');
});

test('Non-CSV upload is rejected', async () => {
  const user = await registerAndLogin();
  await createAccount(user.token);
  const form = new FormData();
  form.append('file', new Blob([Buffer.from('hello')], { type: 'application/zip' }), 'evil.zip');
  form.append('account_id', '1');
  const res = await fetch(`${global.__baseUrl}/imports/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}` },
    body: form
  });
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('Import is ownership-protected', async () => {
  const a = await registerAndLogin();
  const b = await registerAndLogin();
  const account = await createAccount(a.token);
  const up = await upload(a.token, account.id, 'Date,Description,Amount\n2026-09-01,X,10');
  const res = await api('GET', `/imports/${up.data.data.import_id}`, { token: b.token });
  assert.strictEqual(res.status, 404);
});

test('Failed CSV validation records a terminal failure instead of a pending import', async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const up = await upload(user.token, account.id, 'date,description,amount,type,category_id\n2026-09-01,Invalid category,10,expense,999999');
  assert.strictEqual(up.status, 400);
  const history = await api('GET', '/imports', { token: user.token });
  assert.strictEqual(history.data.data.imports[0].status, 'failed');
  assert.match(history.data.data.imports[0].error_message, /category/i);
});

test('Categorizing an invalid CSV row cannot silently mark its invalid amount valid', async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const up = await upload(user.token, account.id, 'date,description,amount,type\n2026-09-01,Bad amount,nope,expense');
  const id = up.data.data.import_id;
  const detail = await api('GET', `/imports/${id}`, { token: user.token });
  const cats = await api('GET', '/categories?type=expense', { token: user.token });
  const response = await api('PATCH', `/imports/${id}/rows/${detail.data.data.rows[0].id}`, {
    token: user.token, body: { action: 'categorize', category_id: cats.data.data.categories[0].id }
  });
  assert.strictEqual(response.status, 400);
  const after = await api('GET', `/imports/${id}`, { token: user.token });
  assert.strictEqual(after.data.data.rows[0].status, 'invalid');
});

test('Concurrent zero-row confirmations complete only once and retain accurate progress', async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const up = await upload(user.token, account.id, 'date,description,amount,type\n2026-09-01,Skipped row,20,expense');
  const id = up.data.data.import_id;
  const detail = await api('GET', `/imports/${id}`, { token: user.token });
  await api('PATCH', `/imports/${id}/rows/${detail.data.data.rows[0].id}`, { token: user.token, body: { action: 'skip' } });
  const responses = await Promise.all([1, 2].map(() => api('POST', `/imports/${id}/confirm`, { token: user.token, body: {} })));
  assert.deepStrictEqual(responses.map(r => r.status).sort(), [200, 400]);
  const result = responses.find(r => r.status === 200).data.data;
  assert.strictEqual(result.total_rows, 1);
  assert.strictEqual(result.skipped, 1);
  assert.strictEqual(result.imported, 0);
  const notifications = await api('GET', '/notifications?type=import_result', { token: user.token });
  assert.strictEqual(notifications.data.data.notifications.length, 1);
});

test('Concurrent confirmations cannot double-debit the selected account', async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token, { balance: 100 });
  const up = await upload(user.token, account.id, 'date,description,amount,type\n2026-09-01,Only once,25,expense');
  const id = up.data.data.import_id;
  const results = await Promise.all([1, 2].map(() => api('POST', `/imports/${id}/confirm`, { token: user.token, body: {} })));
  assert.deepStrictEqual(results.map(r => r.status).sort(), [200, 400]);
  const balance = await api('GET', `/accounts/${account.id}`, { token: user.token });
  assert.strictEqual(Number(balance.data.data.account.balance), 75);
  const detail = await api('GET', `/imports/${id}`, { token: user.token });
  assert.strictEqual(detail.data.data.import.status, 'completed');
  assert.strictEqual(detail.data.data.import.successful_rows, 1);
});

test('CSV numeric dates reject overflow but preserve supported date formats', () => {
  const { parseDate } = require('../src/helpers/csvParser');
  assert.strictEqual(parseDate('2026-02-30'), null);
  assert.strictEqual(parseDate('02/30/2026'), null);
  assert.strictEqual(parseDate('2028-02-29'), '2028-02-29');
  assert.strictEqual(parseDate('27/09/2026'), '2026-09-27');
  assert.strictEqual(parseDate('Jan 5, 2026'), '2026-01-05');
});
