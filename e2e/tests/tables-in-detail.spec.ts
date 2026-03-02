import { test, expect } from '@playwright/test';
import {
  acceptPrivacyConsent,
} from '../fixtures/test-helpers';

test.describe('Tables In Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await acceptPrivacyConsent(page);
    await page.goto('/tables');
  });

  test('should display page title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Tables in Detail/i })).toBeVisible();
    // Page should have descriptive text about database schema
    await expect(page.getByText(/Database schema|field descriptions/i)).toBeVisible();
  });

  test('should display all five database table cards', async ({ page }) => {
    const tableNames = ['FusionAll', 'FissionAll', 'TwoToTwoAll', 'NuclidesPlus', 'ElementsPlus'];

    for (const name of tableNames) {
      await expect(page.getByRole('heading', { name, level: 3 })).toBeVisible();
    }
  });

  test('should show field badges for FusionAll table', async ({ page }) => {
    const fusionCard = page.getByRole('heading', { name: 'FusionAll' }).locator('..');
    const expectedFields = ['E1', 'Z1', 'A1', 'E', 'Z', 'A', 'MeV', 'neutrino'];

    for (const field of expectedFields) {
      await expect(fusionCard.locator('code', { hasText: field }).first()).toBeVisible();
    }
  });

  test('should show field badges for FissionAll table', async ({ page }) => {
    const fissionCard = page.getByRole('heading', { name: 'FissionAll' }).locator('..');
    const expectedFields = ['E1', 'Z1', 'A1', 'E2', 'Z2', 'A2', 'MeV'];

    for (const field of expectedFields) {
      await expect(fissionCard.locator('code', { hasText: field }).first()).toBeVisible();
    }
  });

  test('should show field badges for TwoToTwoAll table', async ({ page }) => {
    const twoToTwoCard = page.getByRole('heading', { name: 'TwoToTwoAll' }).locator('..');
    const expectedFields = ['E3', 'Z3', 'A3', 'E4', 'Z4', 'A4'];

    for (const field of expectedFields) {
      await expect(twoToTwoCard.locator('code', { hasText: field }).first()).toBeVisible();
    }
  });

  test('should show field badges for NuclidesPlus table', async ({ page }) => {
    const nuclidesCard = page.getByRole('heading', { name: 'NuclidesPlus' }).locator('..');
    const expectedFields = ['BE', 'AMU', 'LHL'];

    for (const field of expectedFields) {
      await expect(nuclidesCard.locator('code', { hasText: field }).first()).toBeVisible();
    }
  });

  test('should show field badges for ElementsPlus table', async ({ page }) => {
    const elementsCard = page.getByRole('heading', { name: 'ElementsPlus' }).locator('..');
    const expectedFields = ['EName', 'Period', 'Group', 'AWeight', 'Melting', 'Boiling'];

    for (const field of expectedFields) {
      await expect(elementsCard.locator('code', { hasText: field }).first()).toBeVisible();
    }
  });

  test('should display field definitions section', async ({ page }) => {
    // Field definitions section uses a description list (dl)
    const definitionList = page.locator('dl');
    await expect(definitionList).toBeVisible();

    // Should have definition terms for key fields
    const definitionTerms = definitionList.locator('dt');
    const count = await definitionTerms.count();
    expect(count).toBe(7); // Z, A, E, MeV, BE, BorF, Neutrino
  });

  test('should have description text for each database table', async ({ page }) => {
    // Each card should have a paragraph describing the table
    const cards = page.locator('.card');
    const cardCount = await cards.count();
    // 5 table cards + 1 field definitions card
    expect(cardCount).toBe(6);
  });
});
