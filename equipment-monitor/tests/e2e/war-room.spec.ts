import { test, expect } from '@playwright/test';

test.describe('War Room 3D', () => {
  // These tests exercise the React-driven HUD (TopBar, subsystem overlay, side panels),
  // not the Babylon 3D scene. Under CI's software WebGL renderer the heavy GLB scene
  // intermittently starved the main thread and blew the 120s test budget (flaky timeout).
  // Force the app's existing lightweight WebGL-fallback path by disabling *only* WebGL
  // contexts; 2D canvas (HUD sparklines/trend charts) stays available. The real fallback
  // UI is asserted separately in webgl-fallback.spec.ts.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (HTMLCanvasElement.prototype.getContext as any) = function (
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (orig as any).apply(this, [type, ...args]);
      };
    });
  });

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

  test('click Power Monitoring opens overlay', async ({ page }) => {
    await page.goto('/mes/war-room/');
    await page.locator('button:has-text("PWR")').first().click();
    const overlay = page.locator('[role="dialog"][aria-label="Power Monitoring subsystem details"]');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('button[aria-label="Close panel"]')).toBeVisible();
  });

  test('close button dismisses overlay', async ({ page }) => {
    await page.goto('/mes/war-room/');
    await page.locator('button:has-text("PWR")').first().click();
    const overlay = page.locator('[role="dialog"][aria-label="Power Monitoring subsystem details"]');
    await expect(overlay).toBeVisible();
    await overlay.locator('button[aria-label="Close panel"]').click();
    await expect(overlay).not.toBeVisible();
  });
});
