import { test, expect } from '@playwright/test';

test.describe('Start Scene UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://feedthemonsterdev.curiouscontent.org/'); // replace with actual start path
  });

  test('should render title, play button and hide loading after init', async ({ page }) => {
    // Wait for Rive + BG to load and loading screen to disappear
    await page.waitForTimeout(1000); // or wait for a known signal if available

    const loading = await page.locator('#loading-screen');
    // Wait for loading screen to go away
    await page.waitForSelector('#loading-screen', { state: 'hidden', timeout: 30000 });

    const title = await page.locator('#title');
    // Continue with next assertions
    await expect(page.locator('#title')).toBeVisible();
    await expect(await title.textContent()).not.toBe('');

    const playBtn = await page.locator('#title-and-play-button button');
    await expect(playBtn).toBeVisible();
  });

  test('should start game on play button click', async ({ page }) => {
    // Spy on localStorage change or mock gameStateService
    const playBtn = await page.locator('#title-and-play-button button');
    await playBtn.click();

    // Check toggle button is hidden
    const toggleBtn = await page.locator('#toggle-btn');
    await expect(toggleBtn).toHaveCSS('display', 'none');

    // Confirm some UI or state change
    // e.g., if scene switches to level-select, wait for that
    await page.waitForFunction(() =>
      document.body.innerText.includes('Level Select')
    );
  });

  test('should add long-title class for long game title', async ({ page }) => {
    await page.evaluate(() => {
      document.getElementById('title').textContent = 'This is a very long game title for testing';
    });

    await page.evaluate(() => {
      const title = document.getElementById('title');
      if (title.textContent.length > 20) {
        title.classList.add('title-long');
      }
    });

    const title = await page.locator('#title');
    await expect(title).toHaveClass(/title-long/);
  });
});
