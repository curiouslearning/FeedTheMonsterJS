# FM-966 — QA Automation Coverage for Failed Level Flow (Playwright + Claude)

> Generated via Spec-Driven Development (SDD) process. Source template: `SDD-TEMPLATE.md`.
> Implementation status: **implemented** — `e2e/tests/isolated/tc-018-023-failed-level-replay.spec.ts`, registered in the orchestrator after `FTM_TC_017`.

## Ticket Context

| Field | Value |
|---|---|
| Key | [FM-966](https://curiouslearning.atlassian.net/browse/FM-966) |
| Summary | QA Automation coverage for failed level flow. (Playwright+Claude) |
| Type | Task |
| Project | FM — Feed The Monster |
| Priority | Medium |
| Status | In Progress |
| Reporter | Ashish M |
| Assignee | Ashwin Nair |
| Created | 2026-07-29 |
| Test Doc | [QA Test Case spreadsheet](https://docs.google.com/spreadsheets/d/18M-rIDj84pGg7f4y4ldipOzF3FCo_prZ4yzcqsnZsNQ/edit?usp=sharing) (referenced by ticket; rows for TC_018–TC_023 not yet reflected — see §14) |

**Jira Description (verbatim):**
> Create automation coverage for the level failed flow in the FTM gameplay.
> Currently in our Playwright + Claude implementation we have cover an E2E flow for the happy flow with this implementation we can start covering the level failed flow and replay flow as well.
> The test case suit has been added to the Test doc mentioned below.

### Business Goal
Extend the existing Playwright + Claude E2E suite so that a genuine **Level Failed** outcome — the branch a child hits whenever a level is finished with fewer than the passing star threshold — is regression-tested automatically, closing the remaining gap in Level End coverage. `FTM_TC_016` proves the *passed* path and `FTM_TC_017` (FM-967) proves Replay from that passed state; nothing today proves the Level End screen renders correctly, or that gameplay genuinely produces a failing score, when every answer is wrong.

### Problem Statement
`src/scenes/levelend-scene/levelend-scene.ts` has two independent, testable branches driven purely by `starCount` vs. `MIN_STARS_TO_COMPLETE_LEVEL` (`src/constants/index.ts:197`, value `3`): the SAD reaction / lose-audio branch (`switchToReactionAnimation()`, lines 113-148) and the button-visibility branch (`renderButtonsHTML()`, lines 298-349, hiding Next and — for Level 1 specifically — showing Retry *because* the level failed). No automated test today ever drives the game to a real `starCount < 3` finish, so neither branch is exercised end-to-end against production scoring logic.

### Acceptance Criteria (from FM-966)
1. Automate the **Level Failed** gameplay flow using the existing Playwright + Claude automation framework.
2. Validate that the **Level Failed** screen is displayed when the player fails a level.
3. Verify that all expected UI elements on the **Level Failed** screen are displayed correctly.
4. Ensure the failed level state is captured correctly before displaying the **Level Failed** screen.
5. Integrate the automation into the existing FTM E2E test suite.
6. Ensure the test follows the existing framework standards, reusable helpers, and coding conventions.
7. Ensure the automation executes reliably in CI with consistent, non-flaky results.

**Explicit implementation directive (from this ticket's working session):** after `FTM_TC_017` replays Level 2, the SAME natural flow that `FTM_TC_001`–`FTM_TC_016` already exercise (dynamic puzzle detection → pre-assessment puzzles → assessment → mini-game → remaining puzzles → Level End) must be re-driven end-to-end, but with every FTM puzzle drop and every assessment answer deliberately WRONG, producing a genuine failure rather than a synthetic event. The flow must stop at the failed Level End screen — no Map, Retry, or Next click follows.

---

# 1. Executive Summary

There is **no separate "Level Failed" scene** in this codebase — a failed level renders on the exact same `#levelEnd` / `LevelEndScene` as a passed one, distinguished purely by `starCount < MIN_STARS_TO_COMPLETE_LEVEL`. This spec defines and implements six new Playwright E2E tests, **`FTM_TC_018`–`FTM_TC_023`**, in one new file (`e2e/tests/isolated/tc-018-023-failed-level-replay.spec.ts`), registered immediately after `FTM_TC_017` in the orchestrator. They re-drive the level `FTM_TC_017` just replayed — dragging a wrong stone for every puzzle and answering every assessment question incorrectly — so `GameplayFlowManager.score` never leaves `0`, `GameScore.calculateStarCount(0) === 0`, and the level genuinely fails, landing on the real, naturally-reached `#levelEnd`.

- **Business objective:** regression-proof both the failure branch of Level End rendering *and* the production scoring pipeline that decides pass/fail, so a broken conditional in either `levelend-scene.ts` or `gameplay-flow-manager.ts` is caught in CI before reaching players.
- **Expected user impact:** none directly (test-only change); indirectly reduces risk of a shipped regression that hides the recovery path (Retry) from a child who just failed, or that silently stops scoring wrong answers as failures.
- **Success metrics:** all six new tests pass reliably in CI (`e2e-tests` CircleCI job) across ≥20 consecutive runs with zero flake; `FTM_TC_001`–`FTM_TC_017` remain byte-for-byte unmodified in behavior.

---

# 2. Current State Analysis

**Existing implementation (unchanged by this ticket):**
- `e2e/tests/isolated/tc-016-level-completion.spec.ts` (`FTM_TC_016`) reaches Level End naturally with a passing score and deliberately stays on screen (no Map click) for `FTM_TC_017`.
- `e2e/tests/isolated/tc-017-level-replay.spec.ts` (`FTM_TC_017`, FM-967) clicks Replay, and — critically for this ticket — its final `test.step` already clicks the monster to reveal puzzle 1's stones on the freshly-replayed level, leaving gameplay in a state where `FTM_TC_018` can immediately read a stone position without an extra click.
- `e2e/tests/isolated/tc-009-013-assessment.spec.ts` and `tc-014-015-mini-game.spec.ts` establish the exact natural-flow pattern (dynamic puzzle-count/trigger detection, per-puzzle drag loop, natural assessment trigger + `speedUpAssessmentTimer`, mini-game auto-click) that this ticket's tests mirror for the wrong-answer path.
- `e2e/helpers/game-state-helpers.ts` had `getCorrectStonePositionForCurrentPuzzle` (lines 628-693) and `completeAssessmentSurvey` (lines 968-1027) for the correct-answer path, and `getWrongAssessmentAnswer` (lines 720-734) for single wrong-answer negative testing — but **no helper existed to find a wrong FTM stone, or to cycle an entire assessment answering every question wrong.**
- `e2e/pages/level-end-page.ts` (`LevelEndPage`) had `assertNextButtonVisible()`/`assertRetryButtonVisible()`/`assertMapButtonVisible()` but **no "assert hidden" method**, since no prior test needed to prove a button's absence.

**Key production-code findings that shaped the design (see §5 for full citations):**
- A wrong stone drop is **not rejected or retried** — `gameplay-flow-manager.ts`'s `handleStoneDropResult()` only skips the `+100` score for an incorrect drop; `feedbackAudioHandler.ts`'s incorrect-feedback timeout still publishes `LOAD_NEXT_GAME_PUZZLE`, so the puzzle advances exactly like a correct one, just with no feedback *text* shown (only the correct path calls `feedbackTextEffects.wrapText()` in `puzzleHandler.ts`'s `handleCorrectLetterDrop`).
- `GameScore.calculateStarCount(score)` (`src/data/game-score.ts:162-171`) is pure-integer-score-driven with no time/attempt/hint inputs — an all-wrong run mathematically produces `score = 0` → `starCount = 0`.
- The assessment survey (`@curiouslearning/assessment-survey`, default `BucketGenMode.RandomBST`) fails and cascades down a bucket after at most 2 consecutive wrong answers per bucket (`numConsecutiveWrong >= 2 || numTried >= 5` in the package's `assessment.js`), terminating in `onEnd()` within a bounded number of questions — it **never requires a correct answer to close**, so answering every question wrong does not hang the flow, and — since the assessment path recomputes `assessmentDelay` as `isCorrect ? 5500 : 3000`, a wrong drop on the trigger puzzle actually opens the overlay *faster*.
- `gameStateService.shouldDisplayProgressJar(starsCount, treasureChestScore)` (`gameStateService.ts:345-358`) routes to the Progress Jar scene instead of Level End whenever `treasureChestScore > 0` — the treasure-chest mini-game's `stateTimer`-driven animation (`treasureChestAnimation.ts`) completes automatically regardless of clicks, so this flow deliberately clicks **no** mini-game stones to keep `treasureChestScore === 0` and guarantee routing to the real `#levelEnd`.
- **Discovered during validation:** `miniGameStateService.shouldShowMiniGame()` (`src/miniGame/miniGameStateService/miniGameStateService.ts:95-109`) only assigns a random mini-game trigger puzzle if that level's treasure chest has **not already been completed** in the current session — it returns `0` otherwise. Since `FTM_TC_015` (earlier in this same serial suite) already clicked 5 stones and completed the chest for Level 2 (`earnedStarCount = 1` → `isMiniGameComplete = true`, `treasureChestMiniGame.ts:70`), the mini-game correctly does **not** reappear when `FTM_TC_017` replays the same level. `FTM_TC_021` therefore branches on `state.miniGameTriggerPuzzle` (read fresh in `FTM_TC_018`): if `0`, it skips the mini-game entirely (asserting `treasureChestScore` is trivially `0`) instead of waiting on a treasure canvas that will never appear this session — this was caught by an initial full-suite run (§13) and fixed before this document was finalized.

**Technical debt:** none introduced — the change is purely additive (two new helper functions, one new page-object assertion, one new spec file, minimal orchestrator registration).

---

# 3. Root Cause Analysis

This is a **test-coverage gap**, not a runtime defect. Both the Level End failure-rendering branch and the score-driven pass/fail computation in `gameplay-flow-manager.ts`/`game-score.ts` have existed unchanged since before this suite existed; `FTM_TC_006`–`FTM_TC_017` only ever exercised the passing branch because the natural-flow suite always drags the correct stone and answers assessment questions correctly. There is no architectural, performance, or runtime bottleneck to address — only missing coverage for a scoring path that has existed unchanged. No CPU/memory/offline impact analysis applies.

---

# 4. Proposed Solution (as implemented)

## High-level approach
Six new tests in one grouped file (`tc-018-023-failed-level-replay.spec.ts`), registered via `registerTests(getPage, state)` immediately after `tc017(() => page)` — mirroring the multi-TC-per-file grouping already used by `tc-009-013-assessment.spec.ts` and `tc-014-015-mini-game.spec.ts`:

1. **`FTM_TC_018` (Dynamic Detection)** — mirrors `FTM_TC_009`: waits for `GameplayFlowManager`/`AssessmentFlowCoordinator` to initialize post-replay, reads `assessmentTriggerPuzzle`, `totalPuzzleCount`, `miniGameTriggerPuzzle`, resolves the monster hitbox, and reads a **wrong** stone position for puzzle 1 (already visible from `FTM_TC_017`'s final step). Unlike `FTM_TC_009`, this step **never overrides** `assessmentTriggerPuzzle` when the real config reports the level ineligible (`0`) — see the correction note below.
2. **`FTM_TC_019` (Wrong Pre-Assessment Puzzles, or the Whole Level)** — mirrors `FTM_TC_010`: when the level is assessment-eligible, loops puzzles `1..(assessmentTriggerPuzzle - 1)`; when it is not (`assessmentTriggerPuzzle === 0`), loops **every** puzzle `1..totalPuzzleCount` instead, since there is no trigger puzzle to reserve for `FTM_TC_020`. Each drag is confirmed via `waitForPuzzleAdvance()` (not feedback text, which only renders on the correct path).
3. **`FTM_TC_020` (Assessment Answered All Wrong)** — mirrors `FTM_TC_011`+`FTM_TC_012`: drags a wrong stone on the trigger puzzle, speeds up the assessment timer, waits for the natural overlay, then cycles every question via the new `completeAssessmentSurveyWithWrongAnswers()` helper, verifying the survey ends (bucket-fail cascade) and the overlay dismisses into the combined-mode mini-game transition. **Skips itself** (with a documented annotation, not a failure) when `assessmentTriggerPuzzle === 0` — there is nothing to trigger.
4. **`FTM_TC_021` (Mini-Game Untouched)** — mirrors `FTM_TC_014`+`FTM_TC_015`, inverted: waits for the treasure canvas, but clicks **zero** stones (fast-forwarding only via the existing `speedUpMiniGame()` timer-jump), then asserts `treasureChestScore === 0` on the flow manager — the guarantee that keeps `shouldDisplayProgressJar()` false. Branches on `miniGameTriggerPuzzle` (independent of the assessment-eligibility branch above) exactly the same way — skip with an annotation, not a forced state, when the chest was already completed this session (see §2).
5. **`FTM_TC_022` (Wrong Remaining Puzzles)** — mirrors `FTM_TC_013`: loops the remaining post-mini-game puzzles the same way as `FTM_TC_019`. Skips itself when `assessmentTriggerPuzzle === 0`, since `FTM_TC_019` already drove the entire level in that branch.
6. **`FTM_TC_023` (Failed Level End, Flow Ends)** — mirrors `FTM_TC_016`, inverted: asserts `#levelEnd` visible naturally, `assertStarCount(0)`, the new `assertNextButtonHidden()`, `assertMapButtonVisible()`, `assertRetryButtonVisible()` — and performs **no further click**, per the ticket's explicit directive.

## Correction: assessment eligibility must be read, never overridden

An earlier draft of `FTM_TC_018` copied `FTM_TC_009`'s eligibility-injection fallback verbatim: when `getAssessmentTriggerPuzzle()` returned `0`, it wrote directly to `coordinator['isLevelEligible']`/`coordinator['assessmentPuzzleTrigger']` to force the assessment to trigger. Code review correctly flagged this as unsafe for FM-966 specifically (see §9): forcing eligibility makes `FTM_TC_020` exercise a fabricated configuration instead of the replayed level's real one, and — critically — would silently mask a genuinely broken or missing remote assessment configuration, since the suite would keep passing either way. `FTM_TC_009`'s own use of this pattern predates this ticket and is out of scope to change (`FTM_TC_001`–`FTM_TC_017` are not modified by this ticket), but there is no reason to propagate the same risk into new code.

The fix: `FTM_TC_018` now only **reads** `assessmentTriggerPuzzle` and never mutates coordinator state. `0` (not eligible) is modeled as its own expected branch, not an error to paper over:
- `FTM_TC_019` drags every puzzle in the level wrong (not just the pre-trigger ones) when there's no trigger puzzle to stop at.
- `FTM_TC_020` and `FTM_TC_022` skip themselves with a documented annotation.

In this environment, the replayed level's real configuration is assessment-eligible (confirmed by `FTM_TC_020` genuinely exercising the wrong-answer assessment cycle in the validation run — see §13), so the not-eligible branch is currently a defensive path rather than the one exercised in CI. See §9 for the one residual risk this leaves undocumented-by-execution.

## Why this approach was selected
- **Drives real production code**, not a synthetic event — `triggerLevelEndScene()` (the helper other isolated specs use to shortcut to Level End) was deliberately **not** used here, because the ticket calls for genuinely failing gameplay, and the research in §2 confirmed this is mechanically safe (no infinite-loop risk in either the main puzzle or the assessment survey).
- **Reuses the exact natural-flow skeleton** already proven reliable by `FTM_TC_009`–`FTM_TC_013` — same dynamic detection, same eligibility-injection fallback, same per-puzzle loop shape — minimizing new, unproven test logic. Only the stone-selection and completion-confirmation strategy differ (wrong stone / puzzle-advance instead of correct stone / positive-feedback-text).
- **Two small, additive helpers** (`getWrongStonePositionForCurrentPuzzle`, `completeAssessmentSurveyWithWrongAnswers`) are direct structural mirrors of their correct-answer counterparts — no new abstractions, no changes to existing helpers or `FTM_TC_001`–`FTM_TC_017`.
- **No mini-game interaction** is the one deliberate asymmetry from the passing flow, justified by a specific production-code finding (`shouldDisplayProgressJar`) rather than convenience — documented in §5/§9 so a future reader isn't confused by the divergence from `FTM_TC_014`/`FTM_TC_015`'s auto-click behavior.

## Alternative approaches considered

| Approach | Description | Trade-off |
|---|---|---|
| **A — Synthetic `triggerLevelEndScene(page, 1, 1, false)` (rejected)** | Publish a fake `LEVEL_END_DATA_EVENT` directly, bypassing gameplay entirely. | Fast and simple, but proves nothing about whether wrong answers are actually *scored* as failures by production code — exactly the gap AC 4 ("failed level state is captured correctly") calls out. Rejected in favor of driving real gameplay once research confirmed it was safe and reliable. |
| **B — Force failure via per-puzzle timer expiry (considered, not used)** | Let each puzzle's countdown timer lapse with no drop at all instead of dragging wrong. | Mechanically equivalent (`loadPuzzle(true, 0)` also adds no score), but slower per puzzle (full timer duration vs. ~1.7s incorrect-feedback delay) and does not fulfill the ticket's explicit instruction to "drag the wrong answers." |
| **C — Selected: real wrong-answer playthrough mirroring the existing natural-flow skeleton (chosen)** | As described above. | Best balance: exercises real scoring logic end-to-end, reuses proven test infrastructure, minimal new code, explicit directive satisfied. |

## Business value
Closes the one remaining meaningful gap in Level End coverage — proving the scoring pipeline itself produces a failing outcome, not just that the UI renders one when told to — directly satisfying FM-966 without expanding scope beyond the ticket's explicit ask.

---

# 5. Architecture Hooks

**Existing modules involved (read-only reference or reused as-is):** `e2e/tests/ftm-assessment-survey-flow.spec.ts` (orchestrator registration only), `e2e/tests/isolated/tc-009-013-assessment.spec.ts` / `tc-014-015-mini-game.spec.ts` (pattern reference, not modified), `e2e/pages/gameplay-page.ts`, `e2e/pages/level-end-page.ts`, `e2e/constants/selectors.ts`, `e2e/constants/timeouts.ts`, `e2e/fixtures/game-fixtures.ts`.

**Modules changed:**
- `e2e/helpers/game-state-helpers.ts` — two new exported functions:
  - `getWrongStonePositionForCurrentPuzzle(page)` — inverts `getCorrectStonePositionForCurrentPuzzle`: reads `stoneHandler.foilStones`/`activeStones` and returns any non-disposed stone whose text is neither `correctTargetStone` nor a member of `targetStones`.
  - `completeAssessmentSurveyWithWrongAnswers(page, maxQuestions=20)` — structural mirror of `completeAssessmentSurvey`, swapping `getCorrectAssessmentAnswer`/`correctBtnId` for the existing `getWrongAssessmentAnswer`/`wrongBtnId`.
- `e2e/helpers/index.ts` — barrel-exports both new functions.
- `e2e/pages/level-end-page.ts` — adds `assertNextButtonHidden()`, mirroring `assertNextButtonVisible()`'s exact pattern (`expect(...).toBeHidden({ timeout: Timeouts.domUpdate })`).
- `e2e/fixtures/game-fixtures.ts` — adds `FailedGameplayFlowState` interface + `createFailedGameplayFlowState()` factory, structurally identical to `FullGameplayFlowState`/`createFullGameplayFlowState()` but named distinctly so `capturedStonePos` is documented as holding a **wrong** stone in this context, not the correct one.
- `e2e/tests/isolated/tc-018-023-failed-level-replay.spec.ts` — new file, all six TCs.
- `e2e/tests/ftm-assessment-survey-flow.spec.ts` — one new import + one new registration line (`tc018_023(() => page, failedState)`) after the existing `tc017(() => page)` line; header comment extended to document the new range. **No existing line for `FTM_TC_001`–`FTM_TC_017` was changed.**
- `e2e/tests/README.md` — TC range/count references updated; new table row added.

**Production code hooks (no changes — documented for QA traceability):**
- `src/scenes/gameplay-scene/gameplay-flow-manager.ts`: `handleStoneDropResult()` (lines 288-308, score only increments on `isCorrect`), `determineNextStep()`/`continueAfterPuzzleStep()` (lines 125-189, advances regardless of correctness), `handleLevelCompletion()` (lines 400-428, computes `starsCount` from `this.score` and publishes `LEVEL_END_DATA_EVENT`), `switchSceneAtGameEnd()` (lines 475-487, routes to Level End vs. Progress Jar).
- `src/gamepuzzles/feedbackAudioHandler/feedbackAudioHandler.ts`: `playIncorrectFeedbackSound()` (lines 74-78) — the 1700ms timeout that still advances the puzzle on a wrong drop.
- `src/data/game-score.ts`: `GameScore.calculateStarCount()` (lines 162-171).
- `src/gameStateService/gameStateService.ts`: `shouldDisplayProgressJar()` (lines 345-358) — the reason `FTM_TC_021` clicks no mini-game stones.
- `node_modules/@curiouslearning/assessment-survey/dist/assessment/assessment.js`: `HasQuestionsLeft()`/`handleFailedBucket()`/`failLowestBucket()` — third-party bucket-fail cascade that lets an all-wrong assessment terminate on its own.
- `src/scenes/levelend-scene/levelend-scene.ts`: `switchToReactionAnimation()` and `renderButtonsHTML()` (unchanged from the initial synthetic-trigger draft of this spec — still the rendering logic `FTM_TC_023` asserts against).

**State management:** No new client-side state. Test-side, `FailedGameplayFlowState` is a new but structurally-minimal addition, scoped to this one file.

---

# 6. Folder Structure

```
e2e/
  tests/
    ftm-assessment-survey-flow.spec.ts          # MODIFIED — +1 import, +1 registration after tc017(page)
    isolated/
      tc-018-023-failed-level-replay.spec.ts    # NEW — FTM_TC_018–FTM_TC_023
    README.md                                   # MODIFIED — TC table + range/count updates
  helpers/
    game-state-helpers.ts                       # MODIFIED — +getWrongStonePositionForCurrentPuzzle, +completeAssessmentSurveyWithWrongAnswers
    index.ts                                    # MODIFIED — barrel-export the two new helpers
  pages/
    level-end-page.ts                           # MODIFIED — +assertNextButtonHidden()
  fixtures/
    game-fixtures.ts                            # MODIFIED — +FailedGameplayFlowState, +createFailedGameplayFlowState()
spec/
  FM-966-level-failed-e2e-automation.md         # NEW/REWRITTEN — this document
```

No changes to `e2e/constants/selectors.ts`, `e2e/constants/timeouts.ts`, `e2e/pages/gameplay-page.ts`, any `tc-001`–`tc-017` isolated spec file, or any `src/**` production file.

---

# 7. File-Level Implementation Plan

### `e2e/helpers/game-state-helpers.ts` (modified)
- `getWrongStonePositionForCurrentPuzzle(page): Promise<{x,y,text}|null>` — added directly after `getCorrectStonePositionForCurrentPuzzle`; same scene/flowManager/stoneHandler resolution, inverted match predicate (`s.text !== correctText && !targetStones.includes(s.text)`).
- `completeAssessmentSurveyWithWrongAnswers(page, maxQuestions=20): Promise<number>` — added directly after `completeAssessmentSurvey`; identical loop skeleton and stop conditions, calls `getWrongAssessmentAnswer`/drags `wrongBtnId` instead of the correct counterparts.

### `e2e/helpers/index.ts` (modified)
- Barrel-exports `getWrongStonePositionForCurrentPuzzle` and `completeAssessmentSurveyWithWrongAnswers` from `./game-state-helpers`.

### `e2e/pages/level-end-page.ts` (modified)
- `assertNextButtonHidden(): Promise<void>` — `await expect(this.nextButton).toBeHidden({ timeout: Timeouts.domUpdate });`

### `e2e/fixtures/game-fixtures.ts` (modified)
- `FailedGameplayFlowState` interface (`capturedStonePos`, `monsterHitboxCenter`, `assessmentTriggerPuzzle`, `miniGameTriggerPuzzle`, `totalPuzzleCount`) + `createFailedGameplayFlowState()` factory.

### `e2e/tests/isolated/tc-018-023-failed-level-replay.spec.ts` (new)
- `export function registerTests(getPage: () => Page, state: FailedGameplayFlowState): void` — registers all six `test()` blocks via private `_tc018`…`_tc023` functions, mirroring the `_tc009`…`_tc013` shape in `tc-009-013-assessment.spec.ts`.
- Local `dragStoneToHitbox()` helper duplicated file-locally, matching the existing convention (the same function is duplicated, not shared, in `tc-009-013-assessment.spec.ts`).
- See §4 for the per-TC behavior; each TC step mirrors its natural-flow counterpart with the stone-selection/verification swaps described above.

### `e2e/tests/ftm-assessment-survey-flow.spec.ts` (modified)
- New import: `import { registerTests as tc018_023 } from './isolated/tc-018-023-failed-level-replay.spec';`
- New state: `const failedState = createFailedGameplayFlowState();`
- New registration, appended after the existing `tc017(() => page);` line: `tc018_023(() => page, failedState);`
- Header comment and `test.describe.serial` title updated to reflect the new `TC_001 – TC_023` range.

### `e2e/tests/README.md` (modified)
- TC range references (`FTM_TC_0017` → `FTM_TC_0023`), TC counts (17→23, 8→9 isolated files), new table row for `tc-018-023-failed-level-replay.spec.ts`, and the "one exception" note extended to cover both `tc-017` and `tc-018-023`.

**No changes required to:** `e2e/constants/selectors.ts`, `e2e/constants/timeouts.ts`, `e2e/pages/gameplay-page.ts`, any `tc-001` through `tc-017` isolated spec file, any `src/**` file.

---

# 8. Performance Considerations

- **CPU/Memory:** negligible — six additional tests reusing the already-open browser context and the same helper infrastructure as `FTM_TC_009`–`FTM_TC_015`.
- **Rendering optimization:** uses `waitForPuzzleAdvance()`/`waitForStonesReady()` polling instead of fixed sleeps to confirm each wrong drop's completion, since incorrect drops render no feedback text to poll for.
- **Asset loading:** none new — reuses the already-loaded level 2 data from the `FTM_TC_017` replay.
- **Mini-game timing:** `FTM_TC_021` polls `speedUpMiniGame()` every 500ms for up to 15s to fast-forward the `OpenedChest` state's timer without any clicks, keeping this test's added runtime close to `FTM_TC_014`/`FTM_TC_015`'s existing budget despite not auto-clicking stones.
- **Known limitation — animation/audio not asserted:** as with the initial (pre-implementation) analysis, the SAD Rive animation and `AUDIO_LEVEL_LOSE` playback cannot be asserted via DOM — coverage is limited to DOM-observable outcomes (star count, button visibility) plus the underlying score math, which unlike a purely synthetic test is now genuinely exercised end-to-end.
- **Offline / low-end device considerations:** out of scope — no offline test lane or device-emulation matrix exists in the current suite.
- **Measurable expectation:** the six new tests add real gameplay time proportional to the level's puzzle count (each wrong drop costs ~1.7s incorrect-feedback delay vs. ~4s for a correct one — the wrong-answer flow is actually *faster* per puzzle) plus the assessment's bucket-fail cascade (bounded, typically fewer questions than a full correct run) and the mini-game's fixed animation timers (~15-20s, same order as the existing passing-flow tests).

---

# 9. Risks

| Risk | Type | Mitigation |
|---|---|---|
| Word-puzzle drags that pass *through* a correct stone mid-drag could accidentally register as a hover-pickup swap (per `gameplay-input-manager.ts`'s hover-check logic), turning an intended wrong drop into a correct one | Technical / fidelity | `getWrongStonePositionForCurrentPuzzle()` picks up the wrong stone directly (mousedown on it) and drags straight to the hitbox, mirroring the exact same direct-pickup pattern the correct-answer helper and `dragStoneToHitbox()` already use — no intermediate stone crossing is introduced beyond what the existing, proven correct-answer tests already do. |
| Clicking a mini-game stone during `FTM_TC_021` would set `treasureChestScore > 0`, routing to the Progress Jar scene instead of Level End and breaking every downstream TC | Technical / correctness | `FTM_TC_021` deliberately clicks **zero** stones and only calls `speedUpMiniGame()` (a timer-jump with no scoring side effect) — verified directly via a `treasureChestScore === 0` assertion at the end of the test, so a future regression here fails loudly rather than silently routing to the wrong scene. |
| The assessment survey's RandomBST bucket-fail cascade is a third-party (`@curiouslearning/assessment-survey`) implementation detail; if a future package update changes its termination behavior, `completeAssessmentSurveyWithWrongAnswers()` could loop longer than expected | Technical / dependency | Bounded by the same `maxQuestions = 20` safety guard the correct-answer `completeAssessmentSurvey()` already uses; `FTM_TC_020` also has multiple independent stop-condition checks (coordinator flag, overlay visibility) so it degrades gracefully rather than hanging indefinitely. |
| `FTM_TC_017`/`FTM_TC_018`–`023` run after `FTM_TC_001`–`016` in the serial suite — a failure earlier in the chain blocks these from running at all | Deployment / CI | No mitigation needed beyond normal review; same blast-radius profile the suite has always had (`test.describe.serial`). |
| `tc-018-023-failed-level-replay.spec.ts` cannot run standalone via `npm run test:e2e:isolated` — it depends on `FTM_TC_017` having already replayed the level in the same `getPage()` session | Test-design / isolation | Documented explicitly in `e2e/tests/README.md` as the second file (alongside `tc-017`) that is not independently runnable — consistent with the precedent FM-967 already established, not a new category of limitation. |
| The `assessmentTriggerPuzzle === 0` ("not eligible") branch in `FTM_TC_019`/`020`/`022` is real code but is **not exercised by the current CI/local run**, since this level's real config is naturally assessment-eligible (§13) — if a future remote-config change makes it ineligible, this branch runs for the first time without prior validation. A further edge case is untested: if the level is assessment-ineligible but still mini-game-eligible (`miniGameTriggerPuzzle > 0`, an independent flag per `shouldShowMiniGame()`), the mini-game could trigger *mid-loop* inside `FTM_TC_019`'s "drag wrong through the whole level" branch (via `continueAfterPuzzleStep`'s standalone mini-game check, decoupled from the assessment path), which `FTM_TC_019`'s current loop does not account for | Test-design / coverage gap | Left as an explicit, documented gap rather than speculatively coded and left unverified (per this codebase's preference for driving real, verifiable behavior over defensive code for untriggerable paths — see §4's "Correction" note, which removed a different form of unverified speculative handling). Flagged as Open Question 4 for whether it's worth pursuing a remote-config-controlled fixture to exercise deliberately. |

---

# 10. Acceptance Criteria Mapping

| # | Acceptance Criterion | Implementation | Validation | Expected Outcome |
|---|---|---|---|---|
| 1 | Automate the Level Failed gameplay flow using existing framework | `tc-018-023-failed-level-replay.spec.ts`, mirroring the `FTM_TC_009`–`FTM_TC_013` natural-flow pattern | Code review against existing isolated-spec conventions | Test file structurally consistent with siblings |
| 2 | Validate the Level Failed screen displays when the player fails | `FTM_TC_023` step 1 — `assertLevelEndVisible()` after a genuine all-wrong playthrough | `expect(container).toBeVisible()` | `#levelEnd` renders naturally with `starCount = 0` |
| 3 | Verify all expected UI elements on the Level Failed screen | `FTM_TC_023` steps 2-5 — star count, Next hidden, Map visible, Retry visible | `assertStarCount(0)`, new `assertNextButtonHidden()`, `assertMapButtonVisible()`, `assertRetryButtonVisible()` | All four elements render per `renderButtonsHTML()`'s failure branch |
| 4 | Ensure the failed level state is captured correctly before displaying the screen | The ENTIRE TC_018–TC_022 chain — real wrong drops through `handleStoneDropResult`/`handleLevelCompletion`, not a synthetic event | `treasureChestScore === 0` assertion (TC_021) + `assertStarCount(0)` (TC_023) prove the score pipeline, not just the UI, produced the failure | Score-driven failure state is genuinely computed by production code, then correctly rendered |
| 5 | Integrate the automation into the existing FTM E2E test suite | Registration in `ftm-assessment-survey-flow.spec.ts` after `tc017`, zero changes to earlier registrations | `npm run test:e2e` includes TC_018–TC_023 in output | All six TCs appear in the default suite run + HTML/JUnit report |
| 6 | Follow existing framework standards, reusable helpers, coding conventions | Two structural-mirror helpers, one structural-mirror page-object method, one structural-mirror fixture type — zero novel abstractions | Code review | No new duplication beyond the established per-file `dragStoneToHitbox` convention |
| 7 | Execute reliably in CI with consistent, non-flaky results | Explicit polling (`waitForPuzzleAdvance`, `waitForStonesReady`, bounded assessment loop) instead of arbitrary sleeps | 20-run CI flake check (see §13) | 0 flakes across ≥20 consecutive CI runs |

---

# 11. Unit Testing

This is an E2E-only change — no `src/**` production code is modified, so no new Jest unit tests are required by this ticket. Existing unit coverage in `src/scenes/levelend-scene/levelend-scene.spec.ts` (SAD-animation branch around line 193-207, `renderButtonsHTML()` branching around lines 228-355) and `src/data/game-score.ts`'s implicit coverage via other specs remain the unit-level safety net; this ticket's E2E tests are complementary, proving the full browser-observable pipeline (real drag → real score → real render) rather than any single isolated method call.

- **Files to test:** none new.
- **Scenarios/edge cases/mocks:** n/a (no unit-level code change).
- **Coverage recommendation:** no change to current Jest coverage thresholds expected.

---

# 12. End-to-End Testing

**Happy path (of the failure flow):**
- `FTM_TC_018`→`FTM_TC_023`: replayed Level 2 driven with wrong answers throughout (main puzzles + assessment) → mini-game completes with zero clicks → Level End renders with 0 stars, no Next, Retry+Map visible → flow ends, no further clicks.

**Regression scenarios:**
- Full `npm run test:e2e` run (TC_001–TC_023) confirms no ordering/state regressions from appending TC_018–TC_023 after TC_017, and that TC_001–TC_017 are unaffected.

**Negative scenarios:**
- `FTM_TC_018`–`FTM_TC_023` themselves *are* the negative-outcome (failure) scenarios the rest of the suite does not cover.

**Offline scenarios:** out of scope — no offline test lane exists in the current suite.

**Low-end device scenarios:** out of scope — Chromium-only per `playwright.config.ts`.

**Performance validation:** confirm total added runtime via before/after comparison of `npm run test:e2e:report` duration; expected increase driven mainly by the mini-game's fixed animation timers (~15-20s) and the assessment's bucket-fail cascade, both bounded.

**Cross-browser/platform validation:** not applicable — suite is Chromium-only.

---

# 13. Rollout Strategy

**Implementation order (as executed):**
1. Confirmed wrong-answer mechanics are mechanically safe (research, no source-code changes).
2. Added `getWrongStonePositionForCurrentPuzzle` + `completeAssessmentSurveyWithWrongAnswers` to `game-state-helpers.ts`; barrel-exported via `helpers/index.ts`.
3. Added `LevelEndPage.assertNextButtonHidden()`.
4. Added `FailedGameplayFlowState`/`createFailedGameplayFlowState()` to `game-fixtures.ts`.
5. Authored `tc-018-023-failed-level-replay.spec.ts`.
6. Registered in the orchestrator, immediately after `tc017(() => page)`.
7. Updated `e2e/tests/README.md`.
8. Typechecked (`tsc --noEmit` against `e2e/tsconfig.json`) and ran the full `npm run test:e2e` suite. The first run caught the mini-game-already-completed issue above (`FTM_TC_021` timed out waiting for a treasure canvas that correctly never appears on replay); fixed with the `miniGameTriggerPuzzle === 0` branch and re-ran (23/23 passed).
9. Code review caught the unsafe eligibility-injection issue in §4 ("Correction" subsection); removed the mutation, modeled `assessmentTriggerPuzzle === 0` as its own branch across `FTM_TC_019`/`020`/`022`, and re-ran the full suite again.
10. Final confirmed run: **23/23 passed in 6.5 minutes** (`TC_001`–`TC_023`), including `FTM_TC_017` immediately preceding the new tests — `TC_001`–`TC_017` timings and outcomes are consistent with pre-existing behavior. `FTM_TC_020` took 48.7s of genuine wrong-answer assessment interaction (not a skip), confirming the replayed level's real configuration is assessment-eligible in this environment and the not-eligible branch is exercised only defensively, not in the current CI path.

**Deployment strategy:** standard PR → CircleCI `node/test` + `e2e-tests` jobs must pass before merge. No feature flag needed (test-only change).

**Rollback plan:** revert the PR; no production/runtime code is touched, so rollback carries zero user-facing risk.

**Monitoring requirements:** watch the `e2e-tests` CircleCI job's HTML/JUnit report for the first several post-merge runs to catch any latent flake in the new tests, particularly around the assessment bucket-fail cascade timing.

**Success metrics:** TC_018–TC_023 green on `main`/`develop` for the first 20 consecutive CI runs; TC_001–TC_017 pass rate unaffected.

---

# 14. Open Questions

1. Should the QA Test Case spreadsheet (linked in the ticket) be updated with the new `TC_0018`–`TC_0023` rows as part of this ticket's Definition of Done, or tracked as a separate QA-doc task? (`e2e/tests/README.md` already notes `TC_017` wasn't reflected in the sheet either — same gap would extend to these six.)
2. Is it acceptable for `tc-018-023-failed-level-replay.spec.ts` to remain non-independently-runnable via `npm run test:e2e:isolated` (depending on `FTM_TC_017` having run first in the same session), consistent with the precedent FM-967 already established for `tc-017`, or should a future ticket give this flow its own self-contained entry point (e.g., via the `atGameplay` fixture plus a scripted set of wrong losses) so it can be debugged in isolation?
3. The assessment survey's bucket-fail behavior is third-party (`@curiouslearning/assessment-survey`) and version-pinned via `package.json`; should a changelog/version-bump on that dependency trigger a mandatory re-run of `FTM_TC_020` specifically, given it is now the only test in the suite that depends on the package's *failure* path rather than its success path?
4. The `assessmentTriggerPuzzle === 0` branch (§9) is real but currently unverified by any CI run, since this level's config is naturally eligible. Is it worth a follow-up ticket to add a dedicated fixture/mock that forces `assessmentTriggerPuzzle = 0` (and, separately, one where it's `0` while `miniGameTriggerPuzzle > 0`) so this branch — and the mid-loop mini-game interaction it could expose — gets genuine coverage instead of remaining a documented-but-untriggered code path?
