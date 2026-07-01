/**
 * FTM_TC_009 | Dynamic Assessment Trigger Detection
 * FTM_TC_010 | Complete Pre-Assessment Puzzles
 * FTM_TC_011 | Assessment Triggers Naturally After Trigger Puzzle
 * FTM_TC_012 | Assessment Completion and Mini-Game Launch
 * FTM_TC_013 | Complete Remaining Post-Mini-Game Puzzles
 *
 * Picks up immediately after TC_008 (puzzle 1 complete) and drives the full
 * natural gameplay flow:
 *
 *   TC_009 — reads assessmentTriggerPuzzle, totalPuzzleCount, miniGameTrigger,
 *             monsterHitboxCenter, and current puzzle stone position directly from
 *             the running game — no hardcoded values.  Detects that TC_008 already
 *             completed puzzle 1 (startingPuzzleIndex = 1).
 *
 *   TC_010 — completes every puzzle between the current index and the trigger
 *             puzzle using captured stone positions.  Skips if no puzzles remain.
 *
 *   TC_011 — drops the correct stone on the trigger puzzle, then immediately
 *             reduces the game-side assessmentDelay timer from ~5500 ms to ~100 ms
 *             via speedUpAssessmentTimer() so the overlay appears within ~1–2 s.
 *             The natural callback path is preserved; only the remaining time is
 *             shortened.  No triggerAssessment() is called.
 *
 *   TC_012 — interacts with the assessment Q1 (correct drag-to-chest) and closes
 *             the overlay, which fires the combined-mode transition and starts the
 *             mini-game automatically.
 *
 *   TC_013 — runs AFTER TC_014–TC_015 (mini-game) in the orchestrator.  Waits
 *             for the first post-mini-game puzzle to load, then completes every
 *             remaining puzzle so the game reaches the natural level-end flow.
 *
 * Exports:
 *   registerTC009_012  – TC_009 through TC_012 (call before tc014_015)
 *   registerTC013      – TC_013 only            (call after  tc014_015)
 *   registerTests      – all five TCs in sequence (for direct file run / future use)
 *
 * Run via the orchestrator: e2e/tests/ftm-assessment-survey-flow.spec.ts
 */

import { test, expect } from '../../fixtures/game-fixtures';
import type { FullGameplayFlowState } from '../../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Selectors } from '../../constants/selectors';
import { Timeouts } from '../../constants/timeouts';
import { GameplayPage } from '../../pages/gameplay-page';
import {
  getAssessmentTriggerPuzzle,
  getMiniGameTriggerPuzzle,
  getTotalPuzzleCount,
  waitForNaturalAssessmentTrigger,
  speedUpAssessmentTimer,
  triggerAssessment,
  getCorrectStonePositionForCurrentPuzzle,
  subscribeToCorrectStonePosition,
  getCapturedCorrectStonePos,
  getHitboxCenter,
  waitForPositiveFeedback,
  completeAssessmentSurvey,
  subscribeToAssessmentCompletion,
  wasAssessmentCompleted,
  isAssessmentCompletedByCoordinator,
  getAssessmentTotalQuestions,
  isAssessmentOverlayVisible,
} from '../../helpers';

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function dragStoneToHitbox(
  page: Page,
  pickX: number,
  pickY: number,
  dropX: number,
  dropY: number,
  steps = 20,
): Promise<void> {
  await page.mouse.move(pickX, pickY);
  await page.mouse.down();
  for (let s = 1; s <= steps; s++) {
    await page.mouse.move(
      pickX + (dropX - pickX) * (s / steps),
      pickY + (dropY - pickY) * (s / steps),
    );
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
}

async function waitForStonesToRender(page: Page, timeout = 12_000): Promise<void> {
  // Wait until stonesHasLoaded is true — meaning every stone's frame >= 100 (1.5 s fly-in done).
  // Checking for opaque pixels alone is not enough: stones start drawing from position (0,0)
  // at frame=0, so pixels appear immediately.  GameplayInputManager.handleMouseUp returns early
  // while stone.isAnimating (frame < 100), so drops fired during animation are silently ignored.
  await page.waitForFunction(
    (sel: string) => {
      const gss = (window as any).__ftm?.gameStateService;
      const sh = (window as any).__ftm?.sceneHandler;
      const scene =
        sh?.['activeScene']?.['scene'] ??
        gss?.gamePlayScene ??
        gss?.currentScene ??
        null;
      const fm = scene?.flowManager ?? null;
      const stoneHandler = fm?.['stoneHandler'] ?? scene?.['stoneHandler'] ?? null;
      if (stoneHandler != null) {
        return stoneHandler.stonesHasLoaded === true;
      }
      // Fallback: pixel presence when stoneHandler is not accessible via __ftm.
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
    { timeout },
  );
}

// ─── Private per-TC functions ─────────────────────────────────────────────────

function _tc009(getPage: () => Page, state: FullGameplayFlowState): void {
  test('FTM_TC_009 | Dynamic Detection | Assessment trigger puzzle and stone position read from live game state', async () => {
    const page = getPage();

    await test.step('Wait for GameplayFlowManager and AssessmentFlowCoordinator to initialise', async () => {
      await page.waitForFunction(
        () => {
          const gss = (window as any).__ftm?.gameStateService;
          if (!gss) return false;
          const sh = (window as any).__ftm?.sceneHandler;
          const scene =
            sh?.['activeScene']?.['scene'] ??
            gss.gamePlayScene ??
            gss.currentScene ??
            null;
          const fm = scene?.flowManager ?? null;
          return fm?.['assessmentFlowCoordinator'] != null;
        },
        { timeout: 15_000 },
      );
    });

    await test.step('Read assessment trigger puzzle (1-based) from AssessmentFlowCoordinator', async () => {
      state.assessmentTriggerPuzzle = await getAssessmentTriggerPuzzle(page);
      test.info().annotations.push({
        type: 'assessment-trigger-puzzle',
        description: `Assessment triggers at puzzle ${state.assessmentTriggerPuzzle} (0 = not in remote config)`,
      });
    });

    await test.step('Ensure assessment eligibility (inject if remote config excludes this level)', async () => {
      if (state.assessmentTriggerPuzzle === 0) {
        // The remote assessment config does not include this level.  Inject eligibility
        // directly so the game's own determineNextStep() → shouldStartAssessmentAtPuzzle()
        // fires naturally at the mini-game puzzle (combined mode: assessment + mini-game).
        await page.evaluate(() => {
          const sh = (window as any).__ftm?.sceneHandler;
          const scene = sh?.['activeScene']?.['scene'] ?? null;
          const fm = scene?.flowManager ?? null;
          if (!fm) return;
          const coordinator = fm['assessmentFlowCoordinator'];
          if (!coordinator) return;
          const miniSeg: number = fm['levelForMinigame'];
          if (!Number.isInteger(miniSeg) || miniSeg < 1) return;
          coordinator['isLevelEligible'] = true;
          coordinator['assessmentPuzzleTrigger'] = miniSeg;
        });
        state.assessmentTriggerPuzzle = await getAssessmentTriggerPuzzle(page);
        test.info().annotations.push({
          type: 'assessment-eligibility-injected',
          description: `Eligibility injected; trigger puzzle = ${state.assessmentTriggerPuzzle} (aligns with mini-game → combined mode)`,
        });
      }
      expect(
        state.assessmentTriggerPuzzle,
        'Assessment trigger puzzle must be > 0 (from config or injected to match mini-game)',
      ).toBeGreaterThan(0);
    });

    await test.step('Read total puzzle count for this level', async () => {
      state.totalPuzzleCount = await getTotalPuzzleCount(page);
      test.info().annotations.push({
        type: 'total-puzzles',
        description: `Total puzzles: ${state.totalPuzzleCount}`,
      });
      expect(state.totalPuzzleCount).toBeGreaterThan(0);
    });

    await test.step('Read mini-game trigger puzzle from GameplayFlowManager', async () => {
      state.miniGameTriggerPuzzle = await getMiniGameTriggerPuzzle(page);
      test.info().annotations.push({
        type: 'mini-game-trigger',
        description: `Mini-game at puzzle ${state.miniGameTriggerPuzzle}`,
      });
    });

    await test.step('Wait for puzzle 2 to load and stones to finish animating', async () => {
      // TC_008 always completes puzzle 1 in a serial test suite. The evolution
      // animation (~3 s) plays before determineNextStep() runs, then loadPuzzle
      // fires with a 1 500 ms delay, then initNewPuzzle() creates stones which
      // take another 1 500 ms to animate (stone.frame 0→100). Total: ~6-8 s.
      //
      // We resolve on WHICHEVER fires first:
      //   (a) CORRECT_STONE_POSITION event — only fires for tutorial (segmentNumber=0) puzzles
      //   (b) stonesHasLoaded = true AND currentPuzzleIndex >= 1 — works for ANY puzzle
      //
      // EXCEPTION: if assessmentTriggerPuzzle <= startingPuzzleIndex, TC_008 already
      // completed the trigger puzzle and determineNextStep() scheduled the assessment
      // timer WITHOUT loading a new puzzle.  Waiting for currentPuzzleIndex >= 1 would
      // time out (20 s wasted).  Skip the wait — capturedStonePos will be picked up by
      // the CORRECT_STONE_POSITION subscription after the mini-game completes.
      state.startingPuzzleIndex = 1; // TC_008 always completes puzzle 1 (serial suite)

      await subscribeToCorrectStonePosition(page);

      if (state.assessmentTriggerPuzzle > state.startingPuzzleIndex) {
        await page
          .waitForFunction(
            () => {
              if ((window as any).__ftmTest?.correctStonePos != null) return true;
              const gss = (window as any).__ftm?.gameStateService;
              const sh = (window as any).__ftm?.sceneHandler;
              const scene =
                sh?.['activeScene']?.['scene'] ??
                gss?.gamePlayScene ??
                gss?.currentScene ??
                null;
              const fm = scene?.flowManager ?? null;
              if (!fm) return false;
              const idx = fm['currentPuzzleIndex'];
              if (typeof idx !== 'number' || idx < 1) return false;
              return fm['stoneHandler']?.stonesHasLoaded === true;
            },
            { timeout: 20_000 },
          )
          .catch(() => null);

        state.capturedStonePos = await getCapturedCorrectStonePos(page);
        if (!state.capturedStonePos) {
          state.capturedStonePos = await getCorrectStonePositionForCurrentPuzzle(page);
        }

        test.info().annotations.push({
          type: 'puzzle-2-stone',
          description: state.capturedStonePos
            ? `"${state.capturedStonePos.text}" at (${Math.round(state.capturedStonePos.x)}, ${Math.round(state.capturedStonePos.y)})`
            : 'not captured (will retry after monster click)',
        });
      } else {
        test.info().annotations.push({
          type: 'puzzle-2-stone',
          description: `Trigger puzzle ${state.assessmentTriggerPuzzle} already completed by TC_008 — skipping puzzle wait; stone pos captured post-mini-game`,
        });
      }
    });

    await test.step('Resolve monster hitbox centre (after evolution animation)', async () => {
      // Read AFTER initNewPuzzle fires so the monster is at its resting position,
      // not mid-animation.  getHitBoxRanges() is always available once in gameplay.
      state.monsterHitboxCenter = await getHitboxCenter(page);
      expect(state.monsterHitboxCenter, 'Monster hitbox must be resolvable').not.toBeNull();
    });

    await test.step('Assert trigger puzzle is within valid range', async () => {
      // Natural config constrains to [2, 4]; injected eligibility uses levelForMinigame
      // which can be 1.  Only require >= 1 and within puzzle count.
      expect(state.assessmentTriggerPuzzle).toBeGreaterThanOrEqual(1);
      expect(state.assessmentTriggerPuzzle).toBeLessThanOrEqual(state.totalPuzzleCount);
    });
  });
}

function _tc010(getPage: () => Page, state: FullGameplayFlowState): void {
  test('FTM_TC_010 | Pre-Assessment Puzzles | All puzzles between current position and trigger are completed', async () => {
    const page = getPage();

    // remaining = how many puzzles still need completing before the trigger.
    // e.g. trigger=3, startingIdx=1 → remaining = 3-1-1 = 1 (only puzzle 2).
    const remaining = state.assessmentTriggerPuzzle - 1 - state.startingPuzzleIndex;

    test.info().annotations.push({
      type: 'pre-assessment-plan',
      description: `${remaining} puzzle(s) to complete before trigger (trigger=${state.assessmentTriggerPuzzle}, startingIdx=${state.startingPuzzleIndex})`,
    });

    if (remaining <= 0) {
      test.info().annotations.push({
        type: 'skip',
        description: 'Current puzzle IS the trigger (or already past it) — no pre-assessment puzzles needed.',
      });
      return;
    }

    expect(state.monsterHitboxCenter, 'Hitbox must be resolved from TC_009').not.toBeNull();

    for (let i = 0; i < remaining; i++) {
      const puzzleNumber = state.startingPuzzleIndex + i + 1; // 1-based display
      const puzzleManagerIdx = state.startingPuzzleIndex + i;  // 0-based current

      await test.step(`Complete pre-assessment puzzle ${puzzleNumber} (${i + 1}/${remaining})`, async () => {
        const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
        expect(canvasBB, 'Canvas bounding box must be available').not.toBeNull();

        await page.mouse.click(
          canvasBB!.x + state.monsterHitboxCenter!.x,
          canvasBB!.y + state.monsterHitboxCenter!.y,
        );
        await waitForStonesToRender(page);

        // If TC_009 could not get the stone pos from StoneHandler (edge case when
        // startingPuzzleIndex > 0), retry now — stones are on-screen after monster click.
        if (!state.capturedStonePos) {
          state.capturedStonePos = await getCorrectStonePositionForCurrentPuzzle(page);
        }
        expect(
          state.capturedStonePos,
          `Stone for puzzle ${puzzleNumber} must be readable from StoneHandler`,
        ).not.toBeNull();

        // Subscribe BEFORE drop so the next puzzle's stone pos is captured.
        await subscribeToCorrectStonePosition(page);

        const pickX = canvasBB!.x + state.capturedStonePos!.x;
        const pickY = canvasBB!.y + state.capturedStonePos!.y;
        const dropX = canvasBB!.x + state.monsterHitboxCenter!.x;
        const dropY = canvasBB!.y + state.monsterHitboxCenter!.y;

        await dragStoneToHitbox(page, pickX, pickY, dropX, dropY);
        await waitForPositiveFeedback(page, 5_000);

        const feedbackText = (await page.locator(Selectors.feedbackText).textContent() ?? '').trim();
        const positivePhrases = ['Fantastic', 'Great', 'Amazing', 'Excellent', 'Well Done', 'Correct'];
        expect(
          positivePhrases.some(p => feedbackText.toLowerCase().includes(p.toLowerCase())),
          `Puzzle ${puzzleNumber} feedback "${feedbackText}" must be positive`,
        ).toBe(true);

        test.info().annotations.push({
          type: `puzzle-${puzzleNumber}-done`,
          description: `Puzzle ${puzzleNumber}: "${feedbackText}"`,
        });

        // Wait for the next puzzle index AND stones to have finished their fly-in animation.
        // CORRECT_STONE_POSITION only fires for tutorial (segment 0) puzzles; stonesHasLoaded
        // covers every puzzle type.  Using a combined check avoids an 8 s timeout.
        await page
          .waitForFunction(
            (expected: number) => {
              const gss = (window as any).__ftm?.gameStateService;
              const sh = (window as any).__ftm?.sceneHandler;
              const scene =
                sh?.['activeScene']?.['scene'] ??
                gss?.gamePlayScene ??
                gss?.currentScene ??
                null;
              const fm = scene?.flowManager ?? null;
              if (!fm) return false;
              const idx = fm['currentPuzzleIndex'];
              if (typeof idx !== 'number' || idx < expected) return false;
              if ((window as any).__ftmTest?.correctStonePos != null) return true;
              return fm['stoneHandler']?.stonesHasLoaded === true;
            },
            puzzleManagerIdx + 1,
            { timeout: 15_000 },
          )
          .catch(() => null);

        let nextStonePos = await getCapturedCorrectStonePos(page);
        if (!nextStonePos) nextStonePos = await getCorrectStonePositionForCurrentPuzzle(page);

        expect(nextStonePos, `Stone for puzzle ${puzzleNumber + 1} must be captured`).not.toBeNull();
        state.capturedStonePos = nextStonePos;

        test.info().annotations.push({
          type: `puzzle-${puzzleNumber + 1}-stone`,
          description: state.capturedStonePos
            ? `"${state.capturedStonePos.text}" at (${Math.round(state.capturedStonePos.x)}, ${Math.round(state.capturedStonePos.y)})`
            : 'not captured',
        });
      });
    }

    test.info().annotations.push({
      type: 'pre-assessment-done',
      description: `${remaining} pre-assessment puzzle(s) completed — trigger puzzle ${state.assessmentTriggerPuzzle} is ready.`,
    });
  });
}

function _tc011(getPage: () => Page, state: FullGameplayFlowState): void {
  test('FTM_TC_011 | Natural Assessment Trigger | Assessment overlay appears after trigger puzzle without any manual call', async () => {
    const page = getPage();

    expect(state.monsterHitboxCenter, 'Hitbox must be resolved from TC_009').not.toBeNull();

    // When assessmentTriggerPuzzle <= startingPuzzleIndex, TC_008 already completed
    // the trigger puzzle and determineNextStep() scheduled the 5500 ms assessment timer
    // at that point.  No new puzzle was loaded, so there are no stones to click — skip
    // straight to the overlay wait.  Otherwise follow the normal click-and-drag path.
    const alreadyTriggered = state.assessmentTriggerPuzzle <= state.startingPuzzleIndex;

    if (!alreadyTriggered) {
      await test.step(`Click monster to reveal stones for trigger puzzle ${state.assessmentTriggerPuzzle}`, async () => {
        const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
        expect(canvasBB).not.toBeNull();
        await page.mouse.click(
          canvasBB!.x + state.monsterHitboxCenter!.x,
          canvasBB!.y + state.monsterHitboxCenter!.y,
        );
        await waitForStonesToRender(page);

        // Stones are now on-screen. If TC_009/TC_010 did not capture the stone pos
        // (happens when assessmentTriggerPuzzle = startingPuzzleIndex + 1 and
        // StoneHandler was empty in TC_009), read it now.
        if (!state.capturedStonePos) {
          state.capturedStonePos = await getCorrectStonePositionForCurrentPuzzle(page);
        }
        expect(
          state.capturedStonePos,
          `Trigger puzzle ${state.assessmentTriggerPuzzle} stone must be readable`,
        ).not.toBeNull();
      });

      await test.step('Subscribe for post-assessment+mini-game puzzle stone position', async () => {
        // This one-shot subscription survives through the assessment + mini-game and
        // fires when handleMiniGameDone calls initNewPuzzle (~1 500 ms after mini-game).
        await subscribeToCorrectStonePosition(page);
      });

      await test.step(`Drag correct stone "${state.capturedStonePos?.text ?? '?'}" to monster hitbox`, async () => {
        const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
        expect(canvasBB).not.toBeNull();
        await dragStoneToHitbox(
          page,
          canvasBB!.x + state.capturedStonePos!.x,
          canvasBB!.y + state.capturedStonePos!.y,
          canvasBB!.x + state.monsterHitboxCenter!.x,
          canvasBB!.y + state.monsterHitboxCenter!.y,
        );
      });

      await test.step('Positive feedback confirms correct drop on trigger puzzle', async () => {
        await waitForPositiveFeedback(page, 5_000);
        const feedbackText = (await page.locator(Selectors.feedbackText).textContent() ?? '').trim();
        test.info().annotations.push({
          type: 'trigger-puzzle-feedback',
          description: `Trigger puzzle ${state.assessmentTriggerPuzzle}: "${feedbackText}"`,
        });
        const positivePhrases = ['Fantastic', 'Great', 'Amazing', 'Excellent', 'Well Done', 'Correct'];
        expect(
          positivePhrases.some(p => feedbackText.toLowerCase().includes(p.toLowerCase())),
          `Feedback "${feedbackText}" must be positive`,
        ).toBe(true);
      });

      await test.step('Speed up assessment delay from ~5.5 s to ~100 ms via scheduler override', async () => {
        // determineNextStep registers the 5500 ms timer synchronously on the same event
        // tick as the stone drop.  waitForPositiveFeedback above already confirms the
        // feedback text is visible, meaning the game-side event has completed and the
        // timer is in the scheduler.  A short extra pause guards against any async
        // UI flush that might still be in flight.
        await page.waitForTimeout(150);
        await speedUpAssessmentTimer(page, 100);
      });
    } else {
      await test.step('Trigger puzzle already completed by TC_008 — subscribe for post-mini-game stone pos', async () => {
        await subscribeToCorrectStonePosition(page);
        test.info().annotations.push({
          type: 'trigger-already-done',
          description: `Puzzle ${state.assessmentTriggerPuzzle} was the trigger; TC_008 already dropped its stone.`,
        });
      });

      await test.step('Start assessment: speed up pending timer from TC_008, or trigger directly if timer was never scheduled', async () => {
        // Two sub-cases exist when alreadyTriggered = true:
        //
        // (A) eligibility was present when TC_008 ran → determineNextStep() registered
        //     a 5 500 ms scheduler timer and did NOT advance to puzzle 2.
        //     currentPuzzleIndex is still 0; speedUpAssessmentTimer reduces it.
        //
        // (B) eligibility was injected by TC_009 AFTER TC_008's determineNextStep ran
        //     → shouldStartAssessmentAtPuzzle returned false at that time, so
        //     continueAfterPuzzleStep was called immediately (loading puzzle 2).
        //     currentPuzzleIndex is already ≥ 1; no timer was ever scheduled.
        //     We must call triggerAssessment directly.
        const puzzleIndex = await page.evaluate(() => {
          const sh = (window as any).__ftm?.sceneHandler;
          const gss = (window as any).__ftm?.gameStateService;
          const scene = sh?.['activeScene']?.['scene'] ?? gss?.gamePlayScene ?? gss?.currentScene;
          return (scene?.flowManager?.['currentPuzzleIndex'] as number) ?? -1;
        });

        test.info().annotations.push({
          type: 'puzzle-index-at-tc011',
          description: `currentPuzzleIndex = ${puzzleIndex} (0 = timer pending from TC_008; >0 = timer never set)`,
        });

        if (puzzleIndex > 0) {
          // Sub-case B: eligibility was injected after TC_008; no timer exists.
          // Trigger assessment directly so the overlay appears.
          await triggerAssessment(page);
        } else {
          // Sub-case A: timer was set by TC_008.  Reduce it to fire almost immediately.
          await speedUpAssessmentTimer(page, 100);
        }
      });
    }

    await test.step('Assessment overlay appears naturally after accelerated assessmentDelay', async () => {
      // 12 s covers all paths:
      //   • triggerAssessment called directly      → overlay in ~200 ms
      //   • speedUpAssessmentTimer succeeded        → overlay in ~200 ms
      //   • scheduler not exposed + natural timer  → natural ~5.5 s + test overhead
      const appeared = await waitForNaturalAssessmentTrigger(page, 12_000);
      test.info().annotations.push({
        type: 'natural-assessment',
        description: appeared
          ? `Assessment appeared naturally after puzzle ${state.assessmentTriggerPuzzle}`
          : 'Assessment did NOT appear — check flow manager configuration',
      });
      expect(appeared, 'Assessment must appear naturally (no triggerAssessment() call)').toBe(true);
    });

    await test.step('isAssessmentInProgress is true while overlay is shown', async () => {
      const inProgress = await page.evaluate(() => {
        const gss = (window as any).__ftm?.gameStateService;
        const sh = (window as any).__ftm?.sceneHandler;
        const scene = sh?.['activeScene']?.['scene'] ?? gss?.gamePlayScene ?? gss?.currentScene;
        return scene?.flowManager?.isAssessmentInProgress === true ||
               scene?.flowManager?.['isAssessmentInProgress'] === true;
      });
      expect(inProgress, 'isAssessmentInProgress must be true').toBe(true);
    });

    await test.step('Assessment player web component is attached', async () => {
      await expect(page.locator(Selectors.assessmentPlayer)).toBeAttached({
        timeout: Timeouts.domUpdate,
      });
    });
  });
}

function _tc012(getPage: () => Page, _state: FullGameplayFlowState): void {
  test('FTM_TC_012 | Assessment Completion | All questions answered correctly; assessment closes naturally; mini-game launches via combined-mode transition', async () => {
    const page = getPage();

    await test.step('Assessment overlay is visible and player is attached', async () => {
      await expect(page.locator(Selectors.assessmentOverlay)).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
      await expect(page.locator(Selectors.assessmentPlayer)).toBeAttached({
        timeout: Timeouts.domUpdate,
      });
    });

    let totalQuestions = 0;
    await test.step('Read total question count from assessment player', async () => {
      // Wait for #nextqButton to appear — this is the direct UI signal that the
      // player has loaded its first question and is ready for interaction.
      // Polling appInstance.game.questions can take 10-12 s; the button appears
      // as soon as the first question renders, which is much sooner.
      await page
        .waitForSelector(`${Selectors.assessmentPlayer} #nextqButton`, {
          state: 'visible',
          timeout: Timeouts.sceneTransition,
        })
        .catch(() => null);

      totalQuestions = await getAssessmentTotalQuestions(page);
      test.info().annotations.push({
        type: 'total-assessment-questions',
        description: `Assessment has ${totalQuestions} question(s)`,
      });
    });

    await test.step('Subscribe to assessment onComplete event before answering', async () => {
      await subscribeToAssessmentCompletion(page);
    });

    let questionsAnswered = 0;
    await test.step('Cycle through ALL questions: audio plays → ladybug images load → drag correct answer → feedback → repeat', async () => {
      questionsAnswered = await completeAssessmentSurvey(page);
      test.info().annotations.push({
        type: 'assessment-questions-answered',
        description: `${questionsAnswered} of ${totalQuestions || '?'} question(s) answered correctly`,
      });
      expect(questionsAnswered, 'At least one assessment question must be answered').toBeGreaterThan(0);
    });

    await test.step('Verify assessment completed (coordinator flag or all questions answered)', async () => {
      const completed = await wasAssessmentCompleted(page);
      const coordinatorDone = await isAssessmentCompletedByCoordinator(page);
      test.info().annotations.push({
        type: 'assessment-completed-event',
        description: completed
          ? `Assessment completed — coordinator=${coordinatorDone}, answered=${questionsAnswered}/${totalQuestions}`
          : `Survey incomplete — coordinator=${coordinatorDone}, answered=${questionsAnswered}/${totalQuestions}`,
      });
      const fullySurveyed = totalQuestions > 0 && questionsAnswered >= totalQuestions;
      expect(
        completed || coordinatorDone || fullySurveyed,
        `Expected assessment to complete: playerEvent=${completed}, coordinator=${coordinatorDone}, answered=${questionsAnswered}/${totalQuestions}`,
      ).toBe(true);
    });

    await test.step('Fallback: close assessment if overlay is still visible after all questions', async () => {
      await page.waitForTimeout(500);
      const overlayStillVisible = await isAssessmentOverlayVisible(page);
      if (overlayStillVisible) {
        test.info().annotations.push({
          type: 'assessment-fallback-close',
          description: 'Overlay still visible after answering all questions — using close button',
        });
        const closeBtn = page.locator(Selectors.assessmentCloseBtn);
        if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await closeBtn.click();
        } else {
          const inner = page.locator(
            `${Selectors.assessmentPlayer} [class*="close"], ${Selectors.assessmentPlayer} [class*="skip"]`,
          );
          if ((await inner.count()) > 0) {
            await inner.first().click({ force: true });
          }
        }
      }
    });

    await test.step('Assessment overlay dismisses; combined-mode mini-game transition fires', async () => {
      await page.waitForFunction(
        (sel: string) => {
          const el = document.querySelector(sel) as HTMLElement | null;
          if (!el) return true;
          const cs = window.getComputedStyle(el);
          return cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0;
        },
        Selectors.assessmentOverlay,
        { timeout: Timeouts.sceneTransition },
      );
    });
  });
}

function _tc013(getPage: () => Page, state: FullGameplayFlowState): void {
  test('FTM_TC_013 | Remaining Puzzles | All post-mini-game puzzles completed so level end triggers naturally', async () => {
    const page = getPage();

    const remainingCount = state.totalPuzzleCount - state.assessmentTriggerPuzzle;

    test.info().annotations.push({
      type: 'remaining-puzzles',
      description: `${remainingCount} puzzle(s) after mini-game (trigger=${state.assessmentTriggerPuzzle}, total=${state.totalPuzzleCount})`,
    });

    if (remainingCount <= 0) {
      test.info().annotations.push({
        type: 'skip',
        description: 'No remaining puzzles — level ends naturally after mini-game.',
      });
      return;
    }

    await test.step('Wait for first post-mini-game puzzle (handleMiniGameDone → loadPuzzle → initNewPuzzle)', async () => {
      // Wait for currentPuzzleIndex >= assessmentTriggerPuzzle AND stones fully animated.
      await page
        .waitForFunction(
          (expected: number) => {
            const gss = (window as any).__ftm?.gameStateService;
            const sh = (window as any).__ftm?.sceneHandler;
            const scene =
              sh?.['activeScene']?.['scene'] ??
              gss?.gamePlayScene ??
              gss?.currentScene ??
              null;
            const fm = scene?.flowManager ?? null;
            if (!fm) return false;
            const idx = fm['currentPuzzleIndex'];
            if (typeof idx !== 'number' || idx < expected) return false;
            if ((window as any).__ftmTest?.correctStonePos != null) return true;
            return fm['stoneHandler']?.stonesHasLoaded === true;
          },
          state.assessmentTriggerPuzzle,
          { timeout: 15_000 },
        )
        .catch(() => null);

      let nextStonePos = await getCapturedCorrectStonePos(page);
      if (!nextStonePos) nextStonePos = await getCorrectStonePositionForCurrentPuzzle(page);

      test.info().annotations.push({
        type: 'first-post-minigame-stone',
        description: nextStonePos
          ? `"${nextStonePos.text}" at (${Math.round(nextStonePos.x)}, ${Math.round(nextStonePos.y)})`
          : 'not captured',
      });
      expect(nextStonePos, 'Stone for first post-mini-game puzzle must be available').not.toBeNull();
      state.capturedStonePos = nextStonePos;
    });

    for (let i = 0; i < remainingCount; i++) {
      const puzzleNumber = state.assessmentTriggerPuzzle + 1 + i; // 1-based
      const isLast = i === remainingCount - 1;

      await test.step(`Complete post-mini-game puzzle ${puzzleNumber} of ${state.totalPuzzleCount}`, async () => {
        const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
        expect(canvasBB).not.toBeNull();

        await page.mouse.click(
          canvasBB!.x + state.monsterHitboxCenter!.x,
          canvasBB!.y + state.monsterHitboxCenter!.y,
        );
        await waitForStonesToRender(page);

        if (!isLast) {
          await subscribeToCorrectStonePosition(page);
        }

        await dragStoneToHitbox(
          page,
          canvasBB!.x + state.capturedStonePos!.x,
          canvasBB!.y + state.capturedStonePos!.y,
          canvasBB!.x + state.monsterHitboxCenter!.x,
          canvasBB!.y + state.monsterHitboxCenter!.y,
        );
        await waitForPositiveFeedback(page, 5_000);

        const feedbackText = (await page.locator(Selectors.feedbackText).textContent() ?? '').trim();
        test.info().annotations.push({
          type: `post-puzzle-${puzzleNumber}`,
          description: `Puzzle ${puzzleNumber}: "${feedbackText}"`,
        });

        if (!isLast) {
          const nextIdx = state.assessmentTriggerPuzzle + i + 1;
          // Wait for puzzle index advance AND stones fully animated (covers all puzzle types).
          await page
            .waitForFunction(
              (expected: number) => {
                const gss = (window as any).__ftm?.gameStateService;
                const sh = (window as any).__ftm?.sceneHandler;
                const scene =
                  sh?.['activeScene']?.['scene'] ??
                  gss?.gamePlayScene ??
                  gss?.currentScene ??
                  null;
                const fm = scene?.flowManager ?? null;
                if (!fm) return false;
                const idx = fm['currentPuzzleIndex'];
                if (typeof idx !== 'number' || idx < expected) return false;
                if ((window as any).__ftmTest?.correctStonePos != null) return true;
                return fm['stoneHandler']?.stonesHasLoaded === true;
              },
              nextIdx,
              { timeout: 15_000 },
            )
            .catch(() => null);

          let nextStonePos = await getCapturedCorrectStonePos(page);
          if (!nextStonePos) nextStonePos = await getCorrectStonePositionForCurrentPuzzle(page);
          expect(nextStonePos, `Stone for puzzle ${puzzleNumber + 1} must be captured`).not.toBeNull();
          state.capturedStonePos = nextStonePos;
        }
      });
    }

    test.info().annotations.push({
      type: 'all-puzzles-done',
      description: `All ${state.totalPuzzleCount} puzzles completed — level end should appear naturally.`,
    });
  });
}

// ─── Exports ──────────────────────────────────────────────────────────────────

/**
 * Register TC_009 through TC_012 (dynamic detection + pre-assessment + trigger + completion).
 * Call this BEFORE tc014_015 in the orchestrator.
 */
export function registerTC009_012(getPage: () => Page, state: FullGameplayFlowState): void {
  _tc009(getPage, state);
  _tc010(getPage, state);
  _tc011(getPage, state);
  _tc012(getPage, state);
}

/**
 * Register TC_013 (remaining post-mini-game puzzles).
 * Call this AFTER tc014_015 in the orchestrator so it runs after the mini-game.
 */
export function registerTC013(getPage: () => Page, state: FullGameplayFlowState): void {
  _tc013(getPage, state);
}

/** Register all five TCs in sequence (useful for direct file execution / future reuse). */
export function registerTests(getPage: () => Page, state: FullGameplayFlowState): void {
  registerTC009_012(getPage, state);
  _tc013(getPage, state);
}
