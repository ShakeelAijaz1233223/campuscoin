const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const { startServer, api, registerAndLogin, createAccount } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

test('Invalid JWT signature is rejected', async () => {
  const forged = jwt.sign({ id: 1, email: 'x@x.test', role: 'admin' }, 'wrong-secret-key');
  const res = await api('GET', '/dashboard', { token: forged });
  assert.strictEqual(res.status, 401);
});

test('Malformed token is rejected', async () => {
  const res = await api('GET', '/dashboard', { token: 'not.a.jwt' });
  assert.strictEqual(res.status, 401);
});

test('Expired token is rejected', async () => {
  const expired = jwt.sign({ id: 1 }, require('../src/config/env').JWT_SECRET, { expiresIn: '-10s' });
  const res = await api('GET', '/dashboard', { token: expired });
  assert.strictEqual(res.status, 401);
  assert.match(res.data.message, /expired/i);
});

test('Token for non-existent user is rejected', async () => {
  const token = jwt.sign({ id: 999999 }, require('../src/config/env').JWT_SECRET, { expiresIn: '1h' });
  const res = await api('GET', '/dashboard', { token });
  assert.strictEqual(res.status, 401);
  assert.match(res.data.message, /not found/i);
});

test('SQL injection in search and login is neutralized', async () => {
  const user = await registerAndLogin();
  const sqli = await api('GET', "/transactions?search=%27%20OR%201%3D1--", { token: user.token });
  assert.strictEqual(sqli.status, 200); // parameterized: treated as plain text

  const loginSqli = await api('POST', '/auth/login', { body: { email: "' OR '1'='1", password: "x" } });
  assert.strictEqual([401, 422].includes(loginSqli.status), true);

  const numericInject = await api('GET', '/transactions?category_id=1%20OR%201%3D1', { token: user.token });
  assert.strictEqual([200, 422].includes(numericInject.status), true);
  if (numericInject.status === 200) {
    assert.ok(numericInject.data.data.transactions.every((t) => t.category_id === 1));
  }
});

test('XSS-style input is sanitized on storage', async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const today = new Date().toISOString().split('T')[0];
  const res = await api('POST', '/transactions', {
    token: user.token,
    body: { account_id: account.id, type: 'expense', amount: 10, description: '<script>alert(1)</script>safe', date: today }
  });
  assert.strictEqual(res.status, 201);
  assert.ok(!res.data.data.transaction.description.includes('<script>'), 'angle brackets stripped');
});

test('Cross-user access blocked on every major resource', async () => {
  const a = await registerAndLogin();
  const b = await registerAndLogin();
  const account = await createAccount(a.token);
  const today = new Date().toISOString().split('T')[0];

  const tx = await api('POST', '/transactions', { token: a.token, body: { account_id: account.id, type: 'expense', amount: 5, description: 'x', date: today } });
  const goal = await api('POST', '/goals', { token: a.token, body: { name: 'G', target_amount: 100 } });
  const note = await api('POST', '/notes', { token: a.token, body: { title: 'N', content: 'C' } });
  const budgetCats = await api('GET', '/categories?type=expense', { token: a.token });
  const cat = budgetCats.data.data.categories[0];
  const budget = await api('POST', '/budgets', { token: a.token, body: { category_id: cat.id, amount: 100, month: new Date().getMonth() + 1, year: new Date().getFullYear() } });

  assert.strictEqual((await api('GET', `/transactions/${tx.data.data.transaction.id}`, { token: b.token })).status, 404);
  assert.strictEqual((await api('GET', `/goals/${goal.data.data.goal.id}`, { token: b.token })).status, 404);
  assert.strictEqual((await api('GET', `/notes/${note.data.data.note.id}`, { token: b.token })).status, 404);
  assert.strictEqual((await api('GET', `/budgets/${budget.data.data.budget.id}`, { token: b.token })).status, 404);
  assert.strictEqual((await api('GET', `/accounts/${account.id}`, { token: b.token })).status, 404);
});

test('Role escalation is impossible via registration', async () => {
  const res = await api('POST', '/auth/register', {
    body: { email: `evil.${Date.now()}@test.local`, password: 'Evil@1234', first_name: 'E', role: 'admin' }
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.data.user.role, 'student', 'role field must be ignored');
});

test('Admin endpoints reject students on every route', async () => {
  const student = await registerAndLogin();
  const routes = [
    ['GET', '/admin/dashboard'], ['GET', '/admin/users'], ['GET', '/admin/statistics'],
    ['GET', '/admin/statistics/active-users'], ['GET', '/admin/statistics/categories'],
    ['POST', '/admin/default-categories'], ['POST', '/admin/announcements'], ['POST', '/admin/tips']
  ];
  for (const [method, path] of routes) {
    const res = await api(method, path, { token: student.token });
    assert.strictEqual(res.status, 403, `${method} ${path} should be forbidden`);
  }
});

test('Search endpoint returns structured groups and is scoped to user', async () => {
  const a = await registerAndLogin();
  const b = await registerAndLogin();
  const account = await createAccount(a.token);
  const today = new Date().toISOString().split('T')[0];
  await api('POST', '/transactions', { token: a.token, body: { account_id: account.id, type: 'expense', amount: 42, description: 'xyzzy_unique', date: today } });

  const res = await api('GET', '/search?q=xyzzy_unique', { token: a.token });
  assert.strictEqual(res.status, 200);
  assert.ok(res.data.data.results.transactions.length === 1);

  const other = await api('GET', '/search?q=xyzzy_unique', { token: b.token });
  assert.strictEqual(other.data.data.total_results, 0, 'other user must not find it');
});

test('Response format contract: success envelope and error envelope', async () => {
  const user = await registerAndLogin();
  const ok = await api('GET', '/dashboard', { token: user.token });
  assert.deepStrictEqual(Object.keys(ok.data).slice(0, 3).sort(), ['data', 'message', 'success']);

  const bad = await api('GET', '/definitely-not-a-route', { token: user.token });
  assert.strictEqual(bad.status, 404);
  assert.strictEqual(bad.data.success, false);
  assert.ok(bad.data.message);
});
