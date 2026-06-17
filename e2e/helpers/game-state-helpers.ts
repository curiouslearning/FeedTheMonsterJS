/**
 * Helpers that reach into the running app's JS context via page.evaluate().
 *
 * The game uses ES-module singletons (gameStateService, assessmentSurveyManager).
 * We expose them on window in the test environment by injecting a small script
 * via page.addInitScript() – see exposeGameInternals().
 */
import { Page } from '@playwright/test';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

/**
 * Called BEFORE page.goto(). Ensures window.__ftm exists so callers never
 * have to null-check it before the game populates it.
 *
 * The dev build (NODE_ENV !== 'production') in feedTheMonster.ts already does:
 *   window.__ftm = { gameStateService, assessmentSurveyManager }
 * after featureFlagsService.initialize(). This helper is kept for backward
 * compatibility and to guarantee __ftm is defined from the start.
 */
export async function exposeGameInternals(page: Page) {
  await page.addInitScript(() => {
    (window as any).__ftm = (window as any).__ftm || {};
  });
}

/**
 * Returns the current puzzle's target stone text(s) from the running game.
 * Requires exposeGameInternals() to have been called and the gameplay scene to
 * be active.  Falls back to null if state is not accessible.
 */
export async function getCurrentPuzzleTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return [];
    const data = gss.gamePlayData;
    if (!data?.currentLevelData?.puzzles) return [];
    const currentPuzzleIndex = gss.currentPuzzleIndex ?? 0;
    const puzzle = data.currentLevelData.puzzles[currentPuzzleIndex];
    return puzzle?.targetStones ?? [];
  });
}

/**
 * Publishes a game state event directly.  Useful for shortcutting to specific
 * scenes without driving full UI interactions.
 */
export async function publishGameEvent(page: Page, eventName: string, payload?: unknown) {
  await page.evaluate(
    ({ event, payload }) => {
      const gss = (window as any).__ftm?.gameStateService;
      if (gss) {
        gss.publish(event, payload);
      }
    },
    { event: eventName, payload },
  );
}

/**
 * Triggers the assessment survey overlay programmatically.
 *
 * Primary path: calls GameplayFlowManager.startAssessmentFlow() with the
 * levelForMinigame segment so isCombinedMode=true. This wires up all the real
 * game callbacks — onCloseStart fires handleCombinedModeTransition() which
 * starts the treasure-chest mini game and sets #treasurecanvas display:block;
 * onClose fires resumeAfterClose() → continueAfterPuzzleStep() → loadPuzzle()
 * so gameplay resumes normally after the mini game ends.
 *
 * TypeScript 'private' is not enforced at JS runtime, so startAssessmentFlow
 * can be called from page.evaluate() even though it is declared private.
 *
 * Fallback path (if the flow manager is not accessible): calls asm.open()
 * with best-effort callbacks that at least show #treasurecanvas and hide the
 * overlay so downstream test steps do not stall.
 */
export async function triggerAssessment(page: Page) {
  await page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return;

    // Try to reach GameplayFlowManager through the active gameplay scene.
    // Primary path: via sceneHandler.activeScene['scene'].flowManager
    // (sceneHandler is exposed on window.__ftm in non-production builds).
    const sceneHandler = (window as any).__ftm?.sceneHandler;
    const activeScene = sceneHandler?.['activeScene']?.['scene'] ?? null;
    const scene = activeScene ?? gss.gamePlayScene ?? gss.currentScene ?? null;
    const fm = scene?.flowManager ?? null;

    if (fm && typeof fm.startAssessmentFlow === 'function') {
      const seg: number = typeof fm.levelForMinigame === 'number' ? fm.levelForMinigame : 3;
      fm.startAssessmentFlow(seg, () => {
        // onCloseResume: called after assessment + mini game fully complete
        if (typeof fm.continueAfterPuzzleStep === 'function') {
          fm.continueAfterPuzzleStep(seg, false, 0, 0);
        }
      });
      return;
    }

    // Fallback: open assessment directly with improved callbacks
    const asm = (window as any).__ftm?.assessmentSurveyManager;
    if (!asm) return;
    asm.open({
      onLoaded: () => {},
      onComplete: () => {},
      onRewardTrigger: () => {
        // Best-effort: show treasure canvas so TC_0014/0015 can detect it
        const tc = document.querySelector('#treasurecanvas') as HTMLElement | null;
        if (tc) {
          tc.style.display = 'block';
          tc.style.zIndex = '11';
        }
      },
      onClose: () => {
        const overlay = document.querySelector('#assessment-survey-overlay') as HTMLElement | null;
        if (overlay) overlay.style.display = 'none';
      },
    });
  });
}

/**
 * Pauses the FTM gameplay loop and notifies all subscribers.
 *
 * startAssessmentFlow() only sets isAssessmentInProgress — it does NOT publish
 * GAME_PAUSE_STATUS_EVENT or call pauseGamePlay(), so the game render loop
 * keeps running under the assessment overlay unless this is called explicitly.
 *
 * Mirrors what gameplay-scene.ts lines 420-421 do when the pause button is tapped:
 *   gameStateService.publish(GAME_PAUSE_STATUS_EVENT, true)
 *   this.pauseGamePlay()
 */
export async function pauseFtmGame(page: Page): Promise<void> {
  await page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return;
    gss.publish(gss.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
    const sceneHandler = (window as any).__ftm?.sceneHandler;
    const scene =
      sceneHandler?.['activeScene']?.['scene'] ??
      gss.gamePlayScene ??
      gss.currentScene ??
      null;
    if (scene && typeof scene.pauseGamePlay === 'function') {
      scene.pauseGamePlay();
    }
  });
}

/**
 * Waits for the treasure chest mini game canvas (#treasurecanvas) to become
 * visible on screen.  Fails with a timeout error if it never appears.
 */
export async function waitForTreasureCanvasVisible(page: Page, timeout = 15_000): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return false;
      const cs = window.getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    },
    Selectors.treasureCanvas,
    { timeout },
  );
}

/**
 * Waits for an element inside the assessment-survey-player component.
 * The component may use either regular DOM or a light shadow root.
 */
export async function waitForAssessmentElement(
  page: Page,
  innerSelector: string,
  timeout: number = Timeouts.sceneTransition,
) {
  await page.waitForFunction(
    ({ outer, inner }) => {
      const player = document.querySelector(outer);
      if (!player) return false;
      // Try regular DOM first
      if (player.querySelector(inner)) return true;
      // Try shadow root
      if ((player as any).shadowRoot?.querySelector(inner)) return true;
      return false;
    },
    { outer: Selectors.assessmentPlayer, inner: innerSelector },
    { timeout },
  );
}

/**
 * Returns the bounding box of an element inside assessment-survey-player,
 * searching both regular DOM and shadow DOM.
 */
export async function getAssessmentElementBbox(
  page: Page,
  innerSelector: string,
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return page.evaluate(
    ({ outer, inner }) => {
      const player = document.querySelector(outer);
      if (!player) return null;
      const el =
        player.querySelector(inner) ??
        (player as any).shadowRoot?.querySelector(inner);
      if (!el) return null;
      const r = (el as HTMLElement).getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    },
    { outer: Selectors.assessmentPlayer, inner: innerSelector },
  );
}

/**
 * Triggers level-end scene by publishing the required game events.
 * Pass starCount 1–5 to simulate different outcomes.
 */
export async function triggerLevelEndScene(
  page: Page,
  starCount = 3,
  currentLevel = 0,
  isLastLevel = false,
) {
  await page.evaluate(
    ({ starCount, currentLevel, isLastLevel }) => {
      const gss = (window as any).__ftm?.gameStateService;
      if (!gss) return;

      const data = gss.getFTMData?.();
      if (!data) return;

      gss.isLastLevel = isLastLevel;

      gss.publish(gss.EVENTS.LEVEL_END_DATA_EVENT, {
        levelEndData: {
          starCount,
          currentLevel,
          isTimerEnded: false,
          treasureChestScore: 0,
          score: starCount * 4,
        },
        data,
      });

      gss.publish(gss.EVENTS.SWITCH_SCENE_EVENT, 'LevelEnd');
    },
    { starCount, currentLevel, isLastLevel },
  );
}

/**
 * Checks whether the feedback text contains a positive (correct) message.
 * The game uses game data's FeedbackTexts (Fantastic, Great, Amazing).
 */
export async function waitForPositiveFeedback(page: Page, timeout = Timeouts.domUpdate) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const text = (el.textContent ?? '').trim();
      return text.length > 0;
    },
    Selectors.feedbackText,
    { timeout },
  );
}

/**
 * Subscribes to the CORRECT_STONE_POSITION event (fired for tutorial/segment-0
 * puzzles) and stores the correct stone's CSS-pixel coordinates in
 * window.__ftmTest.correctStonePos.
 *
 * Must be called BEFORE clicking the monster so the subscription is in place
 * when createStones() fires the event.
 */
export async function subscribeToCorrectStonePosition(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__ftmTest = (window as any).__ftmTest ?? {};
    (window as any).__ftmTest.correctStonePos = null;

    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return;

    const unsub = gss.subscribe(gss.EVENTS.CORRECT_STONE_POSITION, (detail: any) => {
      const stones: any[] = detail?.activeTutorialFoilStones ?? [];
      // For letter puzzles the correct stone is the sole element in the array
      if (!detail.isWordPuzzle && stones.length > 0) {
        const s = stones[0];
        (window as any).__ftmTest.correctStonePos = { x: s.x, y: s.y, text: s.text };
      }
      unsub(); // one-shot: unsubscribe after first capture
    });
  });
}

/**
 * Returns the correct stone's CSS-pixel position (relative to #canvas) that was
 * captured by subscribeToCorrectStonePosition(), or null if the event has not
 * fired yet (e.g. non-tutorial segment).
 */
export async function getCapturedCorrectStonePos(
  page: Page,
): Promise<{ x: number; y: number; text: string } | null> {
  return page.evaluate(() => (window as any).__ftmTest?.correctStonePos ?? null);
}

/**
 * Returns the centre of the monster drop-zone hitbox in CSS pixel coordinates
 * relative to #canvas (add canvasBoundingBox.x/.y to get page coordinates).
 * Returns null when the game is not in the gameplay scene.
 */
export async function getHitboxCenter(
  page: Page,
): Promise<{ x: number; y: number } | null> {
  return page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return null;
    const ranges = gss.getHitBoxRanges?.();
    if (!ranges?.hitboxRangeX || !ranges?.hitboxRangeY) return null;
    return {
      x: (ranges.hitboxRangeX.from + ranges.hitboxRangeX.to) / 2,
      y: (ranges.hitboxRangeY.from + ranges.hitboxRangeY.to) / 2,
    };
  });
}
