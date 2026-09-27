const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

test('GET /profile returns user + profile + preferences', async () => {
  const { token } = await registerAndLogin({ first_name: 'Profile' });
  const res = await api('GET', '/profile', { token });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.data.profile.first_name, 'Profile');
  assert.ok(res.data.data.user);
});

test('PUT /profile updates academic year, allowance and savings goal', async () => {
  const { token } = await registerAndLogin();
  const res = await api('PUT', '/profile', {
    token,
    body: { academic_year: 'senior', monthly_allowance: 20000, monthly_savings_goal: 5000 }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.data.profile.academic_year, 'senior');
  assert.strictEqual(parseFloat(res.data.data.profile.monthly_allowance), 20000);
  assert.strictEqual(parseFloat(res.data.data.profile.monthly_savings_goal), 5000);
});

test('PUT /profile rejects invalid academic year', async () => {
  const { token } = await registerAndLogin();
  const res = await api('PUT', '/profile', { token, body: { academic_year: 'wizard' } });
  assert.strictEqual(res.status, 422);
});

test('PUT /profile rejects negative allowance', async () => {
  const { token } = await registerAndLogin();
  const res = await api('PUT', '/profile', { token, body: { monthly_allowance: -5 } });
  assert.strictEqual(res.status, 422);
});

test('Preferences round-trip', async () => {
  const { token } = await registerAndLogin();
  const set = await api('PUT', '/profile/preferences', { token, body: { dashboard_view: 'compact' } });
  assert.strictEqual(set.status, 200);
  const get = await api('GET', '/profile/preferences', { token });
  const prefs = get.data.data.preferences;
  assert.ok(prefs.some((p) => p.setting_key === 'dashboard_view' && p.setting_value === 'compact'));
});

test('Profile is user-scoped (other user cannot read it)', async () => {
  const a = await registerAndLogin({ first_name: 'AliceA' });
  const b = await registerAndLogin({ first_name: 'BobB' });
  const resA = await api('GET', '/profile', { token: a.token });
  const resB = await api('GET', '/profile', { token: b.token });
  assert.notStrictEqual(resA.data.data.profile.user_id, resB.data.data.profile.user_id);
});
