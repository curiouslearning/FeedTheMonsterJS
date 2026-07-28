/**
 * FeedTheMonsterJS – Full E2E Flow (TC_001 – TC_016)
 *
 * Orchestrator: runs all test cases as one serial worker in a single shared
 * browser session. Test logic lives exclusively in the files under isolated/.
 *
 * Execution order:
 *   App launch → Start screen → Level selection → Level 2 →
 *   Gameplay UI + puzzle 1 (TC_006–TC_008) →
 *   Dynamic detection (TC_009) → Pre-assessment puzzles (TC_010) →
 *   Natural assessment trigger (TC_011) → Assessment completion (TC_012) →
 *   Mini-game (TC_014–TC_015) →
 *   Remaining post-mini-game puzzles (TC_013) →
 *   Natural level completion (TC_016)
 *
 * Key design decisions:
 *   • TC_008 completes puzzle 1 and holds a 2 s stability pause.
 *   • TC_009 picks up immediately after; detects startingPuzzleIndex = 1
 *     (puzzle 1 already done) and reads puzzle 2's stone position fresh.
 *   • TC_010 completes remaining pre-assessment puzzles (none if trigger = puzzle 2).
 *   • TC_011 drops the trigger puzzle stone, speeds up the game-side assessmentDelay
 *     timer from ~5.5 s to ~100 ms via speedUpAssessmentTimer(), then waits for the
 *     natural assessment overlay — no triggerAssessment() is called.
 *   • TC_012 answers Q1 and closes the assessment, which fires the combined-mode
 *     transition (mini-game starts automatically).
 *   • TC_013 is registered AFTER TC_014–TC_015 so it runs after the mini-game
 *     completes; it finishes the remaining puzzles so TC_016 appears naturally.
 *   • TC_016 waits for the natural level end — no manual event publishing.
 *
 * To debug a specific area in isolation, run the corresponding file directly
 * from e2e/tests/isolated/.
 */

import { test, createSharedState, createFullGameplayFlowState } from '../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Routes } from '../constants/urls';
import { mockAnalytics, clearGameProgress, exposeGameInternals } from '../helpers';

import { registerTests as tc001 } from './isolated/tc-001-app-launch.spec';
import { registerTests as tc002_003 } from './isolated/tc-002-003-start-screen.spec';
import { registerTests as tc004_005 } from './isolated/tc-004-005-level-selection.spec';
import { registerTests as tc006_008 } from './isolated/tc-006-008-gameplay.spec';
import { registerTC009_012, registerTC013 } from './isolated/tc-009-013-assessment.spec';
import { registerTests as tc014_015 } from './isolated/tc-014-015-mini-game.spec';
import { registerTests as tc016 } from './isolated/tc-016-level-completion.spec';

test.describe.serial('FeedTheMonsterJS – Full E2E Flow (TC_001 – TC_016)', () => {
  test.describe.configure({ retries: 0 });

  let page: Page;
  const state = createSharedState();        // used by TC_006–TC_008
  const fullState = createFullGameplayFlowState(); // used by TC_009–TC_013

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await mockAnalytics(page);
    await clearGameProgress(page);
    await exposeGameInternals(page);
    // TC_001 asserts loading-screen state; navigate here so it catches first paint.
    await page.goto(Routes.game({ lang: 'english' }));
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Navigation: app launch → start screen → Level 2 ──────────────────────
  tc001(() => page);
  tc002_003(() => page);
  // TC_004 subscribes to CORRECT_STONE_POSITION before clicking Level 2.
  tc004_005(() => page);

  // ── Gameplay UI + puzzle 1 ─────────────────────────────────────────────────
  // TC_007 captures monsterHitboxCenter; TC_008 completes puzzle 1 with a 2 s pause.
  tc006_008(() => page, state);

  // ── Dynamic assessment: detection → pre-assessment → trigger → completion ──
  // TC_009 detects startingPuzzleIndex = 1 (TC_008 already completed puzzle 1)
  // and reads the current puzzle stone position fresh.  TC_010 completes remaining
  // pre-assessment puzzles.  TC_011 drops the trigger stone and waits for the
  // natural assessment overlay.  TC_012 answers Q1, closes the overlay, and the
  // combined-mode transition auto-starts the mini-game.
  registerTC009_012(() => page, fullState);

  // ── Mini-game (TC_014–TC_015) ──────────────────────────────────────────────
  // The combined-mode close in TC_012 auto-starts the mini-game.  TC_014 verifies
  // the treasure canvas; TC_015 clicks 5 stones and waits for completion.
  // The TC_011 subscription captures the next puzzle's stone pos when
  // handleMiniGameDone fires initNewPuzzle (~1 500 ms after mini-game ends).
  tc014_015(() => page);

  // ── Remaining post-mini-game puzzles (TC_013) ─────────────────────────────
  // Registered here so it executes after TC_015. Waits for puzzle advance,
  // reads the captured stone pos, and completes all remaining puzzles so the
  // game reaches the natural level-end flow.
  registerTC013(() => page, fullState);

  // ── Natural level completion (TC_016, last step) ───────────────────────────
  // Waits for the level-end screen to appear naturally (progress jar → LevelEnd).
  // Checks stars, buttons, and navigates back to level selection.
  tc016(() => page);
});
