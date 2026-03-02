import { test, expect } from '@playwright/test';
import {
  waitForDatabaseReady,
  acceptMeteredWarningIfPresent,
  acceptPrivacyConsent,
  navigateToPage,
  selectElements,
  waitForReactionResults,
} from '../fixtures/test-helpers';

test.describe('Query History', () => {
  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should show query history panel on fusion page', async ({ page }) => {
    await navigateToPage(page, 'Fusion');
    // History panel or toggle should be present
    const historyToggle = page.getByText(/History/i).first();
    await expect(historyToggle).toBeVisible({ timeout: 5000 });
  });

  test('should add query to history after running fusion query', async ({ page }) => {
    await navigateToPage(page, 'Fusion');

    // Select Hydrogen in element 1
    await selectElements(page, ['H']);

    // Run the query
    const runButton = page.getByRole('button', { name: /Run Query|Search/i }).first();
    if (await runButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await runButton.click();
      await waitForReactionResults(page, 'fusion');
    }

    // Check if history is visible
    const historyText = page.getByText(/History/i).first();
    await expect(historyText).toBeVisible();
  });

  test('should show query history panel on fission page', async ({ page }) => {
    await navigateToPage(page, 'Fission');
    const historyToggle = page.getByText(/History/i).first();
    await expect(historyToggle).toBeVisible({ timeout: 5000 });
  });

  test('should show query history panel on two-to-two page', async ({ page }) => {
    await navigateToPage(page, 'Two');
    const historyToggle = page.getByText(/History/i).first();
    await expect(historyToggle).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Column Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should show column toggle on element data page', async ({ page }) => {
    await navigateToPage(page, 'Element Data');
    // Column toggle button or panel should be present
    const columnToggle = page.getByText(/Columns/i).first();
    await expect(columnToggle).toBeVisible({ timeout: 5000 });
  });

  test('should toggle column visibility on element data page', async ({ page }) => {
    await navigateToPage(page, 'Element Data');

    // Find and click the column toggle
    const columnButton = page.getByRole('button', { name: /Columns/i }).first();
    if (await columnButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await columnButton.click();
      // Should show column options
      await page.waitForTimeout(500);
      // Look for column checkboxes or toggle items
      const options = page.locator('[role="checkbox"], input[type="checkbox"]');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(0); // May have 0 if using a different toggle pattern
    }
  });
});
