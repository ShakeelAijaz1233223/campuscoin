const test=require('node:test');
const assert=require('node:assert/strict');
const {startServer,stopServer,api,registerAndLogin,createAccount}=require('./helpers');
let base;
test.before(async()=>{base=await startServer();});test.after(stopServer);

test('browser cookie auth persists, CSRF writes are rejected and logout clears the cookie',async()=>{
 const user=await registerAndLogin();
 const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:user.password})});
 const cookie=login.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);
 const headers={Cookie:cookie.split(';')[0]};
 assert.equal((await fetch(base+'/auth/me',{headers})).status,200);
 assert.equal((await fetch(base+'/auth/logout',{method:'POST',headers})).status,403);
 const logout=await fetch(base+'/auth/logout',{method:'POST',headers:{...headers,'X-Requested-With':'CampusCoin'}});
 assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Expires=Thu, 01 Jan 1970/);
});

test('registration preserves password characters and allowance',async()=>{
 const email=`characters.${Date.now()}@test.local`,password='  Test<Password>123  ';
 const reg=await api('POST','/auth/register',{body:{email,password,first_name:'Exact',monthly_allowance:7500}});assert.equal(reg.status,201);
 const login=await api('POST','/auth/login',{body:{email,password}});assert.equal(login.status,200);assert.equal(Number(login.data.data.user.profile.monthly_allowance),7500);
});

test('budget edit excludes itself from duplicate check; last transaction deletion resets spending',async()=>{
 const u=await registerAndLogin(),a=await createAccount(u.token);const cats=await api('GET','/categories?type=expense',{token:u.token});const cat=cats.data.data.categories[0];
 const budget=await api('POST','/budgets',{token:u.token,body:{category_id:cat.id,amount:1000,month:9,year:2030}});const id=budget.data.data.budget.id;
 const tx=await api('POST','/transactions',{token:u.token,body:{account_id:a.id,category_id:cat.id,amount:100,type:'expense',date:'2030-09-05',description:'Budget test'}});
 const edit=await api('PATCH',`/budgets/${id}`,{token:u.token,body:{category_id:cat.id,amount:1200,month:9,year:2030}});assert.equal(edit.status,200);assert.equal(Number(edit.data.data.budget.spent),100);
 await api('DELETE',`/transactions/${tx.data.data.transaction.id}`,{token:u.token});
 const list=await api('GET','/budgets?month=9&year=2030',{token:u.token});assert.equal(Number(list.data.data.budgets[0].spent),0);
 await api('DELETE',`/budgets/${id}`,{token:u.token});const again=await api('POST','/budgets',{token:u.token,body:{category_id:cat.id,amount:900,month:9,year:2030}});assert.equal(again.status,201);
});

test('filtered report totals, charts and export describe the same records',async()=>{
 const u=await registerAndLogin(),a=await createAccount(u.token);const cats=await api('GET','/categories',{token:u.token});const expense=cats.data.data.categories.filter(c=>c.type==='expense'),income=cats.data.data.categories.find(c=>c.type==='income');
 for(const [category,type,amount] of [[expense[0],'expense',50],[expense[1],'expense',90],[income,'income',500]])await api('POST','/transactions',{token:u.token,body:{account_id:a.id,category_id:category.id,type,amount,date:'2030-09-05',description:'Report record'}});
 const q=`start_date=2030-09-01&end_date=2030-09-30&category_id=${expense[0].id}&income_category_id=${income.id}`;
 const r=await api('GET','/reports/range?'+q,{token:u.token});assert.equal(r.status,200);assert.deepEqual(r.data.data.report.totals,{income:500,expense:50,count:2});assert.equal(r.data.data.report.daily[0].amount,50);
 const out=await fetch(base+'/reports/range/export?'+q+'&format=json',{headers:{Authorization:`Bearer ${u.token}`}});assert.equal(out.status,200);assert.deepEqual((await out.json()).totals,r.data.data.report.totals);
 const d=await api('GET','/dashboard?month=9&year=2030',{token:u.token});assert.equal(d.data.data.month_summary.expense,140);assert.ok(Array.isArray(d.data.data.spending_trend));
});

test('CSV imports into the selected non-default account with explicit category and AI disabled',async()=>{
 const u=await registerAndLogin(),a=await createAccount(u.token,{balance:0});const cats=await api('GET','/categories?type=expense',{token:u.token});const cat=cats.data.data.categories[0];
 const form=new FormData();form.append('account_id',String(a.id));form.append('use_ai','false');form.append('file',new Blob([`date,description,amount,type,category_id\n2030-09-01,Explicit category,25,expense,${cat.id}`],{type:'text/csv'}),'connected.csv');
 const upload=await fetch(base+'/imports/upload',{method:'POST',headers:{Authorization:`Bearer ${u.token}`},body:form});assert.equal(upload.status,201);const id=(await upload.json()).data.import_id;
 const confirm=await api('POST',`/imports/${id}/confirm`,{token:u.token,body:{skip_duplicates:true}});assert.equal(confirm.data.data.imported,1);
 const tx=await api('GET','/transactions?search=Explicit',{token:u.token});assert.equal(tx.data.data.transactions[0].account_id,a.id);assert.equal(tx.data.data.transactions[0].category_id,cat.id);
 const account=await api('GET',`/accounts/${a.id}`,{token:u.token});assert.equal(Number(account.data.data.account.balance),-25);
 const repeat=await api('POST',`/imports/${id}/confirm`,{token:u.token});assert.equal(repeat.status,400);
});

test('API date validation rejects overflow before reaching MySQL',async()=>{
 const u=await registerAndLogin(),a=await createAccount(u.token);
 const create=await api('POST','/transactions',{token:u.token,body:{account_id:a.id,type:'expense',amount:10,date:'2026-02-30',description:'Invalid day'}});
 assert.equal(create.status,422);
 const report=await api('GET','/reports/range?start_date=2026-02-30&end_date=2026-03-10',{token:u.token});
 assert.equal(report.status,422);
 const valid=await api('POST','/transactions',{token:u.token,body:{account_id:a.id,type:'expense',amount:10,date:'2028-02-29',description:'Leap day'}});
 assert.equal(valid.status,201);
});

test('frontend registration payload creates real, hashed, zero-balance MySQL records',async()=>{
 const {payload}=await import('../../frontend/src/api/contract.js');
 const {uniqueEmail,getDb}=require('./helpers');
 const email=uniqueEmail('test-agent'),password='Abcdef12';
 const body=payload('/auth/register',{name:'Real Integration',email,password,academicYear:'postgraduate',monthlyAllowance:4321});
 assert.deepEqual({first:body.first_name,last:body.last_name,year:body.academic_year},{first:'Real',last:'Integration',year:'graduate'});
 const reg=await api('POST','/auth/register',{body});assert.equal(reg.status,201);
 const id=reg.data.data.user.id,db=getDb();
 try {
  const [[u]]=await db.execute('SELECT * FROM users WHERE id = ? AND email = ?',[id,email]);
  assert.ok(u);assert.notEqual(u.password_hash,password);assert.ok(await require('bcryptjs').compare(password,u.password_hash));
  const [[p]]=await db.execute('SELECT * FROM profiles WHERE user_id = ?',[id]);
  assert.equal(p.first_name,'Real');assert.equal(p.last_name,'Integration');assert.equal(p.academic_year,'graduate');assert.equal(Number(p.monthly_allowance),4321);
  const [accounts]=await db.execute('SELECT * FROM accounts WHERE user_id = ?',[id]);
  assert.equal(accounts.length,1);assert.equal(Number(accounts[0].balance),0);assert.equal(accounts[0].is_default,1);
  const [[counts]]=await db.execute("SELECT (SELECT COUNT(*) FROM transactions WHERE user_id = ?) AS txs, (SELECT COUNT(*) FROM activities WHERE user_id = ? AND action = 'registered') AS registrations, (SELECT COUNT(*) FROM categories WHERE user_id IS NULL AND is_default = 1 AND status = 'active') AS categories",[id,id]);
  assert.equal(counts.txs,0);assert.equal(counts.registrations,1);assert.ok(counts.categories>=12);
  assert.equal((await api('GET','/auth/me',{token:reg.data.data.token})).status,200);
 } finally {await db.end();}
});

test('fresh users can load every main API collection and all analytics without demo records',async()=>{
 const {token}=await registerAndLogin();
 for(const path of ['/auth/me','/profile','/profile/preferences','/accounts','/categories','/categories/defaults','/transactions','/recurring-transactions','/budgets','/budgets/alerts','/goals','/bills','/bills/upcoming','/bills/overdue','/dashboard','/dashboard/forecast','/reports/monthly','/insights','/insights/latest','/tips','/tips/personalized','/bookmarks','/notes','/notifications','/notifications/unread-count','/imports','/settings','/content/announcements','/content/tips','/search?q=Food','/ai/status','/ai/corrections','/ai/suggestions',...['category-spending','daily-spending','weekly-spending','monthly-spending','six-month-overview','historical-averages','category-growth','trends','budget-consumption','savings-rate'].map(p=>'/analytics/'+p)]){
  const r=await api('GET',path,{token});assert.equal(r.status,200,`${path}: ${JSON.stringify(r.data)}`);
 }
 const dashboard=await api('GET','/dashboard',{token});
 assert.equal(dashboard.data.data.balance.total,0);assert.equal(dashboard.data.data.month_summary.income,0);assert.equal(dashboard.data.data.month_summary.expense,0);assert.deepEqual(dashboard.data.data.recent_transactions,[]);
});

test('health and localhost CORS preflight are configured for cookie and Bearer clients',async()=>{
 const health=await fetch(base.replace('/api/v1','')+'/health');assert.equal(health.status,200);assert.equal((await health.json()).success,true);
 const preflight=await fetch(base+'/auth/login',{method:'OPTIONS',headers:{Origin:'http://localhost:5173','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,authorization,x-requested-with'}});
 assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'http://localhost:5173');assert.equal(preflight.headers.get('access-control-allow-credentials'),'true');
});


test('MySQL sessions use UTC for timestamps and reset-token expiry',async()=>{
 const db=require('../src/config/database');
 assert.equal((await db.getOne('SELECT @@session.time_zone AS zone')).zone,'+00:00');
});
