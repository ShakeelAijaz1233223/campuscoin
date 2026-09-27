const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

test('POST /bills creates a bill with reminder settings', async () => {
  const { token } = await registerAndLogin();
  const res = await api('POST', '/bills', {
    token,
    body: { name: 'Electricity', amount: 2500, due_date: inDays(5), frequency: 'monthly', reminder_days: 3 }
  });
  assert.strictEqual(res.status, 201);
  const bill = res.data.data.bill;
  assert.strictEqual(bill.is_paid, 0);
  assert.strictEqual(bill.days_until_due, 5);
  assert.strictEqual(bill.overdue, false);
});

test('POST /bills rejects non-positive amounts', async () => {
  const { token } = await registerAndLogin();
  const res = await api('POST', '/bills', { token, body: { name: 'Bad', amount: 0, due_date: inDays(3) } });
  assert.strictEqual(res.status, 422);
});

test('Overdue bills are flagged and listed', async () => {
  const { token } = await registerAndLogin();
  await api('POST', '/bills', { token, body: { name: 'Old Bill', amount: 500, due_date: inDays(-10) } });
  const list = await api('GET', '/bills', { token });
  const old = list.data.data.bills.find((b) => b.name === 'Old Bill');
  assert.strictEqual(old.overdue, true);
  const overdue = await api('GET', '/bills/overdue', { token });
  assert.ok(overdue.data.data.bills.some((b) => b.name === 'Old Bill'));
});

test('Upcoming bills endpoint returns bills due within N days', async () => {
  const { token } = await registerAndLogin();
  await api('POST', '/bills', { token, body: { name: 'Soon Bill', amount: 300, due_date: inDays(4) } });
  await api('POST', '/bills', { token, body: { name: 'Far Bill', amount: 300, due_date: inDays(25) } });
  const res = await api('GET', '/bills/upcoming?days=7', { token });
  const names = res.data.data.bills.map((b) => b.name);
  assert.ok(names.includes('Soon Bill'));
  assert.ok(!names.includes('Far Bill'));
});

test('PATCH pay / unpay toggles bill payment state', async () => {
  const { token } = await registerAndLogin();
  const created = await api('POST', '/bills', { token, body: { name: 'Payable', amount: 100, due_date: inDays(2) } });
  const id = created.data.data.bill.id;
  const paid = await api('PATCH', `/bills/${id}/pay`, { token });
  assert.strictEqual(paid.data.data.bill.is_paid, 1);
  assert.ok(paid.data.data.bill.paid_date);
  const unpaid = await api('PATCH', `/bills/${id}/unpay`, { token });
  assert.strictEqual(unpaid.data.data.bill.is_paid, 0);
});

test('PUT /bills updates, DELETE /bills archives, ownership enforced', async () => {
  const a = await registerAndLogin();
  const b = await registerAndLogin();
  const created = await api('POST', '/bills', { token: a.token, body: { name: 'Updatable Bill', amount: 100, due_date: inDays(3) } });
  const id = created.data.data.bill.id;
  const upd = await api('PUT', `/bills/${id}`, { token: a.token, body: { amount: 150 } });
  assert.strictEqual(parseFloat(upd.data.data.bill.amount), 150);

  const foreign = await api('PUT', `/bills/${id}`, { token: b.token, body: { amount: 1 } });
  assert.strictEqual(foreign.status, 404);

  const del = await api('DELETE', `/bills/${id}`, { token: a.token });
  assert.strictEqual(del.status, 200);
});

test('Bills summary aggregates unpaid totals', async () => {
  const { token } = await registerAndLogin();
  await api('POST', '/bills', { token, body: { name: 'S1', amount: 100, due_date: inDays(1) } });
  await api('POST', '/bills', { token, body: { name: 'S2', amount: 200, due_date: inDays(2) } });
  const res = await api('GET', '/bills', { token });
  assert.ok(res.data.data.summary.unpaid_total >= 300);
});
