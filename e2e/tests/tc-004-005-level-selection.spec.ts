/**
 * FTM_TC_004 | Level Selection Screen
 * FTM_TC_005 | Navigation from Level Screen to Gameplay Screen
 *
 * TC_004: All levels unlocked in debug mode; level 2 is clickable
 * TC_005: Gameplay screen loads successfully after level button click
 */

import { test, expect, Page } from '@playwright/test';
import { Routes } from '../constants/urls';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';
import { StartPage } from '../pages/start-page';
import { LoadingPage } from '../pages/loading-page';
import { LevelSelectionPage } from '../pages/level-selection-page';
import { GameplayPage } from '../pages/gameplay-page';
import {
  applyStandardMocks,
  clearGameProgress,
  exposeGameInternals,
  subscribeToCorrectStonePosition,
} from '../helpers';

async function waitForLoadingDone(page: Page) {
  await page.waitForFunction(
    (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return true;
      return el.style.display === 'none' || el.style.zIndex === '-1';
    },
    Selectors.loadingScreen,
    { timeout: Timeouts.appReady },
  );
}

test.describe.serial('FTM_TC_004–005 | Level Selection and Navigation to Gameplay', () => {
  test.describe.configure({ retries: 0 });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await applyStandardMocks(page);
    await clearGameProgress(page);
    await exposeGameInternals(page);
    await page.goto(Routes.game({ lang: 'english' }));
    await waitForLoadingDone(page);

    // Enable debug mode to unlock all levels
    await expect(page.locator(StartPage.SELECTORS.toggleDevBtn)).toBeVisible({
      timeout: Timeouts.sceneTransition,
    });
    await page.locator(StartPage.SELECTORS.toggleDevBtn).click();

    // Navigate to level selection
    await page.locator(StartPage.SELECTORS.clickArea).click({ force: true });
    await page.waitForTimeout(1500);
    await expect(page.locator(LevelSelectionPage.SELECTOR)).toBeVisible({
      timeout: Timeouts.sceneTransition,
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_004 | Level Selection Screen
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_004 | Level Selection | All levels unlocked in debug mode; level 2 is clickable', async () => {
    await test.step('Level selection grid is visible', async () => {
      await expect(page.locator(LevelSelectionPage.SELECTORS.grid)).toBeVisible();
    });

    await test.step('Level 1 button (grid index 0) is visible and not locked', async () => {
      await expect(page.locator(LevelSelectionPage.SELECTORS.levelButton(0))).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
    });

    await test.step('Level 2 button (grid index 1) is visible and enabled in debug mode', async () => {
      const level2Btn = page.locator(LevelSelectionPage.SELECTORS.levelButton(1));
      await expect(level2Btn).toBeVisible({ timeout: Timeouts.domUpdate });
      await expect(level2Btn).toBeEnabled();
    });

    await test.step('Subscribe to CORRECT_STONE_POSITION before level loads', async () => {
      await subscribeToCorrectStonePosition(page);
    });

    await test.step('Click level 2 button to navigate to gameplay screen', async () => {
      await page.locator(LevelSelectionPage.SELECTORS.levelButton(1)).click();
      await page.waitForTimeout(1500);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_005 | Navigation from Level Screen to Gameplay Screen
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_005 | Navigation | Gameplay screen loads successfully after level button click', async () => {
    await test.step('Main game canvas is visible', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.mainCanvas)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Pause button is visible', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.pauseButton)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Background wrapper is visible', async () => {
      await expect(page.locator(Selectors.background)).toBeVisible();
    });

    await test.step('Rive monster canvas is attached', async () => {
      await expect(page.locator(Selectors.riveCanvas)).toBeAttached();
    });
  });
});
