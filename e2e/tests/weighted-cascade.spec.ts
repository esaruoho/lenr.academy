import { test, expect } from '@playwright/test';

test.describe('Weighted Cascade (Issue #96)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to cascades page
    await page.goto('/');
    await page.getByRole('link', { name: 'Cascades' }).click();
    await expect(page).toHaveURL('/cascades');
    // Wait for database to load
    await expect(page.locator('button:has-text("Run Cascade Simulation")')).toBeEnabled({ timeout: 10000 });
  });

  test('should display weighted mode toggle', async ({ page }) => {
    // Check for weighted mode toggle
    const weightedToggle = page.getByTestId('weighted-mode-toggle');
    await expect(weightedToggle).toBeVisible();

    // Toggle should be unchecked by default
    await expect(weightedToggle).not.toBeChecked();

    // Should have label "Weighted Mode"
    await expect(page.locator('text=Weighted Mode')).toBeVisible();
  });

  test('should display materials catalog button', async ({ page }) => {
    // Check for materials button
    const materialsButton = page.getByTestId('materials-catalog-button');
    await expect(materialsButton).toBeVisible();
    await expect(materialsButton).toContainText('Materials');
  });

  test('should open and close materials catalog modal', async ({ page }) => {
    // Click materials button
    const materialsButton = page.getByTestId('materials-catalog-button');
    await materialsButton.click();

    // Modal should open
    await expect(page.locator('text=Materials Catalog')).toBeVisible();

    // Should have category tabs
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Natural")')).toBeVisible();
    await expect(page.locator('button:has-text("Alloys")')).toBeVisible();

    // Close modal with X button
    await page.locator('button[aria-label="Close"]').click();

    // Modal should close
    await expect(page.locator('text=Materials Catalog')).not.toBeVisible();
  });

  test('should filter materials by category', async ({ page }) => {
    // Open materials catalog
    await page.getByTestId('materials-catalog-button').click();
    await expect(page.locator('text=Materials Catalog')).toBeVisible();

    // Click on Natural tab
    await page.locator('button:has-text("Natural")').click();

    // Should show natural abundance materials
    await expect(page.locator('text=Natural Lithium')).toBeVisible();
    await expect(page.locator('text=Natural Nickel')).toBeVisible();

    // Click on Alloys tab
    await page.locator('button:has-text("Alloys")').click();

    // Should show alloy materials
    await expect(page.locator('text=Stainless Steel 304')).toBeVisible();
  });

  test('should search materials', async ({ page }) => {
    // Open materials catalog
    await page.getByTestId('materials-catalog-button').click();
    await expect(page.locator('text=Materials Catalog')).toBeVisible();

    // Search for nickel
    await page.locator('input[placeholder*="Search"]').fill('nickel');

    // Should filter results
    await expect(page.locator('text=Natural Nickel')).toBeVisible();
    // Other non-matching materials should be filtered
    await expect(page.locator('text=Natural Lithium')).not.toBeVisible();
  });

  test('should load material and enable weighted mode', async ({ page }) => {
    // Open materials catalog
    await page.getByTestId('materials-catalog-button').click();
    await expect(page.locator('text=Materials Catalog')).toBeVisible();

    // Click on Natural Lithium
    await page.locator('text=Natural Lithium').click();

    // Find the load button for this material and click it
    const loadButton = page.locator('button:has-text("Load")').first();
    await loadButton.click();

    // Modal should close
    await expect(page.locator('text=Materials Catalog')).not.toBeVisible();

    // Weighted mode should be enabled
    const weightedToggle = page.getByTestId('weighted-mode-toggle');
    await expect(weightedToggle).toBeChecked();

    // Proportion input should be visible (appears when weighted mode is on and nuclides selected)
    await expect(page.locator('text=Fuel Proportions')).toBeVisible();
  });

  test('should show proportion input when weighted mode enabled', async ({ page }) => {
    // Enable weighted mode
    const weightedToggle = page.getByTestId('weighted-mode-toggle');
    await weightedToggle.check();

    // Should show proportion input
    await expect(page.locator('text=Fuel Proportions')).toBeVisible();

    // Should show equal distribution by default (since default nuclides are selected)
    // The first nuclide should have a proportion display
    await expect(page.getByTestId('fuel-proportion-input')).toBeVisible();
  });

  test('should show weighted mode info banner', async ({ page }) => {
    // Enable weighted mode
    const weightedToggle = page.getByTestId('weighted-mode-toggle');
    await weightedToggle.check();

    // Should show weighted mode info
    await expect(page.locator('text=Weighted Mode:')).toBeVisible();
    await expect(page.locator('text=Pathway frequencies will be weighted')).toBeVisible();
  });

  test('should disable weighted mode toggle', async ({ page }) => {
    // Enable weighted mode
    const weightedToggle = page.getByTestId('weighted-mode-toggle');
    await weightedToggle.check();
    await expect(weightedToggle).toBeChecked();

    // Proportion input should be visible
    await expect(page.locator('text=Fuel Proportions')).toBeVisible();

    // Disable weighted mode
    await weightedToggle.uncheck();
    await expect(weightedToggle).not.toBeChecked();

    // Proportion input should be hidden
    await expect(page.locator('text=Fuel Proportions')).not.toBeVisible();
  });

  test('should run cascade with weighted mode and display results', async ({ page }) => {
    // Enable weighted mode
    const weightedToggle = page.getByTestId('weighted-mode-toggle');
    await weightedToggle.check();

    // Set low loop count for speed
    const loopInput = page.locator('label:has-text("Max Cascade Loops")').locator('..').locator('input[type="range"]');
    await loopInput.fill('3');

    // Run simulation
    const runButton = page.locator('button:has-text("Run Cascade Simulation")');
    await runButton.click();

    // Wait for results
    await expect(page.locator('text=Cascade Complete')).toBeVisible({ timeout: 30000 });

    // Results should display
    await expect(page.locator('text=Reactions Found')).toBeVisible();
  });

  test('should reset weighted mode on parameter reset', async ({ page }) => {
    // Enable weighted mode
    const weightedToggle = page.getByTestId('weighted-mode-toggle');
    await weightedToggle.check();
    await expect(weightedToggle).toBeChecked();

    // Reset parameters
    await page.click('button:has-text("Reset Parameters")');

    // Weighted mode should be disabled
    await expect(weightedToggle).not.toBeChecked();
  });
});

test.describe('Materials Catalog Categories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cascades');
    await expect(page.locator('button:has-text("Run Cascade Simulation")')).toBeEnabled({ timeout: 10000 });
    // Open materials catalog
    await page.getByTestId('materials-catalog-button').click();
    await expect(page.locator('text=Materials Catalog')).toBeVisible();
  });

  test('should display LENR experiments', async ({ page }) => {
    // Click on LENR tab
    await page.locator('button:has-text("LENR")').click();

    // Should show LENR experiment materials
    await expect(page.locator('text=Parkhomov')).toBeVisible();
    await expect(page.locator('text=Piantelli')).toBeVisible();
  });

  test('should display compounds', async ({ page }) => {
    // Click on Compounds tab
    await page.locator('button:has-text("Compounds")').click();

    // Should show compound materials
    await expect(page.locator('text=LiAlH4')).toBeVisible();
    await expect(page.locator('text=NaBH4')).toBeVisible();
  });

  test('should show material composition preview', async ({ page }) => {
    // Click on Natural tab
    await page.locator('button:has-text("Natural")').click();

    // Click on Natural Lithium
    await page.locator('text=Natural Lithium').click();

    // Should show composition details
    await expect(page.locator('text=Li-6')).toBeVisible();
    await expect(page.locator('text=Li-7')).toBeVisible();
    // Should show isotopic proportions
    await expect(page.locator('text=%')).toBeVisible();
  });
});
