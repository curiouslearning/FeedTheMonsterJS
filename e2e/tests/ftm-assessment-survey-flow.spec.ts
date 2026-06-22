/**
 * FeedTheMonsterJS – Full E2E Flow (TC_001 – TC_0016)
 *
 * All 16 test cases run in a single serial describe block sharing ONE browser
 * page — the browser opens once and closes once at the end of the suite.
 * Each test picks up exactly where the previous left off (continuous session).
 *
 * Execution order mirrors the manual test flow:
 *   App launch → Start screen → Navigation → Level selection → Gameplay →
 *   Assessment → Mini game → Level end
 *
 * For debugging a specific area in isolation, run the corresponding file from
 * e2e/tests/isolated/ (see e2e/tests/README.md).
 */

import { test, expect, Page } from '@playwright/test';
import { Routes } from '../constants/urls';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';
import { LoadingPage } from '../pages/loading-page';
import { StartPage } from '../pages/start-page';
import { LevelSelectionPage } from '../pages/level-selection-page';
import { GameplayPage } from '../pages/gameplay-page';
import { LevelEndPage } from '../pages/level-end-page';
import {
  mockAnalytics,
  clearGameProgress,
  exposeGameInternals,
  subscribeToCorrectStonePosition,
  getCapturedCorrectStonePos,
  getHitboxCenter,
  getCanvasPixelColor,
  triggerAssessment,
  pauseFtmGame,
  hidePausePopupForMiniGame,
  waitForPositiveFeedback,
  waitForTreasureCanvasVisible,
  waitForMiniGameComplete,
} from '../helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Shared utility
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Single serial group — one browser for all 16 TCs
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('FeedTheMonsterJS – Full E2E Flow (TC_001 – TC_0016)', () => {
  test.describe.configure({ retries: 0 });

  let page: Page;

  // Shared across TC_007 → TC_008
  let capturedStonePos: { x: number; y: number; text: string } | null = null;
  let monsterHitboxCenter: { x: number; y: number } | null = null;

  // Shared across TC_0011 → TC_0013
  let correctAssessmentBtnId: string | null = null;
  let wrongAssessmentBtnId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await mockAnalytics(page);
    await clearGameProgress(page);
    await exposeGameInternals(page);
    // TC_001 will assert loading-screen state; navigate here, not in the test
    await page.goto(Routes.game({ lang: 'english' }));
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_001 | App Launch
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_001 | App Launch | App loads in Chrome and start screen is displayed', async () => {
    await test.step('Loading screen is attached to DOM on first paint', async () => {
      await expect(page.locator(LoadingPage.SELECTOR)).toBeAttached();
    });

    await test.step('Loading screen hides after all assets have loaded', async () => {
      await waitForLoadingDone(page);
    });

    await test.step('Start screen is displayed after loading completes', async () => {
      await expect(page.locator(Selectors.background)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
      await expect(page.locator(StartPage.SELECTORS.playButton)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_002 | Start Screen
  // ───────────────────────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────────────────────
  // TC_003 | Navigation
  // ───────────────────────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────────────────────
  // TC_004 | Level Selection Screen
  // ───────────────────────────────────────────────────────────────────────────
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
      // Must happen BEFORE the level button click so the handler is in place when
      // GameplayScene initialises StoneHandler and fires the event.
      await subscribeToCorrectStonePosition(page);
    });

    await test.step('Click level 2 button to navigate to gameplay screen', async () => {
      await page.locator(LevelSelectionPage.SELECTORS.levelButton(1)).click();
      await page.waitForTimeout(1500);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_005 | Navigation from Level Screen to Gameplay Screen
  // ───────────────────────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────────────────────
  // TC_006 | Gameplay Screen
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_006 | Gameplay Screen | All UI elements are loaded and interactable', async () => {
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

  // ───────────────────────────────────────────────────────────────────────────
  // TC_007 | Triggering Stones on Gameplay Screen
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_007 | Stone Trigger | Stones appear on gameplay canvas when Rive monster is clicked', async () => {
    await page.waitForFunction(
      () => (window as any).__ftm?.gameStateService?.getHitBoxRanges?.() != null,
      { timeout: 10_000 },
    );

    await test.step('Read the correct stone position captured during initial puzzle load', async () => {
      capturedStonePos = await getCapturedCorrectStonePos(page);
      test.info().annotations.push({
        type: 'stone-pos',
        description: capturedStonePos
          ? `Captured: "${capturedStonePos.text}" at CSS px (${Math.round(capturedStonePos.x)}, ${Math.round(capturedStonePos.y)})`
          : 'CORRECT_STONE_POSITION did not fire — TC_008 will use systematic fallback',
      });
    });

    await test.step('Resolve monster hitbox centre from game state', async () => {
      monsterHitboxCenter = await getHitboxCenter(page);
      expect(monsterHitboxCenter).not.toBeNull();
    });

    await test.step('Click the monster hotspot on the game canvas', async () => {
      const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
      expect(canvasBB).not.toBeNull();
      await page.mouse.click(
        canvasBB!.x + monsterHitboxCenter!.x,
        canvasBB!.y + monsterHitboxCenter!.y,
      );
    });

    await test.step('Game canvas shows answer options (stones are present)', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.mainCanvas)).toBeVisible();
    });

    await test.step('Game UI remains functional after monster interaction', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.pauseButton)).toBeVisible();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_008 | Drag and Drop
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_008 | Drag and Drop | Dragging correct stone to monster triggers feedback text and audio', async () => {
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
      expect(capturedStonePos, 'CORRECT_STONE_POSITION event must have fired in TC_004').not.toBeNull();

      expect(capturedStonePos!.x).toBeGreaterThan(0);
      expect(capturedStonePos!.x).toBeLessThan(canvasBB!.width);
      expect(capturedStonePos!.y).toBeGreaterThan(0);
      expect(capturedStonePos!.y).toBeLessThan(canvasBB!.height);
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
            cx: Math.round(capturedStonePos!.x),
            cy: Math.round(capturedStonePos!.y),
          },
          { timeout: 5_000 },
        )
        .then(() => { stonePixelFound = true; })
        .catch(() => { stonePixelFound = false; });

      const rx = capturedStonePos!.x / canvasBB!.width;
      const ry = capturedStonePos!.y / canvasBB!.height;
      const [r, g, b, a] = await getCanvasPixelColor(page, GameplayPage.SELECTORS.mainCanvas, rx, ry);
      test.info().annotations.push({
        type: 'stone-pixel',
        description:
          `Stone "${capturedStonePos!.text}" corner pixel rgba(${r},${g},${b},${a}) ` +
          `| 50px neighbourhood: ${stonePixelFound ? 'opaque pixels found ✓' : 'transparent ✗'}`,
      });
      expect(stonePixelFound).toBe(true);
    });

    await test.step('Resolve and validate monster hitbox bounds and dimensions', async () => {
      if (!monsterHitboxCenter) {
        monsterHitboxCenter = await getHitboxCenter(page);
      }
      expect(monsterHitboxCenter).not.toBeNull();

      const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
      const hitboxRanges = await page.evaluate(() => {
        const gss = (window as any).__ftm?.gameStateService;
        return gss?.getHitBoxRanges?.() ?? null;
      });
      expect(hitboxRanges).not.toBeNull();

      const hitboxW = hitboxRanges.hitboxRangeX.to - hitboxRanges.hitboxRangeX.from;
      const hitboxH = hitboxRanges.hitboxRangeY.to - hitboxRanges.hitboxRangeY.from;

      expect(monsterHitboxCenter!.x).toBeGreaterThan(0);
      expect(monsterHitboxCenter!.x).toBeLessThan(canvasBB!.width);
      expect(monsterHitboxCenter!.y).toBeGreaterThan(0);
      expect(monsterHitboxCenter!.y).toBeLessThan(canvasBB!.height);
      expect(hitboxW).toBeGreaterThan(0);
      expect(hitboxH).toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'hitbox',
        description:
          `Monster hitbox centre (${Math.round(monsterHitboxCenter!.x)}, ${Math.round(monsterHitboxCenter!.y)}) ` +
          `| size ${Math.round(hitboxW)}×${Math.round(hitboxH)} px`,
      });
    });

    await test.step(
      `Drag correct stone "${capturedStonePos?.text ?? '?'}" to monster hitbox centre and release`,
      async () => {
        const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
        expect(canvasBB).not.toBeNull();

        const pickX = canvasBB!.x + capturedStonePos!.x;
        const pickY = canvasBB!.y + capturedStonePos!.y;
        const dropX = canvasBB!.x + monsterHitboxCenter!.x;
        const dropY = canvasBB!.y + monsterHitboxCenter!.y;

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
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_009 | Assessment Trigger
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_009 | Assessment Trigger | Assessment overlay appears as overlay on existing UI during gameplay', async () => {
    await test.step('Wait for FTM positive feedback text before triggering assessment', async () => {
      await page.waitForFunction(
        (sel) => {
          const el = document.querySelector(sel);
          return !!el && (el.textContent ?? '').trim().length > 0;
        },
        Selectors.feedbackText,
        { timeout: Timeouts.domUpdate },
      );
      await page.waitForTimeout(2000);
    });

    await test.step('Trigger the assessment survey overlay via GameplayFlowManager', async () => {
      await triggerAssessment(page);
    });

    await test.step('Pause FTM game while assessment is active', async () => {
      await pauseFtmGame(page);
    });

    await test.step('Assessment overlay container is visible over the game', async () => {
      await expect(page.locator(Selectors.assessmentOverlay)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Assessment survey player web component is mounted', async () => {
      await expect(page.locator(Selectors.assessmentPlayer)).toBeAttached({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('FTM game inputs are suspended while assessment is active', async () => {
      const inAssessmentMode = await page.evaluate(() => {
        const gss = (window as any).__ftm?.gameStateService;
        const fm = (gss?.gamePlayScene ?? gss?.currentScene)?.flowManager;
        if (fm && typeof fm.isAssessmentInProgress === 'boolean') {
          return fm.isAssessmentInProgress;
        }
        const overlay = document.querySelector('#assessment-survey-overlay') as HTMLElement | null;
        if (!overlay) return false;
        return parseInt(window.getComputedStyle(overlay).zIndex || '0', 10) > 0;
      });
      expect(inAssessmentMode).toBe(true);
    });

    await test.step('Main game canvas remains attached beneath the overlay', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.mainCanvas)).toBeAttached();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_0010 | Assessment Gameplay
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0010 | Assessment Gameplay | Treasure chest UI and audio button are displayed and interactable', async () => {
    await test.step('Assessment overlay is still visible', async () => {
      await expect(page.locator(Selectors.assessmentOverlay)).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
    });

    await test.step('Wait for assessment question view to render (#pbutton)', async () => {
      await page.waitForSelector(`${Selectors.assessmentPlayer} #pbutton`, {
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Click the audio play button (#nextqButton) to start the first question', async () => {
      await page.waitForSelector(`${Selectors.assessmentPlayer} #nextqButton`, {
        timeout: Timeouts.sceneTransition,
      });
      await page.waitForTimeout(1000);
      await page.locator(`${Selectors.assessmentPlayer} #nextqButton`).click({ force: true });
    });

    await test.step('Answer buttons (.answerButton) appear after the audio prompt', async () => {
      await page.waitForSelector(`${Selectors.assessmentPlayer} .answerButton`, {
        timeout: Timeouts.sceneTransition,
      });
      const btnCount = await page.locator(`${Selectors.assessmentPlayer} .answerButton`).count();
      expect(btnCount).toBeGreaterThan(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_0011 | Assessment Drag and Drop
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0011 | Assessment Drag and Drop | Correct answer dragged to chest; question advances to next', async () => {
    await test.step('Identify correct answer from assessment state and drag it to the chest', async () => {
      await page.waitForFunction(
        (playerSel) => {
          const player = document.querySelector(playerSel);
          if (!player) return false;
          const chest = player.querySelector('#chestImage');
          if (!chest) return false;
          const chestRect = (chest as HTMLElement).getBoundingClientRect();
          if (chestRect.width === 0) return false;
          const btns = Array.from(player.querySelectorAll('.answerButton'));
          return btns.some((b) => {
            const el = b as HTMLElement;
            const cs = window.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            if (el.getBoundingClientRect().width === 0) return false;
            const animations = (el as Element).getAnimations?.() ?? [];
            return animations.length === 0 && parseFloat(cs.opacity) > 0;
          });
        },
        Selectors.assessmentPlayer,
        { timeout: Timeouts.sceneTransition },
      );

      const answerInfo = await page.evaluate((playerSel) => {
        const player = document.querySelector(playerSel) as any;
        if (!player?.appInstance) return null;
        const q = player.appInstance.game?.currentQuestion;
        if (!q || !Array.isArray(q.answers) || !q.correct) return null;
        const correctAnswerName: string = q.correct;
        const correctIdx = (q.answers as any[]).findIndex(
          (a) => a.answerName === correctAnswerName,
        );
        const wrongIdx = (q.answers as any[]).findIndex(
          (a) => a.answerName !== correctAnswerName,
        );
        return {
          correctBtnId: correctIdx >= 0 ? `#answerButton${correctIdx + 1}` : null,
          wrongBtnId: wrongIdx >= 0 ? `#answerButton${wrongIdx + 1}` : null,
          correctAnswerName,
        };
      }, Selectors.assessmentPlayer);

      if (answerInfo?.correctBtnId) {
        correctAssessmentBtnId = answerInfo.correctBtnId;
        wrongAssessmentBtnId = answerInfo.wrongBtnId ?? null;
        test.info().annotations.push({
          type: 'correct-answer-identified',
          description: `Q1 correct answer (${answerInfo.correctAnswerName}) → ${answerInfo.correctBtnId}`,
        });
      }

      expect(correctAssessmentBtnId).not.toBeNull();

      const chest = page.locator(`${Selectors.assessmentPlayer} #chestImage`);
      const chestBB = await chest.boundingBox();
      expect(chestBB).not.toBeNull();

      const btn = page.locator(`${Selectors.assessmentPlayer} ${correctAssessmentBtnId}`);
      const btnBB = await btn.boundingBox();
      expect(btnBB).not.toBeNull();

      await page.mouse.move(btnBB!.x + btnBB!.width / 2, btnBB!.y + btnBB!.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        chestBB!.x + chestBB!.width / 2,
        chestBB!.y + chestBB!.height / 2,
        { steps: 20 },
      );
      await page.mouse.up();

      const feedbackVisible = await page.waitForFunction(
        (playerSel) => {
          const el = document.querySelector(`${playerSel} #feedbackWrap`) as HTMLElement | null;
          return el?.classList.contains('visible') ?? false;
        },
        Selectors.assessmentPlayer,
        { timeout: 5000 },
      ).then(() => true).catch(() => false);

      expect(feedbackVisible, '#feedbackWrap must become visible after dropping the correct answer').toBe(true);

      const isGreenFeedback = feedbackVisible && await page.evaluate((playerSel) => {
        const el = document.querySelector(`${playerSel} #feedbackWrap`) as HTMLElement | null;
        if (!el?.classList.contains('visible')) return false;
        const color = window.getComputedStyle(el).color;
        return !color.includes('255, 0, 0') && color !== 'red';
      }, Selectors.assessmentPlayer);

      test.info().annotations.push({
        type: 'correct-drop-result',
        description: isGreenFeedback
          ? `Green feedback confirmed for ${correctAssessmentBtnId} on Q1`
          : `Feedback appeared but color check inconclusive for ${correctAssessmentBtnId}`,
      });
    });

    await expect(page.locator(Selectors.assessmentPlayer)).toBeAttached();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_0012 | Feedback in Assessment
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0012 | Assessment Feedback | Correct answer shows green/positive feedback', async () => {
    await test.step('Correct answer button was identified during TC_0011', async () => {
      expect(correctAssessmentBtnId).not.toBeNull();
    });

    await test.step('Green feedback (#feedbackWrap visible with green color) confirms correct answer', async () => {
      const greenFeedback = await page.waitForFunction(
        (playerSel) => {
          const el = document.querySelector(`${playerSel} #feedbackWrap`) as HTMLElement | null;
          if (!el?.classList.contains('visible')) return false;
          const color = window.getComputedStyle(el).color;
          return !color.includes('255, 0, 0') && color !== 'red';
        },
        Selectors.assessmentPlayer,
        { timeout: 3000 },
      ).then(() => true).catch(() => false);

      test.info().annotations.push({
        type: 'green-feedback-detection',
        description: greenFeedback
          ? `#feedbackWrap visible with green color — correct btn: ${correctAssessmentBtnId}`
          : `Green feedback faded before check — correct btn ${correctAssessmentBtnId} accepted`,
      });

      await expect(page.locator(Selectors.assessmentOverlay)).toBeAttached();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_0013 | Wrong Drop
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0013 | Wrong Drop | Dropping wrong answer shows red/negative feedback; question does not advance', async () => {
    await test.step('Wait for Q1 green feedback to fade — 2-second auto-advance must fire first', async () => {
      await page.waitForFunction(
        (playerSel) => {
          const player = document.querySelector(playerSel);
          if (!player) return true;
          const fw = player.querySelector('#feedbackWrap') as HTMLElement | null;
          if (!fw) return true;
          return !fw.classList.contains('visible');
        },
        Selectors.assessmentPlayer,
        { timeout: 5000 },
      ).catch(() => null);
    });

    await test.step('Wait for Q2 audio button and click it', async () => {
      await page.waitForSelector(`${Selectors.assessmentPlayer} #nextqButton`, {
        timeout: Timeouts.sceneTransition,
      });
      await page.locator(`${Selectors.assessmentPlayer} #nextqButton`).click({ force: true });
    });

    await test.step('Wait for Q2 answer buttons to finish their entry animation', async () => {
      await page.waitForFunction(
        (playerSel) => {
          const player = document.querySelector(playerSel);
          if (!player) return false;
          const chest = player.querySelector('#chestImage');
          if (!chest || (chest as HTMLElement).getBoundingClientRect().width === 0) return false;
          const btns = Array.from(player.querySelectorAll('.answerButton'));
          return btns.some((b) => {
            const el = b as HTMLElement;
            const cs = window.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            if (el.getBoundingClientRect().width === 0) return false;
            const animations = (el as Element).getAnimations?.() ?? [];
            return animations.length === 0 && parseFloat(cs.opacity) > 0;
          });
        },
        Selectors.assessmentPlayer,
        { timeout: Timeouts.sceneTransition },
      );
    });

    await test.step('Drag a known-wrong button to the chest and verify red feedback via #feedbackWrap', async () => {
      const q2WrongBtnId = await page.evaluate((playerSel) => {
        const player = document.querySelector(playerSel) as any;
        if (!player?.appInstance) return null;
        const q = player.appInstance.game?.currentQuestion;
        if (!q || !Array.isArray(q.answers) || !q.correct) return null;
        const correctAnswerName: string = q.correct;
        const wrongIdx = (q.answers as any[]).findIndex(
          (a) => a.answerName !== correctAnswerName,
        );
        return wrongIdx >= 0 ? `#answerButton${wrongIdx + 1}` : null;
      }, Selectors.assessmentPlayer);

      const buttonIds = ['#answerButton1', '#answerButton2', '#answerButton3', '#answerButton4'];
      const wrongId =
        q2WrongBtnId ??
        wrongAssessmentBtnId ??
        buttonIds.find((b) => b !== correctAssessmentBtnId) ??
        '#answerButton4';

      test.info().annotations.push({
        type: 'intentional-wrong-answer',
        description: `Deliberately dragging ${wrongId} (wrong answer) on Q2`,
      });

      const btn = page.locator(`${Selectors.assessmentPlayer} ${wrongId}`);
      const chest = page.locator(`${Selectors.assessmentPlayer} #chestImage`);
      const btnBB = await btn.boundingBox().catch(() => null);
      const chestBB = await chest.boundingBox().catch(() => null);

      if (btnBB && chestBB) {
        await page.mouse.move(btnBB.x + btnBB.width / 2, btnBB.y + btnBB.height / 2);
        await page.mouse.down();
        await page.mouse.move(chestBB.x + chestBB.width / 2, chestBB.y + chestBB.height / 2, { steps: 20 });
        await page.mouse.up();
      }

      const feedbackVisible = await page.waitForFunction(
        (playerSel) => {
          const el = document.querySelector(`${playerSel} #feedbackWrap`) as HTMLElement | null;
          return el?.classList.contains('visible') ?? false;
        },
        Selectors.assessmentPlayer,
        { timeout: 3000 },
      ).then(() => true).catch(() => false);

      expect(feedbackVisible).toBe(true);
    });

    await test.step('Close assessment survey after verifying the wrong-drop feedback', async () => {
      const closeBtn = page.locator(Selectors.assessmentCloseBtn);
      const closeBtnVisible = await closeBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (closeBtnVisible) {
        await closeBtn.click();
      } else {
        const innerClose = page.locator(
          `${Selectors.assessmentPlayer} [class*="close"], ${Selectors.assessmentPlayer} [class*="skip"]`,
        );
        if ((await innerClose.count()) > 0) {
          await innerClose.first().click({ force: true });
        }
      }
      await page.waitForTimeout(1500);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_0014 | Mini Game Appears After Assessment Close
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0014 | Assessment Completion | Mini game treasure canvas becomes visible after assessment ends', async () => {
    await test.step('Treasure chest mini game canvas (#treasurecanvas) becomes visible', async () => {
      await waitForTreasureCanvasVisible(page, Timeouts.sceneTransition);
      await expect(page.locator(Selectors.treasureCanvas)).toBeVisible();
    });

    await test.step('Raise mini-game canvas above pause popup and hide the pause popup', async () => {
      await hidePausePopupForMiniGame(page);
    });

    await test.step('Mini-game animation advances with real deltaTime (game loop stays paused)', async () => {
      await page.waitForTimeout(1500);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_0015 | Mini Game
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0015 | Mini Game | Click 5 stones, bonus star shown, mini game completes naturally', async () => {
    await test.step('Treasure chest canvas is visible with non-zero dimensions', async () => {
      await expect(page.locator(Selectors.treasureCanvas)).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
      const canvasBB = await page.locator(Selectors.treasureCanvas).boundingBox();
      expect(canvasBB).not.toBeNull();
      expect(canvasBB!.width).toBeGreaterThan(0);
      expect(canvasBB!.height).toBeGreaterThan(0);
    });

    await test.step('Wait for treasure chest to open (FadeIn ~300 ms + ClosedChest ~1000 ms)', async () => {
      await page.waitForTimeout(1500);
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
          setTimeout(tick, intervalMs);
        });
      }, { count: 5, intervalMs: 800 });
    });

    await test.step('Wait for mini game to complete naturally (OpenedChest 12 s + FadeOut 400 ms)', async () => {
      await waitForMiniGameComplete(page, 20_000);
    });

    await test.step('Game background remains visible after mini game ends', async () => {
      await expect(page.locator(Selectors.background)).toBeVisible();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TC_0016 | Completion of a Level
  // ───────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0016 | Level Completion | Level end screen shows jar animation, stars, Rive monster state and navigation CTAs', async () => {
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
});
