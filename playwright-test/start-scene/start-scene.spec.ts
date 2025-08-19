import { test, expect } from '@playwright/test';

test.describe('StartScene', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/');
  });

  test('should hide loading screen after init', async ({ page }) => {
    const loading = page.locator('#loading-screen');
    await expect(loading).toBeVisible();
    await expect(loading).toBeHidden();
  });

  test('should redirect to Level Select on background click', async ({ page }) => {
    const clickArea = page.locator('#start-scene-click-area');
    await expect(clickArea).toBeVisible();
    await clickArea.click();

    await page.waitForFunction(() =>
      document.body.innerText.includes('Level Select')
    );
  });
});
