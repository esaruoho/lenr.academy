import { test, expect } from '@playwright/test';
import {
  acceptPrivacyConsent,
  waitForDatabaseReady,
} from '../fixtures/test-helpers';

test.describe('Transmutations Page', () => {
  // The 60s global timeout is consumed by waitForDatabaseReady on cold-cache
  // CI runs, leaving insufficient budget for the in-test toBeEnabled/toBeVisible
  // waits. Override per-suite so the DB-load + pathway-search has 3 minutes.
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/transmutations');
    await waitForDatabaseReady(page);
  });

  test('renders the page title and disclaimer banner', async ({ page }) => {
    await expect(page.getByTestId('transmutations-heading')).toBeVisible();
    await expect(page.getByTestId('transmutations-disclaimer')).toBeVisible();
  });

  test('renders documented transmutation cards', async ({ page }) => {
    // Iwamura Cs → Pr is the headline entry
    await expect(page.getByText(/Cs-133/).first()).toBeVisible();
    await expect(page.getByText(/Pr-141/).first()).toBeVisible();
    await expect(
      page.getByText(/Iwamura.*Mitsubishi/i).first()
    ).toBeVisible();
  });

  test('finds Parkhomov pathways for first card without errors', async ({ page }) => {
    // Click the first "Find pathways" button (Iwamura Cs → Pr).
    // The button is disabled until the React context's dbReady flag flips,
    // which can lag behind the database-loading DOM marker waitForDatabaseReady
    // checks for — especially on Firefox with a fresh (uncached) DB download.
    // Use a generous timeout so the test doesn't flake on cold-cache CI runs.
    const firstButton = page
      .getByTestId(/find-pathways-/)
      .first();
    await expect(firstButton).toBeEnabled({ timeout: 30000 });
    await firstButton.click();

    // Either pathway results or "no pathways found" is a valid outcome.
    const pathwayResults = page.getByTestId('transmutations-pathway-results');
    const pathwayEmpty = page.getByTestId('transmutations-pathway-empty');
    await expect(pathwayResults.or(pathwayEmpty).first()).toBeVisible({
      timeout: 30000,
    });
  });

  test('category filter narrows the visible cards', async ({ page }) => {
    // Click the Biological filter
    await page.getByTestId('transmutations-category-biological').click();

    // Scope assertions to transmutation card content (avoid matching against
    // the hidden lab-filter <select>'s <option> elements, which contain
    // every author name regardless of which category is active).
    const transmutationCards = page.locator('div.card').filter({
      has: page.locator('[data-testid^="find-pathways-"]'),
    });

    // Vysotskii biological entries should still be visible in cards.
    await expect(transmutationCards.filter({ hasText: /Vysotskii/i }).first()).toBeVisible();

    // Iwamura (thin-film) should now be hidden from card content.
    await expect(transmutationCards.filter({ hasText: /Iwamura/i })).toHaveCount(0);
  });
});
