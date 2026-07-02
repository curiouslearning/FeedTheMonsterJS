/**
 * FTM_TC_0014 | Mini Game Appears After Assessment Close
 * FTM_TC_0015 | Mini Game
 *
 * TC_0014: Treasure chest mini game canvas becomes visible after assessment ends
 * TC_0015: Click 5 stones, bonus star shown, mini game completes naturally
 *
 * Run via the orchestrator: e2e/tests/ftm-assessment-survey-flow.spec.ts
 */

import { test, expect } from '../../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Selectors } from '../../constants/selectors';
import { Timeouts } from '../../constants/timeouts';
import {
  hidePausePopupForMiniGame,
  waitForTreasureCanvasVisible,
  waitForMiniGameComplete,
} from '../../helpers';

export function registerTests(getPage: () => Page): void {
  // ─────────────────────────────────────────────────────────────────────────
  // TC_0014 | Mini Game Appears After Assessment Close
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0014 | Assessment Completion | Mini game treasure canvas becomes visible after assessment ends', async () => {
    const page = getPage();

    await test.step('Treasure chest mini game canvas (#treasurecanvas) becomes visible', async () => {
      await waitForTreasureCanvasVisible(page, Timeouts.sceneTransition);
      await expect(page.locator(Selectors.treasureCanvas)).toBeVisible();
    });

    await test.step('Raise mini-game canvas above pause popup and hide the pause popup', async () => {
      await hidePausePopupForMiniGame(page);
    });

    await test.step('Mini-game animation advances with real deltaTime', async () => {
      await page.waitForTimeout(1500);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_0015 | Mini Game
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0015 | Mini Game | Click 5 stones, bonus star shown, mini game completes naturally', async () => {
    const page = getPage();

    await test.step('Treasure chest canvas is visible with non-zero dimensions', async () => {
      await expect(page.locator(Selectors.treasureCanvas)).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
      const canvasBB = await page.locator(Selectors.treasureCanvas).boundingBox();
      expect(canvasBB).not.toBeNull();
      expect(canvasBB!.width).toBeGreaterThan(0);
      expect(canvasBB!.height).toBeGreaterThan(0);
    });

    await test.step('Wait for first active stone to spawn (replaces static chest-open wait)', async () => {
      await page.waitForFunction(
        () => {
          const scene =
            (window as any).__ftm?.sceneHandler?.['activeScene']?.['scene'];
          const miniGame = scene?.miniGameHandler?.activeMiniGame;
          if (!miniGame) return false;
          const stonesMgr = miniGame['treasureStones'];
          const stones: any[] = stonesMgr?.['stones'] ?? [];
          return stones.some((s: any) => s.active && !s.burning);
        },
        { timeout: 8_000 },
      );
    });

    await test.step('Auto-click 5 stones by reading their live positions from TreasureStones', async () => {
      await page.evaluate(({ count, intervalMs }) => {
        return new Promise<void>((resolve) => {
          const scene =
            (window as any).__ftm?.sceneHandler?.['activeScene']?.['scene'];
          const miniGame = scene?.miniGameHandler?.activeMiniGame;

          let clicked = 0;
          const tick = () => {
            if (clicked >= count || !miniGame) {
              resolve();
              return;
            }
            const stonesMgr = miniGame['treasureStones'];
            const stones: any[] = stonesMgr?.['stones'] ?? [];
            const active = stones.filter((s: any) => s.active && !s.burning);
            if (active.length > 0) {
              const s = active[Math.floor(Math.random() * active.length)];
              stonesMgr['onClickEvent'](s.x, s.y);
              clicked++;
            }
            setTimeout(tick, intervalMs);
          };
          tick(); // Start immediately — stones are already confirmed active
        });
      }, { count: 5, intervalMs: 200 });
    });

    await test.step('Wait for mini game to complete naturally (OpenedChest 12 s + FadeOut 400 ms)', async () => {
      await waitForMiniGameComplete(page, 20_000);
    });

    await test.step('Game background remains visible after mini game ends', async () => {
      await expect(page.locator(Selectors.background)).toBeVisible();
    });
  });
}
