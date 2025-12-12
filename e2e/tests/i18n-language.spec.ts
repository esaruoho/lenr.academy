import { test, expect } from '@playwright/test';
import {
  waitForDatabaseReady,
  acceptMeteredWarningIfPresent,
  clearAllStorage,
  setLanguagePreference
} from '../fixtures/test-helpers';

/**
 * E2E Tests for Internationalization (i18n) and Language Switching
 *
 * Tests:
 * - Language selection modal on first visit
 * - Language switcher in the header
 * - Translation persistence across page reloads
 * - Multiple language support (en, ja, zh, ru, de, fr, es)
 * - Cascade simulation tab translations
 */

test.describe('Language Selection Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh without language preference
    await page.goto('/');
    await clearAllStorage(page);
  });

  test('should show language selection modal on first visit', async ({ page }) => {
    await page.reload();
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);

    // Language selection modal should appear
    const modal = page.locator('[data-testid="language-selection-modal"]').or(
      page.getByRole('dialog').filter({ hasText: /select.*language|choose.*language/i })
    );
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Should show language options
    await expect(page.getByText(/English/)).toBeVisible();
    await expect(page.getByText(/日本語/)).toBeVisible();
    await expect(page.getByText(/中文/)).toBeVisible();
  });

  test('should close modal and save preference when language is selected', async ({ page }) => {
    await page.reload();
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);

    // Wait for modal
    const modal = page.locator('[data-testid="language-selection-modal"]').or(
      page.getByRole('dialog').filter({ hasText: /select.*language|choose.*language/i })
    );
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Select English
    await page.getByRole('button', { name: /English/ }).click();

    // Confirm selection if there's a confirm button
    const confirmButton = page.getByRole('button', { name: /confirm|save|apply/i });
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 3000 });

    // Language preference should be saved
    const preference = await page.evaluate(() => {
      return localStorage.getItem('lenr-language-preference');
    });
    expect(preference).toBe('en');
  });
});

test.describe('Language Switcher', () => {
  test.beforeEach(async ({ page }) => {
    // Set English preference to skip language selection modal
    await setLanguagePreference(page, 'en');
    await page.goto('/');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should display language switcher in header', async ({ page }) => {
    // Language switcher should be visible
    const languageSwitcher = page.getByTestId('language-switcher').or(
      page.locator('button[aria-label*="language"]')
    ).or(
      page.locator('button:has-text("EN")')
    );
    await expect(languageSwitcher).toBeVisible();
  });

  test('should open language dropdown when clicked', async ({ page }) => {
    // Click language switcher
    const languageSwitcher = page.getByTestId('language-switcher').or(
      page.locator('button[aria-label*="language"]')
    ).or(
      page.locator('button:has-text("EN")')
    );
    await languageSwitcher.click();

    // Dropdown should show language options
    await expect(page.getByText(/日本語/).or(page.locator('button:has-text("日本語")'))).toBeVisible();
    await expect(page.getByText(/Deutsch/).or(page.locator('button:has-text("Deutsch")'))).toBeVisible();
    await expect(page.getByText(/Français/).or(page.locator('button:has-text("Français")'))).toBeVisible();
  });

  test('should switch to Japanese and update UI', async ({ page }) => {
    // Click language switcher
    const languageSwitcher = page.getByTestId('language-switcher').or(
      page.locator('button[aria-label*="language"]')
    ).or(
      page.locator('button:has-text("EN")')
    );
    await languageSwitcher.click();

    // Select Japanese
    await page.getByText(/日本語/).click();

    // Wait for UI to update
    await page.waitForTimeout(500);

    // Navigation items should be in Japanese
    await expect(page.getByText(/ホーム|融合反応|核分裂反応/)).toBeVisible({ timeout: 3000 });

    // Language preference should be saved
    const preference = await page.evaluate(() => {
      return localStorage.getItem('lenr-language-preference');
    });
    expect(preference).toBe('ja');
  });

  test('should switch to Chinese and update UI', async ({ page }) => {
    // Click language switcher
    const languageSwitcher = page.getByTestId('language-switcher').or(
      page.locator('button[aria-label*="language"]')
    ).or(
      page.locator('button:has-text("EN")')
    );
    await languageSwitcher.click();

    // Select Chinese
    await page.getByText(/中文/).click();

    // Wait for UI to update
    await page.waitForTimeout(500);

    // Navigation items should be in Chinese
    await expect(page.getByText(/首页|聚变反应|裂变反应/)).toBeVisible({ timeout: 3000 });
  });

  test('should persist language preference across page reloads', async ({ page }) => {
    // Switch to German
    const languageSwitcher = page.getByTestId('language-switcher').or(
      page.locator('button[aria-label*="language"]')
    ).or(
      page.locator('button:has-text("EN")')
    );
    await languageSwitcher.click();
    await page.getByText(/Deutsch/).click();
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await waitForDatabaseReady(page);

    // Should still be in German
    await expect(page.getByText(/Startseite|Fusionsreaktionen|Spaltungsreaktionen/)).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Cascade Simulation Translations', () => {
  test.beforeEach(async ({ page }) => {
    // Set English preference
    await setLanguagePreference(page, 'en');
    await page.goto('/cascades');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should display cascade page with English translations', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: /Cascade Simulations/i })).toBeVisible();

    // Check cascade parameters section (use .first() to avoid strict mode violations)
    await expect(page.getByText(/Fuel Nuclides/i).first()).toBeVisible();
    await expect(page.getByText(/Cascade Parameters/i).first()).toBeVisible();
    await expect(page.getByText(/Temperature/i).first()).toBeVisible();

    // Check run button
    await expect(page.getByRole('button', { name: /Run Cascade Simulation/i })).toBeVisible();
  });

  test('should display cascade results tabs in English', async ({ page }) => {
    // Run a quick simulation
    const runButton = page.getByRole('button', { name: /Run Cascade Simulation/i });
    await expect(runButton).toBeEnabled({ timeout: 10000 });
    await runButton.click();

    // Wait for results
    await expect(page.getByText(/Cascade Complete/i).first()).toBeVisible({ timeout: 30000 });

    // Check tab labels are in English
    await expect(page.getByRole('button', { name: /Summary/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Flow View/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pathway Browser/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Network/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Products/i })).toBeVisible();
  });

  test('should display Flow View translations', async ({ page }) => {
    // Run simulation
    const runButton = page.getByRole('button', { name: /Run Cascade Simulation/i });
    await expect(runButton).toBeEnabled({ timeout: 10000 });
    await runButton.click();
    await expect(page.getByText(/Cascade Complete/i).first()).toBeVisible({ timeout: 30000 });

    // Navigate to Flow View
    await page.getByRole('button', { name: /Flow View/i }).click();

    // Check Flow View content
    await expect(page.getByText(/Reaction Flow Diagram|Showing.*pathways/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should display Pathway Browser translations', async ({ page }) => {
    // Run simulation
    const runButton = page.getByRole('button', { name: /Run Cascade Simulation/i });
    await expect(runButton).toBeEnabled({ timeout: 10000 });
    await runButton.click();
    await expect(page.getByText(/Cascade Complete/i).first()).toBeVisible({ timeout: 30000 });

    // Navigate to Pathway Browser
    await page.getByRole('button', { name: /Pathway Browser/i }).click();

    // Check table headers are translated
    await expect(page.getByRole('columnheader', { name: /Pathway/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Type/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Count/i })).toBeVisible();
  });

  test('should display Network tab translations', async ({ page }) => {
    // Run simulation
    const runButton = page.getByRole('button', { name: /Run Cascade Simulation/i });
    await expect(runButton).toBeEnabled({ timeout: 10000 });
    await runButton.click();
    await expect(page.getByText(/Cascade Complete/i).first()).toBeVisible({ timeout: 30000 });

    // Navigate to Network tab
    await page.getByRole('button', { name: /Network/i }).click();

    // Check Network content (timeline controls)
    await expect(page.getByText(/Cascade Evolution Timeline|Loop.*of/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should display Products tab translations', async ({ page }) => {
    // Run simulation
    const runButton = page.getByRole('button', { name: /Run Cascade Simulation/i });
    await expect(runButton).toBeEnabled({ timeout: 10000 });
    await runButton.click();
    await expect(page.getByText(/Cascade Complete/i).first()).toBeVisible({ timeout: 30000 });

    // Navigate to Products tab
    await page.getByRole('button', { name: /Products/i }).click();

    // Check Products content
    await expect(page.getByText(/Top Products|unique nuclides/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Cascade Simulation in Japanese', () => {
  test.beforeEach(async ({ page }) => {
    // Set Japanese preference
    await setLanguagePreference(page, 'ja');
    await page.goto('/cascades');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should display cascade page with Japanese translations', async ({ page }) => {
    // Check page title is in Japanese
    await expect(page.getByText(/カスケードシミュレーション/)).toBeVisible();

    // Check cascade parameters section
    await expect(page.getByText(/燃料核種/)).toBeVisible();
    await expect(page.getByText(/カスケードパラメータ/)).toBeVisible();

    // Check run button
    await expect(page.getByRole('button', { name: /カスケードシミュレーション実行/ })).toBeVisible();
  });

  test('should display cascade results tabs in Japanese', async ({ page }) => {
    // Run simulation
    const runButton = page.getByRole('button', { name: /カスケードシミュレーション実行/ });
    await expect(runButton).toBeEnabled({ timeout: 10000 });
    await runButton.click();

    // Wait for results (Japanese: カスケード完了)
    await expect(page.getByText(/カスケード完了/)).toBeVisible({ timeout: 30000 });

    // Check tab labels are in Japanese
    await expect(page.getByRole('button', { name: /サマリー/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /フロービュー/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /パスウェイブラウザ/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /ネットワーク/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /生成物/ })).toBeVisible();
  });
});

test.describe('Materials Catalog Translations', () => {
  test.beforeEach(async ({ page }) => {
    await setLanguagePreference(page, 'en');
    await page.goto('/cascades');
    await acceptMeteredWarningIfPresent(page);
    await waitForDatabaseReady(page);
  });

  test('should display materials catalog with English translations', async ({ page }) => {
    // Open materials catalog
    await page.getByTestId('materials-catalog-button').click();

    // Check modal is visible
    const modal = page.getByTestId('materials-catalog-modal');
    await expect(modal).toBeVisible();

    // Check translations
    await expect(modal.getByText(/Materials Catalog/i).first()).toBeVisible();
    await expect(modal.getByRole('button', { name: /Natural/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Alloys/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Compounds/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /LENR/i })).toBeVisible();
  });

  test('should display material names translated', async ({ page }) => {
    // Open materials catalog
    await page.getByTestId('materials-catalog-button').click();
    const modal = page.getByTestId('materials-catalog-modal');
    await expect(modal).toBeVisible();

    // Check material names (these are now translated)
    await expect(modal.getByText(/Natural Lithium/i).first()).toBeVisible();
    await expect(modal.getByText(/Natural Nickel/i).first()).toBeVisible();
  });
});

test.describe('All Supported Languages', () => {
  const languages = [
    { code: 'en', name: 'English', navItem: /Home|Fusion Reactions/ },
    { code: 'ja', name: '日本語', navItem: /ホーム|融合反応/ },
    { code: 'zh', name: '中文', navItem: /首页|聚变反应/ },
    { code: 'ru', name: 'Русский', navItem: /Главная|Реакции синтеза/ },
    { code: 'de', name: 'Deutsch', navItem: /Startseite|Fusionsreaktionen/ },
    { code: 'fr', name: 'Français', navItem: /Accueil|Réactions de fusion/ },
    { code: 'es', name: 'Español', navItem: /Inicio|Reacciones de fusión/ }
  ];

  for (const lang of languages) {
    test(`should display UI in ${lang.name} (${lang.code})`, async ({ page }) => {
      await setLanguagePreference(page, lang.code);
      await page.goto('/');
      await acceptMeteredWarningIfPresent(page);
      await waitForDatabaseReady(page);

      // Check navigation is translated
      await expect(page.getByText(lang.navItem)).toBeVisible({ timeout: 5000 });
    });
  }
});
