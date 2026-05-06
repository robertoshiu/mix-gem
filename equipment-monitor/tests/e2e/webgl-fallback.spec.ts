import { test, expect } from '@playwright/test';

test.describe('WebGL Fallback', () => {
  test('shows fallback when WebGL is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (HTMLCanvasElement.prototype.getContext as any) = () => null;
    });
    await page.goto('/mes/war-room/');
    await expect(page.getByRole('alert', { name: 'WebGL not available' })).toBeVisible({ timeout: 10000 });
  });
});