/**
 * FTM_TC_018 | Failed Level Replay — Dynamic Detection (Post-Replay Config)
 * FTM_TC_019 | Failed Level Replay — Wrong Answers for All Pre-Assessment Puzzles
 * FTM_TC_020 | Failed Level Replay — Assessment Triggers Naturally, Every Question Wrong
 * FTM_TC_021 | Failed Level Replay — Mini-Game Completes Untouched (treasure score stays 0)
 * FTM_TC_022 | Failed Level Replay — Wrong Answers for Remaining Post-Mini-Game Puzzles
 * FTM_TC_023 | Failed Level Replay — Level End Renders a Failed State (flow ends here)
 *
 * Continues directly from FTM_TC_017 (tc-017-level-replay.spec.ts), which replayed
 * Level 2 (0-based currentLevel === 1) and already clicked the monster to reveal
 * puzzle 1's stones. This file re-drives the SAME natural flow that FTM_TC_006–016
 * exercise (dynamic puzzle detection → pre-assessment puzzles → assessment →
 * mini-game → remaining puzzles → Level End) but deliberately drags a WRONG stone
 * for every FTM puzzle and answers every assessment question incorrectly, so the
 * level ends with a genuinely failing score.
 *
 * Why a real wrong-answer playthrough instead of the synthetic
 * triggerLevelEndScene() helper: a wrong stone drop is NOT rejected/retried by the
 * game — gameplay-flow-manager.ts's handleStoneDropResult() only skips the +100
 * score for an incorrect drop, and feedbackAudioHandler.ts's incorrect-feedback
 * timeout still publishes LOAD_NEXT_GAME_PUZZLE, so the puzzle advances exactly
 * like a correct one. An all-wrong run therefore leaves this.score === 0, so
 * GameScore.calculateStarCount(0) === 0 (< MIN_STARS_TO_COMPLETE_LEVEL) at
 * handleLevelCompletion — a genuinely failing, naturally-reached #levelEnd.
 * The assessment survey (RandomBST bucket mode) fails and cascades down after at
 * most 2 consecutive wrong answers per bucket, terminating on its own — it never
 * requires a correct answer to close, so answering every question wrong does not
 * hang the flow.
 *
 * Deliberately NOT clicking any treasure-chest stone in TC_021 keeps
 * treasureChestScore at 0 — gameStateService.shouldDisplayProgressJar() shows the
 * Progress Jar instead of Level End whenever treasureChestScore > 0, so leaving it
 * untouched is what guarantees this flow lands on the real, natural #levelEnd
 * rather than the jar.
 *
 * TC_023 asserts the failed Level End screen and then STOPS — no Map, Retry, or
 * Next click — this flow exists purely to prove the failure branch renders
 * correctly, not to exercise further navigation.
 *
 * Run via the orchestrator: e2e/tests/ftm-assessment-survey-flow.spec.ts
 */

import { test, expect } from '../../fixtures/game-fixtures';
import type { FailedGameplayFlowState } from '../../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Selectors } from '../../constants/selectors';
import { Timeouts } from '../../constants/timeouts';
import { GameplayPage } from '../../pages/gameplay-page';
import { LevelEndPage } from '../../pages/level-end-page';
import {
  getAssessmentTriggerPuzzle,
  getMiniGameTriggerPuzzle,
  getTotalPuzzleCount,
  waitForNaturalAssessmentTrigger,
  speedUpAssessmentTimer,
  getWrongStonePositionForCurrentPuzzle,
  waitForStonesReady,
  waitForPuzzleAdvance,
  completeAssessmentSurveyWithWrongAnswers,
  wasAssessmentCompleted,
  isAssessmentCompletedByCoordinator,
  isAssessmentOverlayVisible,
  hidePausePopupForMiniGame,
  waitForTreasureCanvasVisible,
  waitForMiniGameComplete,
  speedUpMiniGame,
} from '../../helpers';

// ─── Shared helper (mirrors the local helper in tc-009-013-assessment.spec.ts) ─

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

// ─── Private per-TC functions ─────────────────────────────────────────────────

function _tc018(getPage: () => Page, state: FailedGameplayFlowState): void {
  test('FTM_TC_018 | Failed Level Replay | Dynamic detection reads assessment/mini-game/puzzle-count config for the replayed level', async () => {
    const page = getPage();

    await test.step('Wait for GameplayFlowManager and AssessmentFlowCoordinator to initialise', async () => {
      await page.waitForFunction(
        () => {
          const gss = (window as any).__ftm?.gameStateService;
          if (!gss) return false;
          const sh = (window as any).__ftm?.sceneHandler;
          const scene =
            sh?.['activeScene']?.['scene'] ?? gss.gamePlayScene ?? gss.currentScene ?? null;
          const fm = scene?.flowManager ?? null;
          return fm?.['assessmentFlowCoordinator'] != null;
        },
        { timeout: 15_000 },
      );
    });

    await test.step('Read assessment trigger puzzle (1-based) from AssessmentFlowCoordinator', async () => {
      state.assessmentTriggerPuzzle = await getAssessmentTriggerPuzzle(page);
    });

    await test.step('Ensure assessment eligibility (inject if remote config excludes this level)', async () => {
      if (state.assessmentTriggerPuzzle === 0) {
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
      }
      expect(
        state.assessmentTriggerPuzzle,
        'Assessment trigger puzzle must be > 0 (from config or injected to match mini-game)',
      ).toBeGreaterThan(0);
    });

    await test.step('Read total puzzle count for this level', async () => {
      state.totalPuzzleCount = await getTotalPuzzleCount(page);
      expect(state.totalPuzzleCount).toBeGreaterThan(0);
    });

    await test.step('Read mini-game trigger puzzle from GameplayFlowManager', async () => {
      state.miniGameTriggerPuzzle = await getMiniGameTriggerPuzzle(page);
    });

    await test.step('Resolve monster hitbox centre from game state', async () => {
      const gh = await page.evaluate(() => {
        const gss = (window as any).__ftm?.gameStateService;
        const ranges = gss?.getHitBoxRanges?.();
        if (!ranges?.hitboxRangeX || !ranges?.hitboxRangeY) return null;
        return {
          x: (ranges.hitboxRangeX.from + ranges.hitboxRangeX.to) / 2,
          y: (ranges.hitboxRangeY.from + ranges.hitboxRangeY.to) / 2,
        };
      });
      state.monsterHitboxCenter = gh;
      expect(state.monsterHitboxCenter, 'Monster hitbox must be resolvable').not.toBeNull();
    });

    await test.step('Read a WRONG stone position for puzzle 1 (stones already revealed by TC_017)', async () => {
      await waitForStonesReady(page);
      state.capturedStonePos = await getWrongStonePositionForCurrentPuzzle(page);
      expect(state.capturedStonePos, 'A wrong (foil) stone must be readable for puzzle 1').not.toBeNull();
    });

    await test.step('Assert trigger puzzle is within valid range', async () => {
      expect(state.assessmentTriggerPuzzle).toBeGreaterThanOrEqual(1);
      expect(state.assessmentTriggerPuzzle).toBeLessThanOrEqual(state.totalPuzzleCount);
    });
  });
}

function _tc019(getPage: () => Page, state: FailedGameplayFlowState): void {
  test('FTM_TC_019 | Failed Level Replay | Every pre-assessment puzzle is answered with a wrong stone', async () => {
    const page = getPage();

    // Pre-assessment puzzles are 1..(assessmentTriggerPuzzle - 1); the trigger
    // puzzle itself is answered (wrongly) in TC_020, mirroring the TC_010/TC_011 split.
    const remaining = state.assessmentTriggerPuzzle - 1;

    if (remaining <= 0) {
      test.info().annotations.push({
        type: 'skip',
        description: 'Assessment triggers at puzzle 1 — no pre-assessment puzzles needed.',
      });
      return;
    }

    expect(state.monsterHitboxCenter, 'Hitbox must be resolved from TC_018').not.toBeNull();
    expect(state.capturedStonePos, 'Wrong stone for puzzle 1 must be resolved from TC_018').not.toBeNull();

    for (let i = 0; i < remaining; i++) {
      const puzzleNumber = i + 1; // 1-based display
      const puzzleManagerIdx = i; // 0-based current

      await test.step(`Drag a wrong stone for pre-assessment puzzle ${puzzleNumber} (${i + 1}/${remaining})`, async () => {
        const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
        expect(canvasBB, 'Canvas bounding box must be available').not.toBeNull();

        await page.mouse.click(
          canvasBB!.x + state.monsterHitboxCenter!.x,
          canvasBB!.y + state.monsterHitboxCenter!.y,
        );
        await waitForStonesReady(page);

        if (!state.capturedStonePos) {
          state.capturedStonePos = await getWrongStonePositionForCurrentPuzzle(page);
        }
        expect(
          state.capturedStonePos,
          `A wrong stone for puzzle ${puzzleNumber} must be readable from StoneHandler`,
        ).not.toBeNull();

        const pickX = canvasBB!.x + state.capturedStonePos!.x;
        const pickY = canvasBB!.y + state.capturedStonePos!.y;
        const dropX = canvasBB!.x + state.monsterHitboxCenter!.x;
        const dropY = canvasBB!.y + state.monsterHitboxCenter!.y;

        await dragStoneToHitbox(page, pickX, pickY, dropX, dropY);

        // Wrong drops show no feedback TEXT (only the correct path sets
        // #feedback-text — see puzzleHandler.ts handleCorrectLetterDrop), so
        // completion is confirmed via puzzle-index advance instead.
        await waitForPuzzleAdvance(page, puzzleManagerIdx + 1, 15_000);
        await waitForStonesReady(page);

        state.capturedStonePos = await getWrongStonePositionForCurrentPuzzle(page);
        expect(
          state.capturedStonePos,
          `Wrong stone for puzzle ${puzzleNumber + 1} must be captured`,
        ).not.toBeNull();
      });
    }
  });
}

function _tc020(getPage: () => Page, state: FailedGameplayFlowState): void {
  test('FTM_TC_020 | Failed Level Replay | Assessment triggers naturally after the trigger puzzle and every question is answered incorrectly', async () => {
    const page = getPage();

    expect(state.monsterHitboxCenter, 'Hitbox must be resolved from TC_018').not.toBeNull();
    expect(state.capturedStonePos, 'Wrong stone for the trigger puzzle must be resolved').not.toBeNull();

    await test.step(`Drag a wrong stone for the trigger puzzle ${state.assessmentTriggerPuzzle}`, async () => {
      const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
      expect(canvasBB).not.toBeNull();

      await page.mouse.click(
        canvasBB!.x + state.monsterHitboxCenter!.x,
        canvasBB!.y + state.monsterHitboxCenter!.y,
      );
      await waitForStonesReady(page);

      if (!state.capturedStonePos) {
        state.capturedStonePos = await getWrongStonePositionForCurrentPuzzle(page);
      }
      expect(state.capturedStonePos, 'Trigger puzzle wrong stone must be readable').not.toBeNull();

      await dragStoneToHitbox(
        page,
        canvasBB!.x + state.capturedStonePos!.x,
        canvasBB!.y + state.capturedStonePos!.y,
        canvasBB!.x + state.monsterHitboxCenter!.x,
        canvasBB!.y + state.monsterHitboxCenter!.y,
      );
    });

    await test.step('Speed up assessment delay via scheduler override', async () => {
      // determineNextStep() schedules the assessment timer synchronously on the
      // same tick as the (wrong) stone drop — a short pause guards against any
      // async UI flush still in flight before the scheduler override applies.
      await page.waitForTimeout(300);
      await speedUpAssessmentTimer(page, 100);
    });

    await test.step('Assessment overlay appears naturally after the accelerated delay', async () => {
      const appeared = await waitForNaturalAssessmentTrigger(page, 12_000);
      expect(appeared, 'Assessment must appear naturally after a wrong drop on the trigger puzzle').toBe(true);
    });

    await test.step('Assessment player web component is attached', async () => {
      await expect(page.locator(Selectors.assessmentPlayer)).toBeAttached({
        timeout: Timeouts.domUpdate,
      });
    });

    let questionsAnswered = 0;
    await test.step('Cycle through every assessment question, always dragging the WRONG answer', async () => {
      questionsAnswered = await completeAssessmentSurveyWithWrongAnswers(page);
      expect(questionsAnswered, 'At least one assessment question must be answered').toBeGreaterThan(0);
    });

    await test.step('Verify the assessment ended (RandomBST bucket-fail cascade reaches onEnd())', async () => {
      const completed = await wasAssessmentCompleted(page);
      const coordinatorDone = await isAssessmentCompletedByCoordinator(page);
      const overlayGone = !(await isAssessmentOverlayVisible(page));
      expect(
        completed || coordinatorDone || overlayGone,
        `Expected the assessment to end after wrong answers: playerEvent=${completed}, coordinator=${coordinatorDone}, overlayGone=${overlayGone}`,
      ).toBe(true);
    });

    await test.step('Fallback: close assessment if overlay is still visible after bucket-fail cascade', async () => {
      await page.waitForTimeout(500);
      const overlayStillVisible = await isAssessmentOverlayVisible(page);
      if (overlayStillVisible) {
        const closeBtn = page.locator(Selectors.assessmentCloseBtn);
        if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await closeBtn.click();
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

function _tc021(getPage: () => Page, state: FailedGameplayFlowState): void {
  test('FTM_TC_021 | Failed Level Replay | Mini-game (if eligible) completes untouched, keeping treasureChestScore at 0', async () => {
    const page = getPage();

    // miniGameStateService.shouldShowMiniGame() (src/miniGame/miniGameStateService/
    // miniGameStateService.ts:95-109) only assigns a random trigger puzzle if this
    // level's treasure chest has NOT already been completed this session; it
    // returns 0 otherwise. TC_015 (earlier in this same serial suite) already
    // clicked 5 stones and completed the chest for this level, marking
    // isMiniGameComplete = true — so on this replay the mini-game correctly does
    // NOT reappear. state.miniGameTriggerPuzzle (read fresh in TC_018 from the
    // NEW post-replay GameplayFlowManager) reflects this: it is 0 whenever the
    // mini-game has already been completed for this level in the current session.
    if (state.miniGameTriggerPuzzle === 0) {
      test.info().annotations.push({
        type: 'skip',
        description: 'miniGameTriggerPuzzle = 0 — the treasure chest was already completed by TC_015 earlier in this session, so it correctly does not reappear on replay.',
      });

      await test.step('treasureChestScore is 0 (mini-game never ran this session)', async () => {
        const treasureChestScore = await page.evaluate(() => {
          const sh = (window as any).__ftm?.sceneHandler;
          const gss = (window as any).__ftm?.gameStateService;
          const scene = sh?.['activeScene']?.['scene'] ?? gss?.gamePlayScene ?? gss?.currentScene;
          return scene?.flowManager?.['treasureChestScore'] ?? null;
        });
        expect(treasureChestScore).toBe(0);
      });
      return;
    }

    await test.step('Treasure chest mini game canvas (#treasurecanvas) becomes visible', async () => {
      await waitForTreasureCanvasVisible(page, Timeouts.sceneTransition);
      await expect(page.locator(Selectors.treasureCanvas)).toBeVisible();
    });

    await test.step('Raise mini-game canvas above pause popup and hide the pause popup', async () => {
      await hidePausePopupForMiniGame(page);
    });

    await test.step('Deliberately click NO stones — fast-forward the chest timer instead so treasureChestScore stays 0', async () => {
      // shouldDisplayProgressJar() routes to the Progress Jar scene instead of
      // Level End whenever treasureChestScore > 0, so this flow must not earn
      // any mini-game points. speedUpMiniGame() only fast-forwards the
      // OpenedChest state's internal timer — it never awards points itself.
      for (let i = 0; i < 30; i++) {
        await speedUpMiniGame(page);
        await page.waitForTimeout(500);
      }
    });

    await test.step('Mini game completes naturally', async () => {
      await waitForMiniGameComplete(page, 20_000);
    });

    await test.step('treasureChestScore remains 0 (no stones were clicked)', async () => {
      const treasureChestScore = await page.evaluate(() => {
        const sh = (window as any).__ftm?.sceneHandler;
        const gss = (window as any).__ftm?.gameStateService;
        const scene = sh?.['activeScene']?.['scene'] ?? gss?.gamePlayScene ?? gss?.currentScene;
        return scene?.flowManager?.['treasureChestScore'] ?? null;
      });
      expect(treasureChestScore).toBe(0);
    });

    await test.step('Game background remains visible after mini game ends', async () => {
      await expect(page.locator(Selectors.background)).toBeVisible();
    });
  });
}

function _tc022(getPage: () => Page, state: FailedGameplayFlowState): void {
  test('FTM_TC_022 | Failed Level Replay | Every remaining post-mini-game puzzle is answered with a wrong stone', async () => {
    const page = getPage();

    const remainingCount = state.totalPuzzleCount - state.assessmentTriggerPuzzle;

    if (remainingCount <= 0) {
      test.info().annotations.push({
        type: 'skip',
        description: 'No remaining puzzles — level ends naturally after the mini-game.',
      });
      return;
    }

    await test.step('Wait for the first post-mini-game puzzle to load', async () => {
      await waitForPuzzleAdvance(page, state.assessmentTriggerPuzzle, 15_000).catch(() => null);
      await waitForStonesReady(page).catch(() => null);
      state.capturedStonePos = await getWrongStonePositionForCurrentPuzzle(page);
      expect(state.capturedStonePos, 'Wrong stone for the first post-mini-game puzzle must be available').not.toBeNull();
    });

    for (let i = 0; i < remainingCount; i++) {
      const puzzleNumber = state.assessmentTriggerPuzzle + 1 + i; // 1-based
      const isLast = i === remainingCount - 1;

      await test.step(`Drag a wrong stone for post-mini-game puzzle ${puzzleNumber} of ${state.totalPuzzleCount}`, async () => {
        const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
        expect(canvasBB).not.toBeNull();

        await page.mouse.click(
          canvasBB!.x + state.monsterHitboxCenter!.x,
          canvasBB!.y + state.monsterHitboxCenter!.y,
        );
        await waitForStonesReady(page);

        if (!state.capturedStonePos) {
          state.capturedStonePos = await getWrongStonePositionForCurrentPuzzle(page);
        }
        expect(state.capturedStonePos, `Wrong stone for puzzle ${puzzleNumber} must be readable`).not.toBeNull();

        await dragStoneToHitbox(
          page,
          canvasBB!.x + state.capturedStonePos!.x,
          canvasBB!.y + state.capturedStonePos!.y,
          canvasBB!.x + state.monsterHitboxCenter!.x,
          canvasBB!.y + state.monsterHitboxCenter!.y,
        );

        if (!isLast) {
          const nextIdx = state.assessmentTriggerPuzzle + i + 1;
          await waitForPuzzleAdvance(page, nextIdx, 15_000).catch(() => null);
          await waitForStonesReady(page).catch(() => null);
          state.capturedStonePos = await getWrongStonePositionForCurrentPuzzle(page);
          expect(state.capturedStonePos, `Wrong stone for puzzle ${puzzleNumber + 1} must be captured`).not.toBeNull();
        }
      });
    }
  });
}

function _tc023(getPage: () => Page): void {
  test('FTM_TC_023 | Failed Level Replay | Level End renders the failed-level state; the flow ends here', async () => {
    const page = getPage();
    const levelEndPage = new LevelEndPage(page);

    await test.step('Level End screen renders naturally (score-driven, not synthetic)', async () => {
      await levelEndPage.assertLevelEndVisible();
    });

    await test.step('Zero stars rendered — every puzzle and assessment question was answered wrong', async () => {
      await levelEndPage.assertStarCount(0);
    });

    await test.step('Next button is hidden because the level was failed', async () => {
      await levelEndPage.assertNextButtonHidden();
    });

    await test.step('Map button remains visible', async () => {
      await levelEndPage.assertMapButtonVisible();
    });

    await test.step('Retry button is visible (non-first level always offers replay)', async () => {
      await levelEndPage.assertRetryButtonVisible();
    });

    // Intentionally no further interaction: this flow verifies the failed-level
    // render only. Per FM-966, no Map/Retry/Next click follows — the suite ends here.
  });
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function registerTests(getPage: () => Page, state: FailedGameplayFlowState): void {
  _tc018(getPage, state);
  _tc019(getPage, state);
  _tc020(getPage, state);
  _tc021(getPage, state);
  _tc022(getPage, state);
  _tc023(getPage);
}
