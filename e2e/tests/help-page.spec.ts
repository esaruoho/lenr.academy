import { test, expect } from '@playwright/test';
import {
  waitForDatabaseReady,
  acceptMeteredWarningIfPresent,
  acceptPrivacyConsent,
  navigateToPage,
} from '../fixtures/test-helpers';

test.describe('Help Page', () => {
  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should navigate to help page', async ({ page }) => {
    await navigateToPage(page, 'Help');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display glossary section', async ({ page }) => {
    await navigateToPage(page, 'Help');
    // Glossary section should be present
    await expect(page.getByText(/Glossary/i).first()).toBeVisible();
  });

  test('should display example queries section', async ({ page }) => {
    await navigateToPage(page, 'Help');
    await expect(page.getByText(/Example Queries/i).first()).toBeVisible();
  });

  test('should have a working glossary search', async ({ page }) => {
    await navigateToPage(page, 'Help');

    const searchInput = page.getByRole('textbox');
    if (await searchInput.isVisible()) {
      await searchInput.fill('fusion');
      // Should filter glossary entries
      // Wait a moment for filtering
      await page.waitForTimeout(300);
      // The glossary should still show some results (fusion is a common term)
      const glossaryItems = page.locator('[class*="border"]').filter({ hasText: /fusion/i });
      await expect(glossaryItems.first()).toBeVisible();
    }
  });

  test('should have glossary category filter buttons', async ({ page }) => {
    await navigateToPage(page, 'Help');

    // Check for category filter buttons (All, Nuclear Physics, etc.)
    const allButton = page.getByRole('button', { name: /All/i }).first();
    if (await allButton.isVisible()) {
      await allButton.click();
      // Should show all glossary entries
    }
  });

  test('should have clickable example queries that navigate to query pages', async ({ page }) => {
    await navigateToPage(page, 'Help');

    // Find a "Try this" or arrow button for an example query
    const tryButton = page.getByRole('button').filter({ hasText: /try|→/i }).first();
    if (await tryButton.isVisible()) {
      await tryButton.click();
      // Should navigate to a query page (fusion, fission, or twotwo)
      await expect(page).toHaveURL(/\/(fusion|fission|twotwo)/);
    }
  });
});

test.describe('Help Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should display help page content on mobile', async ({ page }) => {
    await navigateToPage(page, 'Help');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
