# FM-1016 — Pausing Gameplay Does Not Freeze the Treasure-Chest Mini-Game

> Generated via Spec-Driven Development (SDD) process. Source template: `SDD-template/SDD-TEMPLATE.md`.
> Implementation status: **in progress** — change currently sits on branch `fm-1012` (see §13 — it needs to be moved to its own `fm-1016` branch). Fix in `src/scenes/gameplay-scene/gameplay-scene.ts`.
> Third in the mini-game series: **FM-973** (`spec/FM-973-minigame-pause-freeze-fix.md`) made the chest *appear*; **FM-1012** (`spec/FM-1012-minigame-starts-before-monster-animation.md`) made it appear at the *right time*; **FM-1016** makes it *respect pause* once it is on screen.

## Ticket Context

| Field | Value |
|---|---|
| Key | FM-1016 |
| Summary | Mini-game and gameplay continue running in background after pause prompt triggered by backgrounding/switching screens |
| Type | Bug |
| Project | FM — Feed The Monster |
| Priority | Medium |
| Status | Review/QA |
| Reporter | Ashish M |
| Assignee | Bernhard Paolo Cena |
| Created | 2026-08-26 |

**Jira Description (verbatim):**

> **Describe the bug**
> In FTM gameplay, when the mini-game is playing and the app is backgrounded or the screen is changed, then returned to, the mini-game and gameplay keep running underneath even with the pause pop-up present.
>
> **To Reproduce**
>
> * Reach mini-game segment
> * During mini-game, minimize the game or change tab to trigger the automatic pause
> * Return to game without closing the pause prompt
> * Game proceeds even with pause prompt present
>
> **Expected behavior**
> When the screen is changed or the app is kept in background, on return the mini-game and gameplay should be paused (halted) until the pause prompt is dismissed.
>
> **Smartphone:**
> Device: All
> OS: All
> Browser: All
> Version: All
>
> **Desktop:**
> OS: All
> Browser: All
> Version: All
>
> **Platform**
> Both web and app versions
>
> **Environment**
> All environments
>
> **Additional context**
> None.

Working summary (from investigation, pending the verbatim ticket): While the treasure-chest mini-game is on screen, pausing the game does not pause the mini-game. When focus is lost (tab hidden / app backgrounded), `handleVisibilityChange` fires, the pause overlay appears, and the main game is flagged paused — but the mini-game keeps animating and counting down underneath. When the chest's 12s run completes, the game silently auto-resumes and the pause overlay is left orphaned on screen (or the game has already moved on beneath it). There is no error or stuck state (that was FM-973); this is a pause-state / lifecycle-coupling issue.

### Business Goal
The pause control must actually pause everything the child can see, including the mini-game. Leaving the mini-game running under the pause overlay — and then auto-dismissing the pause on its own when the chest finishes — is confusing, undermines trust in the pause button, and can consume the child's mini-game reward moment while they are away from the screen.

### Problem Statement
`GameplayScene.draw()` pauses the whole game by starving it of `deltaTime` — when `isPaused` is true it sets `deltaTime = 0` so every downstream update no-ops. The mini-game update call, however, was **deliberately exempted** from that gate: `this.miniGameHandler.update(this.isActiveMiniGame ? realDeltaTime : deltaTime)` fed the mini-game the *real* frame time whenever a mini-game was active, regardless of `isPaused`. That exemption was added under **FM-939** ("Pause Gameplay When Assessment Is Triggered", commit `143b536b`, PR #1985) so the mini-game's animation would keep progressing while the game was paused for the assessment flow. The unintended side effect: a genuine *user* pause (pause button / tab hidden) can no longer stop the mini-game, because the mini-game's timing is 100% `deltaTime`-driven and it is being handed non-zero time behind the pause.

### Acceptance Criteria
1. Pausing while the treasure-chest mini-game is on screen (via tab hide / backgrounding, and via the pause button where reachable) **freezes** the mini-game: chest animation, stone motion, and the internal countdown all stop.
2. While paused, the pause overlay stays visible and the game does **not** auto-resume on its own. The mini-game does not reach completion while paused.
3. Resume happens only through the pause overlay's **Resume** action; on resume the mini-game continues from exactly where it froze, then completes normally.
4. The **assessment → mini-game** flow is unchanged — the mini-game keeps animating there, because that flow never sets `isPaused` (FM-939 preserved).
5. FM-973 (chest appears) and FM-1012 (chest appears at the right time) are **not** regressed.
6. Existing unit suites (`gameplay-scene.spec.ts`, `gameplay-flow-manager.spec.ts`) remain green; a new test asserts the mini-game receives `0` deltaTime while paused and real deltaTime while not paused.

---

# 1. Executive Summary

The treasure-chest mini-game ignores the pause. The whole game is paused by zeroing `deltaTime` inside `GameplayScene.draw()`, but the mini-game's per-frame update was explicitly given the **real** frame time whenever a mini-game is active — an FM-939 exemption meant to keep the chest animating during the *assessment* pause. Because the mini-game's entire timing model (chest state machine, 12s countdown, stone physics) is a pure function of the `deltaTime` it receives, that exemption means a user pause cannot stop it. Worse, when the un-paused mini-game reaches its 12s completion it publishes `IS_MINI_GAME_DONE`, whose handler unconditionally calls `resumeGame()` — silently flipping `isPaused` back to false and leaving the pause popup orphaned on screen (nothing closes it except the user's own Resume click).

- **Business objective:** make pause actually pause the mini-game, and let resume happen the normal way — through the pause overlay — instead of the mini-game auto-resuming the game on its own.
- **Expected user impact:** while paused, the chest/stones freeze and the pause overlay stays put; on Resume the mini-game picks up exactly where it stopped. The assessment→mini-game flow is unchanged.
- **Success metrics:** 0% of pauses during the mini-game result in the chest advancing or the game self-resuming; assessment→mini-game flow still animates; FM-973/FM-1012 behavior intact; unit + E2E suites green.

The fix is a **single-line** change in `src/scenes/gameplay-scene/gameplay-scene.ts`: gate the real-time feed on `!this.isPaused` so the mini-game falls back to the already-zeroed `deltaTime` while paused. Freezing the mini-game is self-completing — a frozen mini-game can never reach `IS_MINI_GAME_DONE`, so the orphaned-popup / auto-resume defect becomes unreachable while paused, with no change to the completion handler.

---

# 2. Current State Analysis

**Frame loop & pause model (unchanged):**
- `GameplayScene.draw()` (`src/scenes/gameplay-scene/gameplay-scene.ts:295`) pauses everything by zeroing time: `if (!this.isPaused) { scheduler.update(deltaTime); } else { deltaTime = 0; }` (lines 297–303). Every downstream consumer that runs on `deltaTime` therefore no-ops while paused. `realDeltaTime` is captured at the top of `draw()` before the zeroing.
- The mini-game update was the one exception: `this.miniGameHandler.update(this.isActiveMiniGame ? realDeltaTime : deltaTime)` — real time when a mini-game is active, ignoring `isPaused`.

**Mini-game timing is purely deltaTime-driven (unchanged):**
- `TreasureChestAnimation.draw(deltaTime)` (`treasureChestAnimation.ts:268`) advances its state machine via `this.stateTimer += deltaTime` and gates the 12s window at `elapsed >= 12000` (`:353`).
- `TreasureStones.stoneBurstAnimation(w, h, deltaTime)` (`treasureStones.ts:154`) advances `this.elapsedTime += deltaTime` and moves each stone by a `deltaTime`-normalized factor (`:307–311`).
- There is **no wall-clock** anywhere in the mini-game (no `setTimeout`/`Date.now()` used for progression). Feed it `0` and every timer and motion freezes atomically; feed it real time and it advances — including behind a pause.
- `miniGameStateService` (`miniGameStateService.ts`) exposes **no pause/resume event** — only `MINI_GAME_WILL_START`, `IS_MINI_GAME_DONE`, `USE_ASSESSMENT_TREASURE_CHEST_LAYOUT`. The mini-game has no concept of "paused."

**Pause entry points:**
- `handleVisibilityChange()` (`gameplay-scene.ts:461`): on `visibilitychange`, early-returns if `flowManager.isAssessmentOpen()`, else publishes `GAME_PAUSE_STATUS_EVENT(true)` and calls `pauseGamePlay()`. This is the path that fires during the mini-game.
- `handleUiPauseClick()` (`:431`): pause button → publishes `GAME_PAUSE_STATUS_EVENT(true)` and calls `pauseGamePlay()`.
- `pauseGamePlay()` (`:350`) sets `isPaused = true` and calls `suspendGameplayActivity()`.
- The `GAME_PAUSE_STATUS_EVENT` subscriber (`:576`) sets `isPauseButtonClicked` and, on `true`, calls `uiManager.openPausePopup()`.

**Pause overlay lifecycle:**
- `GameplayUIManager.openPausePopup()` (`gameplay-ui-manager.ts:122`) opens the popup. It is closed **only** by the popup's own `onClose` (`:86–98`) → `UI_POPUP_RESUME` → `handleUiPopupResume()` (`gameplay-scene.ts:456`), which publishes `GAME_PAUSE_STATUS_EVENT(false)` and calls `resumeGame()`. There is no `closePausePopup()`; `resumeGame()` (`:344`) does not touch the popup.

**Mini-game completion (the coupled defect):**
- `IS_MINI_GAME_DONE` subscriber (`gameplay-scene.ts:561`): sets `isActiveMiniGame = false` and, if `isMiniGamePaused`, calls `resumeGame()` — **unconditionally**, regardless of whether the user has paused. `isMiniGamePaused` is misleadingly named: it does not mean "the mini-game is paused"; it means "main gameplay was suspended because a mini-game is running, resume it when the mini-game ends."

**Stacking context (why the pause button is unreachable during the mini-game):**
- `#treasurecanvas` is set to `zIndex = 11`, `pointerEvents = "auto"`, full-screen, with a 70%-black overlay (`treasureChestAnimation.ts:90–95`). `.game-control` (the pause button's container) is `z-index: -1` (`public/index.css:537`). So during the mini-game, clicks in the pause-button area land on the treasure canvas and read as stone taps — `handleUiPauseClick` does not fire. The realistic pause trigger during the mini-game is therefore `handleVisibilityChange`.

**Current limitation:** the mini-game update is exempted from the single pause mechanism the game has (`deltaTime` zeroing), so there is no way for a user pause to reach it, and the mini-game has no independent pause of its own.

---

# 3. Root Cause Analysis

This is a state-coupling defect, not a mini-game logic bug. Two coupled issues produce the observed behavior:

**(A) The mini-game is exempt from the pause.**
1. Focus is lost during the mini-game → `handleVisibilityChange` fires (its only guard, `isAssessmentOpen()`, is false here).
2. It publishes `GAME_PAUSE_STATUS_EVENT(true)` → subscriber opens the pause popup; `pauseGamePlay()` sets `isPaused = true`.
3. On each subsequent frame, `draw()` sets `deltaTime = 0` — but line 334 hands the mini-game `realDeltaTime` because `isActiveMiniGame` is true. The chest state machine and stone countdown keep advancing. (While the tab is truly hidden, `requestAnimationFrame` is throttled so no frames run; the mini-game resumes advancing the moment the tab is visible again, still "paused.")

**(B) Completion auto-resumes and orphans the popup.**
4. The un-paused mini-game reaches `stateTimer >= 12000` → `FadeOut` → `onFadeComplete` → `processStoneCollection()` → `callback` → `MiniGameHandler.handleMiniGameComplete()` publishes `IS_MINI_GAME_DONE`.
5. The `IS_MINI_GAME_DONE` handler runs `resumeGame()` unconditionally → `isPaused = false`, audio + monster resume — **even though the user is paused**.
6. `resumeGame()` never closes the pause popup, and nothing else does either (the popup only closes on the user's own Resume click). Result: the game has resumed underneath a pause overlay that is still on screen, without the user ever pressing Resume.

**Why the exemption exists (and why it is safe to gate it):** the exemption was introduced under FM-939 to keep the mini-game animating during the *assessment*-triggered pause. But `isPaused` is set to `true` **only** by `pauseGamePlay()`, which is called **only** by the two user/visibility handlers; the assessment flow never sets it, and `handleVisibilityChange` early-returns while the assessment is open. Therefore during the assessment `isPaused` is already `false`, so gating the exemption on `!isPaused` does not change the assessment behavior — it only affects the genuine user/visibility pause, which is exactly the case to fix.

- **Runtime bottleneck:** a single `isPaused`/`deltaTime` mechanism gates the whole game, and the mini-game opted out of it. There is no separate mini-game pause.
- **No CPU/memory/offline dimension** — pure control flow; nothing is leaked or exhausted.

---

# 4. Proposed Solution

**High-level approach:** stop exempting the mini-game from the pause. Feed it the real frame time only while it is active **and not paused**; otherwise feed it `deltaTime` (already `0` while paused). Because the mini-game is a pure function of the time it receives, `0` is a perfect atomic freeze — no per-class changes required.

Before:
```ts
// Mini-game always receives real deltaTime so its animation progresses
// even while the main game is paused (e.g. during assessment flow).
this.miniGameHandler.update(this.isActiveMiniGame ? realDeltaTime : deltaTime);
```

After:
```ts
// Mini-game normally animates on real frame time so it keeps progressing
// during the assessment flow, where the game is never marked paused. But a
// user/visibility pause (isPaused === true) freezes it with the rest of
// gameplay — deltaTime is already 0 while paused — so the mini-game resumes
// only through the pause overlay instead of finishing on its own.
this.miniGameHandler.update(this.isActiveMiniGame && !this.isPaused ? realDeltaTime : deltaTime);
```

**Why this fixes both defects with one line:** freezing the mini-game means it can never reach `stateTimer >= 12000`, so `IS_MINI_GAME_DONE` is never published while paused, so the unconditional `resumeGame()` in that handler is never reached and the popup is never orphaned. Defect (B)'s bad path is made unreachable rather than patched — the completion handler is left untouched. On Resume, `isPaused` returns to `false`, the mini-game resumes on real time from exactly where it stopped, and eventually completes through the normal path (`resumeGame()` there is then a harmless no-op, since `isPaused` is already `false`).

**Why this approach was selected:** it is the minimal change that addresses the root cause, preserves the FM-939 assessment exemption exactly (it only bites when `isPaused` is true, which never happens during the assessment), keeps `realDeltaTime` in use (no unused-variable churn), and requires no new flag, event, or mini-game API.

**Alternatives considered:**
- *Add an explicit mini-game pause API* (`MiniGameHandler.pause()/resume()` cascading into the chest/stones, plus a `MINI_GAME_PAUSE` event). Rejected for this ticket as over-engineered: the `deltaTime`-freeze already stops all animation and timing; a dedicated API is only warranted if/when audio pause (see §9, §14) is brought in scope — at which point that is where the audio pause naturally lives.
- *Make `IS_MINI_GAME_DONE` resume conditional on `!userPaused`.* Rejected as unnecessary once the mini-game is frozen — with the freeze, the handler cannot fire while paused, so there is nothing to guard. (If the freeze were ever removed, this guard would become necessary again — noted in §14.)
- *Fully revert line 334 to `miniGameHandler.update(deltaTime)`.* Behaviorally identical to the chosen fix (since `deltaTime === realDeltaTime` when not paused), but it deletes `realDeltaTime` and erases the visible record of the FM-939 intent. Rejected in favor of the explicit `&& !this.isPaused` guard, which reads as a deliberate, surgical change and keeps the assessment rationale legible in the comment.

**Trade-off:** the mini-game's audio is not paused by this change (see §9). The visible animation/timing is fully frozen; audio pause is a separate, larger change deliberately kept out of scope here.

---

# 5. Architecture Hooks

- **Components affected:** `GameplayScene` only (one line in `draw()`). No other component's source changes. `MiniGameHandler`, `TreasureChestMiniGame`, `TreasureChestAnimation`, `TreasureStones` are untouched — they simply receive `0` while paused.
- **Services/events:** `miniGameStateService` `MINI_GAME_WILL_START` / `IS_MINI_GAME_DONE` (unchanged); `gameStateService` `GAME_PAUSE_STATUS_EVENT` (unchanged).
- **Lifecycle / state management:** reads the existing `isPaused` and `isActiveMiniGame` flags in the `draw()` gate. No new state introduced.
- **Rendering path:** `GameplayScene.draw()` → `miniGameHandler.update(deltaTime|realDeltaTime)` → `TreasureChestAnimation.draw()`. While paused, `draw()` still runs but with `deltaTime = 0`, so it redraws the current frame without advancing — a clean freeze-frame.
- **Pause overlay path (unchanged, now correctly gated):** `openPausePopup()` on pause; `handleUiPopupResume()` → `GAME_PAUSE_STATUS_EVENT(false)` → `resumeGame()` on Resume. With the freeze, this becomes the *only* way the mini-game leaves the paused state.
- **Audio flow (known gap):** `suspendGameplayActivity()` pauses the **gameplay** `audioPlayer` only. The mini-game's own `AudioPlayer` instances (`TreasureChestAnimation.audioPlayer`/`sfxPlayer`, `TreasureStones.audioPlayer`) are not touched by this fix — see §9 and §14.

---

# 6. Folder Structure

Existing files modified:

```
src/
  scenes/
    gameplay-scene/
      gameplay-scene.ts      # draw(): gate mini-game real-time feed on !isPaused
```

New files created: none.
Files removed: none.

Investigation scaffolding currently in the working tree — the `TEST` `console.log` statements in `pauseGamePlay()`, `handleVisibilityChange()`, and the `GAME_PAUSE_STATUS_EVENT` subscriber, plus the `isPauseButtonClicked = true` line added to `pauseGamePlay()` during tracing — must be reviewed and removed before the PR (see §13). They are not part of the fix.

---

# 7. File-Level Implementation Plan

### `src/scenes/gameplay-scene/gameplay-scene.ts` (modified)
- **Purpose:** make the treasure-chest mini-game observe the game's pause state.
- **Required changes:**
  1. In `draw()`, change the mini-game update from `this.isActiveMiniGame ? realDeltaTime : deltaTime` to `this.isActiveMiniGame && !this.isPaused ? realDeltaTime : deltaTime`.
  2. Update the accompanying comment to record both the assessment exemption (why real time is used at all) and the user-pause freeze (why it is gated on `!isPaused`).
- **Public APIs affected:** none. No signatures change; `pauseGamePlay()`, `resumeGame()`, and the event handlers are untouched.
- **Internal methods affected:** `draw()` only. `IS_MINI_GAME_DONE` handler intentionally **not** modified (its bad path is made unreachable by the freeze).

---

# 8. Performance Considerations

- **CPU:** neutral. The gate is a single added boolean `&&`. While paused, the mini-game's `draw()` still runs but does no motion/spawn math beyond redrawing the current frame (all `deltaTime`-scaled work multiplies by `0`).
- **Memory:** neutral — no new allocations, timers, listeners, or state.
- **Rendering:** while paused the chest is a static freeze-frame; per-frame cost is at or below the running baseline.
- **Low-end devices / offline:** no change — logic-only fix, no new asset loads or network calls. Backgrounding the tab (the primary trigger) already throttles the frame loop, so no extra work accrues while hidden.

---

# 9. Risks

| Risk | Assessment | Mitigation |
|---|---|---|
| Regressing the FM-939 assessment exemption (freezing the mini-game during the assessment pause) | **Very low / reasoned safe.** `isPaused` is set true only by `pauseGamePlay()`, called only by the two user/visibility handlers; the assessment never sets it and `handleVisibilityChange` early-returns while the assessment is open. So during the assessment `isPaused` is false and the mini-game still receives real time. | Comment documents the intent; add a unit test asserting real deltaTime is passed when `isActiveMiniGame && !isPaused`. |
| Mini-game **audio** keeps playing while paused | **Known gap / out of scope here.** Freezing `deltaTime` stops animation, not Howler audio. The mini-game's own `AudioPlayer` instances are not paused by `suspendGameplayActivity()`. On the pause-button path audio would continue; on the tab-hide path the browser/Howler usually auto-suspends while hidden and may resume audio on return while still "paused." | Flagged as a follow-up (§14); implement mini-game audio pause via a dedicated `pause()/resume()` cascade if product wants it in scope. |
| Stone top-up (`maintainStones`) runs each frame while frozen | **Low / cosmetic.** With `deltaTime = 0` stones do not move; `maintainStones` may top the on-screen count to its random target once, but the stones remain frozen at the chest and do not drift. | Acceptable for a freeze; note for QA. No code change. |
| Someone later removes the freeze and reintroduces the auto-resume/orphan-popup path | **Medium (maintainability).** Defect (B) is made unreachable, not deleted; removing the freeze would expose it again. | Comment on the `draw()` line explains the coupling; §14 records that `IS_MINI_GAME_DONE`'s unconditional `resumeGame()` would need a `!userPaused` guard if the freeze is ever removed. |
| Pause button still unreachable during the mini-game (`#treasurecanvas` z-index 11 over `.game-control` z-index -1) | **By design / separate concern.** This fix targets freezing on pause, not surfacing a pause control over the chest. The reachable trigger today is tab hide / backgrounding. | If the ticket requires an on-chest pause button, treat as a separate UI change (§14). |
| Regression to FM-973 (chest appears) / FM-1012 (right timing) | **Very low.** Both concern the *start* path (scheduler + publish ordering), which is untouched; this fix only affects the per-frame `deltaTime` handed to an already-running mini-game. | Existing unit/E2E suites; manual smoke on a mini-game level. |

---

# 10. Acceptance Criteria Mapping

| # | Criterion | Implementation | Validation | Expected outcome |
|---|---|---|---|---|
| 1 | Pause freezes the mini-game | `draw()` feeds `deltaTime` (=0) to the mini-game while `isPaused` | Unit: spy `miniGameHandler.update`, set `isActiveMiniGame=true`, `isPaused=true`, call `draw(16)` → arg is `0`. E2E: pause mid-chest, assert `#treasurecanvas` pixels unchanged over time | Chest/stones frozen |
| 2 | Overlay stays; no self-resume | Frozen mini-game can't reach 12s → no `IS_MINI_GAME_DONE` → no `resumeGame()` | E2E: while paused, assert pause popup visible and `isPaused` stays true for > 12s of wall-clock | Popup persists; no auto-resume |
| 3 | Resume only via overlay; continues from freeze | `handleUiPopupResume` → `GAME_PAUSE_STATUS_EVENT(false)` → `resumeGame()` → `isPaused=false` → real time resumes | E2E: click Resume, assert chest animation continues and later completes | Seamless resume |
| 4 | Assessment→mini-game unchanged | Gate only bites when `isPaused` true; assessment never sets it | Unit: `isActiveMiniGame=true`, `isPaused=false` → arg is `realDeltaTime`. E2E: assessment→mini-game still animates | FM-939 preserved |
| 5 | FM-973 / FM-1012 not regressed | Start path untouched | Existing mini-game E2E (`speedUpMiniGame`, `waitForMiniGameComplete`) | Chest still appears at the right time |
| 6 | Suites green + new pause test | One-line change; add `draw()` pause test | `npm test` | All pass |

---

# 11. Unit Testing

- **File under test:** `src/scenes/gameplay-scene/gameplay-scene.ts` (`draw()` mini-game gate). Existing `gameplay-scene.spec.ts` already mocks `miniGameHandler`, `uiManager`, `monsterController`, `stoneHandler`.
- **Scenarios:**
  - `isActiveMiniGame = true`, `isPaused = true` → `miniGameHandler.update` is called with `0` (frozen).
  - `isActiveMiniGame = true`, `isPaused = false` → `miniGameHandler.update` is called with the real deltaTime passed to `draw()`.
  - `isActiveMiniGame = false` (any `isPaused`) → `miniGameHandler.update` is called with the (possibly zeroed) `deltaTime`, matching prior behavior.
  - Guard test: after the pause path sets `isPaused = true`, `IS_MINI_GAME_DONE` is **not** expected to fire from the frozen mini-game (behavioral note — assert `update(0)` rather than driving completion).
- **Edge/failure cases:** `draw()` called repeatedly while paused → mini-game receives `0` every frame (no drift); on `isPaused` flipping back to false, the next `draw()` passes real deltaTime.
- **Mocks required:** `miniGameHandler.update` spy; existing scene mocks. No new mocks.
- **Coverage recommendation:** cover all three branches of the gate (active+paused, active+unpaused, inactive).

---

# 12. End-to-End Testing

- **Happy path (freeze):** reach a mini-game (level 2, or 5/15/25… where `shouldShowMiniGame` selects it); once the chest is on screen, simulate pause (dispatch `visibilitychange` to hidden, or drive the pause path) and assert `#treasurecanvas` content does not change across a sampled interval (`getCanvasPixelColor` stable), the pause popup is visible, and no level advance occurs.
- **Resume:** trigger the pause overlay's Resume; assert the chest animation resumes and eventually completes, then normal post-mini-game flow proceeds.
- **No self-resume regression:** while paused, wait beyond the 12s mini-game duration (accelerated where possible) and assert the game is still paused and the popup still shown (the frozen mini-game never completed).
- **Assessment→mini-game regression:** run the assessment→mini-game combined flow and assert the chest still animates end-to-end (no freeze, since `isPaused` is never set there).
- **Negative:** a level with no mini-game proceeds normally; pause/resume behave as before this change.
- **Cross-platform:** Chromium (CI default). No platform-specific paths introduced. Note the mobile/native background→foreground transition as a manual check, since it drives `visibilitychange`.
- **Reuse:** `speedUpMiniGame`, `waitForMiniGameComplete`, `applyStandardMocks`, `getCanvasPixelColor`, `assertCanvasHasContent`.

---

# 13. Rollout Strategy

- **Branch correction (action required):** the fix currently sits on branch `fm-1012` (that ticket's branch). Because this is a distinct ticket, move it to its own `fm-1016` branch — cherry-pick the single `gameplay-scene.ts` change onto a branch cut from the FM-1012 base (or from `develop`, if FM-1012 has merged) — so FM-1016 ships and reviews independently.
- **Pre-PR cleanup:** remove the investigation scaffolding noted in §6 (the `TEST` console logs and the exploratory `isPauseButtonClicked = true` line) so the PR contains only the one-line gate change + comment.
- **Implementation order:** single commit — the `draw()` gate change + comment; add the `draw()` pause unit test.
- **Deployment:** branch → PR → CircleCI (`node/test` + `e2e-tests`) → merge → per-environment S3 deploy per existing pipeline.
- **Rollback plan:** revert the single commit; no data, schema, or config migration involved.
- **Monitoring:** QA smoke on a mini-game level (pause via tab switch mid-chest; confirm freeze + overlay persistence + clean resume); watch Sentry for any mini-game render errors post-deploy.
- **Success metrics:** no pause-during-mini-game produces chest advancement or self-resume in QA; assessment→mini-game flow unaffected; suites green in CI.

---

# 14. Open Questions

1. **Audio during pause (scope decision).** Should the mini-game's audio (`AUDIO_MINIGAME` music, burn/bonus SFX) pause with the animation in this ticket, or is freezing the visuals sufficient for FM-1016? If in scope, it means threading `pause()/resume()` through `MiniGameHandler → TreasureChestMiniGame → TreasureChestAnimation`/`TreasureStones` to pause their `AudioPlayer` instances (and re-arming on resume, mindful of `TreasureChestAnimation`'s one-shot `resumeAllAudios()` at chest-open).
2. **Pause button reachability during the mini-game.** Does the ticket require the on-screen pause **button** to work while the chest is up? Today it is covered by `#treasurecanvas` (z-index 11) over `.game-control` (z-index -1), so only tab-hide/backgrounding triggers pause during the mini-game. Surfacing a pause control above the chest is a separate UI change.
3. **Latent auto-resume guard.** Defect (B) — the unconditional `resumeGame()` in the `IS_MINI_GAME_DONE` handler that orphans the pause popup — is made *unreachable* by the freeze, not fixed. If the freeze is ever removed or bypassed, that handler needs a `!userPaused` guard and a `closePausePopup()` on resume. Worth a code comment or a tracked follow-up.
4. **Jira source fields.** Resolved — the Ticket Context table now reflects the verbatim FM-1016 Jira record (status: Review/QA).
