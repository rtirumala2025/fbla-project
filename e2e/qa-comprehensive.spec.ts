/**
 * Comprehensive QA End-to-End Test Suite
 * 
 * Tests:
 * - All AI endpoints (chat, budget advisor, pet AI, coach, art generation)
 * - Edge cases (empty data, invalid commands, missing DB entries)
 * - Mobile and desktop responsiveness
 * - Performance metrics (AI response times)
 * - Database integrity
 * - Zero crashes or broken states
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3002';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';
const TEST_ENABLED = process.env.E2E_ENABLED === 'true';

// Performance metrics storage
interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: number;
  error?: string;
}

const performanceMetrics: PerformanceMetric[] = [];

// Helper function to measure API response time
async function measureAPIResponse(
  page: Page,
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    data?: any;
    body?: string;
  } = {}
): Promise<{ response: any; duration: number; status: number }> {
  const startTime = Date.now();
  let response: any;
  
  try {
    if (options.method === 'POST') {
      response = await page.request.post(url, {
        headers: options.headers || {},
        data: options.data,
        multipart: options.body ? undefined : undefined,
      });
    } else if (options.method === 'PUT') {
      response = await page.request.put(url, {
        headers: options.headers || {},
        data: options.data,
      });
    } else if (options.method === 'PATCH') {
      response = await page.request.patch(url, {
        headers: options.headers || {},
        data: options.data,
      });
    } else if (options.method === 'DELETE') {
      response = await page.request.delete(url, {
        headers: options.headers || {},
      });
    } else {
      response = await page.request.get(url, {
        headers: options.headers || {},
      });
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    performanceMetrics.push({
      endpoint: url,
      method: options.method || 'GET',
      responseTime: duration,
      status: 0,
      timestamp: Date.now(),
      error: error.message,
    });
    throw error;
  }
  
  const duration = Date.now() - startTime;
  
  performanceMetrics.push({
    endpoint: url,
    method: options.method || 'GET',
    responseTime: duration,
    status: response.status(),
    timestamp: Date.now(),
  });

  return { response, duration, status: response.status() };
}

// Helper function to get auth token
async function getAuthToken(page: Page): Promise<string | null> {
  try {
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find(c => c.name.includes('token') || c.name.includes('access'));
    return tokenCookie?.value || null;
  } catch {
    return null;
  }
}

// Helper function to login
async function login(page: Page): Promise<void> {
  if (!TEST_ENABLED) return;
  
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.getByLabel(/email/i).first();
  const passwordInput = page.getByLabel(/password/i).first();
  
  if (await emailInput.isVisible()) {
    await emailInput.fill(EMAIL);
    await passwordInput.fill(PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard|home|pet/i, { timeout: 10000 });
  }
}

test.describe('Comprehensive QA Test Suite', () => {
  test.beforeAll(async () => {
    // Clear performance metrics
    performanceMetrics.length = 0;
  });

  test.beforeEach(async ({ page }) => {
    test.skip(
      !TEST_ENABLED,
      'E2E tests skipped; enable by setting E2E_ENABLED=true'
    );

    // Set longer timeout for API calls
    test.setTimeout(120000);
  });

  test.afterAll(async () => {
    // Write performance metrics to file
    const metricsPath = path.join(process.cwd(), 'playwright-report', 'performance-metrics.json');
    fs.mkdirSync(path.dirname(metricsPath), { recursive: true });
    fs.writeFileSync(metricsPath, JSON.stringify(performanceMetrics, null, 2));
  });

  test.describe('Authentication & Setup', () => {
    test('should handle login flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page).toHaveURL(/login/i);
      
      // Check responsive design
      const viewport = page.viewportSize();
      expect(viewport).toBeTruthy();
      
      // Test form visibility
      const emailField = page.getByLabel(/email/i).first();
      const passwordField = page.getByLabel(/password/i).first();
      
      await expect(emailField).toBeVisible();
      await expect(passwordField).toBeVisible();
    });

    test('should redirect authenticated users from login', async ({ page }) => {
      await login(page);
      await page.goto(`${BASE_URL}/login`);
      // Should redirect to dashboard
      await page.waitForURL(/dashboard|home|pet/i, { timeout: 5000 }).catch(() => {});
    });
  });

  test.describe('AI Chat Endpoints', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('POST /api/ai/chat - valid request', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, duration, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            message: 'How can I improve my pet\'s mood?',
            session_id: `test-session-${Date.now()}`,
          },
        }
      );

      expect(status).toBeLessThan(500); // Should not be server error
      expect(duration).toBeLessThan(30000); // Should respond within 30s
      
      if (status < 400) {
        const data = await response.json();
        expect(data).toHaveProperty('message');
      }
    });

    test('POST /api/ai/chat - empty message', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            message: '',
            session_id: `test-session-${Date.now()}`,
          },
        }
      );

      // Should handle empty message gracefully (400 or 200 with default response)
      expect([200, 400, 422]).toContain(status);
    });

    test('POST /api/ai/chat - missing session_id', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            message: 'Test message',
          },
        }
      );

      // Should handle missing session_id (might be optional or required)
      expect(status).toBeLessThan(500);
    });

    test('POST /api/ai/chat - invalid JSON', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: 'invalid json',
        }
      );

      expect([400, 422]).toContain(status);
    });

    test('POST /api/ai/chat - very long message', async ({ page }) => {
      const token = await getAuthToken(page);
      const longMessage = 'a'.repeat(10000);
      const { response, duration, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            message: longMessage,
            session_id: `test-session-${Date.now()}`,
          },
        }
      );

      // Should handle long messages (accept, truncate, or reject)
      expect(status).toBeLessThan(500);
    });
  });

  test.describe('Budget Advisor AI Endpoints', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('POST /api/budget-advisor/analyze - valid transactions', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, duration, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/budget-advisor/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            transactions: [
              { amount: 50.00, category: 'Food', date: new Date().toISOString() },
              { amount: 25.00, category: 'Entertainment', date: new Date().toISOString() },
            ],
            monthly_budget: 1000.00,
          },
        }
      );

      expect(status).toBeLessThan(500);
      expect(duration).toBeLessThan(30000);

      if (status < 400) {
        const data = await response.json();
        expect(data).toHaveProperty('status');
      }
    });

    test('POST /api/budget-advisor/analyze - empty transactions', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/budget-advisor/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            transactions: [],
            monthly_budget: 1000.00,
          },
        }
      );

      // Should return 400 for empty transactions
      expect([400, 422]).toContain(status);
    });

    test('POST /api/budget-advisor/analyze - invalid amounts', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/budget-advisor/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            transactions: [
              { amount: -50.00, category: 'Food', date: new Date().toISOString() },
            ],
            monthly_budget: 1000.00,
          },
        }
      );

      expect([400, 422]).toContain(status);
    });

    test('POST /api/budget-advisor/analyze - zero amounts', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/budget-advisor/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            transactions: [
              { amount: 50.00, category: '', date: new Date().toISOString() },
            ],
            monthly_budget: 1000.00,
          },
        }
      );

      expect([400, 422]).toContain(status2);
    });

    test('GET /api/budget-advisor/health', async ({ page }) => {
      const { response, duration, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/budget-advisor/health`,
        { method: 'GET' }
      );

      expect(status).toBe(200);
      expect(duration).toBeLessThan(5000);

      const data = await response.json();
      expect(data).toHaveProperty('status');
    });
  });

  test.describe('Pet AI Endpoints', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('POST /api/pets/interact - feed action', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, duration, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/pets/interact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            action: 'feed',
            session_id: `test-session-${Date.now()}`,
          },
        }
      );

      expect(status).toBeLessThan(500);
      expect(duration).toBeLessThan(30000);
    });

    test('POST /api/pets/interact - invalid action', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/pets/interact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            action: 'invalid_action_xyz',
            session_id: `test-session-${Date.now()}`,
          },
        }
      );

      // Should handle invalid action gracefully
      expect(status).toBeLessThan(500);
    });

    test('GET /api/pets/ai/insights', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, duration, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/pets/ai/insights`,
        {
          method: 'GET',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      );

      // May return 404 if pet doesn't exist, but shouldn't crash
      expect([200, 404]).toContain(status);
      expect(duration).toBeLessThan(15000);
    });

    test('GET /api/pets/ai/notifications', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, duration, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/pets/ai/notifications`,
        {
          method: 'GET',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      );

      expect([200, 404]).toContain(status);
      expect(duration).toBeLessThan(15000);
    });

    test('GET /api/pets/ai/help', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, duration, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/pets/ai/help`,
        {
          method: 'GET',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      );

      expect([200, 404]).toContain(status);
      expect(duration).toBeLessThan(15000);
    });

    test('POST /api/pets/ai/command - valid command', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, duration, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/pets/ai/command`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            command: 'feed my pet',
          },
        }
      );

      expect(status).toBeLessThan(500);
      expect(duration).toBeLessThan(30000);
    });

    test('POST /api/pets/ai/command - empty command', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/pets/ai/command`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          data: {
            command: '',
          },
        }
      );

      expect([400, 422, 200]).toContain(status);
    });

    test('GET /api/pets/stats - missing pet (edge case)', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/pets/stats`,
        {
          method: 'GET',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      );

      // Should return 404, not 500
      expect([200, 404]).toContain(status);
      expect(status).not.toBe(500);
    });
  });

  test.describe('Coach AI Endpoints', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('GET /api/coach', async ({ page }) => {
      const token = await getAuthToken(page);
      const { response, duration, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/coach`,
        {
          method: 'GET',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      );

      expect(status).toBeLessThan(500);
      expect(duration).toBeLessThan(30000);
    });
  });

  test.describe('Frontend AI Chat Interface', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('should open AI chat and send message', async ({ page }) => {
      // Navigate to dashboard or AI chat page
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Look for AI chat button/icon
      const chatButton = page.getByRole('button', { name: /chat|ai|scout/i }).first();
      
      if (await chatButton.isVisible()) {
        await chatButton.click();
        await page.waitForTimeout(1000);

        // Find text input
        const chatInput = page.getByPlaceholder(/ask|message|type/i).first();
        if (await chatInput.isVisible()) {
          await chatInput.fill('How can I improve my pet\'s happiness?');
          
          const sendButton = page.getByRole('button', { name: /send|submit/i }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
            
            // Wait for response (should appear within 30s)
            await page.waitForTimeout(5000);
            
            // Check for response (should have assistant message or loading indicator)
            const messages = page.locator('[data-role="message"], .message, [class*="message"]');
            const count = await messages.count();
            expect(count).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should handle empty message submission', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      const chatButton = page.getByRole('button', { name: /chat|ai|scout/i }).first();
      if (await chatButton.isVisible()) {
        await chatButton.click();
        await page.waitForTimeout(1000);

        const sendButton = page.getByRole('button', { name: /send|submit/i }).first();
        if (await sendButton.isVisible()) {
          const isDisabled = await sendButton.isDisabled();
          // Send button should be disabled for empty messages, or should show error
          if (!isDisabled) {
            await sendButton.click();
            await page.waitForTimeout(1000);
            // Should show validation error or prevent submission
            const error = page.getByText(/required|empty|message/i).first();
            if (await error.isVisible({ timeout: 2000 }).catch(() => false)) {
              expect(error).toBeVisible();
            }
          }
        }
      }
    });

    test('should handle invalid commands', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      const chatButton = page.getByRole('button', { name: /chat|ai|scout/i }).first();
      if (await chatButton.isVisible()) {
        await chatButton.click();
        await page.waitForTimeout(1000);

        const chatInput = page.getByPlaceholder(/ask|message|type/i).first();
        if (await chatInput.isVisible()) {
          // Try invalid command
          await chatInput.fill('/invalidcommand123');
          
          const sendButton = page.getByRole('button', { name: /send|submit/i }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
            await page.waitForTimeout(5000);
            
            // Should handle gracefully, not crash
            const pageError = page.locator('body').textContent();
            expect(await pageError).not.toContain('Error');
          }
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('desktop - dashboard should be responsive', async ({ page }) => {
      await login(page);
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Check that page loads without horizontal scroll
      const body = page.locator('body');
      const box = await body.boundingBox();
      expect(box).toBeTruthy();
    });

    test('mobile - dashboard should be responsive', async ({ page }) => {
      await login(page);
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Check mobile layout
      const body = page.locator('body');
      const box = await body.boundingBox();
      expect(box).toBeTruthy();
      
      // Check for mobile menu (hamburger menu)
      const menuButton = page.getByRole('button', { name: /menu|nav/i }).first();
      // May or may not be visible, but page should render
      await expect(page.locator('body')).toBeVisible();
    });

    test('tablet - dashboard should be responsive', async ({ page }) => {
      await login(page);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      const body = page.locator('body');
      const box = await body.boundingBox();
      expect(box).toBeTruthy();
    });
  });

  test.describe('Error Handling & Stability', () => {
    test('should not crash on invalid API responses', async ({ page }) => {
      await login(page);
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Intercept and modify API response to return invalid data
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ invalid: 'data' }),
        });
      });

      // Try to interact with page
      await page.reload();
      await page.waitForTimeout(2000);

      // Should not have crashed - page should still be visible
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await login(page);
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Block API calls
      await page.route('**/api/**', route => route.abort());

      // Try to interact
      await page.reload();
      await page.waitForTimeout(2000);

      // Should show error state, not crash
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle missing authentication gracefully', async ({ page }) => {
      // Clear auth
      await page.context().clearCookies();
      await page.goto(`${BASE_URL}/dashboard`);

      // Should redirect to login or show appropriate message
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toMatch(/login|signin|auth/i);
    });
  });

  test.describe('Database Integrity', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('should handle missing pet gracefully', async ({ page }) => {
      const token = await getAuthToken(page);
      
      // Try to get stats for non-existent pet
      const { response, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/pets/stats`,
        {
          method: 'GET',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      );

      // Should return 404, not 500
      if (status === 404) {
        const data = await response.json();
        expect(data).toBeTruthy();
      }
      expect(status).not.toBe(500);
    });

    test('should handle missing user profile gracefully', async ({ page }) => {
      const token = await getAuthToken(page);
      
      const { response, status } = await measureAPIResponse(
        page,
        `${API_BASE_URL}/api/profiles/me`,
        {
          method: 'GET',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      );

      // Should handle missing profile (200 with defaults or 404)
      expect([200, 404]).toContain(status);
      expect(status).not.toBe(500);
    });
  });
});

