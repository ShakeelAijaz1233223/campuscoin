const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin, createAccount } = require('./helpers');

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();
const TODAY = now.toISOString().split('T')[0];

const ctx = {};
test.before(async () => {
  await startServer();
  ctx.user = await registerAndLogin();
  ctx.account = await createAccount(ctx.user.token);
  const cats = await api('GET', '/categories?type=expense', { token: ctx.user.token });
  ctx.food = cats.data.data.categories.find((c) => c.name === 'Food');
  ctx.transport = cats.data.data.categories.find((c) => c.name === 'Transport');
  ctx.misc = cats.data.data.categories.find((c) => c.name === 'Miscellaneous');
});
test.after(require('./helpers').stopServer);

test('POST /budgets creates a monthly category budget', async () => {
  const res = await api('POST', '/budgets', {
    token: ctx.user.token,
    body: { category_id: ctx.food.id, amount: 5000, month: MONTH, year: YEAR }
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.data.budget.category_name, 'Food');
});

test('Duplicate budget for same user+category+month is rejected', async () => {
  const res = await api('POST', '/budgets', {
    token: ctx.user.token,
    body: { category_id: ctx.food.id, amount: 3000, month: MONTH, year: YEAR }
  });
  assert.strictEqual(res.status, 409);
});

test('Spent, remaining, percentage and alerts are calculated from transactions', async () => {
  await api('POST', '/budgets', {
    token: ctx.user.token,
    body: { category_id: ctx.transport.id, amount: 1000, month: MONTH, year: YEAR }
  });
  await api('POST', '/transactions', {
    token: ctx.user.token,
    body: { account_id: ctx.account.id, category_id: ctx.transport.id, type: 'expense', amount: 850, description: 'Fuel', date: TODAY }
  });

  const res = await api('GET', `/budgets?month=${MONTH}&year=${YEAR}`, { token: ctx.user.token });
  assert.strictEqual(res.status, 200);
  const budget = res.data.data.budgets.find((b) => b.category_id === ctx.transport.id);
  assert.strictEqual(parseFloat(budget.spent), 850);
  assert.strictEqual(budget.remaining, 150);
  assert.strictEqual(budget.percentage, 85);
  assert.strictEqual(budget.near_limit, true);
  assert.strictEqual(budget.exceeded, false);
});

test('Alerts endpoint reports near-limit budgets', async () => {
  const res = await api('GET', `/budgets/alerts?month=${MONTH}&year=${YEAR}`, { token: ctx.user.token });
  assert.strictEqual(res.status, 200);
  assert.ok(res.data.data.near_limit.some((b) => b.category_id === ctx.transport.id));
});

test('Exceeding a budget generates a notification and exceeded flag', async () => {
  await api('POST', '/transactions', {
    token: ctx.user.token,
    body: { account_id: ctx.account.id, category_id: ctx.food.id, type: 'expense', amount: 5100, description: 'Big spend', date: TODAY }
  });
  const budgets = await api('GET', `/budgets?month=${MONTH}&year=${YEAR}`, { token: ctx.user.token });
  const b = budgets.data.data.budgets.find((x) => x.category_id === ctx.food.id);
  assert.strictEqual(b.exceeded, true);
  assert.ok(b.percentage > 100);

  const alerts = await api('GET', `/budgets/alerts?month=${MONTH}&year=${YEAR}`, { token: ctx.user.token });
  assert.ok(alerts.data.data.exceeded.some((x) => x.category_id === ctx.food.id));

  const notifs = await api('GET', '/notifications?type=budget_exceeded', { token: ctx.user.token });
  assert.ok(notifs.data.data.notifications.length >= 1, 'budget_exceeded notification expected');
});

test('PUT /budgets updates amount; DELETE archives', async () => {
  const created = await api('POST', '/budgets', { token: ctx.user.token, body: { category_id: ctx.misc.id, amount: 900, month: MONTH, year: YEAR } });
  const id = created.data.data.budget.id;
  const upd = await api('PUT', `/budgets/${id}`, { token: ctx.user.token, body: { amount: 1200 } });
  assert.strictEqual(parseFloat(upd.data.data.budget.amount), 1200);
  const del = await api('DELETE', `/budgets/${id}`, { token: ctx.user.token });
  assert.strictEqual(del.status, 200);
  const gone = await api('GET', `/budgets/${id}`, { token: ctx.user.token });
  assert.strictEqual(gone.status, 404);
});

test('Budgets are ownership-protected', async () => {
  const other = await registerAndLogin();
  const created = await api('POST', '/budgets', { token: ctx.user.token, body: { category_id: ctx.transport.id, amount: 500, month: 12, year: 2030 } });
  const res = await api('PUT', `/budgets/${created.data.data.budget.id}`, { token: other.token, body: { amount: 1 } });
  assert.strictEqual(res.status, 404);
});
