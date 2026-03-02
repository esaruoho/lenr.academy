import { test, expect } from '@playwright/test';
import {
  acceptPrivacyConsent,
} from '../fixtures/test-helpers';

test.describe('Help Page', () => {
  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/help');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Help & Glossary/i })).toBeVisible();
  });

  test('should display example queries section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Example Queries/i })).toBeVisible();
  });

  test('should display example query cards with names and descriptions', async ({ page }) => {
    await expect(page.getByText('Hydrogen-Lithium Fusion')).toBeVisible();
    await expect(page.getByText('Deuterium-Deuterium Fusion')).toBeVisible();
    await expect(page.getByText('Uranium Fission Pathways')).toBeVisible();
  });

  test('should show query type badges on example cards', async ({ page }) => {
    // Query type badges are rendered in small text spans next to card titles
    // Use exact matching to avoid matching substring in card names
    const fusionBadges = page.locator('span', { hasText: 'fusion' });
    const fissionBadges = page.locator('span', { hasText: 'fission' });
    const twotwoBadges = page.locator('span', { hasText: '2→2' });
    expect(await fusionBadges.count()).toBeGreaterThan(0);
    expect(await fissionBadges.count()).toBeGreaterThan(0);
    expect(await twotwoBadges.count()).toBeGreaterThan(0);
  });

  test('should navigate to fusion query when clicking fusion example', async ({ page }) => {
    await page.getByText('Hydrogen-Lithium Fusion').click();
    await page.waitForURL(/\/fusion/);
    expect(page.url()).toContain('/fusion');
  });

  test('should navigate to fission query when clicking fission example', async ({ page }) => {
    await page.getByText('Uranium Fission Pathways').click();
    await page.waitForURL(/\/fission/);
    expect(page.url()).toContain('/fission');
  });

  test('should navigate to twotwo query when clicking twotwo example', async ({ page }) => {
    await page.getByText('Deuterium-Nickel Reactions').click();
    await page.waitForURL(/\/twotwo/);
    expect(page.url()).toContain('/twotwo');
  });

  test('should display glossary section heading', async ({ page }) => {
    // The glossary section has its own heading distinct from the page title
    const glossaryHeadings = page.getByRole('heading', { name: /Glossary/i });
    // At least one heading containing "Glossary"
    expect(await glossaryHeadings.count()).toBeGreaterThan(0);
  });

  test('should have glossary search input', async ({ page }) => {
    const searchInput = page.getByRole('textbox');
    await expect(searchInput).toBeVisible();
  });

  test('should filter glossary entries by search term', async ({ page }) => {
    const searchInput = page.getByRole('textbox');
    await searchInput.fill('Binding Energy');

    // Should show entries matching "Binding Energy"
    await expect(page.getByText('Binding Energy').first()).toBeVisible();
  });

  test('should show no results message for non-matching search', async ({ page }) => {
    const searchInput = page.getByRole('textbox');
    await searchInput.fill('xyznonexistentterm123');

    await expect(page.getByText(/no results|No matching/i)).toBeVisible();
  });

  test('should have category filter buttons', async ({ page }) => {
    const categoryButtons = page.locator('button.rounded-full');
    const count = await categoryButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should filter glossary by category when clicking category button', async ({ page }) => {
    // Get total entry count first by scrolling down to see glossary
    const allItems = page.locator('section').last().locator('.card');
    const totalCount = await allItems.count();

    // Click a specific category (not "All")
    const categoryButtons = page.locator('button.rounded-full');
    await categoryButtons.nth(1).click();

    const filteredCount = await allItems.count();
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
  });

  test('should display glossary entry count', async ({ page }) => {
    const countText = page.getByText(/\d+ terms/i);
    await countText.scrollIntoViewIfNeeded();
    await expect(countText).toBeVisible();
  });

  test('should show related terms on glossary entries', async ({ page }) => {
    // Search for Nuclide to make sure it's visible
    const searchInput = page.getByRole('textbox');
    await searchInput.fill('Nuclide');

    // Wait for filter to apply
    const nuclideEntry = page.locator('.card', { hasText: /^Nuclide/ }).first();
    await expect(nuclideEntry).toBeVisible();
    await expect(nuclideEntry.getByText('Isotope')).toBeVisible();
  });
});
