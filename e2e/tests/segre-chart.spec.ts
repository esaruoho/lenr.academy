import { test, expect } from '@playwright/test';
import {
  waitForDatabaseReady,
  acceptMeteredWarningIfPresent,
  acceptPrivacyConsent,
  navigateToPage,
} from '../fixtures/test-helpers';

test.describe('Segre Chart Page', () => {
  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should navigate to Segre Chart page', async ({ page }) => {
    await navigateToPage(page, 'Segre');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display SVG chart with nuclide cells', async ({ page }) => {
    await navigateToPage(page, 'Segre');
    // Chart should render an SVG with nuclide rectangles
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible({ timeout: 10000 });
    // Should have rect elements for nuclides
    const rects = svg.locator('rect');
    const count = await rects.count();
    expect(count).toBeGreaterThan(10);
  });

  test('should display stability legend', async ({ page }) => {
    await navigateToPage(page, 'Segre');
    // Legend should show stability categories
    await expect(page.getByText(/Stable/i).first()).toBeVisible();
  });

  test('should display chart controls (zoom buttons)', async ({ page }) => {
    await navigateToPage(page, 'Segre');
    // Zoom controls should be present
    const zoomInBtn = page.getByRole('button', { name: /zoom in/i });
    await expect(zoomInBtn).toBeVisible();
    const zoomOutBtn = page.getByRole('button', { name: /zoom out/i });
    await expect(zoomOutBtn).toBeVisible();
  });

  test('should display axis labels', async ({ page }) => {
    await navigateToPage(page, 'Segre');
    // Axis labels should be visible
    await expect(page.getByText(/Proton/i).first()).toBeVisible();
    await expect(page.getByText(/Neutron/i).first()).toBeVisible();
  });

  test('should show nuclide count in legend or stats', async ({ page }) => {
    await navigateToPage(page, 'Segre');
    // Wait for chart to render with data
    await page.waitForTimeout(1000);
    // Should show some count or stats about nuclides
    const statsText = page.getByText(/\d{2,}/).first();
    await expect(statsText).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Segre Chart - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should display Segre Chart on mobile', async ({ page }) => {
    await navigateToPage(page, 'Segre');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // SVG should still be visible on mobile
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible({ timeout: 10000 });
  });
});
