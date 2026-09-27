const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

test('New user receives the SRS default categories', async () => {
  const { token } = await registerAndLogin();
  const res = await api('GET', '/categories', { token });
  assert.strictEqual(res.status, 200);
  const cats = res.data.data.categories;
  const names = cats.map((c) => c.name);

  // Default income categories from the SRS
  for (const name of ['Allowance', 'Part-time Job', 'Scholarship', 'Gift', 'Other Income']) {
    assert.ok(names.includes(name), `missing income category: ${name}`);
  }
  // Default expense categories from the SRS
  for (const name of ['Food', 'Transport', 'Hostel/Rent', 'Academics', 'Subscriptions', 'Entertainment', 'Miscellaneous']) {
    assert.ok(names.includes(name), `missing expense category: ${name}`);
  }
});

test('GET /categories?type= filters by type', async () => {
  const { token } = await registerAndLogin();
  const income = await api('GET', '/categories?type=income', { token });
  assert.ok(income.data.data.categories.every((c) => c.type === 'income'));
  const expense = await api('GET', '/categories?type=expense', { token });
  assert.ok(expense.data.data.categories.every((c) => c.type === 'expense'));
});

test('POST /categories creates a custom category', async () => {
  const { token } = await registerAndLogin();
  const res = await api('POST', '/categories', { token, body: { name: 'Coffee', type: 'expense', color: '#8D6E63' } });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.data.category.name, 'Coffee');
});

test('POST /categories rejects duplicate names of same type', async () => {
  const { token } = await registerAndLogin();
  await api('POST', '/categories', { token, body: { name: 'Unique Cat', type: 'expense' } });
  const res = await api('POST', '/categories', { token, body: { name: 'unique cat', type: 'expense' } });
  assert.strictEqual(res.status, 409);
});

test('PUT /categories updates a custom category', async () => {
  const { token } = await registerAndLogin();
  const created = await api('POST', '/categories', { token, body: { name: 'Updatable', type: 'income' } });
  const id = created.data.data.category.id;
  const res = await api('PUT', `/categories/${id}`, { token, body: { name: 'Updated Cat' } });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.data.category.name, 'Updated Cat');
});

test('Default system categories cannot be modified or deleted', async () => {
  const { token } = await registerAndLogin();
  const cats = await api('GET', '/categories?type=expense', { token });
  const food = cats.data.data.categories.find((c) => c.name === 'Food');
  const del = await api('DELETE', `/categories/${food.id}`, { token });
  assert.strictEqual(del.status, 403);
  const put = await api('PUT', `/categories/${food.id}`, { token, body: { name: 'Hacked' } });
  assert.strictEqual(put.status, 403);
});

test('DELETE /categories archives without corrupting history (soft delete)', async () => {
  const { token, getDb } = { ...require('./helpers') };
  const h = require('./helpers');
  const user = await h.registerAndLogin();
  const account = await h.createAccount(user.token);
  const created = await api('POST', '/categories', { token: user.token, body: { name: 'Doomed Cat', type: 'expense' } });
  const id = created.data.data.category.id;

  // Attach a transaction to the category
  const today = new Date().toISOString().split('T')[0];
  await api('POST', '/transactions', {
    token: user.token,
    body: { account_id: account.id, category_id: id, type: 'expense', amount: 50, description: 'history keeper', date: today }
  });

  const del = await api('DELETE', `/categories/${id}`, { token: user.token });
  assert.strictEqual(del.status, 200);
  assert.strictEqual(del.data.data.archived_due_to_history, true);

  // Transaction must still exist with the category intact
  const db = await h.getDb();
  const [rows] = await db.execute('SELECT t.status AS tx_status, c.status AS cat_status FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.category_id = ?', [id]);
  await db.end();
  assert.strictEqual(rows[0].tx_status, 'active');
  assert.strictEqual(rows[0].cat_status, 'archived');
});

test('Category deletion is ownership-protected', async () => {
  const h = require('./helpers');
  const a = await h.registerAndLogin();
  const b = await h.registerAndLogin();
  const created = await api('POST', '/categories', { token: a.token, body: { name: 'Mine Only', type: 'expense' } });
  const res = await api('DELETE', `/categories/${created.data.data.category.id}`, { token: b.token });
  assert.strictEqual(res.status, 404);
});
