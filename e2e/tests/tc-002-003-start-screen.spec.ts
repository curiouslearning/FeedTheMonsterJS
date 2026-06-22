/**
 * FTM_TC_002 | Start Screen
 * FTM_TC_003 | Navigation
 *
 * TC_002: Title, play button, dev toggle, Rive monster and background are loaded
 * TC_003: Clicking start screen area navigates to level selection screen
 */

import { test, expect, Page } from '@playwright/test';
import { Routes } from '../constants/urls';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';
import { StartPage } from '../pages/start-page';
import { LoadingPage } from '../pages/loading-page';
import { LevelSelectionPage } from '../pages/level-selection-page';
import { applyStandardMocks, clearGameProgress, exposeGameInternals } from '../helpers';

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

test.describe.serial('FTM_TC_002–003 | Start Screen and Navigation', () => {
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
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_002 | Start Screen
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_002 | Start Screen | Title, play button, dev toggle, Rive monster and background are loaded', async () => {
    await test.step('App title is displayed and non-empty', async () => {
      await expect(page.locator(StartPage.SELECTORS.gameTitle)).toBeVisible();
      const title = await page.locator(StartPage.SELECTORS.gameTitle).textContent();
      expect((title ?? '').trim().length).toBeGreaterThan(0);
    });

    await test.step('Play button is visible and enabled', async () => {
      await expect(page.locator(StartPage.SELECTORS.playButton)).toBeVisible();
      await expect(page.locator(StartPage.SELECTORS.playButton)).toBeEnabled();
    });

    await test.step('Dev toggle button is interactable; click to enable debug mode', async () => {
      const toggle = page.locator(StartPage.SELECTORS.toggleDevBtn);
      await expect(toggle).toBeVisible();
      await expect(toggle).toBeEnabled();
      await toggle.click();
      await expect(toggle).toHaveClass(/on/, { timeout: Timeouts.domUpdate });
    });

    await test.step('Dev assessment button becomes visible when debug mode is on', async () => {
      await expect(page.locator(StartPage.SELECTORS.devAssessmentBtn)).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
    });

    await test.step('Rive monster animation canvas is present in the DOM', async () => {
      await expect(page.locator(Selectors.riveCanvas)).toBeAttached();
    });

    await test.step('Background image wrapper is visible', async () => {
      await expect(page.locator(Selectors.background)).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_003 | Navigation
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_003 | Navigation | Clicking start screen area navigates to level selection screen', async () => {
    await test.step('Start screen click area is present in DOM', async () => {
      await expect(page.locator(StartPage.SELECTORS.clickArea)).toBeAttached();
    });

    await test.step('Click start screen area to navigate', async () => {
      await page.locator(StartPage.SELECTORS.clickArea).click({ force: true });
      await page.waitForTimeout(1500);
    });

    await test.step('Level selection screen container is visible', async () => {
      await expect(page.locator(LevelSelectionPage.SELECTOR)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Level selection grid is rendered', async () => {
      await expect(page.locator(LevelSelectionPage.SELECTORS.grid)).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
    });
  });
});
