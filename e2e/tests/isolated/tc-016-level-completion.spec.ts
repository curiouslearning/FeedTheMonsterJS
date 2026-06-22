/**
 * FTM_TC_0016 | Completion of a Level
 *
 * Step: After mini game ends, show progress jar animation then level end screen
 * Expected: Level end screen loaded with star count, Rive monster state and CTAs
 *
 * Triggers the level-end flow via published game events (no full navigation needed)
 * so it works regardless of which scene is active when this test starts.
 *
 * Run via the orchestrator: e2e/tests/ftm-assessment-survey-flow.spec.ts
 */

import { test, expect } from '../../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Routes } from '../../constants/urls';
import { Selectors } from '../../constants/selectors';
import { Timeouts } from '../../constants/timeouts';
import { LevelSelectionPage } from '../../pages/level-selection-page';
import { LevelEndPage } from '../../pages/level-end-page';

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

export function registerTests(getPage: () => Page): void {
  test('FTM_TC_0016 | Level Completion | Level end screen shows jar animation, stars, Rive monster state and navigation CTAs', async () => {
    const page = getPage();

    await test.step('Trigger level-end via ProgressionScene jar fill animation → LevelEnd', async () => {
      const pageAlive = await page.evaluate(() => true).catch(() => false);
      if (!pageAlive) {
        await page.goto(Routes.game({ lang: 'english' }));
        await waitForLoadingDone(page);
      }

      await page.evaluate(() => {
        const gss = (window as any).__ftm?.gameStateService;
        if (!gss) return;
        const data = gss.getFTMData?.();
        if (!data) return;

        gss.publish(gss.EVENTS.LEVEL_END_DATA_EVENT, {
          levelEndData: {
            starCount: 3,
            currentLevel: 1,
            isTimerEnded: false,
            treasureChestScore: 1,
            score: 300,
          },
          data,
        });

        gss.publish(gss.EVENTS.SWITCH_SCENE_EVENT, 'ProgressLevel');
      });
    });

    await test.step('Level end container becomes visible after jar fill animation', async () => {
      await page.waitForFunction(
        (sel: string) => {
          const el = document.querySelector(sel) as HTMLElement | null;
          return el
            ? el.style.display === 'block' ||
              parseInt(el.style.zIndex || '0', 10) >= 11
            : false;
        },
        LevelEndPage.SELECTOR,
        { timeout: 30_000 },
      );
    });

    await test.step('Number of stars obtained is rendered on level end screen', async () => {
      await page.waitForFunction(
        ({ container, item }: { container: string; item: string }) => {
          return document.querySelectorAll(`${container} ${item}`).length >= 1;
        },
        { container: LevelEndPage.SELECTORS.starsContainer, item: LevelEndPage.SELECTORS.starItem },
        { timeout: Timeouts.starAnimation },
      );

      const starCount = await page.locator(LevelEndPage.SELECTORS.starItem).count();
      expect(starCount).toBeGreaterThanOrEqual(1);
    });

    await test.step('Current Rive monster state is visible in level end screen', async () => {
      await expect(page.locator(Selectors.riveCanvas)).toBeAttached();
    });

    await test.step('Map button (return to level selection) is visible', async () => {
      await expect(page.locator(LevelEndPage.SELECTORS.mapButton)).toBeVisible({
        timeout: Timeouts.evolutionDelay,
      });
    });

    await test.step('Next level button is visible', async () => {
      await expect(page.locator(LevelEndPage.SELECTORS.nextButton)).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
    });

    await test.step('Clicking map button returns user to level selection', async () => {
      await page.locator(LevelEndPage.SELECTORS.mapButton).click();
      await expect(page.locator(LevelSelectionPage.SELECTOR)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
    });
  });
}
