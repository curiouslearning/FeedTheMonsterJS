/**
 * FTM_TC_017 | Level Replay
 *
 * Continues directly from FTM_TC_016 (tc-016-level-completion.spec.ts), which
 * deliberately stays on the Level End screen instead of clicking Map. Clicks
 * Replay (#levelend-retry-btn) and verifies the same level reloads into a
 * fresh, interactive gameplay state.
 *
 * Precondition: the orchestrator plays Level 2 (0-based currentLevel === 1),
 * which always renders the Replay button regardless of star count
 * (levelend-scene.ts renderButtonsHTML — Replay is hidden only for a passed
 * Level 1 / currentLevel === 0).
 *
 * Run via the orchestrator: e2e/tests/ftm-assessment-survey-flow.spec.ts
 */

import { test, expect } from '../../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Timeouts } from '../../constants/timeouts';
import { LevelEndPage } from '../../pages/level-end-page';
import { GameplayPage } from '../../pages/gameplay-page';
import { assertCanvasHasContent } from '../../helpers/canvas-helpers';
import { getHitboxCenter, waitForStonesReady } from '../../helpers';

export function registerTests(getPage: () => Page): void {
  test('FTM_TC_017 | Level Replay | Replay button restarts the same level with fresh, interactive puzzle state', async () => {
    const page = getPage();
    const levelEndPage = new LevelEndPage(page);
    const gameplayPage = new GameplayPage(page);

    await test.step('Level end screen from TC_016 is still loaded', async () => {
      await levelEndPage.assertLevelEndVisible();
    });

    await test.step('Wait for UI to settle before interacting with Replay', async () => {
      await page.waitForTimeout(Timeouts.replaySettleDelay);
    });

    await test.step('Click Replay button', async () => {
      await levelEndPage.clickRetryButton();
    });

    await test.step('Gameplay scene reloads after Replay', async () => {
      await gameplayPage.waitForGameplayScene();
    });

    await test.step('Click the monster hotspot to trigger stones on the fresh puzzle', async () => {
      await page.waitForFunction(
        () => (window as any).__ftm?.gameStateService?.getHitBoxRanges?.() != null,
        { timeout: Timeouts.sceneTransition },
      );
      const hitboxCenter = await getHitboxCenter(page);
      expect(hitboxCenter).not.toBeNull();
      const canvasBB = await gameplayPage.mainCanvas.boundingBox();
      expect(canvasBB).not.toBeNull();
      await page.mouse.click(
        canvasBB!.x + hitboxCenter!.x,
        canvasBB!.y + hitboxCenter!.y,
      );
    });

    await test.step('Gameplay canvas re-renders with interactive content', async () => {
      await waitForStonesReady(page);
      await assertCanvasHasContent(page, GameplayPage.SELECTORS.mainCanvas);
    });

    await test.step('Same level (Level 2) context is maintained after replay', async () => {
      const restartedLevel = await page.evaluate(
        () => (window as any).__ftm?.gameStateService?.gamePlayData?.selectedLevelNumber,
      );
      expect(restartedLevel).toBe(1); // 0-based → "Level 2"
    });
  });
}
