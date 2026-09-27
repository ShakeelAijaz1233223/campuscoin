const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin, createAccount } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

const setup = async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const cats = await api('GET', '/categories', { token: user.token });
  const food = cats.data.data.categories.find((c) => c.name === 'Food');
  const gift = cats.data.data.categories.find((c) => c.name === 'Gift');
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const p = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const py = p.getFullYear();
  const pm = String(p.getMonth() + 1).padStart(2, '0');
  // Two months of data so trend comparisons exist
  await api('POST', '/transactions', { token: user.token, body: { account_id: account.id, category_id: gift.id, type: 'income', amount: 8000, description: 'Allowance', date: `${py}-${pm}-01` } });
  await api('POST', '/transactions', { token: user.token, body: { account_id: account.id, category_id: food.id, type: 'expense', amount: 3000, description: 'Food prev month', date: `${py}-${pm}-05` } });
  await api('POST', '/transactions', { token: user.token, body: { account_id: account.id, category_id: gift.id, type: 'income', amount: 9000, description: 'Allowance', date: `${y}-${m}-01` } });
  await api('POST', '/transactions', { token: user.token, body: { account_id: account.id, category_id: food.id, type: 'expense', amount: 4500, description: 'Food this month', date: `${y}-${m}-05` } });
  return { user, y, m };
};

test('POST /insights/generate creates a stored AI insight with advisory metadata', async () => {
  const { user, y, m } = await setup();
  const res = await api('POST', '/insights/generate', { token: user.token, body: { month: parseInt(m), year: y } });
  assert.strictEqual(res.status, 201);
  const insight = res.data.data.insight;
  assert.ok(insight.summary.length > 50, 'summary must be meaningful');
  assert.ok(insight.tip.length > 10, 'tip must exist');
  const meta = typeof insight.metadata === 'string' ? JSON.parse(insight.metadata) : insight.metadata;
  assert.strictEqual(meta.advisory, true, 'insight must be marked advisory');
  assert.strictEqual(insight.month, parseInt(m));
  assert.strictEqual(insight.year, y);
});

test('Insight includes trend comparison when prior month exists', async () => {
  const { user, y, m } = await setup();
  await api('POST', '/insights/generate', { token: user.token, body: { month: parseInt(m), year: y } });
  const byMonth = await api('GET', `/insights/month/${parseInt(m)}/${y}`, { token: user.token });
  assert.strictEqual(byMonth.status, 200);
  assert.ok(/increase|decrease|stable/i.test(byMonth.data.data.insight.summary), 'summary should compare with previous month');
});

test('AI insight-ready notification is generated', async () => {
  const { user, y, m } = await setup();
  await api('POST', '/insights/generate', { token: user.token, body: { month: parseInt(m), year: y } });
  const notifs = await api('GET', '/notifications?type=ai_insight', { token: user.token });
  assert.ok(notifs.data.data.notifications.length >= 1);
});

test('GET /insights history and latest work; ownership enforced', async () => {
  const { user, y, m } = await setup();
  await api('POST', '/insights/generate', { token: user.token, body: { month: parseInt(m), year: y } });
  const list = await api('GET', '/insights', { token: user.token });
  assert.ok(list.data.data.insights.length >= 1);
  const latest = await api('GET', '/insights/latest', { token: user.token });
  assert.ok(latest.data.data.insight);

  const other = await registerAndLogin();
  const id = list.data.data.insights[0].id;
  const foreign = await api('GET', `/insights/${id}`, { token: other.token });
  assert.strictEqual(foreign.status, 404);
});

test('Saving tips engine: personalized tips ranked with potential savings', async () => {
  const { user } = await setup();
  const res = await api('GET', '/tips/personalized', { token: user.token });
  assert.strictEqual(res.status, 200);
  const tips = res.data.data.tips;
  assert.ok(tips.length >= 1);
  for (const tip of tips) {
    assert.ok('potential_savings' in tip, 'each tip must carry potential savings impact');
    assert.ok('rank_score' in tip);
    assert.ok('source' in tip);
  }
  const scores = tips.map((t) => t.rank_score);
  const sorted = [...scores].sort((a, b) => b - a);
  assert.deepStrictEqual(scores, sorted, 'tips must be ranked');
});

test('Tip dismiss / pin / history flow', async () => {
  const { user } = await setup();
  const tips = (await api('GET', '/tips/personalized', { token: user.token })).data.data.tips;
  const first = tips[0];
  const dismissed = await api('POST', '/tips/dismiss', { token: user.token, body: { tip_title: first.title } });
  assert.strictEqual(dismissed.status, 200);
  const after = (await api('GET', '/tips/personalized', { token: user.token })).data.data.tips;
  assert.ok(!after.some((t) => t.title === first.title), 'dismissed tip should be hidden');

  const pinned = await api('POST', '/tips/pin', { token: user.token, body: { tip_title: after[0]?.title || 'x' } });
  assert.strictEqual(pinned.status, 200);

  const history = await api('GET', '/tips/history', { token: user.token });
  assert.ok(history.data.data.history.generated_at);
});

test('System tips list endpoint works', async () => {
  const { user } = await setup();
  const res = await api('GET', '/tips', { token: user.token });
  assert.strictEqual(res.status, 200);
  assert.ok(res.data.data.tips.length >= 1);
});

test('Bookmarks: tip and insight bookmark lifecycle', async () => {
  const { user } = await setup();
  const tips = (await api('GET', '/tips', { token: user.token })).data.data.tips;
  await api('POST', `/bookmarks/tips/${tips[0].id}`, { token: user.token });

  const dup = await api('POST', `/bookmarks/tips/${tips[0].id}`, { token: user.token });
  assert.strictEqual(dup.status, 409, 'duplicate bookmark rejected');

  await api('POST', '/insights/generate', { token: user.token, body: {} });
  const insights = (await api('GET', '/insights', { token: user.token })).data.data.insights;
  await api('POST', `/bookmarks/insights/${insights[0].id}`, { token: user.token });

  const all = await api('GET', '/bookmarks', { token: user.token });
  assert.ok(all.data.data.tips.length >= 1);
  assert.ok(all.data.data.insights.length >= 1);

  const rm = await api('DELETE', `/bookmarks/tips/${tips[0].id}`, { token: user.token });
  assert.strictEqual(rm.status, 200);
});

test('Notes CRUD with ownership', async () => {
  const a = await registerAndLogin();
  const b = await registerAndLogin();
  const created = await api('POST', '/notes', { token: a.token, body: { title: 'Note A', content: 'Content A' } });
  const id = created.data.data.note.id;

  const foreign = await api('GET', `/notes/${id}`, { token: b.token });
  assert.strictEqual(foreign.status, 404);

  const upd = await api('PUT', `/notes/${id}`, { token: a.token, body: { content: 'Updated' } });
  assert.strictEqual(upd.data.data.note.content, 'Updated');

  const list = await api('GET', '/notes', { token: a.token });
  assert.ok(list.data.data.notes.some((n) => n.id === id));

  const del = await api('DELETE', `/notes/${id}`, { token: a.token });
  assert.strictEqual(del.status, 200);
});
