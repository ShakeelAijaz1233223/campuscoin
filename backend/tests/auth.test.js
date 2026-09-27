const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin, uniqueEmail } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

test('POST /auth/register creates a student account with token', async () => {
  const email = uniqueEmail('auth');
  const res = await api('POST', '/auth/register', {
    body: { email, password: 'Strong@123', first_name: 'Auth', last_name: 'Test' }
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.data.token);
  assert.strictEqual(res.data.data.user.email, email);
  assert.strictEqual(res.data.data.user.role, 'student');
  assert.ok(!res.data.data.user.password_hash, 'password hash must never be returned');
});

test('POST /auth/register rejects duplicate email', async () => {
  const email = uniqueEmail('dup');
  await api('POST', '/auth/register', { body: { email, password: 'Strong@123', first_name: 'A' } });
  const res = await api('POST', '/auth/register', { body: { email, password: 'Strong@123', first_name: 'B' } });
  assert.strictEqual(res.status, 409);
});

test('POST /auth/register rejects weak passwords', async () => {
  const res = await api('POST', '/auth/register', {
    body: { email: uniqueEmail('weak'), password: 'weak', first_name: 'W' }
  });
  assert.strictEqual(res.status, 422);
});

test('POST /auth/login succeeds with valid credentials and updates last_login', async () => {
  const { email, password } = await registerAndLogin();
  const res = await api('POST', '/auth/login', { body: { email, password } });
  assert.strictEqual(res.status, 200);
  assert.ok(res.data.data.token);
  assert.ok(res.data.data.user.last_login_at);
});

test('POST /auth/login rejects wrong password', async () => {
  const { email } = await registerAndLogin();
  const res = await api('POST', '/auth/login', { body: { email, password: 'Wrong@123' } });
  assert.strictEqual(res.status, 401);
});

test('POST /auth/login rejects unknown email', async () => {
  const res = await api('POST', '/auth/login', { body: { email: 'ghost@nowhere.test', password: 'Whatever@123' } });
  assert.strictEqual(res.status, 401);
});

test('GET /auth/me returns the authenticated user', async () => {
  const { token, email } = await registerAndLogin();
  const res = await api('GET', '/auth/me', { token });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.data.user.email, email);
});

test('GET /auth/me without token is unauthorized', async () => {
  const res = await api('GET', '/auth/me');
  assert.strictEqual(res.status, 401);
});

test('POST /auth/logout succeeds for authenticated user', async () => {
  const { token } = await registerAndLogin();
  const res = await api('POST', '/auth/logout', { token });
  assert.strictEqual(res.status, 200);
});

test('POST /auth/forgot-password always returns success (no enumeration)', async () => {
  const res1 = await api('POST', '/auth/forgot-password', { body: { email: uniqueEmail('fp') } });
  assert.strictEqual(res1.status, 200);
  const { email } = await registerAndLogin();
  const res2 = await api('POST', '/auth/forgot-password', { body: { email } });
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.data.data.message, res1.data.data.message);
});

test('POST /auth/reset-password with valid dev token changes password', async () => {
  const { email, password } = await registerAndLogin();
  const fp = await api('POST', '/auth/forgot-password', { body: { email } });
  const resetToken = fp.data.data.reset_token;
  assert.ok(resetToken, 'dev env should expose reset token for testing');
  const res = await api('POST', '/auth/reset-password', { body: { token: resetToken, password: 'NewPass@123' } });
  assert.strictEqual(res.status, 200);
  const login = await api('POST', '/auth/login', { body: { email, password: 'NewPass@123' } });
  assert.strictEqual(login.status, 200);
});

test('POST /auth/reset-password rejects reused token', async () => {
  const { email } = await registerAndLogin();
  const fp = await api('POST', '/auth/forgot-password', { body: { email } });
  const resetToken = fp.data.data.reset_token;
  await api('POST', '/auth/reset-password', { body: { token: resetToken, password: 'NewPass@123' } });
  const res = await api('POST', '/auth/reset-password', { body: { token: resetToken, password: 'Again@1234' } });
  assert.strictEqual(res.status, 400);
});

test('POST /auth/reset-password rejects invalid token', async () => {
  const res = await api('POST', '/auth/reset-password', { body: { token: 'invalid-token-value', password: 'Whatever@123' } });
  assert.strictEqual(res.status, 400);
});

test('Suspended user cannot login', async () => {
  const { registerAndLogin: r, getDb } = require('./helpers');
  const { email, password } = await r();
  const db = await getDb();
  await db.execute("UPDATE users SET status = 'suspended' WHERE email = ?", [email]);
  await db.end();
  const res = await api('POST', '/auth/login', { body: { email, password } });
  assert.strictEqual(res.status, 401);
  assert.match(res.data.message, /suspended/i);
});

test('Admin-authorized endpoint blocks students and allows admins', async () => {
  const student = await registerAndLogin();
  const admin = await registerAndLogin({ role: 'admin' });
  const blocked = await api('GET', '/admin/dashboard', { token: student.token });
  assert.strictEqual(blocked.status, 403);
  const allowed = await api('GET', '/admin/dashboard', { token: admin.token });
  assert.strictEqual(allowed.status, 200);
});
