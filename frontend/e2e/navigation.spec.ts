import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect root to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to bonds page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/bonds"]');
    await expect(page).toHaveURL('/bonds');
    await expect(page.locator('h1, h2').first()).toContainText(/bond|yield|curve/i);
  });

  test('should navigate to stocks page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/stocks"]');
    await expect(page).toHaveURL('/stocks');
  });

  test('should navigate to whale page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/whale"]');
    await expect(page).toHaveURL('/whale');
  });

  test('should navigate to policy page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/policy"]');
    await expect(page).toHaveURL('/policy');
  });

  test('should navigate to economy page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/economy"]');
    await expect(page).toHaveURL('/economy');
  });

  test('should navigate to history page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/history"]');
    await expect(page).toHaveURL('/history');
  });

  test('should navigate to macro page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/macro"]');
    await expect(page).toHaveURL('/macro');
  });
});

test.describe('Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/insight|dashboard|economic/i);
  });

  test('should display navigation links', async ({ page }) => {
    await page.goto('/dashboard');

    // Check main navigation items are visible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a[href="/bonds"]')).toBeVisible();
    await expect(page.locator('a[href="/stocks"]')).toBeVisible();
    await expect(page.locator('a[href="/whale"]')).toBeVisible();
  });

  test('should display summary cards on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for cards to load (they may have loading state)
    await page.waitForTimeout(1000);

    // Check for at least some content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
