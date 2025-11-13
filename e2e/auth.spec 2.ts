import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe('Authentication Flow', () => {
  test.beforeEach(async () => {
    test.skip(
      process.env.E2E_ENABLED !== 'true' || !EMAIL || !PASSWORD,
      'Authentication E2E test skipped; set E2E_ENABLED=true and credential env vars to run.',
    );
  });

  test('user can sign in and sign out', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.getByRole('link', { name: /sign in|log in/i }).click();
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel(/password/i).fill(PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await expect(page.getByText(/welcome/i)).toBeVisible();

    await page.getByRole('button', { name: /profile|account/i }).click();
    await page.getByRole('button', { name: /sign out|log out/i }).click();

    await expect(page.getByRole('link', { name: /sign in|log in/i })).toBeVisible();
  });
});

