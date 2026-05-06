import { test, expect } from '@playwright/test';

test.describe('SPC Dashboard', () => {
  test('renders dashboard with KPI gauge cards', async ({ page }) => {
    await page.goto('/mes/spc/');
    await expect(page.locator('[data-testid="spc-dashboard"]')).toBeVisible();
    await page.waitForSelector('[data-testid^="kpi-gauge-"]');
    const gauges = page.locator('[data-testid^="kpi-gauge-"]');
    await expect(gauges.first()).toBeVisible();
  });

  test('KPI gauge cards have accessible labels', async ({ page }) => {
    await page.goto('/mes/spc/');
    await page.waitForSelector('[data-testid^="kpi-gauge-"]');
    const firstGauge = page.locator('[data-testid^="kpi-gauge-"]').first();
    await expect(firstGauge).toHaveAttribute('aria-label', /Critical Dimension|CD Uniformity|Overlay|Line Edge/);
  });

  test('keyboard select changes active parameter', async ({ page }) => {
    await page.goto('/mes/spc/');
    await page.waitForSelector('[data-testid^="kpi-gauge-"][role="button"]');
    const gauge = page.locator('[data-testid="kpi-gauge-cd"]');
    await gauge.focus();
    await page.keyboard.press('Enter');
    await expect(gauge).toHaveAttribute('aria-pressed', 'true');
  });
});