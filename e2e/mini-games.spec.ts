import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel(/email/i).fill(EMAIL!);
  await page.getByLabel(/password/i).fill(PASSWORD!);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page.getByText(/dashboard/i)).toBeVisible();
}

test.describe('Mini-Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      process.env.E2E_ENABLED !== 'true' || !EMAIL || !PASSWORD,
      'Mini-game E2E test skipped; enable by setting E2E_ENABLED=true and credentials.',
    );

    await login(page);
  });

  test('complete Fetch Frenzy and view rewards summary', async ({ page }) => {
    await page.goto(`${BASE_URL}/play`);
    await page.getByRole('button', { name: /fetch/i }).click();
    await expect(page).toHaveURL(/\/minigames\/fetch$/);
    const catchButton = page.getByRole('button', { name: 'Catch the ball' });
    await catchButton.click();
    await catchButton.click();
    await catchButton.click();
    await expect(page.getByText(/Rewards Earned/i)).toBeVisible();
    await page.getByRole('button', { name: /Keep Playing/i }).click();
    await expect(page.getByText(/Current streak/i)).toBeVisible();
  });

  test('record a reaction run and surface adaptive insights', async ({ page }) => {
    await page.goto(`${BASE_URL}/play`);
    await page.getByRole('button', { name: /free play/i }).click();
    await expect(page).toHaveURL(/\/minigames\/reaction$/);
    await expect(page.getByRole('button', { name: /Tap now!/i })).toBeVisible({ timeout: 7000 });
    await page.getByRole('button', { name: /Tap now!/i }).click();
    await expect(page.getByText(/Rewards Earned/i)).toBeVisible();
    await page.getByRole('button', { name: /Keep Playing/i }).click();
    await expect(page.getByText(/Adaptive insights/i)).toBeVisible();
  });

  test('sync a DreamWorld sequence and fetch leaderboard data', async ({ page }) => {
    await page.goto(`${BASE_URL}/play`);
    await page.getByRole('button', { name: /outdoor adventure/i }).click();
    await expect(page).toHaveURL(/\/minigames\/dream$/);
    await page.getByRole('button', { name: /Sync progress/i }).click();
    await expect(page.getByText(/Rewards Earned/i)).toBeVisible();
    await page.getByRole('button', { name: /Keep Playing/i }).click();
    await expect(page.getByText(/leaderboard/i)).toBeVisible();
  });
});

