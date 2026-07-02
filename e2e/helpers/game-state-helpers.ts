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
 * After clicking stones in the treasure-chest mini-game, the OpenedChest state
 * still runs its full 12-second timer before transitioning to FadeOut.
 * This helper jumps stateTimer to 12 000 ms so the very next game frame
 * transitions to FadeOut (~400 ms), ending the mini-game in ~1 s instead of
 * waiting up to 12 s.
 *
 * TreasureChestState enum values (from treasureChestAnimation.ts):
 *   FlyIn=0, FadeIn=1, ClosedChest=2, OpenedChest=3, FadeOut=4
 */
export async function speedUpMiniGame(page: Page): Promise<void> {
  await page.evaluate(() => {
    const scene =
      (window as any).__ftm?.sceneHandler?.['activeScene']?.['scene'];
    const miniGame = scene?.miniGameHandler?.activeMiniGame;
    if (!miniGame) return;
    const animation = miniGame['treasureAnimation'];
    if (!animation) return;
    // Jump only when actually in OpenedChest — avoids stomping FadeOut if already there.
    if (animation['state'] === 3 /* OpenedChest */) {
      animation['stateTimer'] = 12_000;
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
 * Reduces the pending assessment-delay timer from ~5500 ms to targetMs so the
 * assessment overlay appears within 1–2 s instead of the full game-side delay.
 *
 * Works by reaching the custom Scheduler singleton (exposed on window.__ftm.scheduler
 * in non-production builds) and setting the remaining time of any large one-shot
 * timer to targetMs.  The natural callback path is preserved — the exact same
 * startAssessmentFlow closure that was scheduled fires; we only shorten the wait.
 *
 * Call this immediately after waitForPositiveFeedback() in TC_011.
 */
export async function speedUpAssessmentTimer(page: Page, targetMs = 100): Promise<void> {
  await page.evaluate((targetMs: number) => {
    const scheduler = (window as any).__ftm?.scheduler;
    if (!scheduler) return;
    const timers: Map<any, any> = scheduler['timers'];
    if (!timers) return;
    for (const timer of timers.values()) {
      // Target only one-shot timers with a long remaining delay (the assessment timer).
      if (!timer.loop && timer.remaining > 1000) {
        timer.remaining = targetMs;
      }
    }
  }, targetMs);
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

// ─── Assessment survey interaction helpers ────────────────────────────────────

/**
 * Returns info about the CORRECT answer for the current assessment question.
 * Returns null if the question or player is not accessible.
 */
export async function getCorrectAssessmentAnswer(
  page: Page,
): Promise<{ correctBtnId: string; correctAnswerName: string; correctBtnIndex: number } | null> {
  return page.evaluate((playerSel: string) => {
    const player = document.querySelector(playerSel) as any;
    if (!player?.appInstance) return null;
    const q = player.appInstance.game?.currentQuestion;
    if (!q || !Array.isArray(q.answers) || !q.correct) return null;
    const correctName: string = q.correct;
    const idx = (q.answers as any[]).findIndex(a => a.answerName === correctName);
    if (idx < 0) return null;
    return { correctBtnId: `#answerButton${idx + 1}`, correctAnswerName: correctName, correctBtnIndex: idx + 1 };
  }, Selectors.assessmentPlayer);
}

/**
 * Returns info about a WRONG answer for the current assessment question.
 * Returns null if there are no wrong answer options.
 */
export async function getWrongAssessmentAnswer(
  page: Page,
): Promise<{ wrongBtnId: string; wrongAnswerName: string } | null> {
  return page.evaluate((playerSel: string) => {
    const player = document.querySelector(playerSel) as any;
    if (!player?.appInstance) return null;
    const q = player.appInstance.game?.currentQuestion;
    if (!q || !Array.isArray(q.answers) || !q.correct) return null;
    const correctName: string = q.correct;
    const wrongIdx = (q.answers as any[]).findIndex(a => a.answerName !== correctName);
    if (wrongIdx < 0) return null;
    const answers = q.answers as any[];
    return { wrongBtnId: `#answerButton${wrongIdx + 1}`, wrongAnswerName: answers[wrongIdx].answerName };
  }, Selectors.assessmentPlayer);
}

/**
 * Waits for assessment answer buttons (ladybug images) to finish their entry
 * animation and become interactive.
 */
export async function waitForAssessmentAnswerButtons(
  page: Page,
  timeout: number = Timeouts.sceneTransition,
): Promise<void> {
  await page.waitForFunction(
    (playerSel: string) => {
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
        const anims = (el as Element).getAnimations?.() ?? [];
        return anims.length === 0 && parseFloat(cs.opacity) > 0;
      });
    },
    Selectors.assessmentPlayer,
    { timeout },
  );
}

/**
 * Drags an assessment answer button to the chest image.
 * Returns true if the drag succeeded; false if elements were not found.
 */
export async function dragAssessmentAnswerToChest(
  page: Page,
  btnSelector: string,
): Promise<boolean> {
  const chest = page.locator(`${Selectors.assessmentPlayer} #chestImage`);
  const btn = page.locator(`${Selectors.assessmentPlayer} ${btnSelector}`);
  const chestBB = await chest.boundingBox();
  const btnBB = await btn.boundingBox();
  if (!chestBB || !btnBB) return false;
  await page.mouse.move(btnBB.x + btnBB.width / 2, btnBB.y + btnBB.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    chestBB.x + chestBB.width / 2,
    chestBB.y + chestBB.height / 2,
    { steps: 20 },
  );
  await page.mouse.up();
  return true;
}

/**
 * Waits for the assessment feedback overlay (#feedbackWrap.visible) to appear.
 * Returns true on success, false on timeout.
 */
export async function waitForAssessmentFeedback(
  page: Page,
  timeout: number = 5_000,
): Promise<boolean> {
  return page
    .waitForFunction(
      (pSel: string) => {
        const el = document.querySelector(`${pSel} #feedbackWrap`) as HTMLElement | null;
        return el?.classList.contains('visible') ?? false;
      },
      Selectors.assessmentPlayer,
      { timeout },
    )
    .then(() => true)
    .catch(() => false);
}

/**
 * Waits for the assessment feedback overlay to hide (feedback animation complete).
 * Returns true when hidden, false on timeout.
 */
export async function waitForAssessmentFeedbackToHide(
  page: Page,
  timeout: number = 5_000,
): Promise<boolean> {
  return page
    .waitForFunction(
      (pSel: string) => {
        const el = document.querySelector(`${pSel} #feedbackWrap`) as HTMLElement | null;
        return !el?.classList.contains('visible');
      },
      Selectors.assessmentPlayer,
      { timeout },
    )
    .then(() => true)
    .catch(() => false);
}

/**
 * Returns true if the assessment player currently has a question to display.
 */
export async function hasAssessmentCurrentQuestion(page: Page): Promise<boolean> {
  return page.evaluate((playerSel: string) => {
    const player = document.querySelector(playerSel) as any;
    if (!player?.appInstance) return false;
    return player.appInstance.game?.currentQuestion != null;
  }, Selectors.assessmentPlayer);
}

/**
 * Returns the total number of questions in the current assessment survey.
 * Returns 0 if the player or game is not accessible.
 */
export async function getAssessmentTotalQuestions(page: Page): Promise<number> {
  return page.evaluate((playerSel: string) => {
    const player = document.querySelector(playerSel) as any;
    if (!player?.appInstance) return 0;
    const questions = player.appInstance.game?.questions;
    return Array.isArray(questions) ? questions.length : 0;
  }, Selectors.assessmentPlayer);
}

/**
 * Subscribes to the assessment player's onComplete event and stores the result
 * in window.__ftmTest.assessmentCompleted. Must be called BEFORE questions are answered.
 * AssessmentSurveyPlayerElement.ONCOMPLETE = 'completed' (not 'oncomplete').
 */
export async function subscribeToAssessmentCompletion(page: Page): Promise<void> {
  await page.evaluate((playerSel: string) => {
    (window as any).__ftmTest = (window as any).__ftmTest ?? {};
    (window as any).__ftmTest.assessmentCompleted = false;
    const player = document.querySelector(playerSel) as any;
    if (!player?.subscribe) return;
    player.subscribe('completed', () => {
      (window as any).__ftmTest.assessmentCompleted = true;
    });
  }, Selectors.assessmentPlayer);
}

/**
 * Returns true if the assessment has completed — either the player 'completed'
 * event fired OR the AssessmentFlowCoordinator reports completion.
 */
export async function wasAssessmentCompleted(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    if ((window as any).__ftmTest?.assessmentCompleted === true) return true;
    const sh = (window as any).__ftm?.sceneHandler;
    const scene = sh?.['activeScene']?.['scene'] ?? null;
    const fm = scene?.flowManager ?? null;
    const coordinator = fm?.['assessmentFlowCoordinator'];
    return coordinator?.isAssessmentCompletedThisRun?.() === true;
  });
}

/**
 * Returns true if the AssessmentFlowCoordinator has marked the assessment as
 * completed in the current run (set by handleAssessmentCompleted() when the
 * player fires its 'completed' event through the game's onComplete callback).
 */
export async function isAssessmentCompletedByCoordinator(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const sh = (window as any).__ftm?.sceneHandler;
    const scene = sh?.['activeScene']?.['scene'] ?? null;
    const fm = scene?.flowManager ?? null;
    const coordinator = fm?.['assessmentFlowCoordinator'];
    return coordinator?.isAssessmentCompletedThisRun?.() === true;
  });
}

/**
 * Checks if the assessment overlay is currently visible on screen.
 */
export async function isAssessmentOverlayVisible(page: Page): Promise<boolean> {
  return page.evaluate((sel: string) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return false;
    const cs = window.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0;
  }, Selectors.assessmentOverlay);
}

/**
 * Completes the entire assessment survey by cycling through ALL questions and
 * answering each one CORRECTLY.
 *
 * Stops when: coordinator marks complete, no more questions, overlay dismissed,
 * or maxQuestions safety guard hit. Returns the count of questions answered.
 */
export async function completeAssessmentSurvey(
  page: Page,
  maxQuestions: number = 20,
): Promise<number> {
  let answered = 0;

  for (let i = 0; i < maxQuestions; i++) {
    // Stop if coordinator already flagged completion (most reliable signal)
    const alreadyDone = await isAssessmentCompletedByCoordinator(page);
    if (alreadyDone) break;

    // Stop if the overlay has already dismissed (e.g. after last question auto-closed)
    const overlayGone = !(await isAssessmentOverlayVisible(page));
    if (overlayGone) break;

    // Stop if the player reports no current question
    const hasQ = await hasAssessmentCurrentQuestion(page);
    if (!hasQ) break;

    // Wait for #nextqButton to become visible (audio prompt ready for this question)
    const nextqSelector = `${Selectors.assessmentPlayer} #nextqButton`;
    const nextqAppeared = await page
      .waitForSelector(nextqSelector, { state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false);
    if (!nextqAppeared) break;

    // Small pause before click to allow audio cue to initialize
    await page.waitForTimeout(300);
    await page.locator(nextqSelector).click({ force: true });

    // Wait for ladybug answer images to finish their entry animation
    await waitForAssessmentAnswerButtons(page, Timeouts.sceneTransition);

    // Read correct answer from live game state
    const answerInfo = await getCorrectAssessmentAnswer(page);
    if (!answerInfo) break;

    // Drag the correct ladybug to the chest
    const dragged = await dragAssessmentAnswerToChest(page, answerInfo.correctBtnId);
    if (!dragged) break;

    // Wait for positive feedback overlay to appear
    await waitForAssessmentFeedback(page, 5_000);

    answered++;

    // Wait for feedback animation to hide
    await waitForAssessmentFeedbackToHide(page, 5_000);

    // Short pause for UI transition between questions, then re-check coordinator
    await page.waitForTimeout(300);

    // Exit immediately if coordinator signals completion after this answer
    const completedNow = await isAssessmentCompletedByCoordinator(page);
    if (completedNow) break;
  }

  return answered;
}

/**
 * Answers one assessment question INCORRECTLY (for negative-flow testing), then
 * answers it CORRECTLY on the retry.
 */
export async function answerAssessmentQuestionWithWrongThenCorrect(
  page: Page,
): Promise<{ wrongAnswerName: string; correctAnswerName: string } | null> {
  const nextqSelector = `${Selectors.assessmentPlayer} #nextqButton`;
  const nextqAppeared = await page
    .waitForSelector(nextqSelector, { state: 'visible', timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  if (!nextqAppeared) return null;

  await page.waitForTimeout(300);
  await page.locator(nextqSelector).click({ force: true });

  await waitForAssessmentAnswerButtons(page, Timeouts.sceneTransition);

  const wrongInfo = await getWrongAssessmentAnswer(page);
  const correctInfo = await getCorrectAssessmentAnswer(page);
  if (!wrongInfo || !correctInfo) return null;

  await dragAssessmentAnswerToChest(page, wrongInfo.wrongBtnId);
  await waitForAssessmentFeedback(page, 5_000);
  await waitForAssessmentFeedbackToHide(page, 5_000);

  await page.waitForTimeout(500);
  const retryBtnsVisible = await page
    .waitForFunction(
      (playerSel: string) => {
        const player = document.querySelector(playerSel);
        if (!player) return false;
        const btns = Array.from(player.querySelectorAll('.answerButton'));
        return btns.some((b) => {
          const el = b as HTMLElement;
          const cs = window.getComputedStyle(el);
          return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getBoundingClientRect().width > 0;
        });
      },
      Selectors.assessmentPlayer,
      { timeout: 5_000 },
    )
    .then(() => true)
    .catch(() => false);

  if (retryBtnsVisible) {
    await dragAssessmentAnswerToChest(page, correctInfo.correctBtnId);
    await waitForAssessmentFeedback(page, 5_000);
    await waitForAssessmentFeedbackToHide(page, 5_000);
  }

  return { wrongAnswerName: wrongInfo.wrongAnswerName, correctAnswerName: correctInfo.correctAnswerName };
}
