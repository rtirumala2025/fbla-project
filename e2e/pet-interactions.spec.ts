import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe('Pet Interactions', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      process.env.E2E_ENABLED !== 'true' || !EMAIL || !PASSWORD,
      'Pet interaction E2E test skipped; enable by setting E2E_ENABLED=true and credentials.',
    );

    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel(/password/i).fill(PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    if (process.env.E2E_ENABLED === 'true') {
      await page.context().storageState({ path: '.playwright/auth.json' });
    }
  });

  test('feed, play, rest, and view stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/pet`);

    await page.getByRole('button', { name: /feed/i }).click();
    await expect(page.getByText(/food/i)).toBeVisible();

    await page.getByRole('button', { name: /play/i }).click();
    await expect(page.getByText(/mini-game/i)).toBeVisible();

    await page.getByRole('button', { name: /rest/i }).click();
    await expect(page.getByText(/energy/i)).toBeVisible();

    await page.getByRole('link', { name: /stats/i }).click();
    await expect(page.getByText(/health/i)).toBeVisible();
  });
});

