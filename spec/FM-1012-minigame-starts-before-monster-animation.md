# FM-1012 — Mini-Game Starts Before the Monster Finishes Its Reaction Animation

> Generated via Spec-Driven Development (SDD) process. Source template: `SDD-template/SDD-TEMPLATE.md`.
> Implementation status: **in progress** — branch `fm-1012`. Fix in `src/scenes/gameplay-scene/gameplay-flow-manager.ts`.
> Follow-up to **FM-973** (`spec/FM-973-minigame-pause-freeze-fix.md`): FM-973 made the chest *appear*; FM-1012 makes it appear at the *right time*.

## Ticket Context

| Field | Value |
|---|---|
| Key | FM-1012 |
| Summary | Mini-game triggers before puzzle audio/SFX finishes, interrupting Rive animation |
| Type | Bug |
| Project | FM — Feed The Monster |
| Priority | Medium |
| Status | In Progress |
| Reporter | Ashish M |
| Assignee | Bernhard Cena |
| Created | 2026-08-20 |

**Jira Description (verbatim):**

> **Describe the bug**
> The gameplay is no longer getting stuck. However, a small issue was noticed during testing: when a wrong answer is given for a puzzle and the mini-game is triggered, the mini-game appears before the puzzle's SFX/audio has finished playing, which also interrupts the Rive animation.
>
> **To Reproduce**
> - Download the latest test build and select any language which does not have Assessment in it (e.g. Hindi)
> - Download FTM and start the game
> - Play through the game till level 2, and in level 2 give wrong answers for each puzzle until the mini-game is triggered
> - When the mini-game is about to display, the issue can be observed
>
> **Expected behavior**
> The mini-game should be triggered only after all puzzle audio and SFX have finished playing.
>
> **Smartphone:** Device: All · OS: All · Browser: All · Version: All
>
> **Environment:** All environments
>
> **Additional context:** None.

Working summary (from investigation, pending the verbatim ticket): On the puzzle segment that triggers the treasure-chest mini-game, the Rive monster is cut off mid-reaction — the chest/mini-game takes over the screen before the monster finishes its eat/spit/sad (or eat/happy) animation. There is **no error or stuck state** (that was FM-973); this is purely a timing/sequencing issue.

### Business Goal
Preserve the emotional beat of the monster's reaction (success celebration / failure "sad") on the mini-game trigger puzzle. Cutting the animation short makes the transition feel abrupt and janky for children and undercuts the feedback the reaction is meant to deliver.

### Problem Statement
`GameplayFlowManager.continueAfterPuzzleStep()` published `MINI_GAME_WILL_START` **synchronously** the instant it decided a mini-game was due. PubSub is synchronous, so the `GameplayScene` subscriber ran immediately → `suspendGameplayActivity()` → `monsterController.pause()`, which **pauses the Rive monster's playback**. On the incorrect path this publish fires ~1.7s after the stone drop (when the feedback audio callback emits `LOAD_NEXT_GAME_PUZZLE`), but the failure animation's final `isSad` phase is not scheduled to trigger until **2500–3000ms** (phase-dependent, `monster-controller.ts:18–23`). The monster was therefore frozen mid-`isSpit`, before `isSad` ever played, at the exact moment the chest appeared.

### Acceptance Criteria
1. On the mini-game trigger puzzle, the monster's reaction animation (success or failure) is given time to play before the mini-game pauses the monster.
2. `MINI_GAME_WILL_START` is still published **before** `miniGameHandler.start()` on **both** the correct (start @1500ms) and incorrect (start @3000ms) paths, so the scene clears stones / suspends gameplay before the chest starts.
3. The mini-game still appears and animates on its trigger puzzle — FM-973 behavior is not regressed (standard flow and assessment→mini-game combined flow).
4. The publish delay is **derived from the existing `miniGameDelay`**, not a standalone hardcoded animation-duration constant that can drift out of sync.
5. Existing unit tests (`gameplay-flow-manager.spec.ts`, `gameplay-scene.spec.ts`) remain green, and new tests assert the publish-before-start ordering on both paths.

---

# 1. Executive Summary

On the puzzle that triggers the treasure-chest mini-game, the monster's reaction animation was being cut off — the chest took over before the monster finished celebrating (correct) or reacting sad (incorrect). The cause is a sequencing problem: `MINI_GAME_WILL_START` was published synchronously, and the scene's subscriber immediately pauses the Rive monster. Because the monster's reaction is a multi-phase animation whose final phase triggers 2.5–3.0s in, pausing it the moment the mini-game was scheduled froze it mid-reaction.

- **Business objective:** keep the monster's reaction beat intact through the mini-game transition so the moment reads as intentional, not clipped.
- **Expected user impact:** the monster visibly finishes its success/fail animation, then the chest appears; no more "monster stops dead" frame.
- **Success metrics:** on affected levels, the reaction animation completes before the chest pauses the monster on 100% of trigger-puzzle completions (both correct and incorrect answers, both standard and combined flows); publish-before-start ordering holds on both paths; unit suites stay green.

The fix is a single-file change in `src/scenes/gameplay-scene/gameplay-flow-manager.ts`: defer the `MINI_GAME_WILL_START` publish onto the scheduler at `publishDelay = miniGameDelay - 500`, so (a) the reaction animation plays before the monster is paused, and (b) the publish still lands 500ms ahead of `miniGameHandler.start()` on both paths.

---

# 2. Current State Analysis

**Reaction animation (unchanged):**
- `GameplayFlowManager.handleStoneDropResult()` (`gameplay-flow-manager.ts:296`) plays `monsterController.playSuccessAnimation()` on correct, `playFailureAnimation()` on incorrect (lines 299/301).
- `MonsterController.playFailureAnimation()` (`monster-controller.ts:82`) is a three-phase sequence — `isChewing` → `isSpit` → `isSad` — each phase fired on a **phase-dependent delay** from `animationDelays` (`monster-controller.ts:18–23`): `isSpit` at 1000–1500ms and `isSad` at **2500–3000ms**. `playSuccessAnimation()` is `isChewing` → `isHappy` (`isHappy` @1700ms).
- `MonsterController.pause()` (`monster-controller.ts:97`) pauses the underlying Rive playback, freezing whatever frame is showing.

**Flow → mini-game launch (this file):**
- On the incorrect path, `FeedbackAudioHandler.playIncorrectFeedbackSound()` schedules `audioEndCallback()` at **1700ms** (`feedbackAudioHandler.ts:75–77`), which publishes `LOAD_NEXT_GAME_PUZZLE`. On the correct path the callback fires ~**4000ms** after the audio settles (`feedbackAudioHandler.ts:97–99`).
- `LOAD_NEXT_GAME_PUZZLE` → `handleLoadNextGamePuzzle()` → `determineNextStep()` (`gameplay-flow-manager.ts:125`). `nextStepDelay = isCorrect ? 1500 : 3000` (line 133) is passed as **both** `loadPuzzleDelay` and `miniGameDelay` into `continueAfterPuzzleStep()` (line 152).
- `continueAfterPuzzleStep()` (`gameplay-flow-manager.ts:160`): when `currentPuzzleSegment === levelForMinigame && !hasShownChest`, it publishes `MINI_GAME_WILL_START` and schedules `miniGameHandler.start()` at `miniGameDelay`.

**Subscriber (the trigger):**
- `GameplayScene` subscribes to `MINI_GAME_WILL_START` (`gameplay-scene.ts:543`): sets `isActiveMiniGame`/`isMiniGamePaused`, clears stones, and calls `suspendGameplayActivity()` (line 553) → `monsterController?.pause()` (line 366). The symmetric exit is `IS_MINI_GAME_DONE` → `resumeGame()` (lines 560/567).

**PubSub (root enabler):** `PubSub.publish()` invokes subscribers **synchronously, inline** — so publishing `MINI_GAME_WILL_START` pauses the monster before the publishing line returns (same mechanism FM-973 documented).

**Current limitation:** the publish (which pauses the monster) was pinned to the *decision* moment, not to *when the reaction animation is done*. There was no delay between "we will show a mini-game" and "freeze the monster."

---

# 3. Root Cause Analysis

This is a sequencing/timing bug, not a mini-game or animation-logic bug.

**Incorrect-answer timeline (before fix), t measured from the stone drop:**
1. `t≈0` — `playFailureAnimation()` schedules `isChewing@0`, `isSpit@~1000–1500`, `isSad@~2500–3000` (per phase).
2. `t≈1700` — feedback audio callback publishes `LOAD_NEXT_GAME_PUZZLE` → `determineNextStep(false)` → `continueAfterPuzzleStep(…, 3000, 3000)`.
3. `t≈1700` — `MINI_GAME_WILL_START` published **synchronously** → subscriber → `monsterController.pause()`. **The monster freezes mid-`isSpit`, before `isSad` has triggered.**
4. `t≈3000` — `miniGameHandler.start()` renders the chest over a monster that never finished reacting.

The monster's animation phases are scheduled on the (FM-973-fixed, still-running) scheduler, so `isSad`'s input may still *fire* — but with Rive playback paused it does not visually advance. The net effect on screen is a monster that stops dead the moment the chest appears.

**Why a naïve fixed delay is the wrong fix:** an earlier iteration hardcoded `failureAnimationDuration = 2500` for the publish while leaving `start` at `miniGameDelay`. That number (a) duplicates timing knowledge that already lives in `MonsterController.animationDelays` and is too short for phases 0/2/3, and (b) **inverts the publish/start ordering on the correct path**: correct-answer `miniGameDelay` is 1500, so `start@1500` would fire *before* `publish@2500`, launching the chest while stones are still on screen and the monster un-suspended. The real requirement is a *relationship* (publish strictly before start), not a magic constant.

- **Runtime bottleneck:** the pause was coupled to the scheduling decision instead of to animation completion.
- **No CPU/memory/offline dimension** — pure control flow.

---

# 4. Proposed Solution

**High-level approach:** defer the `MINI_GAME_WILL_START` publish onto the scheduler, at a delay **derived from `miniGameDelay`**:

```ts
// gameplay-flow-manager.ts — continueAfterPuzzleStep()
const publishDelay = miniGameDelay - 500;

this.timeoutRegistry.setTimeout(() => {
  miniGameStateService.publish(
    miniGameStateService.EVENTS.MINI_GAME_WILL_START,
    { level: currentPuzzleSegment }
  );
}, publishDelay);

this.timeoutRegistry.setTimeout(() => {
  this.miniGameHandler.start();
}, miniGameDelay);
```

This yields, relative to `continueAfterPuzzleStep`:

| Path | `miniGameDelay` (start) | `publishDelay` (pause monster) |
|---|---|---|
| Incorrect | 3000 | 2500 |
| Correct | 1500 | 1000 |

**Why this approach:**
- **Ordering is guaranteed on both paths.** `publishDelay` is always `miniGameDelay − 500`, so the publish (and therefore stone-clear + monster-suspend) always lands 500ms *before* `miniGameHandler.start()`. The original "publish before start" invariant is restored — including on the correct path the fixed-2500 iteration broke.
- **No new magic number.** The delay is derived from the delay already flowing through the function, not a second hand-tuned copy of the animation length.
- **The reaction animation gets its window.** On the incorrect path the pause now lands ~4200ms after the drop (1700 + 2500), well after `isSad` triggers, so the failure reaction plays before the freeze. On the correct path the pause lands after `isHappy`.

**Alternatives considered:**
- *Hardcode `failureAnimationDuration = 2500` for the publish.* Rejected — duplicates `MonsterController.animationDelays`, is too short for phases 0/2/3, and reverses publish/start ordering on the correct path (`start@1500` < `publish@2500`).
- *Gate the monster pause on an animation-complete signal instead of a timer.* Cleaner in principle (removes all timing coupling) but a larger change touching `MonsterController`/Rive callbacks; deferred as a future improvement (see §14).
- *Only delay on the incorrect path.* Rejected as unnecessary branching — the derived `miniGameDelay − 500` already produces correct behavior on both paths with one expression.

**Trade-off:** the fix still leans on the upstream feedback-audio delays (1700ms incorrect / ~4000ms correct) to give the reaction its head start. That coupling is pre-existing and acceptable for this ticket; the animation-complete-signal approach in §14 would remove it entirely.

---

# 5. Architecture Hooks

- **Components affected:** `GameplayFlowManager` only. `GameplayScene`, `MonsterController`, `FeedbackAudioHandler`, `MiniGameHandler` are unchanged (the scene edits from investigation were debug logs, reverted).
- **Services/events:** `miniGameStateService.MINI_GAME_WILL_START` (now published on a deferred scheduler timer); the custom `Scheduler` via `TimeoutRegistry`.
- **Lifecycle / state management:** no state flags change. `hasShownChest` is still set synchronously when the branch is entered, so re-entrancy is unaffected; only the *publish* moves onto a timer.
- **Rendering / animation path:** `MonsterController.pause()` (Rive playback) now runs after the reaction animation window instead of at the scheduling instant.
- **Audio flow:** unchanged — the fix consumes the existing feedback-audio callback timing, it does not alter it.
- **Integration point:** `handleCombinedModeTransition()` (`gameplay-flow-manager.ts:252`) still publishes `MINI_GAME_WILL_START` synchronously; that path is intentionally untouched (see §9/§14).

---

# 6. Folder Structure

Existing files modified:

```
src/
  scenes/
    gameplay-scene/
      gameplay-flow-manager.ts        # defer publish to miniGameDelay - 500
      gameplay-flow-manager.spec.ts   # + two publish-before-start ordering tests
```

New files created: `spec/FM-1012-minigame-starts-before-monster-animation.md` (this document).
Files removed: none.

(All `TEST`/debug `console.log` scaffolding added during investigation — across `gameplay-flow-manager.ts` and `gameplay-scene.ts` — has been reverted. `gameplay-scene.ts` carries no net change.)

---

# 7. File-Level Implementation Plan

### `src/scenes/gameplay-scene/gameplay-flow-manager.ts` (modified)
- **Purpose:** stop the mini-game from freezing the monster before its reaction animation completes, while preserving publish-before-start ordering.
- **Required changes:**
  1. In `continueAfterPuzzleStep()`, remove the synchronous `miniGameStateService.publish(MINI_GAME_WILL_START, …)`.
  2. Add `const publishDelay = miniGameDelay - 500;` and wrap the publish in `this.timeoutRegistry.setTimeout(() => { … }, publishDelay)`.
  3. Keep the `miniGameHandler.start()` timer at `miniGameDelay`.
  4. Doc comment explaining that the publish must precede the start and gives the reaction animation its window — so it is not "simplified" back to a synchronous publish.
- **Public APIs affected:** none. `continueAfterPuzzleStep()` is private; its signature is unchanged.
- **Internal methods affected:** `continueAfterPuzzleStep()` body only.

### `src/scenes/gameplay-scene/gameplay-flow-manager.spec.ts` (modified)
- **Purpose:** lock in the ordering guarantee and prevent the fixed-constant regression from returning.
- **Required changes:** add two tests (see §11). The pre-existing `runs assessment before mini-game on the same puzzle segment` test is repaired by the fix (the `miniGameDelay = 0` path now yields `publishDelay = -500`, which the scheduler fires on the next tick).

---

# 8. Performance Considerations

- **CPU:** neutral — one extra scheduler timer per mini-game trigger (one per level at most), no per-frame work added.
- **Memory:** neutral — the timer is tracked and cleared by `TimeoutRegistry` on dispose, same as the existing start timer.
- **Rendering:** improved perceived quality — the reaction animation completes instead of freezing; no change to frame cost.
- **Low-end devices / offline:** no change — logic-only, no asset or network work.

---

# 9. Risks

| Risk | Assessment | Mitigation |
|---|---|---|
| `publishDelay` is negative on the post-assessment path (`miniGameDelay = 0` → `-500`) | **Low / verified.** The custom `Scheduler` treats a non-positive `remaining` as "fire on next `update()`", and timers fire in registration order, so publish still precedes start. | Covered by the (now passing) `runs assessment before mini-game` test. Optional hardening: `Math.max(miniGameDelay - 500, 0)` — deferred, out of scope for this ticket. |
| Reaction animation still not fully finished before pause on the slowest phases (`isSad` @3000, phase 0/3) | **Low.** On the incorrect path the pause lands ~4200ms after the drop, after `isSad` triggers; the sad clip has ~1s+ to play. | Manual QA across monster phases; §14 tracks the animation-complete-signal approach for a coupling-free guarantee. |
| Combined-mode (`handleCombinedModeTransition`) still publishes synchronously | **Low.** In that flow the assessment overlay has been on screen long enough that the reaction animation has finished, so an immediate pause is harmless. | Documented as intentional (§5); §14 open question to confirm on device. |
| Someone re-inlines the publish as synchronous | **Medium (maintainability).** | Doc comment on the publish timer; the two ordering unit tests fail if publish stops preceding start. |
| Regression to FM-973 (chest not appearing) | **Very low.** The chest's `start()` path and scheduler behavior are unchanged; only the publish moves onto a timer. | Existing flow-manager + scene specs; E2E mini-game render check. |

---

# 10. Acceptance Criteria Mapping

| # | Criterion | Implementation | Validation | Expected outcome |
|---|---|---|---|---|
| 1 | Reaction animation plays before monster is paused | Publish (→ `monsterController.pause()`) deferred to `miniGameDelay - 500` | Unit: publish not called before `publishDelay`; manual: monster finishes reaction on trigger puzzle | Monster completes reaction, then chest |
| 2 | Publish precedes start on both paths | `publishDelay = miniGameDelay - 500` (always < `miniGameDelay`) | Unit: `publish` `invocationCallOrder` < `start` on both correct & incorrect | Ordering holds |
| 3 | Mini-game still appears (no FM-973 regression) | `start()` timer unchanged | Unit: `miniGameHandler.start` called once; E2E: `#treasurecanvas` renders content | Chest visible/animating |
| 4 | Delay derived, not a magic constant | Uses `miniGameDelay`, no `failureAnimationDuration` literal | Code review / diff | No decoupled duration constant |
| 5 | Suites green + new ordering coverage | Fix + two new tests | `npm test` (`gameplay-flow-manager.spec.ts`, `gameplay-scene.spec.ts`) | All pass |

---

# 11. Unit Testing

- **File under test:** `src/scenes/gameplay-scene/gameplay-flow-manager.ts` (the publish/start scheduling in `continueAfterPuzzleStep`).
- **Harness:** the existing spec drives the custom scheduler with `scheduler.update(ms)` (`TimeoutRegistry` is scheduler-backed), mocks `miniGameStateService`, and uses `invocationCallOrder` for ordering assertions — reuse this pattern.
- **New scenarios (added):**
  1. *Incorrect answer* — set `shouldShowMiniGame → 1`, `shouldStartAssessmentAtPuzzle → false`; `determineNextStep(false, false)`; after `scheduler.update(2500)` assert `MINI_GAME_WILL_START` published and `start` **not** yet called; after a further `update(500)` assert `start` called once; assert publish order < start order.
  2. *Correct answer (regression guard)* — same setup; `determineNextStep(true, false)`; after `scheduler.update(1000)` assert publish done and `start` not yet called; after `update(500)` assert `start` called once; assert publish order < start order. **This is the test that fails under the fixed-2500 iteration.**
- **Repaired existing test:** `runs assessment before mini-game on the same puzzle segment` — passes again because `publishDelay = -500` fires on the test's final `scheduler.update(0)`.
- **Edge/failure cases:** non-mini-game segment (`shouldShowMiniGame → 0`) → publish never called, `loadPuzzle` path taken.
- **Mocks required:** `miniGameStateService`, `miniGameHandler`, `monsterController`, `gameStateService`, `AssessmentFlowCoordinator` — all already patterned in the spec.
- **Result:** flow-manager spec 7/7, scene spec 12/12 (19/19 across both) at time of writing.

---

# 12. End-to-End Testing

- **Happy path (correct answer into mini-game):** play the trigger puzzle with a correct answer; assert the monster's success animation completes, then `#treasurecanvas` renders content (`assertCanvasHasContent`).
- **Failure path (incorrect answer into mini-game):** answer the trigger puzzle incorrectly; assert the monster's sad reaction plays before the chest appears.
- **Combined-mode path:** assessment on the same segment as the mini-game; assert the chest still appears after the survey closes (`handleCombinedModeTransition`).
- **Regression:** confirm FM-973 — the chest reliably appears and animates; confirm stones cleared and no interaction while the chest is up.
- **Negative:** level with no mini-game proceeds straight to the next puzzle, no chest.
- **Cross-platform:** Chromium (CI default); no platform-specific paths introduced.
- **Reuse:** `speedUpMiniGame`, `waitForMiniGameComplete`, `applyStandardMocks` for mini-game timing.

---

# 13. Rollout Strategy

- **Implementation order:** single commit on `fm-1012` — defer the publish, add doc comment, add the two ordering tests, add this spec.
- **Deployment:** branch → PR → CircleCI (`node/test` + `e2e-tests`) → merge → per-environment S3 deploy per existing pipeline.
- **Rollback plan:** revert the single commit; no data/schema/config migration.
- **Monitoring:** QA smoke on affected levels post-deploy; existing Sentry error tracking (no new error surface expected — this is a visual-timing fix).
- **Success metrics:** reaction animation completes before the chest on every trigger-puzzle completion in QA; unit + E2E suites green in CI.

---

# 14. Open Questions

1. **Animation-complete signal vs timer.** The robust long-term fix is to pause the monster on an actual Rive animation-complete callback rather than on a derived delay, removing the coupling to the feedback-audio timings. Worth a follow-up ticket?
2. **Combined-mode publish.** `handleCombinedModeTransition()` still publishes `MINI_GAME_WILL_START` synchronously. Confirm on device that the monster reaction is already complete by the time the assessment overlay closes (expected, since the survey is on screen for seconds).
3. **Negative-delay tidiness.** `miniGameDelay - 500` computes to `-500` on the post-assessment path. Functionally safe; do we want `Math.max(…, 0)` for readability, or keep the minimal change?
