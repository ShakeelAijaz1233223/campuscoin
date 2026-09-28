import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.skip(
  process.env.E2E_CONNECTED !== '1',
  'Requires the disposable test database and real API.'
);
async function session(page) {
  const email = `nocturne.${Date.now()}.${Math.random().toString(36).slice(2)}@test.local`;
  const password = 'NocturneTest@123';
  const response = await page.request.post('/api/v1/auth/register', {
    data: { email, password, first_name: 'Nocturne', last_name: 'Student' }
  });
  expect(response.status()).toBe(201);
  await page.request.post('/api/v1/auth/login', { data: { email, password } });
  await page.goto('/dashboard');
  await expect(page.locator('.balance-number')).toBeVisible();
}

test('header quick-add refreshes an already mounted transaction list', async ({
  page
}) => {
  await session(page);
  await page.goto('/transactions');
  await page
    .getByRole('button', { name: 'Add a transaction', exact: true })
    .click();
  await page
    .getByLabel('Description', { exact: true })
    .fill('Header refresh regression');
  await page.getByLabel('Amount', { exact: true }).fill('321.25');
  await page.getByRole('button', { name: 'Create transaction' }).click();
  await expect(
    page.getByRole('button', { name: 'Header refresh regression', exact: true })
  ).toBeVisible();
});

test('dashboard mutation refreshes annual cash flow and current balance', async ({
  page
}) => {
  await session(page);
  await page
    .getByRole('button', { name: 'Add transaction', exact: true })
    .click();
  await page
    .getByLabel('Description', { exact: true })
    .fill('Annual refresh regression');
  await page.getByLabel('Amount', { exact: true }).fill('321.25');
  await page.getByRole('button', { name: 'Create transaction' }).click();
  await expect(page.locator('.balance-number')).toContainText('321.25');
  await page.getByText('View cash flow data', { exact: true }).click();
  await expect(page.locator('.chart-data').first()).toContainText('321.25');
});

test('annual chart failure is explicit and retry recovers real data', async ({
  page
}) => {
  await session(page);
  let fail = true;
  await page.route('**/api/v1/reports/range?**', async (route) => {
    if (fail)
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Annual chart unavailable' })
      });
    else await route.continue();
  });
  await page.reload();
  await expect(page.getByText('Annual chart unavailable')).toBeVisible();
  await expect(page.locator('.balance-number')).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(
    page.getByRole('heading', { name: 'Spending rhythm' })
  ).toBeVisible();
});

test('goal contributions persist, complete, and reopen through real APIs', async ({
  page
}) => {
  await session(page);
  await page.goto('/goals');
  await page
    .getByRole('button', { name: 'Add goal', exact: true })
    .first()
    .click();
  await page
    .getByLabel('What are you saving for?')
    .fill('Contribution regression');
  await page.getByLabel('Target amount').fill('100');
  await page.getByRole('button', { name: 'Create item' }).click();
  await page.getByRole('button', { name: 'Add savings', exact: true }).click();
  await page.getByLabel('Contribution amount').fill('100');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add savings', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Remove contribution' })
  ).toBeVisible();
  await expect(page.getByLabel('Contribution amount')).not.toBeVisible();
  await page.getByRole('button', { name: 'Remove contribution' }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByLabel('Contribution amount')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Your next small step.' })
  ).toBeVisible();
});

test('mobile drawer traps focus, supports Escape and hides offscreen links', async ({
  page
}) => {
  await session(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.sidebar')).toHaveAttribute('inert', '');
  const trigger = page.getByRole('button', { name: 'Open navigation' });
  await trigger.click();
  const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
  await expect(drawer).toBeVisible();
  await expect(page.locator('.app-main')).toHaveAttribute('inert', '');
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => !!document.activeElement.closest('.sidebar'))
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('all student routes fit mobile, tablet and desktop in both color themes', async ({
  page
}) => {
  test.setTimeout(300000);
  await session(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const routes = [
    'dashboard',
    'transactions',
    'categories',
    'recurring-transactions',
    'budgets',
    'goals',
    'bills',
    'reports',
    'insights',
    'saving-tips',
    'saved',
    'notifications',
    'search',
    'profile',
    'settings'
  ];
  for (const theme of ['dark', 'light']) {
    await page.goto('/settings');
    await page.getByLabel('Color theme').selectOption(theme);
    for (const width of [320, 390, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await page.goto('/' + route);
        await expect(page.locator('main h1')).toBeVisible();
        await page.waitForLoadState('networkidle');
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          `${route} ${theme} ${width}px`
        ).toBe(true);
      }
    }
  }
  await page.getByLabel('Reading size').selectOption('20');
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/dashboard');
  await expect(page.locator('.balance-number')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    'large text at 320px'
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('key screens meet automated WCAG AA checks and reduced motion', async ({
  page
}) => {
  test.setTimeout(90000);
  await page.goto('/login');
  await page.getByLabel('Email address').waitFor();
  const audit = async (label) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          reason: n.failureSummary,
          html: n.html
        }))
      })),
      label
    ).toEqual([]);
  };
  await audit('login');
  await session(page);
  await audit('dashboard');
  expect(
    await page
      .locator('.holo-object')
      .evaluate((node) => getComputedStyle(node).animationName)
  ).toBe('none');
  await page.goto('/transactions');
  await page
    .getByRole('button', { name: 'Add transaction', exact: true })
    .first()
    .click();
  await page.getByLabel('Amount', { exact: true }).waitFor();
  await audit('transaction modal');
  await page.keyboard.press('Escape');
  await page.goto('/settings');
  await page.getByLabel('Color theme').selectOption('light');
  await audit('light settings');
});

test('public and admin screens fit small mobile and desktop without runtime errors', async ({
  page
}) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password/test-token',
      '/help',
      '/sitemap',
      '/404',
      '/unauthorized'
    ]) {
      await page.goto(route);
      await expect(page.locator('main h1').first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        `${route} ${width}px`
      ).toBe(true);
    }
  }
  expect(process.env.E2E_ADMIN_EMAIL).toBeTruthy();
  const login = await page.request.post('/api/v1/auth/login', {
    data: {
      email: process.env.E2E_ADMIN_EMAIL,
      password: process.env.E2E_ADMIN_PASSWORD
    }
  });
  expect(login.status()).toBe(200);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      '/admin',
      '/admin/users',
      '/admin/categories',
      '/admin/announcements',
      '/admin/tips',
      '/admin/statistics'
    ]) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        `${route} ${width}px`
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
