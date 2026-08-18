# FM-967 — QA Automation Coverage for Replay Level Flow (Playwright + Claude)

> Generated via Spec-Driven Development (SDD) process. Source template: `SDD-TEMPLATE.md`.
> **This document is a specification only. No test or source code has been modified as part of producing this file.**

## Ticket Context

| Field | Value |
|---|---|
| Key | [FM-967](https://curiouslearning.atlassian.net/browse/FM-967) |
| Summary | QA Automation coverage for Replay level flow. (Playwright+Claude) |
| Type | Task |
| Project | FM — Feed The Monster |
| Priority | Medium |
| Status | In Progress |
| Reporter | Ashish M |
| Assignee | Ashwin Nair |
| Created | 2026-07-29 |
| Test Doc | [QA Test Case spreadsheet](https://docs.google.com/spreadsheets/d/18M-rIDj84pGg7f4y4ldipOzF3FCo_prZ4yzcqsnZsNQ/edit?usp=sharing) (referenced by ticket; test-case rows for Replay not yet reflected in `e2e/tests/README.md`) |

**Jira Description (verbatim):**
> Create automation coverage for the Replay Level flow in the FTM gameplay. Currently, our Playwright + Claude implementation covers the happy path E2E flow. With this implementation, we can extend the automation coverage to validate the Replay functionality after a player fails a level, ensuring the same level is restarted correctly and is fully playable.

### Business Goal
Extend the existing Playwright + Claude E2E suite so that the **Replay Level** action — a core recovery path players use after an unsuccessful or repeat attempt at a level — is regression-tested automatically, closing a gap in coverage that today only exercises the "happy path" (complete a level → advance/return to map).

### Problem Statement
`FTM_TC_016` (`e2e/tests/isolated/tc-016-level-completion.spec.ts`) proves the Level End screen renders correctly (stars, buttons, Rive monster) and that the **Map** button returns the player to Level Selection. It does **not** exercise the **Replay** (`#levelend-retry-btn`) button at all. There is currently zero automated coverage verifying that clicking Replay reloads the same level, resets puzzle progress, and leaves the gameplay canvas fully interactive — a functional path (`levelend-scene.ts` → `buttonCallbackFn('retry')`) that a regression could silently break.

### Acceptance Criteria (from FM-967)
1. Automate the Replay Level flow using the existing Playwright + Claude automation framework.
2. Validate that selecting Replay from the Level End screen restarts the same level successfully.
3. Verify that the gameplay loads correctly after replay is initiated.
4. Ensure the replayed level is fully interactive and can be played from the beginning.
5. Verify that the correct level context is maintained after replay.
6. Integrate the automation into the existing FTM E2E test suite.
7. Ensure the test follows the existing framework standards, reusable helpers, and coding conventions.
8. Ensure the automation executes reliably in CI with consistent, non-flaky results.

**User-specified execution sequence (this task's explicit steps):**
1. Confirm the Level End screen from `FTM_TC_016` loads properly.
2. Wait 2 seconds (post-load settle time before interacting with Replay).
3. Click the Replay button — expected to reload **Level 2** (the level the orchestrator suite currently plays, 0-based `currentLevel === 1`).

---

# 1. Executive Summary

This spec defines **`FTM_TC_017 | Level Replay`**, a new Playwright E2E test that runs immediately after `FTM_TC_016` in the existing serial suite. It asserts that clicking the Level End screen's Replay button reloads the *same* level (Level 2) with a fresh, interactive puzzle state — closing the AC gap in FM-967.

- **Business objective:** regression-proof the Replay recovery path so a broken `levelend-scene.ts` retry handler is caught in CI before reaching players.
- **Expected user impact:** none directly (test-only change); indirectly reduces risk of a shipped regression that traps players on a level they can't restart.
- **Success metrics:** new test passes reliably in CI (`e2e-tests` CircleCI job) across ≥20 consecutive runs with zero flake; zero new page-object or helper code needed beyond one small addition (see §7).

---

# 2. Current State Analysis

**Existing implementation:**
- `e2e/tests/ftm-assessment-survey-flow.spec.ts` — orchestrator; registers `tc001 → tc002_003 → tc004_005 → tc006_008 → registerTC009_012 → tc014_015 → registerTC013 → tc016` inside one `test.describe.serial` block sharing a single `page` and two shared-state objects (`SharedFlowState`, `FullGameplayFlowState`). Neither shared-state object tracks a level number field.
- `e2e/tests/isolated/tc-016-level-completion.spec.ts` — the last registered test. It:
  1. Waits (35s) for `#levelEnd` to become visible naturally (no synthetic events published).
  2. Asserts ≥1 star rendered.
  3. Asserts `#rivecanvas` attached.
  4. Asserts Map and Next buttons visible.
  5. **Clicks Map** → asserts return to `#level-selection-container`.
- `e2e/pages/level-end-page.ts` (`LevelEndPage`) **already exposes everything needed to click Replay** — no new page-object code required:
  - `SELECTORS.retryButton = '#levelend-retry-btn'`
  - `retryButton` getter
  - `assertRetryButtonVisible()`
  - `clickRetryButton()` (waits for visibility with `Timeouts.evolutionDelay`, then clicks)
- `e2e/pages/gameplay-page.ts` (`GameplayPage`) exposes `waitForGameplayScene()` (asserts `#canvas` + `#pause-button` visible within `Timeouts.sceneTransition`), used elsewhere as the standard "gameplay scene is active" check.
- `e2e/helpers/canvas-helpers.ts` exposes `assertCanvasHasContent(page, selector)` — used elsewhere to confirm stones have rendered.
- `e2e/helpers/game-state-helpers.ts` exposes `triggerLevelEndScene(page, starCount, currentLevel, isLastLevel)`, a synthetic shortcut already used by other isolated specs to reach the Level End screen without playing a full level.

**Current limitations:**
- No test ever exercises `#levelend-retry-btn`.
- No assertion anywhere in the suite reads `selectedLevelNumber` / `currentLevelData` from `window.__ftm.gameStateService` to prove *which* level is active — level identity is not surfaced in the DOM, so "same level restarted" can only be verified programmatically.
- `e2e/constants/timeouts.ts` has no constant for a deliberate short settle delay (closest are `buttonAnimation: 500` and `stoneDrop: 1_000`); a literal 2s wait as requested has no existing named constant.
- `e2e/tests/README.md`'s TC table stops at `TC_0016`; no `TC_017` is reserved yet.

**Technical debt:** none introduced by this change if the recommended approach (§4) is followed — it is purely additive.

---

# 3. Root Cause Analysis

This is a **test-coverage gap**, not a runtime defect. Root cause: the original E2E suite (per its header comment in `ftm-assessment-survey-flow.spec.ts`) was scoped to the happy-path flow (`App launch → ... → Natural level completion (TC_016)`) and Replay was out of scope at the time. `levelend-scene.ts` has supported Replay since before this suite existed (`buttonCallbackFn('retry')`, `handleRetryOrNext`), so there is no architectural or performance bottleneck to address — only a missing test. No CPU/memory/offline impact analysis applies; this section is intentionally short because the work is additive test coverage, not a fix to a bottleneck.

---

# 4. Proposed Solution

## High-level approach
Add **`FTM_TC_017 | Level Replay`** as a new isolated spec file (`e2e/tests/isolated/tc-017-level-replay.spec.ts`) following the exact `registerTests(getPage)` pattern used by every other isolated file, registered in the orchestrator immediately after `tc016(page)`. The test performs, as **four composable "aspects"** (see §5 for why this structuring is used):

1. **Arrange/Reach aspect** — confirm the Level End screen described by `FTM_TC_016` is present and loaded (reuse `LevelEndPage.assertLevelEndVisible()` / the same visibility checks TC_016 already performs).
2. **Settle aspect** — an explicit, intentional `page.waitForTimeout(2_000)` (new named constant, see §7) after the screen is confirmed loaded, per the ticket's explicit sequencing requirement.
3. **Interact aspect** — click Replay via `LevelEndPage.clickRetryButton()` (already exists, no new code).
4. **Verify aspect** — confirm (a) the gameplay scene reloads (`GameplayPage.waitForGameplayScene()`), (b) the canvas has re-rendered interactive content (`assertCanvasHasContent`), and (c) the level context is unchanged — read `selectedLevelNumber` from `window.__ftm.gameStateService` via `page.evaluate` and assert it still equals `1` (0-based Level 2, the level the orchestrator plays).

## Why this approach was selected
- Satisfies every AC in FM-967 using **only existing helpers and page objects** (AC 1, 6, 7) — the only new code is one timeout constant and one new spec file.
- Keeps `tc-016-level-completion.spec.ts` **untouched**, eliminating regression risk to already-passing coverage (aligned with the "avoid unnecessary refactoring" SDD principle).
- Matches the project's established dual structure: one test per TC number, registered both in the isolated file and the serial orchestrator.

## Alternative approaches considered

| Approach | Description | Trade-off |
|---|---|---|
| **A — Extend natural flow in-place (rejected)** | Remove/relocate the "click Map" step from `tc-016-level-completion.spec.ts` so the *same* Level End screen instance TC_016 reaches is reused by TC_017 before Replay is clicked, then have TC_017 (not TC_016) perform the return-to-map assertion. | Higher fidelity (single continuous natural flow) but **modifies an existing, passing, documented test** (`FTM_TC_016`'s Jira/QA-doc description says it ends by returning to the map) — this is a behavior change to a shipped, previously-signed-off test case, not purely additive. Higher review/regression risk for no measurable extra coverage value, since Level-End-screen-is-loaded is already proven by TC_016 regardless of which test clicks which button next. |
| **B — Synthetic reach via `triggerLevelEndScene` (rejected as primary, viable as fallback)** | Skip natural gameplay entirely; call `triggerLevelEndScene(page, 3, 1, false)` to jump straight to Level End, independent of TC_001–016. | Fastest, fully isolated, zero dependency on the long natural flow (35s wait) — best for the standalone `test:e2e:isolated` run. But bypasses `handleLevelCompletion`'s real event chain, so it verifies Replay in isolation from "just completed a level naturally," which is weaker evidence for AC 2 ("restarts the same level **successfully**" in the context the ticket describes: "after a player fails a level"). |
| **C — Selected: sequential registration after TC_016, own explicit checks (chosen)** | New `FTM_TC_017` test, registered after `tc016(page)` in the orchestrator, re-asserts Level End is visible (cheap, since it's still on-screen — TC_016's last action was clicking Map, so **this requires the ordering nuance in §14 Open Question 1** — see below), then does Settle → Interact → Verify. | Best balance: purely additive, reuses natural flow evidence, minimal new code, no changes to TC_016. Carries one open sequencing question flagged for confirmation before implementation (§14). |

## Business value
Directly satisfies FM-967 without expanding scope, keeps CI runtime impact small (one extra test, no duplicated 35s natural-completion wait if ordering is resolved per §14), and produces a regression net around a real player-facing recovery path.

---

# 5. Architecture Hooks

**Why "aspect-driven":** Playwright has no native AOP/decorator mechanism, so "aspect-driven" here means structuring the single `FTM_TC_017` test as **independent, composable `test.step()` blocks**, each owning exactly one cross-cutting concern, mirroring the existing convention already used inside `tc-016-level-completion.spec.ts` (each `test.step` there is already single-purpose: visibility, stars, buttons, navigation). This keeps failures attributable to one concern and lets future tests reuse individual steps as helpers if needed.

| Aspect | Concern | Implementation hook |
|---|---|---|
| Arrange/Reach | Level End screen is loaded (TC_016 precondition) | `LevelEndPage.waitForLevelEndScene()` / `assertLevelEndVisible()` |
| Settle | Deliberate pre-interaction delay (ticket-mandated 2s) | `page.waitForTimeout(Timeouts.replaySettleDelay)` — new constant, §7 |
| Interact | Click Replay | `LevelEndPage.clickRetryButton()` (existing) |
| Verify — scene | Gameplay scene reloaded | `GameplayPage.waitForGameplayScene()` (existing) |
| Verify — render | Canvas is interactive/re-rendered | `assertCanvasHasContent(page, GameplayPage.SELECTORS.mainCanvas)` (existing) |
| Verify — context | Same level (Level 2 / `selectedLevelNumber === 1`) restarted | `page.evaluate(() => window.__ftm.gameStateService.gamePlayData.selectedLevelNumber)` (existing global; new assertion only) |

**Existing modules involved:** `e2e/tests/ftm-assessment-survey-flow.spec.ts`, `e2e/tests/isolated/tc-016-level-completion.spec.ts` (read-only reference, no edits), `e2e/pages/level-end-page.ts`, `e2e/pages/gameplay-page.ts`, `e2e/helpers/canvas-helpers.ts`, `e2e/constants/timeouts.ts`, `e2e/constants/selectors.ts`.

**Production code hooks (no changes needed, documented for QA traceability):** `src/scenes/levelend-scene/levelend-scene.ts` (`buttonCallbackFn('retry')` → `handleRetryOrNext(this.currentLevel)`), `src/sceneHandler/scene-handler.ts` (`SWITCH_SCENE_EVENT('GamePlay')` dispatch), `gameStateService.EVENTS.GAMEPLAY_DATA_EVENT` / `SWITCH_SCENE_EVENT`.

**State management:** No new client-side state. Test-side, the new isolated file introduces no new shared-state interface (unlike `SharedFlowState`/`FullGameplayFlowState`) since it needs no cross-test data beyond the shared `page`.

**Rendering / asset paths exercised:** Level End teardown (`LevelEndScene.dispose()`, 500ms after retry) racing against `GameplayScene` construction — this is exactly why the Verify aspect must wait on `GameplayPage.waitForGameplayScene()` rather than assume synchronous readiness.

---

# 6. Folder Structure

```
e2e/
  tests/
    ftm-assessment-survey-flow.spec.ts     # MODIFIED — add tc017 import + registration after tc016(page)
    isolated/
      tc-017-level-replay.spec.ts          # NEW — FTM_TC_017 test
    README.md                              # MODIFIED — document TC_017 in the TC table
  constants/
    timeouts.ts                            # MODIFIED — add `replaySettleDelay: 2_000`
spec/
  FM-967-replay-level-e2e-automation.md    # NEW — this document
```

No changes to `e2e/pages/`, `e2e/helpers/`, `e2e/constants/selectors.ts`, `e2e/fixtures/game-fixtures.ts`, or any `src/` production file — all required selectors, page-object methods, and helpers already exist.

---

# 7. File-Level Implementation Plan

### `e2e/tests/isolated/tc-017-level-replay.spec.ts` (new)
- **Purpose:** implement `FTM_TC_017 | Level Replay`.
- **Required changes:** new file, `export function registerTests(getPage: () => Page): void`, mirroring the shape of `tc-016-level-completion.spec.ts`.
- **Public API:** exports `registerTests` (consumed by the orchestrator).
- **Internal steps (test.step blocks, one per aspect from §5):**
  1. `'Level end screen from TC_016 is still loaded'` — `expect(page.locator(LevelEndPage.SELECTOR)).toBeVisible()` (cheap re-check; screen should already be visible per TC_016).
  2. `'Wait for UI to settle before interacting with Replay'` — `await page.waitForTimeout(Timeouts.replaySettleDelay)`.
  3. `'Click Replay button'` — `await levelEndPage.clickRetryButton()` (via `LevelEndPage` page-object fixture) or `await page.locator(LevelEndPage.SELECTORS.retryButton).click()` if not using the fixture-bound instance — follow whichever pattern `tc-016` uses (raw `page.locator`) for consistency.
  4. `'Gameplay scene reloads after Replay'` — `await gameplayPage.waitForGameplayScene()`.
  5. `'Gameplay canvas re-renders with interactive content'` — `await assertCanvasHasContent(page, GameplayPage.SELECTORS.mainCanvas)`.
  6. `'Same level (Level 2) context is maintained after replay'` — read and assert `selectedLevelNumber`:
     ```ts
     const restartedLevel = await page.evaluate(
       () => (window as any).__ftm.gameStateService.gamePlayData.selectedLevelNumber,
     );
     expect(restartedLevel).toBe(1); // 0-based → "Level 2"
     ```

### `e2e/tests/ftm-assessment-survey-flow.spec.ts` (modified)
- **Purpose:** register the new test in the serial suite.
- **Required changes:** add `import { registerTests as tc017 } from './isolated/tc-017-level-replay.spec';` alongside the existing imports; add `tc017(() => page);` immediately after the existing `tc016(() => page);` line.
- **Public API affected:** none (internal test registration only).

### `e2e/constants/timeouts.ts` (modified)
- **Purpose:** name the ticket-mandated 2-second settle delay instead of a magic number.
- **Required changes:** add one key, following existing naming/comment conventions:
  ```ts
  export const Timeouts = {
    // ...existing keys unchanged...
    replaySettleDelay: 2_000, // deliberate pause after Level End loads, before clicking Replay
  } as const;
  ```

### `e2e/tests/README.md` (modified)
- **Purpose:** keep the TC-numbering table authoritative.
- **Required changes:** add a row: `tc-017-level-replay.spec.ts | TC_0017 | Replay button restarts the same level with fresh, interactive puzzle state`.

**No changes required to:** `e2e/pages/level-end-page.ts`, `e2e/pages/gameplay-page.ts`, `e2e/helpers/*`, `e2e/constants/selectors.ts`, `e2e/fixtures/game-fixtures.ts`, any `src/**` file.

---

# 8. Performance Considerations

- **CPU/Memory:** negligible — one additional short-lived test reusing an already-open browser context; no new heavyweight fixtures.
- **Rendering optimization:** relies on existing `waitForGameplayScene()` polling rather than fixed sleeps for the scene-transition assertion, avoiding both flakiness and unnecessary over-waiting.
- **Asset loading:** none new — Replay reuses already-loaded level assets (per `handleRetryOrNext`, `this.data.levels[level]` is already in memory; no network re-fetch expected).
- **Drag interaction optimization:** not exercised by this test (verifies canvas *renders* interactive content via `assertCanvasHasContent`, not a full drag-drop cycle) — acceptable per AC 4 ("fully interactive **and can be played**" is evidenced by canvas content + scene readiness; a full stone-drag re-validation would duplicate `tc-006-008-gameplay.spec.ts` coverage rather than add value).
- **Offline / low-end device considerations:** not in scope — Replay is a same-session, no-network-refetch transition; existing suite has no offline-mode test lane to extend.
- **Measurable expectation:** new test should add no more than ~3–5s to total suite runtime beyond the mandated 2s settle wait plus normal scene-transition polling (bounded by `Timeouts.sceneTransition` = 15s worst case).

---

# 9. Risks

| Risk | Type | Mitigation |
|---|---|---|
| TC_016 already clicks Map as its final step, potentially navigating away from Level End before TC_017 runs | Technical / sequencing | Resolve via §14 Open Question 1 before implementation — either confirm Map-click doesn't fully tear down state usable by TC_017, or (fallback) have TC_017 re-enter Level End via `triggerLevelEndScene` (Option B) if natural continuation proves unreliable. |
| `LevelEndScene.dispose()` (500ms after retry) racing the new `GameplayScene` construction could cause a flaky read of `selectedLevelNumber` if read too early | Regression / flakiness | Always call `waitForGameplayScene()` before reading `gameStateService` state (already sequenced this way in §7, step 4 before step 6). |
| Serial suite (`workers: 1`, `fullyParallel: false`) means a flaky/failing TC_017 blocks nothing after it (it's last) but a bug in it does not block earlier tests — low blast radius | Deployment / CI | No mitigation needed beyond normal review; failure isolated to end of suite. |
| README/TC-numbering drift (README already inconsistent between `TC_016`/`TC_0016`) | Documentation | Use `FTM_TC_017` in code (matching existing `FTM_TC_016` code convention) and `TC_0017` in the README table (matching the table's existing column convention) — consistent with current (if imperfect) precedent, not introducing a new inconsistency. |

---

# 10. Acceptance Criteria Mapping

| # | Acceptance Criterion | Implementation | Validation | Expected Outcome |
|---|---|---|---|---|
| 1 | Automate Replay Level flow using existing framework | New `tc-017-level-replay.spec.ts` via `registerTests(getPage)` pattern | Code review against existing isolated-spec conventions | Test file structurally indistinguishable from siblings |
| 2 | Replay restarts the same level successfully | Step 3 (click) + Step 6 (`selectedLevelNumber === 1` assertion) | `expect(restartedLevel).toBe(1)` | Assertion passes; fails loudly if `handleRetryOrNext` regresses to increment level |
| 3 | Gameplay loads correctly after replay | Step 4 (`waitForGameplayScene()`) | Playwright auto-retry assertion on `#canvas` + `#pause-button` | Passes within `Timeouts.sceneTransition` (15s) |
| 4 | Replayed level fully interactive, playable from beginning | Step 5 (`assertCanvasHasContent`) | Non-transparent pixel check on `#canvas` | Confirms stones re-rendered post-replay |
| 5 | Correct level context maintained | Step 6 | `selectedLevelNumber` read via `window.__ftm.gameStateService` | Equals pre-replay level (Level 2 / index `1`) |
| 6 | Integrated into existing FTM E2E suite | Registration in `ftm-assessment-survey-flow.spec.ts` after `tc016` | `npm run test:e2e` includes TC_017 in output | TC_017 appears in default suite run + HTML/JUnit report |
| 7 | Follows framework standards/helpers/conventions | Reuses `LevelEndPage`, `GameplayPage`, `assertCanvasHasContent`, `Timeouts` — zero new abstractions beyond one constant | Code review | No new page-object/helper duplication |
| 8 | Reliable, non-flaky in CI | Explicit waits (`waitForGameplayScene`, `waitForTimeout(replaySettleDelay)`) instead of arbitrary sleeps for state checks | 20-run CI flake check (see §13) | 0 flakes across ≥20 consecutive CI runs |

---

# 11. Unit Testing

This is an E2E-only change — no `src/**` production code is modified, so no new Jest unit tests are strictly required by this ticket. For completeness, if `src/scenes/levelend-scene/levelend-scene.spec.ts` is touched in a related future change, note the existing coverage already asserts the retry path publishes `SWITCH_SCENE_EVENT` with `SCENE_NAME_GAME_PLAY` (see `levelend-scene.spec.ts:308-312`) — this spec's E2E test is complementary, not duplicative, since it verifies the *browser-observable* result (scene actually renders, canvas actually re-populates) rather than the *event-publish* call, which the unit test already covers.

- **Files to test:** none new.
- **Scenarios/edge cases/mocks:** n/a (no unit-level code change).
- **Coverage recommendation:** no change to current Jest coverage thresholds expected.

---

# 12. End-to-End Testing

**Happy path:**
- `FTM_TC_017`: Level End loaded (from TC_016) → 2s settle → click Replay → gameplay scene reloads → canvas has content → `selectedLevelNumber` unchanged (Level 2).

**Regression scenarios:**
- Run full `npm run test:e2e` suite (TC_001–TC_017) to confirm no ordering/state regressions introduced by inserting TC_017 after TC_016.
- Run `npm run test:e2e:isolated` to confirm `tc-017-level-replay.spec.ts` doesn't silently depend on cross-file fixture state it can't get standalone (flagged in §14 Open Question 2).

**Negative scenarios:**
- If `#levelend-retry-btn` is not rendered (would only happen for `currentLevel === 0` with passing stars, per `levelend-scene.ts:339-342`) — not applicable to the current suite (plays Level 2, `currentLevel === 1`, so Replay always renders per `levelend-scene.ts:330-337`), but document this as a precondition comment in the new spec so a future change to which level the orchestrator plays doesn't silently break the Replay button's visibility assumption.

**Offline scenarios:** out of scope — no offline test lane exists in the current suite to extend.

**Low-end device scenarios:** out of scope — Playwright suite runs a single fixed Chromium profile (`playwright.config.ts`); no device-emulation matrix exists to extend.

**Performance validation:** confirm total added runtime (§8) via before/after comparison of `npm run test:e2e:report` duration.

**Cross-browser/platform validation:** not applicable — suite is Chromium-only per `playwright.config.ts`.

---

# 13. Rollout Strategy

**Implementation order:**
1. Add `Timeouts.replaySettleDelay` constant.
2. Author `tc-017-level-replay.spec.ts`.
3. Register in orchestrator (`ftm-assessment-survey-flow.spec.ts`).
4. Update `e2e/tests/README.md` TC table.
5. Run locally (`npm run test:e2e`) and in isolation (`npm run test:e2e:isolated`) before opening a PR.

**Deployment strategy:** standard PR → CircleCI `node/test` + `e2e-tests` jobs must pass before merge, per existing branch-gating rules in `.circleci/config.yml`. No feature flag needed (test-only change).

**Rollback plan:** revert the PR; no production/runtime code is touched, so rollback carries zero user-facing risk.

**Monitoring requirements:** watch the `e2e-tests` CircleCI job's HTML/JUnit report (already uploaded to S3) for the first several post-merge runs to catch any latent flake in the new test.

**Success metrics:** TC_017 green on `main`/`develop` for the first 20 consecutive CI runs; no increase in overall `e2e-tests` job duration beyond the estimate in §8.

---

# 14. Open Questions

1. **Sequencing conflict:** `tc-016-level-completion.spec.ts` currently ends by **clicking Map** and asserting arrival at Level Selection — this navigates away from the Level End screen. Since `FTM_TC_017` is specified to run "after" TC_016 and needs the Level End screen still loaded, please confirm one of:
   - (a) TC_016 should be left as-is, and TC_017 should independently re-enter Level End for Level 2 via the existing `triggerLevelEndScene(page, 3, 1, false)` helper (Option B in §4) rather than assuming natural continuation, **or**
   - (b) TC_016's final "click Map" step should move to become the last step of TC_017 instead (Option A in §4), accepting a small edit to an existing, previously-signed-off test case.
   This materially changes §6/§7 and should be confirmed before implementation begins.
2. Does `tc-017-level-replay.spec.ts` need to be independently runnable via `npm run test:e2e:isolated` (i.e., with its own setup to reach Level End without relying on TC_001–016 having already run in the same file), matching the "self-contained" description of the isolated suite in `e2e/tests/README.md`? Current isolated files (e.g. `tc-016`) appear to assume `getPage()` already reflects deep flow state, so this may be an existing pattern gap rather than one unique to this ticket.
3. Should the QA Test Case spreadsheet (linked in the ticket) be updated with the new `TC_0017` row as part of this ticket's Definition of Done, or tracked as a separate QA-doc task?
4. Is verifying `selectedLevelNumber` via `window.__ftm.gameStateService` (a debug/internal global) acceptable as the source of truth for AC 5, or is a DOM-visible signal preferred (none currently exists — would require a `src/` change, which is out of scope per the ticket's automation-only framing)?
