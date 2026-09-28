const test = require('node:test');
const assert = require('node:assert/strict');
const {
  startServer,
  stopServer,
  api,
  registerAndLogin,
  createAccount
} = require('./helpers');
const { escapeCSV } = require('../src/utils/csv');
test.before(startServer);
test.after(stopServer);

test('logout revokes previously issued Bearer tokens', async () => {
  const user = await registerAndLogin();
  assert.equal(
    (await api('POST', '/auth/logout', { token: user.token })).status,
    200
  );
  assert.equal(
    (await api('GET', '/auth/me', { token: user.token })).status,
    401
  );
});
test('password change revokes old sessions and rotates the current session', async () => {
  const user = await registerAndLogin();
  const changed = await api('POST', '/auth/change-password', {
    token: user.token,
    body: { current_password: user.password, new_password: 'Changed@456' }
  });
  assert.equal(changed.status, 200);
  assert.ok(changed.data.data.token);
  assert.equal(
    (await api('GET', '/auth/me', { token: user.token })).status,
    401
  );
  assert.equal(
    (await api('GET', '/auth/me', { token: changed.data.data.token })).status,
    200
  );
});
test('password reset revokes all existing access sessions', async () => {
  const user = await registerAndLogin();
  const forgot = await api('POST', '/auth/forgot-password', {
    body: { email: user.email }
  });
  assert.equal(
    (
      await api('POST', '/auth/reset-password', {
        body: { token: forgot.data.data.reset_token, password: 'ResetPass@456' }
      })
    ).status,
    200
  );
  assert.equal(
    (await api('GET', '/auth/me', { token: user.token })).status,
    401
  );
});
test('validation never reflects submitted passwords', async () => {
  const password = 'SecretButWeak';
  const response = await api('POST', '/auth/register', {
    body: { email: 'valid@test.local', first_name: 'Test', password }
  });
  assert.equal(response.status, 422);
  assert.ok(!JSON.stringify(response.data).includes(password));
});
test('public authentication rejects cross-site form-compatible content types', async () => {
  const response = await api('POST', '/auth/login', {
    headers: { 'Content-Type': 'text/plain' },
    body: { email: 'x@y.test', password: 'TestPass@123' }
  });
  assert.equal(response.status, 415);
});
test('all CSV export cells neutralize formulas and correctly escape quotes', () => {
  for (const value of [
    '=1+1',
    '+SUM(A1:A2)',
    '@SUM(A1:A2)',
    '-1+1',
    '  =1+1',
    '\t=1+1',
    '\r=1+1'
  ])
    assert.ok(escapeCSV(value).startsWith('"\''));
  assert.equal(escapeCSV('A "quoted", note'), '"A ""quoted"", note"');
  assert.equal(escapeCSV(42.5), '"42.5"');
});
test('concurrent transaction deletions reverse the balance exactly once', async () => {
  const { token } = await registerAndLogin();
  const account = await createAccount(token, { balance: 1000 });
  const created = await api('POST', '/transactions', {
    token,
    body: {
      account_id: account.id,
      type: 'expense',
      amount: 125.5,
      date: '2026-09-28'
    }
  });
  const id = created.data.data.transaction.id;
  const results = await Promise.all([
    api('DELETE', `/transactions/${id}`, { token }),
    api('DELETE', `/transactions/${id}`, { token })
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 404]);
  const result = await api('GET', `/accounts/${account.id}`, { token });
  assert.equal(Number(result.data.data.account.balance), 1000);
});
test('concurrent transaction edits preserve the ledger/account invariant', async () => {
  const { token } = await registerAndLogin();
  const account = await createAccount(token, { balance: 1000 });
  const created = await api('POST', '/transactions', {
    token,
    body: {
      account_id: account.id,
      type: 'expense',
      amount: 100,
      date: '2026-09-28'
    }
  });
  const id = created.data.data.transaction.id;
  const results = await Promise.all(
    [200, 300].map((amount) =>
      api('PATCH', `/transactions/${id}`, { token, body: { amount } })
    )
  );
  assert.ok(results.every((r) => r.status === 200));
  const transaction = await api('GET', `/transactions/${id}`, { token });
  const result = await api('GET', `/accounts/${account.id}`, { token });
  assert.equal(
    Number(result.data.data.account.balance) +
      Number(transaction.data.data.transaction.amount),
    1000
  );
});
test('a transaction cannot forge import metadata, a transfer, or fractional cents', async () => {
  const { token } = await registerAndLogin();
  const account = await createAccount(token);
  const body = {
    account_id: account.id,
    type: 'expense',
    amount: 10,
    date: '2026-09-28',
    import_id: 99999,
    recurring_id: 99999
  };
  const result = await api('POST', '/transactions', { token, body });
  assert.equal(result.status, 201);
  assert.equal(result.data.data.transaction.import_id, null);
  assert.equal(result.data.data.transaction.recurring_id, null);
  assert.equal(
    (
      await api('POST', '/transactions', {
        token,
        body: { ...body, type: 'transfer' }
      })
    ).status,
    422
  );
  assert.equal(
    (
      await api('POST', '/transactions', {
        token,
        body: { ...body, amount: 1.001 }
      })
    ).status,
    422
  );
});
test('contribution deletion reopens completed goals and cannot deduct twice', async () => {
  const { token } = await registerAndLogin();
  const created = await api('POST', '/goals', {
    token,
    body: { name: 'Concurrency goal', target_amount: 100 }
  });
  const id = created.data.data.goal.id;
  const contribution = await api('POST', `/goals/${id}/contributions`, {
    token,
    body: { amount: 100 }
  });
  assert.equal(contribution.data.data.goal.status, 'completed');
  const path = `/goals/${id}/contributions/${contribution.data.data.contribution_id}`;
  const results = await Promise.all([
    api('DELETE', path, { token }),
    api('DELETE', path, { token })
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 404]);
  const result = await api('GET', `/goals/${id}`, { token });
  assert.equal(result.data.data.goal.status, 'active');
  assert.equal(Number(result.data.data.goal.current_amount), 0);
});
test('notification opt-out suppresses new notifications without deleting history', async () => {
  const { token } = await registerAndLogin();
  await api('POST', '/insights/generate', {
    token,
    body: { month: 9, year: 2026 }
  });
  const before = await api('GET', '/notifications', { token });
  assert.ok(before.data.data.notifications.length > 0);
  assert.equal(
    (
      await api('PATCH', '/settings', {
        token,
        body: { notifications_enabled: false }
      })
    ).status,
    200
  );
  await api('POST', '/insights/generate', {
    token,
    body: { month: 8, year: 2026 }
  });
  const after = await api('GET', '/notifications', { token });
  assert.equal(
    after.data.data.notifications.length,
    before.data.data.notifications.length
  );
});
test('range summary can omit row payloads without losing totals', async () => {
  const { token } = await registerAndLogin();
  const result = await api(
    'GET',
    '/reports/range?start_date=2026-09-01&end_date=2026-09-30&include_transactions=false',
    { token }
  );
  assert.equal(result.status, 200);
  assert.ok(!('transactions' in result.data.data.report));
  assert.equal(result.data.data.report.totals.income, 0);
});
test('insight builder uses the chosen currency and actual category growth fields', () => {
  const { buildInsight } = require('../src/helpers/insightBuilder');
  const result = buildInsight({
    month: 9,
    year: 2026,
    currency: 'USD',
    totalIncome: 100,
    totalExpense: 60,
    previousIncome: 100,
    previousExpense: 20,
    categoryGrowth: [{ category_name: 'Food', change_percent: 40 }]
  });
  assert.ok(result.summary.includes('USD'));
  assert.ok(!result.summary.includes('PKR'));
  assert.ok(result.summary.includes('Food (+40%)'));
});
test('report downloads reject encoded directory components before checking ownership', async () => {
  const { token, user } = await registerAndLogin();
  const path = `/exports/download/${encodeURIComponent(`report_${user.id}_folder/report_other_123.pdf`)}`;
  assert.equal((await api('GET', path, { token })).status, 404);
  assert.equal(
    require('../src/services/report.service').getExportFile(
      'folder/report_1_123.pdf'
    ),
    null
  );
});
test('category type cannot be changed through an unvalidated body property', async () => {
  const { token } = await registerAndLogin();
  const created = await api('POST', '/categories', {
    token,
    body: { name: 'Immutable type', type: 'expense' }
  });
  const id = created.data.data.category.id;
  assert.equal(
    (
      await api('PATCH', `/categories/${id}`, {
        token,
        body: { type: 'income' }
      })
    ).status,
    400
  );
  assert.equal(
    (await api('GET', `/categories/${id}`, { token })).data.data.category.type,
    'expense'
  );
});

test('note create and update apply the same content-size limit as the form', async () => {
  const { token } = await registerAndLogin();
  assert.equal(
    (
      await api('POST', '/notes', {
        token,
        body: { title: 'Too long', content: 'x'.repeat(10001) }
      })
    ).status,
    422
  );
  const created = await api('POST', '/notes', {
    token,
    body: { title: 'Valid', content: 'A financial plan.' }
  });
  assert.equal(created.status, 201);
  assert.equal(
    (
      await api('PATCH', `/notes/${created.data.data.note.id}`, {
        token,
        body: { content: 'x'.repeat(10001) }
      })
    ).status,
    422
  );
});
