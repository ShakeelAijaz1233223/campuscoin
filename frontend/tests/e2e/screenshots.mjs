// Capture fresh screenshots of the redesigned frontend against the real,
// running stack (Vite -> Express -> MySQL). All data is created through the
// real API with a disposable test user, exactly like the connected specs.
import {chromium} from 'playwright-core';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const OUT = path.resolve('screenshots-out');
mkdirSync(OUT, {recursive: true});
const API = BASE + '/api/v1';
const password = 'Screenshot@123';
const stamp = Date.now();
const email = `shots.${stamp}@test.local`;

async function api(context, method, urlPath, body) {
  const res = await context.request.fetch(API + urlPath, {
    method,
    data: body,
    headers: {'X-Requested-With': 'CampusCoin'}
  });
  if (!res.ok()) throw new Error(`${method} ${urlPath} -> ${res.status()} ${await res.text()}`);
  return res.json().catch(() => ({}));
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(650);
}

async function shot(page, name) {
  await page.screenshot({path: path.join(OUT, name + '.png'), fullPage: true});
  console.log('captured', name);
}

async function main() {
  const browser = await chromium.launch({args: ['--no-sandbox', '--disable-dev-shm-usage']});
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // Auth pages first (no session).
  await page.goto(BASE + '/login');
  await settle(page);
  await shot(page, '01-login');
  await page.goto(BASE + '/register');
  await settle(page);
  await shot(page, '02-register');

  // Real registration through the UI, then seed real records through the API.
  await page.getByLabel('Full name').fill('Amina Yusuf');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', {exact: true}).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', {name: 'Create your account'}).click();
  await page.getByText('You’re all set.').waitFor({timeout: 20000});
  await page.goto(BASE + '/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', {exact: true}).fill(password);
  await page.getByRole('button', {name: 'Sign in to your workspace'}).click();
  await page.waitForURL(/dashboard/, {timeout: 20000});

  const cats = (await api(context, 'GET', '/categories')).data.categories ?? (await api(context, 'GET', '/categories')).data;
  const accounts = (await api(context, 'GET', '/accounts')).data.accounts;
  const catId = name => (cats.find(c => c.name === name) || cats.find(c => c.type === 'expense')).id;
  const account = accounts[0];
  const tx = (category, type, amount, day, description) =>
    api(context, 'POST', '/transactions', {account_id: account.id, category_id: catId(category), type, amount, date: `2026-09-${day}`, description});
  await tx('Food', 'expense', 640, '03', 'Groceries at the campus market');
  await tx('Transport', 'expense', 220, '07', 'Metro card top-up');
  await tx('Food', 'expense', 430, '14', 'Late-night chai run');
  await tx('Shopping', 'expense', 1850, '18', 'Winter hoodies sale');
  await tx('Entertainment', 'expense', 900, '21', 'Movie night with the squad');
  const incomeCats = cats.filter(c => c.type === 'income');
  await api(context, 'POST', '/transactions', {account_id: account.id, category_id: incomeCats[0].id, type: 'income', amount: 25000, date: '2026-09-01', description: 'Monthly allowance'});
  await api(context, 'POST', '/transactions', {account_id: account.id, category_id: incomeCats[1]?.id || incomeCats[0].id, type: 'income', amount: 8000, date: '2026-09-16', description: 'Design freelance gig'});
  await api(context, 'POST', '/budgets', {category_id: catId('Food'), amount: 6000, month: 9, year: 2026});
  await api(context, 'POST', '/budgets', {category_id: catId('Transport'), amount: 1500, month: 9, year: 2026});
  await api(context, 'POST', '/goals', {name: 'New laptop for finals', target_amount: 95000, current_amount: 22000, target_date: '2027-05-01', description: 'A fast, light machine for thesis season.'});
  await api(context, 'POST', '/bills', {name: 'Hostel WiFi', amount: 1500, due_date: '2026-10-02', category_id: catId('Food'), reminder_days: 2, is_paid: false});
  await api(context, 'POST', '/insights/generate', {month: 9, year: 2026});

  await page.goto(BASE + '/dashboard');
  await settle(page);
  try {await shot(page, '03-dashboard-desktop');} catch (e) {console.error('dashboard shot failed: ' + e.message.split('\n')[0]);}

  // Mobile dashboard.
  try {
    const mobile = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    const mpage = await mobile.newPage();
    await mpage.goto(BASE + '/login');
    await mpage.getByLabel('Email address').fill(email);
    await mpage.getByLabel('Password', {exact: true}).fill(password);
    await mpage.getByRole('button', {name: 'Sign in to your workspace'}).click();
    await mpage.waitForURL(/dashboard/, {timeout: 20000});
    await settle(mpage);
    await shot(mpage, '04-dashboard-mobile');
    await mobile.close();
  } catch (e) {console.error('mobile shot failed: ' + e.message.split('\n')[0]);}

  for (const [name, url] of [
    ['05-transactions', '/transactions'],
    ['06-budgets', '/budgets'],
    ['07-savings-goals', '/goals'],
    ['08-bills', '/bills'],
    ['09-reports', '/reports'],
    ['10-ai-insights', '/insights'],
    ['11-saving-tips', '/saving-tips'],
    ['12-saved-notes', '/saved'],
    ['13-categories', '/categories'],
    ['14-recurring', '/recurring-transactions'],
    ['15-notifications', '/notifications'],
    ['16-profile', '/profile'],
    ['17-settings', '/settings']
  ]) {
    try {
      await page.goto(BASE + url);
      await settle(page);
      await shot(page, name);
    } catch (e) {
      console.error('shot failed for ' + name + ': ' + e.message.split('\n')[0]);
    }
  }

  // Admin: sign out student, sign in with the test administrator.
  try {
    await api(context, 'POST', '/auth/logout');
    await page.goto(BASE + '/login');
    await page.getByLabel('Email address').fill(process.env.E2E_ADMIN_EMAIL);
    await page.getByLabel('Password', {exact: true}).fill(process.env.E2E_ADMIN_PASSWORD);
    await page.getByRole('button', {name: 'Sign in to your workspace'}).click();
    await page.waitForURL(/dashboard/, {timeout: 20000});
    for (const [name, url] of [['18-admin-overview', '/admin'], ['19-admin-users', '/admin/users']]) {
      await page.goto(BASE + url);
      await settle(page);
      await shot(page, name);
    }
  } catch (e) {console.error('admin shots failed: ' + e.message.split('\n')[0]);}

  if (errors.length) {
    console.error('PAGE ERRORS:\n' + errors.join('\n'));
    process.exitCode = 2;
  }
  await browser.close();
}
main().catch(e => {console.error(e);process.exit(1);});
