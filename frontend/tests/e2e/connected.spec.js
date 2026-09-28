import {test,expect} from '@playwright/test';
// Real Vite proxy -> Express -> MySQL. No route interception.
test.skip(process.env.E2E_CONNECTED!=='1','Requires a migrated, seeded test database and running API.');
const password='ConnectedTest@123';
async function session(page){
 const email=`connected.${Date.now()}.${Math.random().toString(36).slice(2)}@test.local`;
 const reg=await page.request.post('/api/v1/auth/register',{data:{email,password,first_name:'Connected',last_name:'Student'}});expect(reg.status()).toBe(201);
 await page.goto('/login');await page.getByLabel('Email address').fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in to your workspace'}).click();await expect(page).toHaveURL(/dashboard/);return email;
}
async function openForm(page,path,kind){await page.goto(path);await page.getByRole('button',{name:'Add '+kind,exact:true}).first().click();await expect(page.getByRole('dialog')).toBeVisible();}
async function save(page,edit=false){await page.getByRole('button',{name:edit?'Save changes':/^Create (item|transaction)$/}).click();await expect(page.getByRole('dialog')).not.toBeVisible();}
async function remove(page,kind){await page.getByRole('button',{name:'Delete '+kind,exact:true}).first().click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();}
test('login cookie, reload, logout, CSRF and role authorization',async({page})=>{
 await session(page);await page.reload();await expect(page).toHaveURL(/dashboard/);await page.goto('/admin');await expect(page).toHaveURL(/unauthorized/);
 expect((await page.request.post('/api/v1/auth/logout')).status()).toBe(403);
 expect((await page.request.post('/api/v1/auth/logout',{headers:{'X-Requested-With':'CampusCoin'}})).ok()).toBeTruthy();await page.goto('/transactions');await expect(page).toHaveURL(/login/);
});
test('all student routes consume real backend data without runtime/API errors',async({page})=>{
 await session(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/api/v1/')&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 for(const path of ['/dashboard','/transactions','/categories','/recurring-transactions','/budgets','/goals','/bills','/reports','/insights','/saving-tips','/saved','/notifications','/search?q=Food','/profile','/settings']){
  await page.goto(path);await expect(page.locator('main h1')).toBeVisible();await page.waitForLoadState('networkidle');await expect(page.getByText('Let’s get you back on track.')).not.toBeVisible();
 }expect(errors).toEqual([]);
});
test('transaction create, AI, update, filter, dashboard and delete',async({page})=>{
 await session(page);await openForm(page,'/transactions','transaction');await page.getByLabel('Description',{exact:true}).fill('Connected lunch');await page.getByLabel('Amount',{exact:true}).fill('125.50');
 await page.getByRole('button',{name:'Suggest category'}).click();await page.getByRole('button',{name:'Accept',exact:true}).click();await save(page);await page.reload();await expect(page.getByRole('button',{name:'Connected lunch',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Edit transaction',exact:true}).click();await page.getByLabel('Amount',{exact:true}).fill('200');await save(page,true);
 const d=await (await page.request.get('/api/v1/dashboard')).json();expect(d.data.month_summary.expense).toBe(200);expect(Array.isArray(d.data.spending_trend)).toBeTruthy();
 await page.getByRole('button',{name:'Filters',exact:true}).click();await page.getByLabel('Search description').fill('not present');await expect(page.getByText('No matches found.')).toBeVisible();await page.getByLabel('Search description').fill('');await expect(page.getByRole('button',{name:'Connected lunch',exact:true})).toBeVisible();await remove(page,'transaction');await expect(page.getByText('Your transactions start here.')).toBeVisible();
});
test('category, budget, goal, bill, recurring and notes persist',async({page})=>{
 await session(page);await openForm(page,'/categories','category');await page.getByLabel('Category name').fill('Connected category');await save(page);
 await openForm(page,'/budgets','budget');await page.getByLabel('Expense category').selectOption({label:'Connected category'});await page.getByLabel('Monthly limit').fill('1000');await save(page);await expect(page.getByRole('heading',{name:'Connected category'})).toBeVisible();await page.getByRole('button',{name:'Edit budget',exact:true}).click();await page.getByLabel('Monthly limit').fill('1200');await save(page,true);await remove(page,'budget');
 await openForm(page,'/goals','goal');await page.getByLabel('What are you saving for?').fill('Connected laptop');await page.getByLabel('Target amount').fill('5000');await page.getByLabel('Amount already saved').fill('500');await page.getByLabel('Target date').fill('2099-12-31');await save(page);await page.reload();await expect(page.getByText(/500.*saved/)).toBeVisible();await remove(page,'goal');await expect(page.getByText('Your savings goals start here.')).toBeVisible();
 await openForm(page,'/bills','bill');await page.getByLabel('Bill name').fill('Connected internet');await page.getByLabel('Amount',{exact:true}).fill('300');await page.getByLabel('Due date').fill('2099-10-10');await save(page);await page.getByRole('button',{name:'Edit bill',exact:true}).click();await page.getByLabel('Status',{exact:true}).selectOption('paid');await save(page,true);await page.reload();await expect(page.getByText('paid',{exact:true})).toBeVisible();await remove(page,'bill');await expect(page.getByText('Your bills & payments start here.')).toBeVisible();
 await openForm(page,'/recurring-transactions','recurring transaction');await page.getByLabel('Description',{exact:true}).fill('Connected recurring');await page.getByLabel('Amount',{exact:true}).fill('50');await page.getByLabel('Category',{exact:true}).selectOption({label:'Connected category'});await page.getByLabel('Start date').fill('2099-10-01');await page.getByLabel('Active',{exact:true}).uncheck();await save(page);await expect(page.getByText('Paused',{exact:true})).toBeVisible();await remove(page,'recurring transaction');
 await page.goto('/saved');await page.getByRole('button',{name:'Your notes'}).click();await page.getByRole('button',{name:'Add note',exact:true}).first().click();await page.getByLabel('Title',{exact:true}).fill('Connected note');await page.getByLabel('Note',{exact:true}).fill('Remember the budget');await save(page);await expect(page.getByText('Remember the budget').first()).toBeVisible();await remove(page,'note');
});
test('CSV upload, category correction, duplicates and confirmation',async({page})=>{
 await session(page);const cats=await (await page.request.get('/api/v1/categories?type=expense')).json();const cat=cats.data.categories[0];
 const accounts=await (await page.request.get('/api/v1/accounts')).json();const account=accounts.data.accounts[0];
 await page.goto('/transactions');await page.getByRole('button',{name:'Import CSV'}).click();await page.locator('input[type=file]').setInputFiles({name:'connected.csv',mimeType:'text/csv',buffer:Buffer.from(`description,amount,type,date,categoryId\nConnected CSV,17,expense,2026-09-01,${cat.id}\nConnected CSV,17,expense,2026-09-01,${cat.id}\n`)});
 await page.getByRole('button',{name:'Validate with backend'}).click();await page.getByRole('button',{name:'Confirm import'}).click();await expect(page.getByRole('heading',{name:'Import complete'})).toBeVisible();await expect(page.getByText(/1 imported/)).toBeVisible();
 const tx=await (await page.request.get('/api/v1/transactions?search=Connected%20CSV')).json();expect(tx.data.transactions).toHaveLength(1);expect(tx.data.transactions[0].category_id).toBe(cat.id);expect(tx.data.transactions[0].account_id).toBe(account.id);
});
test('reports download PDF, CSV and JSON; six-month range',async({page})=>{
 await session(page);await page.goto('/reports');await page.waitForLoadState('networkidle');
 for(const name of ['PDF','CSV','JSON']){const download=page.waitForEvent('download');await page.getByRole('button',{name,exact:true}).click();expect((await download).suggestedFilename()).toBe('campuscoin-report.'+name.toLowerCase());}
 await page.getByRole('button',{name:'Six-month overview'}).click();await expect(page.getByLabel('From',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'PDF',exact:true})).toBeVisible();
});
test('insights, bookmarks, tips and unread notifications',async({page})=>{
 await session(page);await page.goto('/insights');await page.getByRole('button',{name:/Generate/}).click();await page.getByRole('button',{name:'Bookmark',exact:true}).click();await expect(page.getByRole('button',{name:'Remove bookmark',exact:true})).toBeVisible();await page.goto('/saved');await page.getByRole('button',{name:'Saved insights'}).click();await page.getByRole('button',{name:'Remove bookmark'}).click();await expect(page.getByText('Keep the good ideas close.')).toBeVisible();
 await page.goto('/saving-tips');await page.getByRole('button',{name:'Bookmark',exact:true}).first().click();await expect(page.getByRole('button',{name:'Remove bookmark',exact:true})).toBeVisible();await page.getByRole('button',{name:'Dismiss tip'}).first().click();
 await page.goto('/notifications');await page.getByRole('button',{name:'Mark all read'}).click();await page.getByRole('button',{name:'Unread',exact:true}).click();await expect(page.getByText('You’re all caught up.')).toBeVisible();
});
test('profile and notification settings survive reload',async({page})=>{
 await session(page);await page.goto('/profile');await page.getByLabel('Full name').fill('Updated Student');await page.getByLabel('Academic year').selectOption('postgraduate');await page.getByLabel('Monthly allowance baseline').fill('9000');await page.getByLabel('Savings goal',{exact:true}).fill('700');await page.getByRole('button',{name:'Save changes'}).click();await expect(page.getByText('Your profile has been updated.')).toBeVisible();await page.reload();await expect(page.getByLabel('Full name')).toHaveValue('Updated Student');await expect(page.getByLabel('Monthly allowance baseline')).toHaveValue('9000.00');
 await page.goto('/settings');await page.getByLabel('In-app notifications').check();await page.getByRole('button',{name:'Save preferences'}).click();await expect(page.getByText('Preferences saved.')).toBeVisible();await page.reload();await expect(page.getByLabel('In-app notifications')).toBeChecked();
});
test('registration and development password reset through actual forms',async({page})=>{
 const email=`form.${Date.now()}@test.local`;await page.goto('/register');await page.getByLabel('Full name').fill('Form Student');await page.getByLabel('Email address').fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByLabel('Confirm password').fill(password);await page.getByLabel('Academic year').selectOption('3');await page.getByLabel('Monthly allowance (PKR)').fill('4321');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Create your account'}).click();await expect(page.getByText('You’re all set.')).toBeVisible();
 await page.goto('/forgot-password');await page.getByLabel('Email address').fill(email);await page.getByRole('button',{name:'Send reset link'}).click();await page.getByRole('link',{name:'Development only: open password reset link'}).click();await page.getByLabel('Password',{exact:true}).fill('ChangedTest@123');await page.getByLabel('Confirm password').fill('ChangedTest@123');await page.getByRole('button',{name:'Reset password',exact:true}).click();await expect(page.getByText('Your password has been reset. You can now sign in.')).toBeVisible();
 await page.goto('/login');await page.getByLabel('Email address').fill(email);await page.getByLabel('Password',{exact:true}).fill('ChangedTest@123');await page.getByRole('button',{name:'Sign in to your workspace'}).click();await expect(page).toHaveURL(/dashboard/);const me=await(await page.request.get('/api/v1/auth/me')).json();expect(Number(me.data.user.profile.monthly_allowance)).toBe(4321);
});
test('admin statistics and content management use protected backend routes',async({page})=>{
 await page.goto('/login');await page.getByLabel('Email address').fill(process.env.E2E_ADMIN_EMAIL||'admin@campuscoin.com');await page.getByLabel('Password',{exact:true}).fill(process.env.E2E_ADMIN_PASSWORD||'Admin@123');await page.getByRole('button',{name:'Sign in to your workspace'}).click();await expect(page).toHaveURL(/dashboard/);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/api/v1/')&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 for(const path of ['/admin','/admin/users','/admin/categories','/admin/announcements','/admin/tips','/admin/statistics']){await page.goto(path);await page.waitForLoadState('networkidle');await expect(page.locator('main h1')).toBeVisible();}expect(errors).toEqual([]);
 const name='Connected announcement '+Date.now();await openForm(page,'/admin/announcements','announcement');await page.getByLabel('Title',{exact:true}).fill(name);await page.getByLabel('Announcement',{exact:true}).fill('A live integration test');await page.getByLabel('Published').check();await save(page);await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
 const row=page.getByRole('row').filter({has:page.getByRole('button',{name,exact:true})});await row.getByRole('button',{name:'Edit announcement',exact:true}).click();await page.getByLabel('Announcement',{exact:true}).fill('Updated live integration test');await save(page,true);await row.getByRole('button',{name:'Delete announcement',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByRole('button',{name,exact:true})).not.toBeVisible();
});
test('accounts and admin user-access/tip actions persist',async({page})=>{
 const email=await session(page);
 await openForm(page,'/settings','account');await page.getByLabel('Account name').fill('Connected bank');await page.getByLabel('Account type').selectOption('bank');await page.getByLabel('Balance',{exact:true}).fill('200');await save(page);
 let row=page.getByRole('row').filter({has:page.getByRole('button',{name:'Connected bank',exact:true})});await row.getByRole('button',{name:'Edit account',exact:true}).click();await page.getByLabel('Balance',{exact:true}).fill('350');await save(page,true);await page.reload();row=page.getByRole('row').filter({has:page.getByRole('button',{name:'Connected bank',exact:true})});await expect(row).toContainText('350');await row.getByRole('button',{name:'Delete account',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByRole('button',{name:'Connected bank',exact:true})).not.toBeVisible();
 await page.request.post('/api/v1/auth/logout',{headers:{'X-Requested-With':'CampusCoin'}});await page.goto('/login');await page.getByLabel('Email address').fill(process.env.E2E_ADMIN_EMAIL||'admin@campuscoin.com');await page.getByLabel('Password',{exact:true}).fill(process.env.E2E_ADMIN_PASSWORD||'Admin@123');await page.getByRole('button',{name:'Sign in to your workspace'}).click();await expect(page).toHaveURL(/dashboard/);
 await page.goto('/admin/users');await page.getByLabel('Search users').fill(email);row=page.getByRole('row').filter({hasText:email});await row.getByRole('button',{name:'Disable',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(row.getByRole('button',{name:'Enable',exact:true})).toBeVisible();await row.getByRole('button',{name:'Reset access',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(row.getByRole('button',{name:'Disable',exact:true})).toBeVisible();
 const name='Connected tip '+Date.now();await openForm(page,'/admin/tips','tip');await page.getByLabel('Title',{exact:true}).fill(name);await page.getByLabel('Tip content').fill('Keep a record');await page.getByLabel('Topic').fill('General');await save(page);row=page.getByRole('row').filter({has:page.getByRole('button',{name,exact:true})});await expect(row).toContainText('Paused');await row.getByRole('button',{name:'Edit tip',exact:true}).click();await page.getByLabel('Published').check();await save(page,true);await expect(row).toContainText('Active');await row.getByRole('button',{name:'Delete tip',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByRole('button',{name,exact:true})).not.toBeVisible();
});
test('new budgets use the selected month and remain visible after save',async({page})=>{
 await session(page);
 await page.goto('/budgets');
 await page.getByLabel('Budget month',{exact:true}).fill('2031-04');
 await page.getByRole('button',{name:'Add budget',exact:true}).first().click();
 await expect(page.getByLabel('Month',{exact:true})).toHaveValue('2031-04');
 await page.getByLabel('Expense category').selectOption({label:'Food'});
 await page.getByLabel('Monthly limit').fill('875');
 await save(page);
 await expect(page.getByRole('heading',{name:'Food',exact:true})).toBeVisible();
 const response=await page.request.get('/api/v1/budgets?month=4&year=2031');
 const data=await response.json();
 expect(data.data.budgets).toHaveLength(1);
 expect(Number(data.data.budgets[0].amount)).toBe(875);
});

test('empty CSV is rejected and cannot leave a previous file ready for import',async({page})=>{
 await session(page);
 await page.goto('/transactions');
 await page.getByRole('button',{name:'Import CSV',exact:true}).click();
 const input=page.locator('input[type=file]');
 await input.setInputFiles({name:'valid.csv',mimeType:'text/csv',buffer:Buffer.from('description,amount,type,date\nPreview only,10,expense,2026-09-01\n')});
 await expect(page.getByRole('heading',{name:'Review 1 rows',exact:true})).toBeVisible();
 await input.setInputFiles({name:'empty.csv',mimeType:'text/csv',buffer:Buffer.from('description,amount,type,date\n')});
 await expect(page.getByText('CSV file contains no data rows.',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Validate with backend',exact:true})).not.toBeVisible();
 await expect(page.getByRole('button',{name:'Confirm import',exact:true})).not.toBeVisible();
});

test('registration policy, SQL persistence, login, authenticated dashboard and UI logout',async({page})=>{
 const email=`test-agent-${Date.now()}@example.com`,password='Abcdef12';
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let submissions=0;page.on('request',r=>{if(r.url().endsWith('/auth/register')&&r.method()==='POST')submissions++;});
 await page.goto('/register');
 await page.getByLabel('Full name').fill('Verified Student');
 await page.getByLabel('Email address').fill(email);
 await page.getByLabel('Password',{exact:true}).fill('onlylowercase12');
 await page.getByLabel('Confirm password').fill('onlylowercase12');
 await page.getByRole('checkbox').check();
 await page.getByRole('button',{name:'Create your account'}).click();
 await expect(page.getByRole('alert')).toContainText('uppercase letter');expect(submissions).toBe(0);
 await page.getByLabel('Password',{exact:true}).fill(password);
 await page.getByLabel('Confirm password').fill(password);
 // Academic year and monthly allowance are optional, just as on the backend.
 const response=page.waitForResponse(r=>r.url().endsWith('/auth/register')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Create your account'}).click();
 const registered=await response;expect(registered.status()).toBe(201);
 const user=(await registered.json()).data.user;
 await expect(page.getByText('You’re all set.')).toBeVisible();
 // Query the same MySQL DB as the test API; no browser/API interception.
 const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);
 const db=require('../../../backend/src/config/database');
 try {
  const record=await db.getOne('SELECT u.id, u.password_hash, p.first_name, p.last_name, p.academic_year FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = ? AND u.email = ?',[user.id,email]);
  expect(record.first_name).toBe('Verified');expect(record.last_name).toBe('Student');expect(record.academic_year).toBe('freshman');
  expect(await require('../../../backend/node_modules/bcryptjs').compare(password,record.password_hash)).toBe(true);
  const accounts=await db.query('SELECT balance, is_default FROM accounts WHERE user_id = ?',[user.id]);
  expect(accounts).toHaveLength(1);expect(Number(accounts[0].balance)).toBe(0);
  expect(Number((await db.getOne('SELECT COUNT(*) AS n FROM transactions WHERE user_id = ?',[user.id])).n)).toBe(0);
  expect(Number((await db.getOne("SELECT COUNT(*) AS n FROM activities WHERE user_id = ? AND action = 'registered'",[user.id])).n)).toBe(1);
 } finally {await db.pool.end();}
 await page.getByRole('link',{name:/Back to sign in/}).click();
 await page.getByLabel('Email address').fill(email);await page.getByLabel('Password',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Sign in to your workspace'}).click();await expect(page).toHaveURL(/dashboard/);
 const cookie=(await page.context().cookies()).find(c=>c.name==='campuscoin_session');expect(cookie.httpOnly).toBe(true);
 expect(await page.evaluate(()=>Object.keys(localStorage).some(k=>/token|session/i.test(k)))).toBe(false);
 const me=await page.request.get('/api/v1/auth/me');expect(me.status()).toBe(200);expect((await me.json()).data.user.email).toBe(email);
 const dashboard=await page.request.get('/api/v1/dashboard');expect(dashboard.status()).toBe(200);expect((await dashboard.json()).data.balance.total).toBe(0);
 await page.reload();await expect(page).toHaveURL(/dashboard/);
 await page.getByRole('button',{name:/Sign out|Log out/i}).click();
 await expect(page).toHaveURL(/login|^http[^/]+\/$/);
 expect((await page.context().cookies()).some(c=>c.name==='campuscoin_session')).toBe(false);
 expect((await page.request.get('/api/v1/auth/me')).status()).toBe(401);
 expect(errors).toEqual([]);
});


test('sign out clears stale UI state when the browser session is already gone',async({page})=>{
 await session(page);
 // Let dashboard requests finish before simulating expiry; otherwise a pending
 // protected request correctly redirects before the sign-out button can be used.
 await expect(page.getByText('Total balance').first()).toBeVisible();
 await page.waitForLoadState('networkidle');
 await page.context().clearCookies();
 await page.getByRole('button',{name:'Sign out',exact:true}).click();
 await expect(page).toHaveURL(/login/);
});

test('change password from the profile page and sign back in',async({page})=>{
 const email=await session(page);
 await page.goto('/profile');
 await page.getByLabel('Current password',{exact:true}).fill('ConnectedTest@123');
 await page.getByLabel('New password',{exact:true}).fill('Rotated@12345');
 await page.getByLabel('Confirm new password').fill('Rotated@12345');
 await page.getByRole('button',{name:'Change password'}).click();
 await expect(page.getByText('Your password has been changed.')).toBeVisible();
 await page.getByRole('button',{name:'Sign out',exact:true}).click();
 await expect(page).toHaveURL(/login/);
 await page.getByLabel('Email address').fill(email);
 await page.getByLabel('Password',{exact:true}).fill('Rotated@12345');
 await page.getByRole('button',{name:'Sign in to your workspace'}).click();
 await expect(page).not.toHaveURL(/login/);
 await expect(page.getByLabel('Full name')).toBeVisible();
 await page.context().clearCookies();
 await page.goto('/login');
 await page.getByLabel('Email address').fill(email);
 await page.getByLabel('Password',{exact:true}).fill('ConnectedTest@123');
 await page.getByRole('button',{name:'Sign in to your workspace'}).click();
 await expect(page).toHaveURL(/login/);
 await expect(page.getByRole('alert')).toContainText('Invalid email or password');
});
