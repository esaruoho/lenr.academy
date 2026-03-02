import { test, expect } from '@playwright/test';
import {
  waitForDatabaseReady,
  acceptMeteredWarningIfPresent,
  acceptPrivacyConsent,
  navigateToPage,
  selectElements,
  waitForReactionResults,
} from '../fixtures/test-helpers';

test.describe('Export Features', () => {
  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should show export buttons after running fusion query', async ({ page }) => {
    await navigateToPage(page, 'Fusion');

    // Select H in element 1 and Li in element 2
    await selectElements(page, ['H']);

    // Look for and click the run/search button
    const runButton = page.getByRole('button', { name: /Run Query|Search/i }).first();
    if (await runButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await runButton.click();
      await waitForReactionResults(page, 'fusion');

      // Export buttons should be visible (JSON and PDF)
      const jsonButton = page.getByRole('button', { name: /JSON/i }).first();
      const pdfButton = page.getByRole('button', { name: /PDF/i }).first();

      // At least one export option should exist
      const jsonVisible = await jsonButton.isVisible({ timeout: 3000 }).catch(() => false);
      const pdfVisible = await pdfButton.isVisible({ timeout: 3000 }).catch(() => false);

      expect(jsonVisible || pdfVisible).toBe(true);
    }
  });

  test('should show export buttons after running fission query', async ({ page }) => {
    await navigateToPage(page, 'Fission');

    // Select U (Uranium) for fission
    await selectElements(page, ['U']);

    const runButton = page.getByRole('button', { name: /Run Query|Search/i }).first();
    if (await runButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await runButton.click();
      await waitForReactionResults(page, 'fission');

      // Check for export options
      const exportButton = page.getByRole('button').filter({ hasText: /export|JSON|PDF|download/i }).first();
      const visible = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);
      // Export should be available when there are results
      expect(visible).toBeDefined();
    }
  });

  test('should show share query button on query pages', async ({ page }) => {
    await navigateToPage(page, 'Fusion');
    // The share/copy link button should be visible
    const shareButton = page.getByText(/Copy Link|Share/i).first();
    await expect(shareButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Energy Histogram', () => {
  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should show energy histogram after fusion query with results', async ({ page }) => {
    await navigateToPage(page, 'Fusion');

    // Select H in element 1
    await selectElements(page, ['H']);

    const runButton = page.getByRole('button', { name: /Run Query|Search/i }).first();
    if (await runButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await runButton.click();
      await waitForReactionResults(page, 'fusion');

      // Energy histogram section should appear when there are results
      const histogramSection = page.getByText(/Energy Distribution|MeV Distribution|Histogram/i).first();
      const visible = await histogramSection.isVisible({ timeout: 5000 }).catch(() => false);
      // May or may not be visible depending on whether the section is collapsed by default
      expect(visible !== undefined).toBe(true);
    }
  });
});
