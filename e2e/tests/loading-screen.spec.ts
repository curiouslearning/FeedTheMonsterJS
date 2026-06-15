import { test, expect } from '../fixtures/game-fixtures';
import { applyStandardMocks, clearGameProgress } from '../helpers';
import { Routes } from '../constants/urls';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

test.describe('Loading Screen', () => {
  test.beforeEach(async ({ page }) => {
    await applyStandardMocks(page);
    await clearGameProgress(page);
  });

  test('shows loading screen on initial page load', async ({ page, loadingPage }) => {
    // Navigate and immediately assert — before await networkidle
    await page.goto(Routes.game());
    await loadingPage.assertLoadingVisible();
  });

  test('loading screen disappears after assets load', async ({ page, loadingPage }) => {
    await page.goto(Routes.game());
    await loadingPage.waitForLoadingToComplete();
    const el = page.locator(Selectors.loadingScreen);
    const display = await el.evaluate((e: HTMLElement) => e.style.display);
    const zIndex = await el.evaluate((e: HTMLElement) => e.style.zIndex);
    expect(display === 'none' || zIndex === '-1').toBeTruthy();
  });

  test('progress bar is visible during loading', async ({ page, loadingPage }) => {
    await page.goto(Routes.game());
    await loadingPage.assertProgressBarVisible();
  });

  test('loading gif is present during loading', async ({ page, loadingPage }) => {
    await page.goto(Routes.game());
    await expect(loadingPage.loadingGif).toBeVisible({ timeout: Timeouts.appReady });
    await expect(loadingPage.loadingGif).toHaveAttribute('src', /loadingImg/);
  });

  test('page title is Feed The Monster', async ({ page }) => {
    await page.goto(Routes.game());
    await expect(page).toHaveTitle(/Feed The Monster/i);
  });
});
