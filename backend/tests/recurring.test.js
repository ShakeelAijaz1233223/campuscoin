const test = require('node:test');
const assert = require('node:assert');
const { startServer, api, registerAndLogin, createAccount } = require('./helpers');

test.before(startServer);
test.after(require('./helpers').stopServer);

const setup = async () => {
  const user = await registerAndLogin();
  const account = await createAccount(user.token);
  const cats = await api('GET', '/categories', { token: user.token });
  return {
    user, account,
    expenseCat: cats.data.data.categories.find((c) => c.name === 'Subscriptions'),
    incomeCat: cats.data.data.categories.find((c) => c.name === 'Allowance')
  };
};

test('POST /recurring-transactions creates a monthly expense rule', async () => {
  const { user, account, expenseCat } = await setup();
  const res = await api('POST', '/recurring-transactions', {
    token: user.token,
    body: {
      account_id: account.id, category_id: expenseCat.id, type: 'expense',
      amount: 500, description: 'Gym membership', frequency: 'monthly',
      start_date: '2026-10-01'
    }
  });
  assert.strictEqual(res.status, 201);
  const rule = res.data.data.recurring_transaction;
  assert.strictEqual(rule.next_occurrence, '2026-10-01');
  assert.strictEqual(rule.is_active, 1);
});

test('POST /recurring-transactions creates income rules with custom frequency', async () => {
  const { user, account, incomeCat } = await setup();
  const res = await api('POST', '/recurring-transactions', {
    token: user.token,
    body: {
      account_id: account.id, category_id: incomeCat.id, type: 'income',
      amount: 1000, description: 'Weekly allowance', frequency: 'weekly',
      start_date: '2026-10-01', end_date: '2026-12-31'
    }
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.data.recurring_transaction.frequency, 'weekly');
});

test('POST /recurring-transactions rejects end date before start date', async () => {
  const { user, account, expenseCat } = await setup();
  const res = await api('POST', '/recurring-transactions', {
    token: user.token,
    body: {
      account_id: account.id, category_id: expenseCat.id, type: 'expense',
      amount: 100, description: 'Bad range', frequency: 'monthly',
      start_date: '2026-10-10', end_date: '2026-10-01'
    }
  });
  assert.strictEqual(res.status, 400);
});

test('Process generates due transactions without duplicates', async () => {
  const h = require('./helpers');
  const { user, account, expenseCat } = await setup();
  // Rule starting in the past => due immediately
  const created = await api('POST', '/recurring-transactions', {
    token: user.token,
    body: {
      account_id: account.id, category_id: expenseCat.id, type: 'expense',
      amount: 300, description: 'Past due rule', frequency: 'monthly',
      start_date: new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth()-1,1)).toISOString().slice(0,10)
    }
  });
  assert.strictEqual(created.status, 201);

  const p1 = await api('POST', '/recurring-transactions/process', { token: user.token });
  assert.strictEqual(p1.status, 200);
  assert.ok(p1.data.data.generated >= 1, 'should generate at least one transaction');

  const p2 = await api('POST', '/recurring-transactions/process', { token: user.token });
  assert.strictEqual(p2.data.data.generated, 0, 'second run must not duplicate');
  // Duplicate prevention: exactly one transaction per generated date exists
  const txs = await api('GET', '/transactions?search=Past due rule', { token: user.token });
  assert.strictEqual(txs.data.data.transactions.length, 2, 'previous and current month generated exactly once each');
});

test('PATCH toggle activates/deactivates a rule', async () => {
  const { user, account, expenseCat } = await setup();
  const created = await api('POST', '/recurring-transactions', {
    token: user.token,
    body: { account_id: account.id, category_id: expenseCat.id, type: 'expense', amount: 50, description: 'Toggle me', frequency: 'monthly', start_date: '2026-10-01' }
  });
  const id = created.data.data.recurring_transaction.id;
  const off = await api('PATCH', `/recurring-transactions/${id}/toggle`, { token: user.token, body: { is_active: false } });
  assert.strictEqual(off.data.data.recurring_transaction.is_active, 0);
  const on = await api('PATCH', `/recurring-transactions/${id}/toggle`, { token: user.token, body: { is_active: true } });
  assert.strictEqual(on.data.data.recurring_transaction.is_active, 1);
});

test('Recurring rules are ownership-protected', async () => {
  const a = await registerAndLogin();
  const b = await registerAndLogin();
  const account = await createAccount(a.token);
  const created = await api('POST', '/recurring-transactions', {
    token: a.token,
    body: { account_id: account.id, type: 'income', amount: 10, description: 'Private rule', frequency: 'monthly', start_date: '2026-10-01' }
  });
  const res = await api('GET', `/recurring-transactions/${created.data.data.recurring_transaction.id}`, { token: b.token });
  assert.strictEqual(res.status, 404);
});

test('concurrent processors post a due occurrence and balance change exactly once', async () => {
  const {user,account,expenseCat}=await setup();
  const today=new Date().toISOString().slice(0,10);
  const created=await api('POST','/recurring-transactions',{token:user.token,body:{account_id:account.id,category_id:expenseCat.id,type:'expense',amount:25,frequency:'monthly',start_date:today}});
  assert.strictEqual(created.status,201);
  const results=await Promise.all([api('POST','/recurring-transactions/process',{token:user.token}),api('POST','/recurring-transactions/process',{token:user.token})]);
  assert.deepStrictEqual(results.map(r=>r.status),[200,200]);
  assert.strictEqual(results.reduce((n,r)=>n+r.data.data.generated,0),1);
  const after=await api('GET',`/accounts/${account.id}`,{token:user.token});
  assert.strictEqual(Number(after.data.data.account.balance),975);
});

test('overdue recurring rules catch up only through their end date', async () => {
  const {user,account,expenseCat}=await setup();
  const start=new Date(); start.setUTCDate(start.getUTCDate()-3);
  const end=new Date(); end.setUTCDate(end.getUTCDate()-2);
  const created=await api('POST','/recurring-transactions',{token:user.token,body:{account_id:account.id,category_id:expenseCat.id,type:'expense',amount:10,frequency:'daily',start_date:start.toISOString().slice(0,10),end_date:end.toISOString().slice(0,10)}});
  assert.strictEqual(created.status,201);
  const result=await api('POST','/recurring-transactions/process',{token:user.token});
  assert.strictEqual(result.data.data.generated,2);
  const second=await api('POST','/recurring-transactions/process',{token:user.token});
  assert.strictEqual(second.data.data.generated,0);
});
