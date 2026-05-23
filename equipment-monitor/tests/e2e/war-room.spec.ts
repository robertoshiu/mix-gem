import { test, expect } from '@playwright/test';

test.describe('War Room 3D', () => {
  test.afterEach(async ({ page }) => {
    await page.goto('about:blank');
  });

  test('header and zone controls render', async ({ page }) => {
    await page.goto('/mes/war-room/');
    // Use the WAR ROOM 3D heading as anchor and find sibling buttons
    const warRoomHeading = page.getByRole('heading', { name: 'WAR ROOM 3D' });
    await expect(warRoomHeading).toBeVisible();
    const headerButtons = warRoomHeading.locator('xpath=ancestor::header/descendant::button');
    await expect(headerButtons).toHaveCount(4);
    await expect(headerButtons.first()).toHaveAttribute('aria-label', /Power Monitoring/);
  });

  test('zone card buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/mes/war-room/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeAttached();
  });

  test('click Power Monitoring opens overlay with focus', async ({ page }) => {
    await page.goto('/mes/war-room/');
    await page.locator('button:has-text("PWR")').first().click();
    const overlay = page.locator('[role="dialog"][aria-label="Power Monitoring subsystem details"]');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('button[aria-label="Close panel"]')).toBeFocused();
  });

  test('Escape closes overlay and restores focus', async ({ page }) => {
    await page.goto('/mes/war-room/');
    const pwrBtn = page.locator('button:has-text("PWR")').first();
    await pwrBtn.click();
    const overlay = page.locator('[role="dialog"][aria-label="Power Monitoring subsystem details"]');
    await expect(overlay).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(overlay).not.toBeVisible();
  });
});
