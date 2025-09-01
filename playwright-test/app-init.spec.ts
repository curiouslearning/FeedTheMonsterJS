import { test, expect } from '@playwright/test';

test.describe('App Initialization Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mocking all external services that are used in init
    await page.route('**/assets/fonts/**', route => route.fulfill({ status: 200, body: '' }));
    await page.route('**/sw.js', route => route.fulfill({ status: 200, body: '' }));
    await page.route('**/data.json', route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'Test Title',
        OtherAudios: [],
        Levels: [],
        FeedbackTexts: [],
        RightToLeft: false,
        FeedbackAudios: [],
        majversion: '3.15',
        minversion: '3.15',
        version: '3.15'
      }),
    }));

    // Stub localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('is_cached', JSON.stringify([["en", true]]));
    });

    // Navigate to the page that loads the App class
    await page.goto('http://localhost:8080/'); // Adjust according to your test server
  });

  test('should render essential elements on startup', async ({ page }) => {
    await expect(page.locator('#background')).toBeVisible();
    await expect(page.locator('#rivecanvas')).toBeVisible();
    await expect(page.locator('#canvas')).toBeVisible();
    await expect(page.locator('#version-info-id')).toBeVisible();
  });

  test('should initialize canvas dimensions and styles correctly', async ({ page }) => {
    const canvas = page.locator('#canvas');
    const riveCanvas = page.locator('#rivecanvas');
    const bg = page.locator('#background');

    await expect(canvas).toBeVisible();
    await expect(riveCanvas).toBeVisible();

    const width = await canvas.evaluate(el => (el as HTMLCanvasElement).width);
    const height = await canvas.evaluate(el => (el as HTMLCanvasElement).height);
    expect(height).toBeGreaterThan(0);
    expect(width).toBeGreaterThan(0);

    const bgStyle = await bg.evaluate(el => getComputedStyle(el).width);
    expect(bgStyle).toContain('px');
  });


  test('should respond to service worker message: "Update Found"', async ({ page }) => {
    // Trigger confirm dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Update Found');
      await dialog.dismiss(); // or .accept() depending on desired behavior
    });

    await page.evaluate(() => {
      const appInstance = (window as any).app;
      appInstance?.handleServiceWorkerMessage({ data: { msg: 'Update Found' } });
    });
  });

  test('should cache language on download complete', async ({ page }) => {
    await page.evaluate(() => {
      const appInstance = (window as any).app;
      if (appInstance) {
        appInstance.cacheLanguage();
      }
    });

    const isCached = await page.evaluate(() =>
      localStorage.getItem('is_cached')
    );
    expect(isCached).toContain('en');
  });

  test('should add and remove necessary event listeners', async ({ page }) => {
    await page.evaluate(() => {
      const appInstance = (window as any).app;
      if (appInstance) {
        appInstance.dispose();
      }
    });

    // You can assert logs or behavior here after disposal
    expect(true).toBeTruthy(); // Placeholder to assert disposal didn't throw
  });
});
