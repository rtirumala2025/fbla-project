import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe('Finance Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      process.env.E2E_ENABLED !== 'true' || !EMAIL || !PASSWORD,
      'Finance E2E test skipped; enable by setting E2E_ENABLED=true and credentials.',
    );

    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel(/password/i).fill(PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('view summary and record a purchase', async ({ page }) => {
    await page.goto(`${BASE_URL}/finance`);

    await expect(page.getByText(/balance/i)).toBeVisible();
    await expect(page.getByText(/allowance/i)).toBeVisible();

    await page.getByRole('button', { name: /shop/i }).click();
    await page.getByRole('button', { name: /purchase/i }).click();
    await expect(page.getByText(/purchase complete/i)).toBeVisible();

    await page.getByRole('link', { name: /transactions/i }).click();
    await expect(page.getByText(/shop purchase/i)).toBeVisible();
  });
});

