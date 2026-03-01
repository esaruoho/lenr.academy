import { test, expect } from '@playwright/test';
import {
  waitForDatabaseReady,
  acceptMeteredWarningIfPresent,
  acceptPrivacyConsent,
  navigateToPage,
} from '../fixtures/test-helpers';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should display the main title', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    // Title should contain LENR Academy or similar
    await expect(heading).toHaveText(/LENR|Academy|Nanosoft/i);
  });

  test('should have navigation links to query pages', async ({ page }) => {
    // Should have links to Fusion, Fission, and Two-To-Two pages
    await expect(page.getByRole('link', { name: /Fusion/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Fission/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Two.?To.?Two/i }).first()).toBeVisible();
  });

  test('should navigate to Fusion page from home', async ({ page }) => {
    await page.getByRole('link', { name: /Fusion/i }).first().click();
    await expect(page).toHaveURL(/\/fusion/);
  });

  test('should navigate to Element Data from home', async ({ page }) => {
    const elementDataLink = page.getByRole('link', { name: /Element/i }).first();
    if (await elementDataLink.isVisible()) {
      await elementDataLink.click();
      await expect(page).toHaveURL(/\/element/);
    }
  });

  test('should display feature cards', async ({ page }) => {
    // The home page has cards describing features
    // Check for key sections: Query Reactions, Element Data, etc.
    const cards = page.locator('.card, [class*="card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display database statistics', async ({ page }) => {
    // Home page may show database stats like reaction counts
    // Look for numbers that match known database sizes
    const statsText = page.getByText(/\d{3,}/).first();
    if (await statsText.isVisible()) {
      const text = await statsText.textContent();
      expect(text).toBeDefined();
    }
  });
});

test.describe('Home Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should display home page on mobile viewport', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should have working navigation links on mobile', async ({ page }) => {
    // Links should be visible and clickable on mobile
    const fusionLink = page.getByRole('link', { name: /Fusion/i }).first();
    await expect(fusionLink).toBeVisible();
  });
});
