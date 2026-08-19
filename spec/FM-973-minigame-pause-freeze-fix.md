# FM-973 — Mini-Game Fails to Appear After Pausing Gameplay (Scheduler Freeze)

> Generated via Spec-Driven Development (SDD) process. Source template: `SDD-template/SDD-TEMPLATE.md`.
> Implementation status: **in progress** — branch `fm-973`. Fix in `src/scenes/gameplay-scene/gameplay-scene.ts`.

## Ticket Context

| Field | Value |
|---|---|
| Key | FM-973 |
| Summary | Gameplay gets stuck when minigame is about to trigger — mobile + browser, test env |
| Type | Bug |
| Project | FM — Feed The Monster |
| Priority | Medium |
| Status | Review/QA |
| Reporter | Ashish M |
| Assignee | Bernhard Cena |
| Created | 2026-08-07 |

**Jira Description (verbatim):**
> **Describe the bug**
> In the gameplay screen, whenever a minigame is about to trigger, the gameplay flow gets stuck and does not move forward. This happens on both mobile and browser, in the test environment.
>
> **To Reproduce**
>
> * From the start screen, navigate to the gameplay screen.
> * Reach Level 2.
> * Start Level 2.
> * Gameplay gets stuck in the middle, right when the minigame is about to trigger.
>
> **Expected behavior**
> The gameplay flow should not get stuck, and the minigame should load properly.
>
> **Environment**
> Test
>
> **Additional context**
> None.

### Business Goal
Ensure the treasure-chest mini-game reliably appears and animates after its designated puzzle segment. A regression currently prevents the chest from ever rendering, silently removing the mini-game reward moment for children on affected levels.

### Problem Statement
When `MINI_GAME_WILL_START` is published from `GameplayFlowManager.continueAfterPuzzleStep()`, the `GameplayScene` subscriber ran `pauseGamePlay()`, which sets `isPaused = true`. PubSub is synchronous, so this pause happens *before* `continueAfterPuzzleStep()` schedules the mini-game's own start via `timeoutRegistry.setTimeout(...)`. That timer runs on the custom `Scheduler`, which only advances through `scheduler.update(deltaTime)` inside `GameplayScene.draw()` — a call gated on `!this.isPaused`. With `isPaused` now true, the scheduler is frozen, the deferred `miniGameHandler.start()` never fires, `TreasureChestMiniGame.start()` → `treasureAnimation.show()` is never called, and the mini-game canvas renders live-but-empty. Net effect: the chest never appears.

### Acceptance Criteria
1. After the mini-game trigger puzzle, the treasure chest appears and plays its animation (both the standard flow and the assessment→mini-game combined flow).
2. While the mini-game is on screen, main gameplay is still quieted: audio paused, timer rotation stopped, monster paused.
3. The mini-game start path must NOT set `isPaused = true` (the custom scheduler must keep advancing so the deferred start fires).
4. Existing `pauseGamePlay()` behavior (pause popup, assessment flow, visibility change) is unchanged for all other callers.
5. No new regressions: the level timer / stone interactions do not silently advance underneath the mini-game.
6. Existing unit tests (`gameplay-flow-manager.spec.ts`) remain green.

---

# 1. Executive Summary

The treasure-chest mini-game stopped appearing on its trigger puzzle. The chest's own start is scheduled through the game's **custom `Scheduler`** (via `TimeoutRegistry`), and that scheduler only advances while the game is **not** paused. But the code path that launches the mini-game published `MINI_GAME_WILL_START` first, and the `GameplayScene` subscriber synchronously called `pauseGamePlay()` — flipping `isPaused = true` **before** the mini-game's start timer was even registered. With the scheduler frozen, the deferred `miniGameHandler.start()` never fired, so `TreasureChestMiniGame.start()` → `treasureAnimation.show()` was never called and the chest never rendered.

- **Business objective:** restore the mini-game reward moment so children on affected levels see the treasure chest, and protect that path against re-breaking.
- **Expected user impact:** the chest reliably appears and animates after its puzzle segment; audio, timer, and monster still correctly quiet down while it's on screen.
- **Success metrics:** mini-game renders on 100% of trigger-puzzle completions across affected levels (both standard and assessment→mini-game combined flows); existing unit suite (`gameplay-flow-manager.spec.ts`) stays green; no regression in the level timer or stone interaction while the chest is up.

The fix is a single-file change in `src/scenes/gameplay-scene/gameplay-scene.ts`: extract the "quiet the gameplay" side-effects of `pauseGamePlay()` into a new `suspendGameplayActivity()`, and have the mini-game subscriber call **that** — quieting audio/timer/monster **without** setting `isPaused`, so the scheduler keeps running and the chest's start timer can fire.

---

# 2. Current State Analysis

**Frame loop & scheduler (unchanged):**
- `GameplayScene.draw()` (`src/scenes/gameplay-scene/gameplay-scene.ts:295`) advances the custom scheduler only when not paused: `if (!this.isPaused) { scheduler.update(deltaTime); } else { deltaTime = 0; }` (lines 297–303).
- The custom `Scheduler` (`src/services/scheduler.ts`) is deltaTime-driven: its `update()` (line 76) decrements each timer's `remaining` and fires callbacks. It has no wall-clock; if `update()` isn't called, no timer ever fires.
- `TimeoutRegistry` (`src/common/timeout-registry.ts`) wraps `scheduler.setTimeout`, so every `timeoutRegistry.setTimeout(...)` is subject to the pause gate above.

**Mini-game launch (unchanged flow):**
- `GameplayFlowManager.continueAfterPuzzleStep()` (`gameplay-flow-manager.ts:164`): when `currentPuzzleSegment === this.levelForMinigame && !this.hasShownChest`, it (a) publishes `MINI_GAME_WILL_START`, then (b) `this.timeoutRegistry.setTimeout(() => this.miniGameHandler.start(), miniGameDelay)`.
- The assessment→mini-game **combined mode** path (`handleCombinedModeTransition()`, line 244, guarded by `isCombinedMode` at line 198) publishes the same `MINI_GAME_WILL_START` event.
- `MiniGameHandler.start()` → `TreasureChestMiniGame.start()` → `treasureAnimation.show(...)` is what actually renders the chest. `TreasureChestMiniGame.update()` only *draws the current animation state*; with no prior `show()`, it draws nothing.

**Subscriber (the defective part):**
- `GameplayScene` subscribes to `MINI_GAME_WILL_START` (`gameplay-scene.ts:543`): sets `isActiveMiniGame = true`, `isMiniGamePaused = true`, clears stones, and — previously — called `pauseGamePlay()` inside `if (!this.isPaused)`.
- `pauseGamePlay()` (line 350) bundles two concerns: `this.isPaused = true` **and** three quieting side-effects (pause audio, stop timer rotation, pause monster).
- `IS_MINI_GAME_DONE` (line 560) sets `isActiveMiniGame = false` and, if `isMiniGamePaused`, calls `resumeGame()`.

**PubSub (root enabler):** `PubSub.publish()` (`src/events/pub-sub-events.ts`) invokes each subscriber **synchronously, inline** — despite the "asynchronous" wording in its docstring. So a subscriber's side-effects complete before the publishing line returns.

**Current limitation:** `pauseGamePlay()` is the only tool a caller has to quiet gameplay, and it inseparably sets `isPaused`. Any caller that needs the scheduler to keep running (the mini-game) cannot use it without freezing itself.

---

# 3. Root Cause Analysis

The bug is an ordering + coupling problem, not a mini-game logic bug:

1. `continueAfterPuzzleStep()` calls `miniGameStateService.publish(MINI_GAME_WILL_START, …)`.
2. Because PubSub is **synchronous**, the `GameplayScene` subscriber runs immediately and calls `pauseGamePlay()` → `this.isPaused = true`. Control has not yet returned to `continueAfterPuzzleStep()`.
3. `continueAfterPuzzleStep()` **then** registers the chest's start via `this.timeoutRegistry.setTimeout(…, miniGameDelay)` — a timer in the now-relevant custom scheduler.
4. On every subsequent frame, `draw()` skips `scheduler.update(deltaTime)` because `isPaused` is `true`. The chest's start timer's `remaining` never decrements.
5. `miniGameHandler.start()` never fires → `treasureAnimation.show()` never runs → **the chest never appears.**

**Why it looks like a render freeze specifically:** `draw()` still calls `miniGameHandler.update(realDeltaTime)` every frame (line 334, because `isActiveMiniGame` is true), so the mini-game *update loop* is alive — but it has nothing to draw because `show()` was gated behind the frozen start timer. The result is a live, empty `#treasurecanvas`.

- **Runtime bottleneck:** the single `isPaused` flag gates *both* the main-game clock and the scheduler that the mini-game depends on. There is no way to pause one without the other.
- **No CPU/memory/offline dimension** — this is pure control flow; nothing is leaked or exhausted.

---

# 4. Proposed Solution

**High-level approach:** separate "flag the game as paused" from "quiet the active gameplay." Extract the three side-effects of `pauseGamePlay()` into a new private method `suspendGameplayActivity()`. The mini-game subscriber calls `suspendGameplayActivity()` directly (quieting audio/timer/monster) but never sets `isPaused`, so `scheduler.update()` keeps running and the chest's deferred `start()` fires normally.

```ts
public pauseGamePlay(): void {
  this.isPaused = true;
  this.suspendGameplayActivity();   // unchanged behavior for all existing callers
}

private suspendGameplayActivity(): void {
  this.audioPlayer?.pauseAllAudios();
  this.uiManager.applyTimerRotation(false);
  this.monsterController?.pause();
}
```

Subscriber:
```ts
if (!this.isPaused) {
  this.suspendGameplayActivity();   // was: this.pauseGamePlay();
}
```

**Why this approach:** it is the minimal change that fixes the root cause. `pauseGamePlay()`'s public contract is preserved exactly (still sets `isPaused` + quiets), so the pause popup, assessment, and visibility-change callers are unaffected. The mini-game gets precisely what it needs.

**Alternatives considered:**
- *Decouple the scheduler from `isPaused` (advance it even when paused).* Rejected — the scheduler is intentionally pause-aware (its own docstring), and other paused states rely on that; a broad change risks unrelated regressions.
- *Schedule the chest start with native `window.setTimeout` instead of the custom scheduler.* Rejected — bypasses the game's own pause/lifecycle/disposal management (`TimeoutRegistry` tracks and clears timers on teardown), reintroducing exactly the leak class the registry exists to prevent.
- *Reorder so the timer is registered before the publish.* Rejected — fragile; still leaves `isPaused` true, freezing the scheduler for the rest of the mini-game.

**Trade-off:** with `isPaused` staying `false` during the mini-game, the main-game branch of `draw()` (gated on `isGameStarted`) keeps executing. This is safe because gameplay is already neutralized by other means (see §9), but it is a behavioral nuance worth documenting.

---

# 5. Architecture Hooks

- **Components affected:** `GameplayScene` (subscriber + pause methods). No other component's source changes.
- **Services/events:** `miniGameStateService` `MINI_GAME_WILL_START` / `IS_MINI_GAME_DONE` events; the custom `Scheduler` (via `TimeoutRegistry`).
- **Lifecycle / state management:** the `isPaused`, `isActiveMiniGame`, `isMiniGamePaused` flags on `GameplayScene`. The fix changes *which* flags the mini-game path sets (drops `isPaused`, keeps `isActiveMiniGame`/`isMiniGamePaused`).
- **Rendering path:** `GameplayScene.draw()` → `miniGameHandler.update()` (unchanged); the fix simply lets `scheduler.update()` keep running so `miniGameHandler.start()` can be reached.
- **Audio flow:** `audioPlayer.pauseAllAudios()` / `resumeAllAudios()` — invoked the same way, just relocated into `suspendGameplayActivity()`.
- **Integration point:** `resumeGame()` (line 344, fired by `IS_MINI_GAME_DONE`) remains the symmetric exit; it sets `isPaused = false` (already false), resumes audio and monster.

---

# 6. Folder Structure

Existing files modified:

```
src/
  scenes/
    gameplay-scene/
      gameplay-scene.ts      # extract suspendGameplayActivity(); subscriber uses it
```

New files created: none.
Files removed: none.

(All debug scaffolding added during investigation in `assessment-flow-coordinator.ts`, `timeout-registry.ts`, `miniGameStateService.ts`, `treasureChestMiniGame.ts`, and `gameplay-flow-manager.ts` has been reverted — those files carry no net change.)

---

# 7. File-Level Implementation Plan

### `src/scenes/gameplay-scene/gameplay-scene.ts` (modified)
- **Purpose:** fix the mini-game freeze by decoupling gameplay-quieting from the `isPaused` flag.
- **Required changes:**
  1. Add `private suspendGameplayActivity(): void` containing the three side-effects previously inside `pauseGamePlay()` (`audioPlayer?.pauseAllAudios()`, `uiManager.applyTimerRotation(false)`, `monsterController?.pause()`).
  2. Reduce `pauseGamePlay()` to `this.isPaused = true;` + `this.suspendGameplayActivity();`.
  3. In the `MINI_GAME_WILL_START` subscriber, replace `this.pauseGamePlay()` with `this.suspendGameplayActivity()` inside the existing `if (!this.isPaused)` guard.
  4. Add a doc comment on `suspendGameplayActivity()` explaining *why* it must not set `isPaused` (scheduler freeze), so it isn't "simplified" back into `pauseGamePlay()`.
- **Public APIs affected:** `pauseGamePlay()` — behavior **unchanged** (still sets `isPaused` + quiets). No signature change.
- **Internal methods affected:** new private `suspendGameplayActivity()`; `MINI_GAME_WILL_START` subscriber body.

---

# 8. Performance Considerations

- **CPU:** neutral. No new per-frame work; one method extraction and one call-site swap.
- **Memory:** neutral — no new allocations, no new timers. In fact the pre-fix state effectively leaked intent (a registered start timer that could never fire until teardown); post-fix it resolves normally.
- **Rendering:** the mini-game now renders as intended; per-frame cost is identical to a correctly-working baseline.
- **Low-end devices / offline:** no change — logic-only fix, no additional asset loads or network calls.

---

# 9. Risks

| Risk | Assessment | Mitigation |
|---|---|---|
| Level timer keeps counting under the chest (because `isPaused` stays false) | **Low / verified safe.** Timer tick in `GameplayUIManager.update()` (line 104) requires `shouldStartTimer`, which is `canUpdateTimer = … && stoneHandler.stonesHasLoaded` (`gameplay-scene.ts:319`). The subscriber's `clearAllStones()` → `disposeStones()` sets `stonesHasLoaded = false` (`stone-handler.ts:289`), so the timer does **not** advance. | Covered by clearing stones; add a regression test (see §11). |
| Stray stone interaction while chest is up | **Low.** Stones are disposed by `clearAllStones()`; `handleStoneLetterDrawing`/input have no stones to act on. | Existing behavior; assert no stones after event. |
| Someone re-collapses `suspendGameplayActivity()` back into `pauseGamePlay()` | **Medium (maintainability).** | Doc comment on the method explains the scheduler-freeze reason; unit test asserts the mini-game path does not set `isPaused`. |
| Resume asymmetry: `resumeGame()` does not call `applyTimerRotation(true)` | **Low / pre-existing.** Timer rotation is re-established when the next puzzle's timer starts. | Track as open question (§14), not introduced by this fix. |
| Regression risk to pause popup / assessment / visibility-change | **Very low.** `pauseGamePlay()`'s external contract is byte-for-byte preserved. | Existing tests + manual pause/resume check. |

---

# 10. Acceptance Criteria Mapping

| # | Criterion | Implementation | Validation | Expected outcome |
|---|---|---|---|---|
| 1 | Chest appears & animates after trigger puzzle (both flows) | Subscriber calls `suspendGameplayActivity()` → scheduler keeps running → `miniGameHandler.start()` fires | E2E: play to trigger puzzle, assert `#treasurecanvas` renders content; unit: assert scheduler advances after publish | Chest visible/animating |
| 2 | Audio, timer rotation, monster quieted during mini-game | `suspendGameplayActivity()` retains all three side-effects | Unit: spy `pauseAllAudios`, `applyTimerRotation(false)`, `monsterController.pause()` on the event | All three called once |
| 3 | Mini-game path does not set `isPaused` | Subscriber no longer calls `pauseGamePlay()` | Unit: assert `scene.isPaused === false` after `MINI_GAME_WILL_START` | `isPaused` stays false |
| 4 | `pauseGamePlay()` unchanged for other callers | Method still `isPaused = true` + `suspendGameplayActivity()` | Unit: `pauseGamePlay()` sets `isPaused` true + calls the three | Behavior preserved |
| 5 | No silent timer/stone advance under chest | Stones cleared → `stonesHasLoaded = false` gates timer | Unit/E2E: timer value unchanged across mini-game duration | Timer frozen |
| 6 | Existing unit suite green | No change to flow-manager contract | `npm test` (`gameplay-flow-manager.spec.ts`) | 5/5 pass |

---

# 11. Unit Testing

- **File under test:** `src/scenes/gameplay-scene/gameplay-scene.ts` (subscriber + pause methods). Existing `gameplay-flow-manager.spec.ts` continues to cover the publish/ordering path.
- **Scenarios:**
  - On `MINI_GAME_WILL_START`: `isActiveMiniGame === true`, `isMiniGamePaused === true`, `stoneHandler.clearAllStones()` called, and **`isPaused === false`**.
  - The three quieting effects (`pauseAllAudios`, `applyTimerRotation(false)`, `monsterController.pause()`) are invoked exactly once.
  - `pauseGamePlay()` still sets `isPaused === true` and invokes the same three effects (guards the refactor).
  - On `IS_MINI_GAME_DONE` after the mini-game path: `resumeGame()` restores audio/monster; `isActiveMiniGame === false`.
- **Edge/failure cases:** event fired while already `isPaused` (pause popup open) → `suspendGameplayActivity()` is skipped by the `if (!this.isPaused)` guard (no double-pause).
- **Scheduler regression test (recommended):** in a flow-manager-style test, register a `timeoutRegistry` timer, publish `MINI_GAME_WILL_START` through a real `GameplayScene`-like subscriber that only quiets, then assert `scheduler.update()` still fires the timer (i.e., the freeze cannot recur).
- **Mocks required:** `audioPlayer`, `uiManager`, `monsterController`, `stoneHandler`, `miniGameStateService` (already patterned in existing specs).
- **Coverage recommendation:** cover both subscriber branches (paused vs not-paused) and both pause methods.

---

# 12. End-to-End Testing

- **Happy path:** play a level with a mini-game to its trigger puzzle; assert `#treasurecanvas` renders visible content (chest animation) via `assertCanvasHasContent`, and that gameplay audio/monster are quiet.
- **Combined-mode path:** trigger assessment on the same segment as the mini-game (`handleCombinedModeTransition`); assert the chest still appears after the survey closes.
- **Regression:** confirm the main level timer does not advance while the chest is on screen; confirm no stone is interactable.
- **Negative:** a level with no mini-game (`shouldShowMiniGame` → 0) proceeds straight to next puzzle with no chest and no altered pause state.
- **Cross-platform:** Chromium (CI default). No platform-specific code paths introduced.
- **Reuse:** existing helpers (`speedUpMiniGame`, `waitForMiniGameComplete`, `applyStandardMocks`) already cover mini-game timing.

---

# 13. Rollout Strategy

- **Implementation order:** single commit on `fm-973` — extract `suspendGameplayActivity()`, swap the subscriber call, add doc comment, add/adjust unit tests.
- **Deployment:** normal branch → PR → CircleCI (`node/test` + `e2e-tests`) → merge → per-environment S3 deploy per existing pipeline.
- **Rollback plan:** revert the single commit; no data, schema, or config migration involved.
- **Monitoring:** watch for mini-game render issues via existing Sentry error tracking and QA smoke on affected levels post-deploy.
- **Success metrics:** mini-game renders on every trigger-puzzle completion in QA; unit + E2E suites green in CI.

---

# 14. Open Questions

1. **Timer-rotation restore on resume.** `resumeGame()` does not call `applyTimerRotation(true)`; rotation is presumably re-established by the next puzzle's timer start. Confirm the clock resumes rotating correctly after the mini-game (pre-existing behavior, not changed here).
2. **Combined-mode visual (`handleCombinedModeTransition`).** That path also manipulates `#chestImage` / `#treasurecanvas` directly for a fly-in; confirm it renders correctly now that the scheduler is no longer frozen (it publishes the same event the fix targets).
3. **Jira source fields.** Ticket summary, priority, reporter, created date, and verbatim description still need to be filled in the Ticket Context table above from FM-973.
