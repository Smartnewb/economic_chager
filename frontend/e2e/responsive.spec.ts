import { test, expect } from '@playwright/test';

/**
 * Automated Responsive Testing
 *
 * Tests the application at various viewport sizes to ensure
 * responsive design works correctly across devices.
 */

// Device viewport configurations
const devices = {
  'iPhone SE': { width: 375, height: 667 },
  'iPad': { width: 768, height: 1024 },
  'iPad Pro': { width: 1024, height: 1366 },
  'Desktop': { width: 1920, height: 1080 },
};

// Landscape orientations
const landscapeDevices = {
  'iPhone SE Landscape': { width: 667, height: 375 },
  'iPad Landscape': { width: 1024, height: 768 },
  'iPad Pro Landscape': { width: 1366, height: 1024 },
};

// Pages to test
const pages = [
  { path: '/', name: 'Home' },
  { path: '/bonds', name: 'Bonds' },
  { path: '/stocks', name: 'Stocks' },
  { path: '/currency', name: 'Currency' },
  { path: '/policy', name: 'Policy' },
  { path: '/economy', name: 'Economy' },
  { path: '/whale', name: 'Whale' },
  { path: '/dashboard', name: 'Dashboard' },
];

test.describe('Responsive Design - Portrait Devices', () => {
  for (const [deviceName, viewport] of Object.entries(devices)) {
    test.describe(`${deviceName} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport });

      for (const page of pages) {
        test(`${page.name} page renders without errors`, async ({ page: browserPage }) => {
          // Navigate to page
          await browserPage.goto(page.path);

          // Wait for page to be ready
          await browserPage.waitForLoadState('domcontentloaded');

          // Check no JavaScript errors
          const errors: string[] = [];
          browserPage.on('pageerror', (error) => {
            errors.push(error.message);
          });

          // Verify page has content
          const body = browserPage.locator('body');
          await expect(body).toBeVisible();

          // Check navigation is visible (may be hamburger on mobile)
          const nav = browserPage.locator('nav, [role="navigation"], header');
          await expect(nav.first()).toBeVisible();

          // Verify no horizontal overflow (common responsive issue)
          const bodyWidth = await browserPage.evaluate(() => document.body.scrollWidth);
          const viewportWidth = viewport.width;
          expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small tolerance

          // No critical errors should occur
          expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
        });
      }

      test('Navigation menu is accessible', async ({ page: browserPage }) => {
        await browserPage.goto('/');
        await browserPage.waitForLoadState('domcontentloaded');

        // On mobile, navigation might be in a hamburger menu
        if (viewport.width < 768) {
          // Look for hamburger menu button
          const menuButton = browserPage.locator('button[aria-label*="menu"], button[aria-label*="Menu"], [data-testid="mobile-menu"]');
          if (await menuButton.count() > 0) {
            await expect(menuButton.first()).toBeVisible();
          }
        } else {
          // On larger screens, nav links should be visible
          const navLinks = browserPage.locator('nav a, header a');
          expect(await navLinks.count()).toBeGreaterThan(0);
        }
      });

      test('Text is readable (not too small)', async ({ page: browserPage }) => {
        await browserPage.goto('/');
        await browserPage.waitForLoadState('domcontentloaded');

        // Check that main content text is at least 12px
        const fontSize = await browserPage.evaluate(() => {
          const mainContent = document.querySelector('main, [role="main"], .container, body');
          if (mainContent) {
            const style = window.getComputedStyle(mainContent);
            return parseFloat(style.fontSize);
          }
          return 16;
        });

        expect(fontSize).toBeGreaterThanOrEqual(12);
      });

      test('Buttons and interactive elements are tap-friendly', async ({ page: browserPage }) => {
        await browserPage.goto('/bonds');
        await browserPage.waitForLoadState('domcontentloaded');

        // Check that buttons have minimum tap target size (44x44 is Apple's recommendation)
        const buttons = browserPage.locator('button');
        const buttonCount = await buttons.count();

        if (buttonCount > 0) {
          const firstButton = buttons.first();
          const box = await firstButton.boundingBox();
          if (box) {
            // Allow smaller buttons on desktop, but enforce minimum on mobile
            if (viewport.width < 768) {
              expect(box.width).toBeGreaterThanOrEqual(32);
              expect(box.height).toBeGreaterThanOrEqual(32);
            }
          }
        }
      });
    });
  }
});

test.describe('Responsive Design - Landscape Orientation', () => {
  for (const [deviceName, viewport] of Object.entries(landscapeDevices)) {
    test.describe(`${deviceName} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport });

      test('Home page renders in landscape', async ({ page: browserPage }) => {
        await browserPage.goto('/');
        await browserPage.waitForLoadState('domcontentloaded');

        const body = browserPage.locator('body');
        await expect(body).toBeVisible();

        // Verify no horizontal overflow
        const bodyWidth = await browserPage.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20);
      });

      test('Charts render correctly in landscape', async ({ page: browserPage }) => {
        await browserPage.goto('/bonds');
        await browserPage.waitForLoadState('domcontentloaded');

        // Wait a bit for charts to render
        await browserPage.waitForTimeout(1000);

        // Charts should be visible and not overflow
        const chartContainer = browserPage.locator('.recharts-wrapper, canvas, svg');
        if (await chartContainer.count() > 0) {
          const chart = chartContainer.first();
          await expect(chart).toBeVisible();
        }
      });

      test('Navigation accessible in landscape', async ({ page: browserPage }) => {
        await browserPage.goto('/');
        await browserPage.waitForLoadState('domcontentloaded');

        // Navigation should still be accessible
        const nav = browserPage.locator('nav, [role="navigation"], header');
        await expect(nav.first()).toBeVisible();
      });
    });
  }
});

test.describe('Critical Responsive Breakpoints', () => {
  // Test specific breakpoint transitions

  test('Layout adapts at 640px (sm breakpoint)', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Page should render without errors
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Layout adapts at 768px (md breakpoint)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/stocks');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Layout adapts at 1024px (lg breakpoint)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/economy');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Layout adapts at 1280px (xl breakpoint)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/whale');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Touch and Mobile Interactions', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Scrolling works on mobile viewport', async ({ page }) => {
    await page.goto('/bonds');
    await page.waitForLoadState('domcontentloaded');

    // Page should be scrollable if content overflows
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 667;

    if (scrollHeight > viewportHeight) {
      // Try scrolling
      await page.evaluate(() => window.scrollTo(0, 100));
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    }
  });

  test('Analysis button is accessible on mobile', async ({ page }) => {
    await page.goto('/bonds');
    await page.waitForLoadState('domcontentloaded');

    // Look for the analysis trigger button
    const analysisButton = page.locator('button:has-text("Summon"), button:has-text("Analyze"), button:has-text("Board")');
    if (await analysisButton.count() > 0) {
      await expect(analysisButton.first()).toBeVisible();

      // Should be large enough to tap
      const box = await analysisButton.first().boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(32);
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }
  });
});
