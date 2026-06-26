/**
 * FTM_TC_016 | Level Completion
 *
 * Waits for the level-end screen to appear NATURALLY after all puzzles are done.
 * TC_013 completes the remaining post-mini-game puzzles, which causes the game to
 * call handleLevelCompletion → LEVEL_END_DATA_EVENT → SWITCH_SCENE_EVENT('ProgressLevel')
 * → progress jar animation → LevelEnd scene.
 *
 * This test does NOT publish any events — it simply waits for the natural transition.
 *
 * Run via the orchestrator: e2e/tests/ftm-assessment-survey-flow.spec.ts
 */

import { test, expect } from '../../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Selectors } from '../../constants/selectors';
import { Timeouts } from '../../constants/timeouts';
import { LevelSelectionPage } from '../../pages/level-selection-page';
import { LevelEndPage } from '../../pages/level-end-page';

export function registerTests(getPage: () => Page): void {
  test('FTM_TC_016 | Level Completion | Progress jar animation plays and level end screen is reached naturally', async () => {
    const page = getPage();

    await test.step('Level end container becomes visible after progress jar animation', async () => {
      // handleLevelCompletion publishes LEVEL_END_DATA_EVENT then SWITCH_SCENE_EVENT
      // ('ProgressLevel'). ProgressionScene fills the jar before transitioning to LevelEnd.
      // Allow up to 35 s for the full sequence including the jar fill animation.
      await page.waitForFunction(
        (sel: string) => {
          const el = document.querySelector(sel) as HTMLElement | null;
          return el
            ? el.style.display === 'block' ||
              parseInt(el.style.zIndex || '0', 10) >= 11
            : false;
        },
        LevelEndPage.SELECTOR,
        { timeout: 35_000 },
      );
    });

    await test.step('Stars earned in this level are rendered on the level end screen', async () => {
      await page.waitForFunction(
        ({ container, item }: { container: string; item: string }) =>
          document.querySelectorAll(`${container} ${item}`).length >= 1,
        { container: LevelEndPage.SELECTORS.starsContainer, item: LevelEndPage.SELECTORS.starItem },
        { timeout: Timeouts.starAnimation },
      );

      const starCount = await page.locator(LevelEndPage.SELECTORS.starItem).count();
      expect(starCount).toBeGreaterThanOrEqual(1);

      test.info().annotations.push({
        type: 'level-end-stars',
        description: `Level end: ${starCount} star(s) awarded`,
      });
    });

    await test.step('Rive monster canvas is present on level end screen', async () => {
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
