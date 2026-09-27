const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

const adminSetup = async () => registerAndLogin({ role: 'admin' });

test('Admin dashboard returns platform statistics', async () => {
  const admin = await adminSetup();
  const res = await api('GET', '/admin/dashboard', { token: admin.token });
  assert.strictEqual(res.status, 200);
  const stats = res.data.data.statistics;
  assert.ok(stats.total_users >= 2);
  assert.ok('total_transactions' in stats);
  assert.ok('total_students' in stats);
  assert.ok('total_admins' in stats);
});

test('Admin users list supports search and pagination', async () => {
  const admin = await adminSetup();
  const res = await api('GET', '/admin/users?page=1&limit=10', { token: admin.token });
  assert.strictEqual(res.status, 200);
  assert.ok(res.data.meta.pagination.totalItems >= 2);
  const searched = await api('GET', '/admin/users?search=admin', { token: admin.token });
  assert.ok(searched.data.data.users.length >= 1);
});

test('Admin can view user detail with stats', async () => {
  const admin = await adminSetup();
  const student = await registerAndLogin();
  const res = await api('GET', `/admin/users/${student.user.id}`, { token: admin.token });
  assert.strictEqual(res.status, 200);
  assert.ok('transaction_count' in res.data.data.stats);
});

test('Admin can disable and re-enable a user; disabled user cannot login', async () => {
  const admin = await adminSetup();
  const student = await registerAndLogin({ password: 'Disable@123' });
  const email = student.email;

  const off = await api('PATCH', `/admin/users/${student.user.id}/status`, { token: admin.token, body: { status: 'inactive' } });
  assert.strictEqual(off.status, 200);
  const blockedLogin = await api('POST', '/auth/login', { body: { email, password: 'Disable@123' } });
  assert.strictEqual(blockedLogin.status, 401);

  // Disabled user's token should also be rejected
  const blockedApi = await api('GET', '/dashboard', { token: student.token });
  assert.strictEqual(blockedApi.status, 401);

  const on = await api('PATCH', `/admin/users/${student.user.id}/status`, { token: admin.token, body: { status: 'active' } });
  assert.strictEqual(on.status, 200);
});

test('Admin cannot disable another admin', async () => {
  const admin1 = await adminSetup();
  const admin2 = await adminSetup();
  const res = await api('PATCH', `/admin/users/${admin2.user.id}/status`, { token: admin1.token, body: { status: 'suspended' } });
  assert.strictEqual(res.status, 403);
});

test('Admin reset access clears lockout state', async () => {
  const admin = await adminSetup();
  const student = await registerAndLogin({ password: 'Locked@1234' });
  const { getDb } = require('./helpers');
  const db = await getDb();
  await db.execute('UPDATE users SET failed_login_attempts = 5, locked_until = DATE_ADD(NOW(), INTERVAL 20 MINUTE) WHERE id = ?', [student.user.id]);
  await db.end();

  const blocked = await api('POST', '/auth/login', { body: { email: student.email, password: 'Locked@1234' } });
  assert.strictEqual(blocked.status, 401);
  assert.match(blocked.data.message, /locked/i);

  const reset = await api('POST', `/admin/users/${student.user.id}/reset-access`, { token: admin.token });
  assert.strictEqual(reset.status, 200);
  const ok = await api('POST', '/auth/login', { body: { email: student.email, password: 'Locked@1234' } });
  assert.strictEqual(ok.status, 200);
});

test('Admin manages default categories', async () => {
  const admin = await adminSetup();
  const list = await api('GET', '/admin/default-categories', { token: admin.token });
  assert.ok(list.data.data.categories.length >= 12, 'SRS defaults expected');

  const created = await api('POST', '/admin/default-categories', { token: admin.token, body: { name: `Default Test ${Date.now()}`, type: 'expense' } });
  assert.strictEqual(created.status, 201);
  const id = created.data.data.category.id;

  const upd = await api('PUT', `/admin/default-categories/${id}`, { token: admin.token, body: { sort_order: 99 } });
  assert.strictEqual(upd.status, 200);

  const del = await api('DELETE', `/admin/default-categories/${id}`, { token: admin.token });
  assert.strictEqual(del.status, 200);
});

test('Admin announcements CRUD reaches users via content endpoint', async () => {
  const admin = await adminSetup();
  const student = await registerAndLogin();
  const created = await api('POST', '/admin/announcements', {
    token: admin.token,
    body: { title: `Test announcement ${Date.now()}`, content: 'Hello students!', type: 'info' }
  });
  assert.strictEqual(created.status, 201);
  const annId = created.data.data.announcement.id;

  const content = await api('GET', '/content/announcements', { token: student.token });
  assert.ok(content.data.data.announcements.some((a) => a.id === annId));

  const updated = await api('PUT', `/admin/announcements/${annId}`, { token: admin.token, body: { is_active: false } });
  assert.strictEqual(updated.status, 200);
  const contentAfter = await api('GET', '/content/announcements', { token: student.token });
  assert.ok(!contentAfter.data.data.announcements.some((a) => a.id === annId));

  const del = await api('DELETE', `/admin/announcements/${annId}`, { token: admin.token });
  assert.strictEqual(del.status, 200);
});

test('Admin system tips CRUD', async () => {
  const admin = await adminSetup();
  const created = await api('POST', '/admin/tips', { token: admin.token, body: { title: `Admin tip ${Date.now()}`, content: 'Save money', priority: 5 } });
  assert.strictEqual(created.status, 201);
  const id = created.data.data.tip.id;
  const upd = await api('PUT', `/admin/tips/${id}`, { token: admin.token, body: { priority: 10 } });
  assert.strictEqual(upd.status, 200);
  const del = await api('DELETE', `/admin/tips/${id}`, { token: admin.token });
  assert.strictEqual(del.status, 200);
});

test('Admin statistics endpoints: active users, transaction count, most-used categories', async () => {
  const admin = await adminSetup();
  const active = await api('GET', '/admin/statistics/active-users', { token: admin.token });
  assert.strictEqual(active.status, 200);
  assert.ok(Array.isArray(active.data.data.users));

  const txCount = await api('GET', '/admin/statistics/transactions', { token: admin.token });
  assert.ok(txCount.data.data.total_transactions >= 0);

  const cats = await api('GET', '/admin/statistics/categories', { token: admin.token });
  assert.ok(Array.isArray(cats.data.data.categories));
});
