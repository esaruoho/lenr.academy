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

    // Should show language options (use .first() to avoid strict mode violations)
    await expect(page.getByText(/English/).first()).toBeVisible();
    await expect(page.getByText(/日本語/).first()).toBeVisible();
    await expect(page.getByText(/中文/).first()).toBeVisible();
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
    await page.getByRole('button', { name: /English/ }).first().click();

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

    // Dropdown should show language options (use .first() to avoid strict mode violations)
    await expect(page.getByText(/日本語/).or(page.locator('button:has-text("日本語")')).first()).toBeVisible();
    await expect(page.getByText(/Deutsch/).or(page.locator('button:has-text("Deutsch")')).first()).toBeVisible();
    await expect(page.getByText(/Français/).or(page.locator('button:has-text("Français")')).first()).toBeVisible();
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
    await page.getByText(/日本語/).first().click();

    // Wait for UI to update
    await page.waitForTimeout(1000);

    // Navigation items should be in Japanese - check for Home link in Japanese
    await expect(page.getByRole('link', { name: /ホーム/i })).toBeVisible({ timeout: 5000 });

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
    await page.getByText(/中文/).first().click();

    // Wait for UI to update
    await page.waitForTimeout(1000);

    // Navigation items should be in Chinese - check for Home link in Chinese (主页)
    await expect(page.getByRole('link', { name: /主页/i })).toBeVisible({ timeout: 5000 });
  });

  test('should persist language preference across page reloads', async ({ browser }) => {
    // Create a completely fresh context without any init scripts
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();

    // Manually set language to English without init script
    await freshPage.goto('/');
    await freshPage.evaluate(() => {
      localStorage.setItem('lenr-language-preference', 'en');
      localStorage.setItem('lenr-language-selected', 'true');
    });
    await freshPage.reload();
    await acceptMeteredWarningIfPresent(freshPage);
    await waitForDatabaseReady(freshPage);

    // Switch to German
    const languageSwitcher = freshPage.getByTestId('language-switcher').or(
      freshPage.locator('button[aria-label*="language"]')
    ).or(
      freshPage.locator('button:has-text("EN")')
    );
    await languageSwitcher.click();
    await freshPage.getByText(/Deutsch/).first().click();

    // Wait for language to be applied and saved to localStorage
    await freshPage.waitForTimeout(2000);

    // Reload page
    await freshPage.reload();
    await waitForDatabaseReady(freshPage);

    // Wait for i18next to load and apply the saved language preference
    await freshPage.waitForTimeout(2000);

    // Should still be in German - check for Home link
    await expect(freshPage.getByRole('link', { name: /Startseite/i })).toBeVisible({ timeout: 10000 });

    // Clean up
    await freshContext.close();
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

    // Wait for pathway data to load
    await expect(page.getByText(/Showing.*pathways/i).first()).toBeVisible({ timeout: 5000 });

    // The Pathway Browser shows a search bar and filters, but may not have a traditional table
    // Check for the pathway count display instead
    await expect(page.getByText(/17674.*pathways/i).first()).toBeVisible();
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
    await expect(page.getByRole('heading', { name: /カスケードシミュレーション/ })).toBeVisible();

    // Check cascade parameters section (use .first() to avoid strict mode violations)
    await expect(page.getByText(/燃料核種/).first()).toBeVisible();
    await expect(page.getByText(/カスケードパラメータ/).first()).toBeVisible();

    // Check run button
    await expect(page.getByRole('button', { name: /カスケードシミュレーション.*実行/ })).toBeVisible();
  });

  test('should display cascade results tabs in Japanese', async ({ page }) => {
    // Run simulation
    const runButton = page.getByRole('button', { name: /カスケードシミュレーション.*実行/ });
    await expect(runButton).toBeEnabled({ timeout: 10000 });
    await runButton.click();

    // Wait for results (Japanese: カスケード完了) - use .first() to avoid strict mode violations
    await expect(page.getByText(/カスケード完了/).first()).toBeVisible({ timeout: 30000 });

    // Wait a moment for tabs to render
    await page.waitForTimeout(1000);

    // Scroll to tabs if needed by looking for the Summary tab
    const summaryTab = page.getByRole('button', { name: /概要/ });
    await summaryTab.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});

    // Check tab labels are in Japanese (using correct translations)
    await expect(page.getByRole('button', { name: /概要/ })).toBeVisible(); // Summary
    await expect(page.getByRole('button', { name: /フロービュー/ })).toBeVisible(); // Flow View
    await expect(page.getByRole('button', { name: /経路ブラウザ/ })).toBeVisible(); // Pathway Browser
    await expect(page.getByRole('button', { name: /ネットワーク/ })).toBeVisible(); // Network
    await expect(page.getByRole('button', { name: /生成物/ })).toBeVisible(); // Products
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
    // Tab buttons - use .first() to avoid strict mode violations with material names containing "Natural"
    await expect(modal.getByRole('button', { name: /Natural/i }).first()).toBeVisible();
    await expect(modal.getByRole('button', { name: /Alloys/i }).first()).toBeVisible();
    await expect(modal.getByRole('button', { name: /Compounds/i }).first()).toBeVisible();
    await expect(modal.getByRole('button', { name: /LENR/i }).first()).toBeVisible();
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
    { code: 'zh', name: '中文', navItem: /主页|聚变反应/ }, // Fixed: 主页 not 首页
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

      // Check navigation is translated by finding a link with the expected text
      // Use .first() to avoid strict mode violations since the pattern matches multiple links
      await expect(page.getByRole('link', { name: lang.navItem }).first()).toBeVisible({ timeout: 5000 });
    });
  }
});
