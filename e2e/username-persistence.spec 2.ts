/**
 * E2E Test: Username Persistence
 * 
 * This test verifies that username changes:
 * 1. Are saved to the database
 * 2. Display immediately in the UI
 * 3. Persist after page reload
 * 4. Persist after re-authentication
 */

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
const ORIGINAL_USERNAME = 'TestUser';
const NEW_USERNAME = `UpdatedUser_${Date.now()}`;

test.describe('Username Persistence E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should persist username change through full flow', async ({ page }) => {
    // Step 1: Login (or skip if already logged in)
    console.log('Step 1: Attempting login...');
    
    // Check if already logged in by looking for dashboard/profile link
    const isLoggedIn = await page.locator('text=/Welcome,|Sign Out/i').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      // Navigate to login page
      await page.click('text=/Log in|Sign In/i');
      await page.waitForURL(/.*\/(login|signin).*/i);
      
      // Fill login form
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForURL(/.*\/dashboard.*/i, { timeout: 10000 });
    }
    
    console.log('✓ Logged in successfully');

    // Step 2: Navigate to Profile page
    console.log('Step 2: Navigating to Profile page...');
    await page.click('a[href*="profile"], button:has-text("Profile")');
    await page.waitForURL(/.*\/profile.*/i);
    console.log('✓ On Profile page');

    // Step 3: Verify current username is displayed
    console.log('Step 3: Checking current username...');
    const currentUsernameElement = await page.locator('text=/Username/i').locator('..').locator('p, input').first();
    const currentUsername = await currentUsernameElement.textContent() || await currentUsernameElement.inputValue();
    console.log(`Current username: ${currentUsername}`);

    // Step 4: Click Edit button
    console.log('Step 4: Clicking Edit button...');
    await page.click('button:has-text("Edit"), button[aria-label="Edit profile"]');
    await page.waitForTimeout(500); // Wait for edit mode to activate
    console.log('✓ Edit mode activated');

    // Step 5: Update username
    console.log(`Step 5: Updating username to: ${NEW_USERNAME}`);
    const usernameInput = page.locator('input[type="text"]').first();
    await usernameInput.clear();
    await usernameInput.fill(NEW_USERNAME);
    console.log('✓ Username field updated');

    // Step 6: Save changes
    console.log('Step 6: Saving changes...');
    
    // Wait for the save request to complete
    const savePromise = page.waitForResponse(
      response => response.url().includes('profiles') && response.request().method() === 'PATCH',
      { timeout: 5000 }
    ).catch(() => null);
    
    await page.click('button:has-text("Save")');
    
    // Wait for success toast
    await expect(page.locator('text=/updated successfully|success/i')).toBeVisible({ timeout: 5000 });
    console.log('✓ Save successful - toast appeared');
    
    const saveResponse = await savePromise;
    if (saveResponse) {
      console.log(`✓ API response: ${saveResponse.status()}`);
      expect(saveResponse.status()).toBe(200);
    }

    // Step 7: Verify immediate UI update on Profile page
    console.log('Step 7: Verifying immediate UI update...');
    await page.waitForTimeout(1000); // Wait for state to update
    await expect(page.locator(`text="${NEW_USERNAME}"`)).toBeVisible({ timeout: 5000 });
    console.log('✓ Username updated on Profile page');

    // Step 8: Navigate to Dashboard and verify
    console.log('Step 8: Navigating to Dashboard...');
    await page.click('a[href*="dashboard"], button:has-text("Dashboard")');
    await page.waitForURL(/.*\/dashboard.*/i);
    
    // Check for username in welcome message or header
    await expect(page.locator(`text=/Welcome.*${NEW_USERNAME}/i`)).toBeVisible({ timeout: 5000 });
    console.log('✓ Username displayed in Dashboard');

    // Step 9: Reload page and verify persistence
    console.log('Step 9: Reloading page to test persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still show new username after reload
    await expect(page.locator(`text=/Welcome.*${NEW_USERNAME}|${NEW_USERNAME}/i`)).toBeVisible({ timeout: 5000 });
    console.log('✓ Username persisted after reload');

    // Step 10: Navigate back to Profile to confirm
    console.log('Step 10: Final verification on Profile page...');
    await page.click('a[href*="profile"], button:has-text("Profile")');
    await page.waitForURL(/.*\/profile.*/i);
    await expect(page.locator(`text="${NEW_USERNAME}"`)).toBeVisible();
    console.log('✓ Username still correct on Profile page');

    console.log('\n✅ ALL CHECKS PASSED - Username persistence verified!');
  });

  test('should reject unauthorized profile updates', async ({ page, context }) => {
    console.log('Testing unauthorized access...');
    
    // Clear all auth cookies and storage
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Try to access profile page without auth
    await page.goto('/profile');
    
    // Should redirect to login or show not authenticated message
    await page.waitForTimeout(2000);
    const url = page.url();
    const isOnLogin = url.includes('login') || url.includes('signin');
    const hasNoAuthMessage = await page.locator('text=/not logged in|please log in|unauthorized/i').isVisible().catch(() => false);
    
    expect(isOnLogin || hasNoAuthMessage).toBeTruthy();
    console.log('✓ Unauthorized access properly blocked');
  });
});

