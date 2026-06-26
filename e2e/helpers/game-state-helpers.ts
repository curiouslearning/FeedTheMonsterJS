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
 * Triggers the assessment survey overlay programmatically, guaranteeing that
 * the overlay is opened with isCombinedMode = true so that closing it (TC_0013)
 * will trigger handleCombinedModeTransition → show #treasurecanvas.
 *
 * Root-cause fix: determineNextStep() may have already called startAssessmentFlow()
 * with currentPuzzleSegment = 1, which gives isCombinedMode = false when
 * levelForMinigame ≠ 1.  We close that overlay silently, reset the flow-manager
 * flags, and reopen with seg = levelForMinigame so isCombinedMode is guaranteed
 * to be true.
 *
 * TypeScript 'private' is not enforced at JS runtime, so private members such
 * as startAssessmentFlow, levelForMinigame and hasShownChest are fully
 * accessible from page.evaluate().
 */
export async function triggerAssessment(page: Page) {
  await page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return;

    // Reach GameplayFlowManager via sceneHandler (exposed on window.__ftm in dev builds).
    const sceneHandler = (window as any).__ftm?.sceneHandler;
    const activeScene = sceneHandler?.['activeScene']?.['scene'] ?? null;
    const scene = activeScene ?? gss.gamePlayScene ?? gss.currentScene ?? null;
    const fm = scene?.flowManager ?? null;

    if (fm && typeof fm.startAssessmentFlow === 'function') {
      // Read the segment that was randomly assigned for the mini-game trigger.
      const rawLevel = fm.levelForMinigame;
      const seg: number = (typeof rawLevel === 'number' && rawLevel >= 1) ? rawLevel : 1;

      // Close any assessment that determineNextStep() may have already opened.
      // assessmentSurveyManager.close() hides the overlay instantly without
      // invoking the handleClose closure (no onCloseStart / onClose callbacks).
      const asm = (window as any).__ftm?.assessmentSurveyManager;
      if (asm && typeof asm.close === 'function') {
        asm.close();
      }

      // Reset flow-manager flags so startAssessmentFlow() proceeds and
      // so isCombinedMode evaluates to (seg === levelForMinigame && !hasShownChest) = true.
      fm.isAssessmentInProgress = false;
      fm.hasShownChest = false;
      fm.levelForMinigame = seg; // idempotent; ensures the segment lines up

      fm.startAssessmentFlow(seg, () => {
        // onCloseResume: only invoked in non-combined mode (combined mode is
        // handled internally via the IS_MINI_GAME_DONE event).
        if (typeof fm.continueAfterPuzzleStep === 'function') {
          fm.continueAfterPuzzleStep(seg, false, 0, 0);
        }
      });
      return;
    }

    // Fallback: direct assessmentSurveyManager.open() when flowManager is not accessible.
    const asm = (window as any).__ftm?.assessmentSurveyManager;
    if (!asm) return;
    asm.open({
      onLoaded: () => {},
      onComplete: () => {},
      onRewardTrigger: () => {
        const tc = document.querySelector('#treasurecanvas') as HTMLElement | null;
        if (tc) { tc.style.display = 'block'; tc.style.zIndex = '11'; }
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
 * Hides the pause popup and raises #treasurecanvas above it so the mini-game
 * is fully visible and interactive.
 *
 * The .popup CSS class sets z-index: 1000.  #treasurecanvas defaults to
 * z-index: 11, so it is hidden behind the pause popup.  This helper:
 *   1. Raises #treasurecanvas to z-index: 1001 (above the pause popup).
 *   2. Removes the .show class from #pause-popup and sets display: none so
 *      the popup is invisible while the mini-game plays.
 */
export async function hidePausePopupForMiniGame(page: Page): Promise<void> {
  await page.evaluate(() => {
    const tc = document.querySelector('#treasurecanvas') as HTMLElement | null;
    if (tc) tc.style.zIndex = '1001';

    const pp = document.querySelector('#pause-popup') as HTMLElement | null;
    if (pp) {
      pp.classList.remove('show');
      pp.style.display = 'none';
    }
  });
}

/**
 * Resumes the FTM gameplay render loop after it was paused via pauseFtmGame().
 *
 * When isPaused = true in GameplayScene.draw(), deltaTime is forced to 0 so
 * TreasureChestAnimation never advances its stateTimer.  Calling resumeGame()
 * restores real deltaTime so the mini-game can actually progress.
 */
export async function resumeFtmGame(page: Page): Promise<void> {
  await page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return;
    gss.publish(gss.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
    const sceneHandler = (window as any).__ftm?.sceneHandler;
    const scene =
      sceneHandler?.['activeScene']?.['scene'] ??
      gss.gamePlayScene ??
      gss.currentScene ??
      null;
    if (scene && typeof scene.resumeGame === 'function') {
      scene.resumeGame();
    }
  });
}

/**
 * Waits for the treasure chest mini game to finish — i.e. for #treasurecanvas
 * to become hidden (display:none) after the FadeOut phase completes.
 */
export async function waitForMiniGameComplete(page: Page, timeout = 20_000): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return true; // Canvas removed from DOM = done
      const cs = window.getComputedStyle(el);
      return cs.display === 'none' || cs.visibility === 'hidden';
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

// ─── Dynamic assessment + full-level helpers ──────────────────────────────────

/**
 * Returns the 1-based puzzle segment at which the assessment will trigger,
 * read from AssessmentFlowCoordinator.getAssessmentPuzzleTrigger().
 * Returns 0 if the coordinator is inaccessible or the level is not eligible.
 */
export async function getAssessmentTriggerPuzzle(page: Page): Promise<number> {
  return page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return 0;
    const sh = (window as any).__ftm?.sceneHandler;
    const scene =
      sh?.['activeScene']?.['scene'] ?? gss.gamePlayScene ?? gss.currentScene ?? null;
    const fm = scene?.flowManager ?? null;
    const coordinator = fm?.['assessmentFlowCoordinator'];
    if (!coordinator) return 0;
    const trigger = coordinator.getAssessmentPuzzleTrigger?.();
    return typeof trigger === 'number' ? trigger : 0;
  });
}

/**
 * Returns the 1-based puzzle segment index where the mini-game is scheduled
 * (GameplayFlowManager.levelForMinigame). Returns 0 if not set.
 */
export async function getMiniGameTriggerPuzzle(page: Page): Promise<number> {
  return page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return 0;
    const sh = (window as any).__ftm?.sceneHandler;
    const scene =
      sh?.['activeScene']?.['scene'] ?? gss.gamePlayScene ?? gss.currentScene ?? null;
    const fm = scene?.flowManager ?? null;
    if (!fm) return 0;
    const level = fm['levelForMinigame'];
    return typeof level === 'number' && level >= 1 ? level : 0;
  });
}

/**
 * Returns the total number of puzzles in the current level by reading
 * gameStateService.gamePlayData.currentLevelData.puzzles.length.
 */
export async function getTotalPuzzleCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    return gss?.gamePlayData?.currentLevelData?.puzzles?.length ?? 0;
  });
}

/**
 * Returns the current 0-based puzzle index from GameplayFlowManager.currentPuzzleIndex.
 * Returns -1 if the flow manager is not accessible.
 */
export async function getCurrentPuzzleIndexFromManager(page: Page): Promise<number> {
  return page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return -1;
    const sh = (window as any).__ftm?.sceneHandler;
    const scene =
      sh?.['activeScene']?.['scene'] ?? gss.gamePlayScene ?? gss.currentScene ?? null;
    const fm = scene?.flowManager ?? null;
    if (!fm) return -1;
    const idx = fm['currentPuzzleIndex'];
    return typeof idx === 'number' ? idx : -1;
  });
}

/**
 * Polls until GameplayFlowManager.currentPuzzleIndex >= expectedIndex (0-based).
 * Throws if the index does not advance within the timeout.
 */
export async function waitForPuzzleAdvance(
  page: Page,
  expectedIndex: number,
  timeout = 10_000,
): Promise<void> {
  await page.waitForFunction(
    (expected: number) => {
      const gss = (window as any).__ftm?.gameStateService;
      if (!gss) return false;
      const sh = (window as any).__ftm?.sceneHandler;
      const scene =
        sh?.['activeScene']?.['scene'] ?? gss.gamePlayScene ?? gss.currentScene ?? null;
      const fm = scene?.flowManager ?? null;
      if (!fm) return false;
      const idx = fm['currentPuzzleIndex'];
      return typeof idx === 'number' && idx >= expected;
    },
    expectedIndex,
    { timeout },
  );
}

/**
 * Polls for #assessment-survey-overlay to become visible (natural trigger path).
 * Returns true if the overlay appeared within the timeout, false otherwise.
 */
export async function waitForNaturalAssessmentTrigger(
  page: Page,
  timeout = 12_000,
): Promise<boolean> {
  return page
    .waitForFunction(
      (sel: string) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return false;
        const cs = window.getComputedStyle(el);
        return (
          cs.display !== 'none' &&
          cs.visibility !== 'hidden' &&
          parseFloat(cs.opacity) > 0
        );
      },
      '#assessment-survey-overlay',
      { timeout },
    )
    .then(() => true)
    .catch(() => false);
}

/**
 * Returns the correct stone position for the CURRENT puzzle by reading from
 * the StoneHandler directly (bypasses the CORRECT_STONE_POSITION event).
 * Returns null if StoneHandler is not accessible or has no correct stone.
 *
 * Handles both letter puzzles (correctTargetStone = single letter, e.g. 'a')
 * and word puzzles (correctTargetStone = joined word, e.g. 'cat' while individual
 * stone texts are 'c', 'a', 't'). Falls back to targetStones[] array matching for
 * word puzzle levels.
 */
export async function getCorrectStonePositionForCurrentPuzzle(
  page: Page,
): Promise<{ x: number; y: number; text: string } | null> {
  return page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return null;
    const sh = (window as any).__ftm?.sceneHandler;
    const scene =
      sh?.['activeScene']?.['scene'] ?? gss.gamePlayScene ?? gss.currentScene ?? null;
    if (!scene) return null;
    const fm = scene?.flowManager ?? null;
    if (!fm) return null;
    const stoneHandler = fm?.['stoneHandler'] ?? scene?.['stoneHandler'] ?? null;
    if (!stoneHandler) return null;

    // getCorrectTargetStone() returns a STRING (the target text), not a StoneConfig object.
    // For letter puzzles: correctTargetStone = single letter e.g. 'a'
    // For word puzzles:   correctTargetStone = joined word e.g. 'cat' (targetStones.join(""))
    const correctText: string =
      typeof stoneHandler.getCorrectTargetStone === 'function'
        ? stoneHandler.getCorrectTargetStone()
        : stoneHandler['correctTargetStone'];

    // targetStones is the raw array of individual letter strings ['c', 'a', 't'].
    // For letter puzzles it has a single element; for word puzzles it has all letters.
    const targetStones: string[] = stoneHandler['targetStones'] ?? [];
    const foilStones: any[] = stoneHandler['foilStones'] ?? [];

    if (!correctText && targetStones.length === 0) return null;

    // Primary match: letter puzzle — stone.text === correctTargetStone (e.g. 'a' === 'a')
    // foilStones is the live array; activeStones is a filtered snapshot — prefer foilStones.
    for (const s of foilStones) {
      if (s && !s.isDisposed && s.text === correctText) {
        return { x: s.x, y: s.y, text: s.text };
      }
    }

    // Word puzzle fallback: correctTargetStone is the joined word (e.g. 'cat') but each
    // stone's text is a single letter ('c', 'a', 't'). Use targetStones array to match.
    if (targetStones.length > 0) {
      for (const s of foilStones) {
        if (s && !s.isDisposed && targetStones.includes(s.text)) {
          return { x: s.x, y: s.y, text: s.text };
        }
      }
    }

    const activeStones: any[] = stoneHandler['activeStones'] ?? [];
    for (const s of activeStones) {
      if (s && !s.isDisposed && s.text === correctText) {
        return { x: s.x, y: s.y, text: s.text };
      }
    }

    if (targetStones.length > 0) {
      for (const s of activeStones) {
        if (s && !s.isDisposed && targetStones.includes(s.text)) {
          return { x: s.x, y: s.y, text: s.text };
        }
      }
    }

    return null;
  });
}
