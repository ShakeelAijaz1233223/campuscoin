const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin, createAccount } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

const setup = async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const cats = await api('GET', '/categories', { token: user.token });
  const expenseCat = cats.data.data.categories.find((c) => c.name === 'Food');
  const incomeCat = cats.data.data.categories.find((c) => c.name === 'Gift');
  return { user, account, expenseCat, incomeCat };
};

test('POST /transactions creates income and updates account balance', async () => {
  const { user, account, incomeCat } = await setup();
  const before = await api('GET', `/accounts/${account.id}`, { token: user.token });
  const beforeBalance = parseFloat(before.data.data.account.balance);

  const today = new Date().toISOString().split('T')[0];
  const res = await api('POST', '/transactions', {
    token: user.token,
    body: { account_id: account.id, category_id: incomeCat.id, type: 'income', amount: 500, description: 'Birthday cash', date: today }
  });
  assert.strictEqual(res.status, 201);
  const tx = res.data.data.transaction;
  assert.strictEqual(parseFloat(tx.amount), 500);

  const after = await api('GET', `/accounts/${account.id}`, { token: user.token });
  assert.strictEqual(parseFloat(after.data.data.account.balance), beforeBalance + 500);
});

test('POST /transactions rejects category/transaction type mismatch', async () => {
  const { user, account, expenseCat } = await setup();
  const today = new Date().toISOString().split('T')[0];
  const res = await api('POST', '/transactions', {
    token: user.token,
    body: { account_id: account.id, category_id: expenseCat.id, type: 'income', amount: 100, description: 'mismatch', date: today }
  });
  assert.strictEqual(res.status, 400);
});

test('POST /transactions with use_ai suggests a category', async () => {
  const { user, account } = await setup();
  const today = new Date().toISOString().split('T')[0];
  const res = await api('POST', '/transactions', {
    token: user.token,
    body: { account_id: account.id, type: 'expense', amount: 300, description: 'Bus pass recharge', date: today, use_ai: true }
  });
  assert.strictEqual(res.status, 201);
  const ai = res.data.data.ai_suggestion;
  assert.ok(ai, 'AI suggestion expected');
  if (ai.categoryId) {
    assert.strictEqual(res.data.data.transaction.category_id, ai.categoryId);
  }
});

test('GET /transactions supports pagination, filters, sorting and search', async () => {
  const { user, account, expenseCat } = await setup();
  const today = new Date().toISOString().split('T')[0];
  for (const [desc, amount] of [['Alpha snack', 10], ['Bravo snack', 20], ['Charlie ride', 30], ['Delta book', 40]]) {
    await api('POST', '/transactions', {
      token: user.token,
      body: { account_id: account.id, category_id: expenseCat.id, type: 'expense', amount, description: desc, date: today }
    });
  }

  const page1 = await api('GET', '/transactions?page=1&limit=2&sort=amount&order=DESC', { token: user.token });
  assert.strictEqual(page1.status, 200);
  assert.strictEqual(page1.data.data.transactions.length, 2);
  assert.ok(page1.data.meta.pagination.totalItems >= 4);
  assert.strictEqual(parseFloat(page1.data.data.transactions[0].amount), 40);

  const filtered = await api('GET', `/transactions?category_id=${expenseCat.id}&min_amount=25`, { token: user.token });
  assert.ok(filtered.data.data.transactions.every((t) => parseFloat(t.amount) >= 25));

  const searched = await api('GET', '/transactions?search=bravo', { token: user.token });
  assert.strictEqual(searched.data.data.transactions.length, 1);

  const dated = await api('GET', `/transactions?start_date=${today}&end_date=${today}`, { token: user.token });
  assert.ok(dated.data.data.transactions.length >= 4);
});

test('Duplicate detection warns on identical recent transaction', async () => {
  const { user, account, expenseCat } = await setup();
  const today = new Date().toISOString().split('T')[0];
  await api('POST', '/transactions', {
    token: user.token,
    body: { account_id: account.id, category_id: expenseCat.id, type: 'expense', amount: 77, description: 'Dup check coffee', date: today }
  });
  const res = await api('POST', '/transactions', {
    token: user.token,
    body: { account_id: account.id, category_id: expenseCat.id, type: 'expense', amount: 77, description: 'Dup check coffee', date: today }
  });
  assert.strictEqual(res.status, 201);
  assert.ok(res.data.data.duplicate_warning, 'duplicate warning expected');
});

test('PUT /transactions updates fields and records AI override on category change', async () => {
  const { user, account, expenseCat, incomeCat } = await setup();
  const today = new Date().toISOString().split('T')[0];
  const created = await api('POST', '/transactions', {
    token: user.token,
    body: { account_id: account.id, category_id: expenseCat.id, type: 'expense', amount: 15, description: 'Before update', date: today }
  });
  const id = created.data.data.transaction.id;
  const res = await api('PUT', `/transactions/${id}`, {
    token: user.token,
    body: { amount: 25, description: 'After update', category_id: incomeCat.id, type: 'income' }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(parseFloat(res.data.data.transaction.amount), 25);
  assert.strictEqual(res.data.data.transaction.description, 'After update');
  assert.strictEqual(res.data.data.transaction.ai_overridden, 1);
});

test('DELETE /transactions soft-deletes and reverses balance', async () => {
  const { user, account, expenseCat } = await setup();
  const today = new Date().toISOString().split('T')[0];
  const before = parseFloat((await api('GET', `/accounts/${account.id}`, { token: user.token })).data.data.account.balance);
  const created = await api('POST', '/transactions', {
    token: user.token,
    body: { account_id: account.id, category_id: expenseCat.id, type: 'expense', amount: 60, description: 'To be deleted', date: today }
  });
  const id = created.data.data.transaction.id;
  const del = await api('DELETE', `/transactions/${id}`, { token: user.token });
  assert.strictEqual(del.status, 200);
  const after = parseFloat((await api('GET', `/accounts/${account.id}`, { token: user.token })).data.data.account.balance);
  assert.strictEqual(after, before);

  const gone = await api('GET', `/transactions/${id}`, { token: user.token });
  assert.strictEqual(gone.status, 404);
});

test('Cross-user transaction access is blocked', async () => {
  const a = await registerAndLogin();
  const b = await registerAndLogin();
  const account = await createAccount(a.token);
  const today = new Date().toISOString().split('T')[0];
  const created = await api('POST', '/transactions', {
    token: a.token,
    body: { account_id: account.id, type: 'expense', amount: 5, description: 'private', date: today }
  });
  const res = await api('GET', `/transactions/${created.data.data.transaction.id}`, { token: b.token });
  assert.strictEqual(res.status, 404);
});

test('Advanced: recently viewed / edited / unusually large endpoints respond', async () => {
  const { user } = await setup();
  const rv = await api('GET', '/transactions/recently-viewed', { token: user.token });
  assert.strictEqual(rv.status, 200);
  const re = await api('GET', '/transactions/recently-edited', { token: user.token });
  assert.strictEqual(re.status, 200);
  const ul = await api('GET', '/transactions/unusually-large', { token: user.token });
  assert.strictEqual(ul.status, 200);
  assert.strictEqual(ul.data.data.advisory, true);
});
