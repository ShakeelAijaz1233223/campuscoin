const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

test('POST /goals creates a savings goal with progress fields', async () => {
  const { token } = await registerAndLogin();
  const res = await api('POST', '/goals', {
    token,
    body: { name: 'Bike Fund', description: 'New bicycle', target_amount: 25000, target_date: '2027-01-31' }
  });
  assert.strictEqual(res.status, 201);
  const goal = res.data.data.goal;
  assert.strictEqual(goal.name, 'Bike Fund');
  assert.strictEqual(goal.percentage, 0);
  assert.strictEqual(goal.remaining, 25000);
  assert.ok(goal.days_remaining > 0);
});

test('POST /goals rejects past target dates and non-positive amounts', async () => {
  const { token } = await registerAndLogin();
  const bad1 = await api('POST', '/goals', { token, body: { name: 'Past', target_amount: 100, target_date: '2020-01-01' } });
  assert.strictEqual(bad1.status, 400);
  const bad2 = await api('POST', '/goals', { token, body: { name: 'Zero', target_amount: 0 } });
  assert.strictEqual(bad2.status, 422);
});

test('Contributions update progress, milestones and completion', async () => {
  const { token } = await registerAndLogin();
  const created = await api('POST', '/goals', {
    token, body: { name: 'Milestone Goal', target_amount: 1000, target_date: '2027-06-30' }
  });
  const id = created.data.data.goal.id;

  const c1 = await api('POST', `/goals/${id}/contributions`, { token, body: { amount: 300, notes: 'first' } });
  assert.strictEqual(c1.status, 201);
  assert.strictEqual(c1.data.data.goal.percentage, 30);

  await api('POST', `/goals/${id}/contributions`, { token, body: { amount: 300 } });
  const c3 = await api('POST', `/goals/${id}/contributions`, { token, body: { amount: 400 } });
  assert.strictEqual(c3.data.data.goal.percentage, 100);
  assert.strictEqual(c3.data.data.goal.status, 'completed');

  const contribs = await api('GET', `/goals/${id}/contributions`, { token });
  assert.strictEqual(contribs.data.data.contributions.length, 3);

  const notifs = await api('GET', '/notifications?type=goal_milestone', { token });
  assert.ok(notifs.data.data.notifications.length >= 3, '25/50/75 milestone notifications expected');
  const completed = await api('GET', '/notifications?type=goal_completed', { token });
  assert.ok(completed.data.data.notifications.length >= 1, 'completion notification expected');
});

test('GET /goals returns summary aggregates', async () => {
  const { token } = await registerAndLogin();
  await api('POST', '/goals', { token, body: { name: 'G1', target_amount: 1000 } });
  await api('POST', '/goals', { token, body: { name: 'G2', target_amount: 2000 } });
  const res = await api('GET', '/goals', { token });
  assert.strictEqual(res.status, 200);
  assert.ok(res.data.data.summary.total_target >= 3000);
});

test('DELETE /goals cancels goal; contributions can be removed', async () => {
  const { token } = await registerAndLogin();
  const created = await api('POST', '/goals', { token, body: { name: 'Cancel Me', target_amount: 500 } });
  const id = created.data.data.goal.id;
  const c = await api('POST', `/goals/${id}/contributions`, { token, body: { amount: 100 } });
  const contributionId = c.data.data.contribution_id;
  const del = await api('DELETE', `/goals/${id}/contributions/${contributionId}`, { token });
  assert.strictEqual(del.status, 200);
  const after = await api('GET', '/goals', { token });
  const goal = after.data.data.goals.find((g) => g.id === id);
  assert.strictEqual(parseFloat(goal.current_amount), 0);
  const cancelled = await api('DELETE', `/goals/${id}`, { token });
  assert.strictEqual(cancelled.status, 200);
});

test('Goals are ownership-protected', async () => {
  const a = await registerAndLogin();
  const b = await registerAndLogin();
  const created = await api('POST', '/goals', { token: a.token, body: { name: 'Private Goal', target_amount: 100 } });
  const res = await api('GET', `/goals/${created.data.data.goal.id}`, { token: b.token });
  assert.strictEqual(res.status, 404);
});
