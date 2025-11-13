import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe('AI Companion Flows', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      process.env.E2E_ENABLED !== 'true' || !EMAIL || !PASSWORD,
      'AI flow E2E test skipped; enable by setting E2E_ENABLED=true and credentials.',
    );

    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(EMAIL!);
    await page.getByLabel(/password/i).fill(PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('open AI assistant, request help, and view notifications', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai`);

    await page.getByRole('textbox', { name: /ask/i }).fill('How can I improve my pet\'s mood?');
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText(/suggestion/i)).toBeVisible();

    await page.getByRole('link', { name: /notifications/i }).click();
    await expect(page.getByText(/needs attention/i)).toBeVisible();
  });
});

