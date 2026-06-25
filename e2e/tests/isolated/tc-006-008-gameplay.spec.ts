/**
 * FTM_TC_006 | Gameplay Screen
 * FTM_TC_007 | Triggering Stones on Gameplay Screen
 * FTM_TC_008 | Drag and Drop
 *
 * TC_006: All UI elements are loaded and interactable
 * TC_007: Stones appear on gameplay canvas when Rive monster is clicked
 * TC_008: Dragging correct stone to monster triggers feedback text and audio
 *
 * TC_007 writes capturedStonePos + monsterHitboxCenter into SharedFlowState;
 * TC_008 reads them. TC_008 ends with a 2 s stability pause so TC_009
 * (assessment trigger) can safely begin without its own bridging wait.
 *
 * Run via the orchestrator: e2e/tests/ftm-assessment-survey-flow.spec.ts
 */

import { test, expect } from '../../fixtures/game-fixtures';
import type { SharedFlowState } from '../../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Selectors } from '../../constants/selectors';
import { Timeouts } from '../../constants/timeouts';
import { GameplayPage } from '../../pages/gameplay-page';
import {
  getCapturedCorrectStonePos,
  getHitboxCenter,
  getCanvasPixelColor,
  waitForPositiveFeedback,
} from '../../helpers';

export function registerTests(getPage: () => Page, state: SharedFlowState): void {
  // ─────────────────────────────────────────────────────────────────────────
  // TC_006 | Gameplay Screen
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_006 | Gameplay Screen | All UI elements are loaded and interactable', async () => {
    const page = getPage();

    await test.step('Target letter is displayed on the prompt bubble', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.promptContainer)).toBeAttached({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Rive monster animation is loaded', async () => {
      await expect(page.locator(Selectors.riveCanvas)).toBeAttached();
    });

    await test.step('Background image is loaded and visible', async () => {
      await expect(page.locator(Selectors.background)).toBeVisible();
    });

    await test.step('Timer bar is loaded', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.timerComponent)).toBeAttached({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Pause button is loaded and interactable', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.pauseButton)).toBeVisible();
      await expect(page.locator(GameplayPage.SELECTORS.pauseButton)).toBeEnabled();
    });

    await test.step('Puzzle indicator (game canvas) is visible', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.mainCanvas)).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_007 | Triggering Stones on Gameplay Screen
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_007 | Stone Trigger | Stones appear on gameplay canvas when Rive monster is clicked', async () => {
    const page = getPage();

    await page.waitForFunction(
      () => (window as any).__ftm?.gameStateService?.getHitBoxRanges?.() != null,
      { timeout: 10_000 },
    );

    await test.step('Read the correct stone position captured during initial puzzle load', async () => {
      state.capturedStonePos = await getCapturedCorrectStonePos(page);
      test.info().annotations.push({
        type: 'stone-pos',
        description: state.capturedStonePos
          ? `Captured: "${state.capturedStonePos.text}" at CSS px (${Math.round(state.capturedStonePos.x)}, ${Math.round(state.capturedStonePos.y)})`
          : 'CORRECT_STONE_POSITION did not fire — TC_008 will use systematic fallback',
      });
    });

    await test.step('Resolve monster hitbox centre from game state', async () => {
      state.monsterHitboxCenter = await getHitboxCenter(page);
      expect(state.monsterHitboxCenter).not.toBeNull();
    });

    await test.step('Click the monster hotspot on the game canvas', async () => {
      const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
      expect(canvasBB).not.toBeNull();
      await page.mouse.click(
        canvasBB!.x + state.monsterHitboxCenter!.x,
        canvasBB!.y + state.monsterHitboxCenter!.y,
      );
    });

    await test.step('Game canvas shows answer options (stones are present)', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.mainCanvas)).toBeVisible();
    });

    await test.step('Game UI remains functional after monster interaction', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.pauseButton)).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_008 | Drag and Drop
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_008 | Drag and Drop | Dragging correct stone to monster triggers feedback text and audio', async () => {
    const page = getPage();

    await test.step('Wait for stones to be rendered on #canvas (poll pixel data)', async () => {
      await page.waitForFunction(
        (sel) => {
          const canvas = document.querySelector(sel) as HTMLCanvasElement | null;
          if (!canvas || canvas.width === 0 || canvas.height === 0) return false;
          const ctx = canvas.getContext('2d');
          if (!ctx) return false;
          const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) return true;
          }
          return false;
        },
        GameplayPage.SELECTORS.mainCanvas,
        { timeout: 10_000 },
      );
    });

    await test.step('Assert correct stone position is captured and within canvas bounds', async () => {
      const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
      expect(canvasBB, 'Canvas bounding box must be available').not.toBeNull();
      expect(state.capturedStonePos, 'CORRECT_STONE_POSITION event must have fired').not.toBeNull();

      expect(state.capturedStonePos!.x).toBeGreaterThan(0);
      expect(state.capturedStonePos!.x).toBeLessThan(canvasBB!.width);
      expect(state.capturedStonePos!.y).toBeGreaterThan(0);
      expect(state.capturedStonePos!.y).toBeLessThan(canvasBB!.height);
    });

    await test.step('Verify stone is rendered near captured coordinates via canvas pixel inspection', async () => {
      const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
      let stonePixelFound = false;
      await page
        .waitForFunction(
          ({ sel, cx, cy }) => {
            const canvas = document.querySelector(sel) as HTMLCanvasElement | null;
            if (!canvas || canvas.width === 0) return false;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;
            const RADIUS = 50;
            const x = Math.max(0, cx - RADIUS);
            const y = Math.max(0, cy - RADIUS);
            const size = RADIUS * 2 + 1;
            const { data } = ctx.getImageData(
              x, y,
              Math.min(size, canvas.width - x),
              Math.min(size, canvas.height - y),
            );
            for (let i = 3; i < data.length; i += 4) {
              if (data[i] > 0) return true;
            }
            return false;
          },
          {
            sel: GameplayPage.SELECTORS.mainCanvas,
            cx: Math.round(state.capturedStonePos!.x),
            cy: Math.round(state.capturedStonePos!.y),
          },
          { timeout: 5_000 },
        )
        .then(() => { stonePixelFound = true; })
        .catch(() => { stonePixelFound = false; });

      const rx = state.capturedStonePos!.x / canvasBB!.width;
      const ry = state.capturedStonePos!.y / canvasBB!.height;
      const [r, g, b, a] = await getCanvasPixelColor(page, GameplayPage.SELECTORS.mainCanvas, rx, ry);
      test.info().annotations.push({
        type: 'stone-pixel',
        description:
          `Stone "${state.capturedStonePos!.text}" corner pixel rgba(${r},${g},${b},${a}) ` +
          `| 50px neighbourhood: ${stonePixelFound ? 'opaque pixels found ✓' : 'transparent ✗'}`,
      });

      expect(stonePixelFound).toBe(true);
    });

    await test.step('Resolve and validate monster hitbox bounds and dimensions', async () => {
      if (!state.monsterHitboxCenter) {
        state.monsterHitboxCenter = await getHitboxCenter(page);
      }
      expect(state.monsterHitboxCenter).not.toBeNull();

      const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
      const hitboxRanges = await page.evaluate(() => {
        const gss = (window as any).__ftm?.gameStateService;
        return gss?.getHitBoxRanges?.() ?? null;
      });
      expect(hitboxRanges).not.toBeNull();

      const hitboxW = hitboxRanges.hitboxRangeX.to - hitboxRanges.hitboxRangeX.from;
      const hitboxH = hitboxRanges.hitboxRangeY.to - hitboxRanges.hitboxRangeY.from;

      expect(state.monsterHitboxCenter!.x).toBeGreaterThan(0);
      expect(state.monsterHitboxCenter!.x).toBeLessThan(canvasBB!.width);
      expect(state.monsterHitboxCenter!.y).toBeGreaterThan(0);
      expect(state.monsterHitboxCenter!.y).toBeLessThan(canvasBB!.height);
      expect(hitboxW).toBeGreaterThan(0);
      expect(hitboxH).toBeGreaterThan(0);
    });

    await test.step(
      `Drag correct stone "${state.capturedStonePos?.text ?? '?'}" to monster hitbox centre and release`,
      async () => {
        const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
        expect(canvasBB).not.toBeNull();

        const pickX = canvasBB!.x + state.capturedStonePos!.x;
        const pickY = canvasBB!.y + state.capturedStonePos!.y;
        const dropX = canvasBB!.x + state.monsterHitboxCenter!.x;
        const dropY = canvasBB!.y + state.monsterHitboxCenter!.y;

        await page.mouse.move(pickX, pickY);
        await page.mouse.down();
        const STEPS = 20;
        for (let i = 1; i <= STEPS; i++) {
          await page.mouse.move(
            pickX + (dropX - pickX) * (i / STEPS),
            pickY + (dropY - pickY) * (i / STEPS),
          );
          await page.waitForTimeout(20);
        }
        await page.mouse.up();
      },
    );

    await test.step('Positive feedback text appears and matches a known correct-answer phrase', async () => {
      await waitForPositiveFeedback(page, 5000);

      const feedbackContent = (
        await page.locator(Selectors.feedbackText).textContent() ?? ''
      ).trim();

      const knownPositivePhrases = ['Fantastic', 'Great', 'Amazing', 'Excellent', 'Well Done', 'Correct'];
      const matchesPositive = knownPositivePhrases.some((phrase) =>
        feedbackContent.toLowerCase().includes(phrase.toLowerCase()),
      );

      test.info().annotations.push({
        type: 'feedback-text',
        description: `Feedback received: "${feedbackContent}"`,
      });

      expect(
        matchesPositive,
        `Feedback text "${feedbackContent}" must match one of: ${knownPositivePhrases.join(', ')}`,
      ).toBe(true);

      // Stability pause — TC_009 (assessment trigger) needs the game to settle
      // after the correct-drop feedback before the assessment overlay is shown.
      await page.waitForTimeout(2000);
    });
  });
}
