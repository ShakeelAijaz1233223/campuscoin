const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { startServer, api, registerAndLogin, createAccount } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

const setupUserWithData = async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const cats = await api('GET', '/categories', { token: user.token });
  const food = cats.data.data.categories.find((c) => c.name === 'Food');
  const gift = cats.data.data.categories.find((c) => c.name === 'Gift');
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  await api('POST', '/transactions', { token: user.token, body: { account_id: account.id, category_id: gift.id, type: 'income', amount: 10000, description: 'Gift income', date: `${y}-${m}-05` } });
  await api('POST', '/transactions', { token: user.token, body: { account_id: account.id, category_id: food.id, type: 'expense', amount: 2000, description: 'Food spend', date: `${y}-${m}-10` } });
  return { user, y, m };
};

test('GET /reports/monthly returns category breakdown and totals', async () => {
  const { user, y, m } = await setupUserWithData();
  const res = await api('GET', `/reports/monthly?month=${m}&year=${y}`, { token: user.token });
  assert.strictEqual(res.status, 200);
  const report = res.data.data.report;
  assert.strictEqual(report.totals.income, 10000);
  assert.strictEqual(report.totals.expense, 2000);
  assert.ok(report.categoryBreakdown.some((c) => c.category_name === 'Food'));
  assert.ok(report.monthlyTrend.length >= 1);
});

test('GET /reports/range supports daily grouping and category filter', async () => {
  const { user, y, m } = await setupUserWithData();
  const start = `${y}-${m}-01`;
  const end = `${y}-${m}-28`;
  const res = await api('GET', `/reports/range?start_date=${start}&end_date=${end}&group_by=daily`, { token: user.token });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.data.report.totals.expense, 2000);
  assert.ok(res.data.data.report.breakdown.length >= 1);
});

test('GET /reports/range supports weekly grouping', async () => {
  const { user, y, m } = await setupUserWithData();
  const start = `${y}-${m}-01`;
  const end = `${y}-${m}-28`;
  const res = await api('GET', `/reports/range?start_date=${start}&end_date=${end}&group_by=weekly`, { token: user.token });
  assert.strictEqual(res.status, 200);
  assert.ok(res.data.data.report.breakdown.length >= 1);
});

test('GET /reports/monthly/pdf generates a real PDF file', async () => {
  const { user, y, m } = await setupUserWithData();
  const res = await api('GET', `/reports/monthly/pdf?month=${m}&year=${y}`, { token: user.token });
  assert.strictEqual(res.status, 200);
  const filename = res.data.data.filename;
  assert.match(filename, /\.pdf$/);
  const path = require('node:path').join(__dirname, '../exports', filename);
  assert.ok(fs.existsSync(path), 'PDF file should exist on disk');
  const buf = fs.readFileSync(path);
  assert.ok(buf.subarray(0, 4).toString() === '%PDF', 'file must start with %PDF magic bytes');
});

test('Reports never leak another user\u2019s data', async () => {
  const a = await setupUserWithData();
  const b = await registerAndLogin();
  const res = await api('GET', `/reports/monthly?month=${a.m}&year=${a.y}`, { token: b.token });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.data.report.totals.expense, 0, 'other user\u2019s expenses must not appear');
});

test('Analytics endpoints all work for authenticated user', async () => {
  const { user } = await setupUserWithData();
  for (const ep of ['category-spending', 'daily-spending', 'weekly-spending', 'monthly-spending', 'six-month-overview', 'historical-averages', 'category-growth', 'trends', 'budget-consumption', 'savings-rate']) {
    const res = await api('GET', `/analytics/${ep}`, { token: user.token });
    assert.strictEqual(res.status, 200, `${ep} failed`);
    assert.strictEqual(res.data.success, true, `${ep} success flag missing`);
  }
});

test('CSV export returns downloadable CSV content', async () => {
  const { user } = await setupUserWithData();
  const res = await fetch(`${(await startServer())}/exports/transactions/csv`, {
    headers: { Authorization: `Bearer ${user.token}` }
  });
  assert.strictEqual(res.status, 200);
  const text = await res.text();
  assert.match(text, /^date,type,amount,description/);
  assert.ok(text.includes('Food spend'));
});
