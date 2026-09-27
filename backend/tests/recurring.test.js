const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin, createAccount } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

const setup = async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const cats = await api('GET', '/categories', { token: user.token });
  return {
    user, account,
    expenseCat: cats.data.data.categories.find((c) => c.name === 'Subscriptions'),
    incomeCat: cats.data.data.categories.find((c) => c.name === 'Allowance')
  };
};

test('POST /recurring-transactions creates a monthly expense rule', async () => {
  const { user, account, expenseCat } = await setup();
  const res = await api('POST', '/recurring-transactions', {
    token: user.token,
    body: {
      account_id: account.id, category_id: expenseCat.id, type: 'expense',
      amount: 500, description: 'Gym membership', frequency: 'monthly',
      start_date: '2026-10-01'
    }
  });
  assert.strictEqual(res.status, 201);
  const rule = res.data.data.recurring_transaction;
  assert.strictEqual(rule.next_occurrence, '2026-10-01');
  assert.strictEqual(rule.is_active, 1);
});

test('POST /recurring-transactions creates income rules with custom frequency', async () => {
  const { user, account, incomeCat } = await setup();
  const res = await api('POST', '/recurring-transactions', {
    token: user.token,
    body: {
      account_id: account.id, category_id: incomeCat.id, type: 'income',
      amount: 1000, description: 'Weekly allowance', frequency: 'weekly',
      start_date: '2026-10-01', end_date: '2026-12-31'
    }
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.data.recurring_transaction.frequency, 'weekly');
});

test('POST /recurring-transactions rejects end date before start date', async () => {
  const { user, account, expenseCat } = await setup();
  const res = await api('POST', '/recurring-transactions', {
    token: user.token,
    body: {
      account_id: account.id, category_id: expenseCat.id, type: 'expense',
      amount: 100, description: 'Bad range', frequency: 'monthly',
      start_date: '2026-10-10', end_date: '2026-10-01'
    }
  });
  assert.strictEqual(res.status, 400);
});

test('Process generates due transactions without duplicates', async () => {
  const h = require('./helpers');
  const { user, account, expenseCat } = await setup();
  // Rule starting in the past => due immediately
  const created = await api('POST', '/recurring-transactions', {
    token: user.token,
    body: {
      account_id: account.id, category_id: expenseCat.id, type: 'expense',
      amount: 300, description: 'Past due rule', frequency: 'monthly',
      start_date: '2026-08-15'
    }
  });
  assert.strictEqual(created.status, 201);

  const p1 = await api('POST', '/recurring-transactions/process', { token: user.token });
  assert.strictEqual(p1.status, 200);
  assert.ok(p1.data.data.generated >= 1, 'should generate at least one transaction');

  const p2 = await api('POST', '/recurring-transactions/process', { token: user.token });
  assert.strictEqual(p2.data.data.generated, 0, 'second run must not duplicate');
  // Duplicate prevention: exactly one transaction per generated date exists
  const txs = await api('GET', '/transactions?search=Past due rule', { token: user.token });
  assert.strictEqual(txs.data.data.transactions.length, 2, 'Aug + Sep occurrences generated exactly once each');
});

test('PATCH toggle activates/deactivates a rule', async () => {
  const { user, account, expenseCat } = await setup();
  const created = await api('POST', '/recurring-transactions', {
    token: user.token,
    body: { account_id: account.id, category_id: expenseCat.id, type: 'expense', amount: 50, description: 'Toggle me', frequency: 'monthly', start_date: '2026-10-01' }
  });
  const id = created.data.data.recurring_transaction.id;
  const off = await api('PATCH', `/recurring-transactions/${id}/toggle`, { token: user.token, body: { is_active: false } });
  assert.strictEqual(off.data.data.recurring_transaction.is_active, 0);
  const on = await api('PATCH', `/recurring-transactions/${id}/toggle`, { token: user.token, body: { is_active: true } });
  assert.strictEqual(on.data.data.recurring_transaction.is_active, 1);
});

test('Recurring rules are ownership-protected', async () => {
  const a = await registerAndLogin();
  const b = await registerAndLogin();
  const account = await createAccount(a.token);
  const created = await api('POST', '/recurring-transactions', {
    token: a.token,
    body: { account_id: account.id, type: 'income', amount: 10, description: 'Private rule', frequency: 'monthly', start_date: '2026-10-01' }
  });
  const res = await api('GET', `/recurring-transactions/${created.data.data.recurring_transaction.id}`, { token: b.token });
  assert.strictEqual(res.status, 404);
});
