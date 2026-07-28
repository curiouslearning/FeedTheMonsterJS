# E2E Test Cases

## Where to find test case documentation

The test cases covered here correspond to the **FeedTheMonsterJS QA Test Case Document** (FTM_TC_001 – FTM_TC_0016).
Refer to that document for:
- Detailed step-by-step instructions
- Expected outcomes per step
- Environment prerequisites
- Test data requirements

Each test uses the `FTM_TC_XXX` prefix in its title to match the document's TC number directly.

---

## Primary test file

**[ftm-assessment-survey-flow.spec.ts](ftm-assessment-survey-flow.spec.ts)** — the default run target.

All 16 TCs live in one `test.describe.serial` block. The browser opens **once**, runs every test case in order (TC_001 → TC_0016), and closes once at the end. No navigation restarts between test cases — each test picks up exactly where the previous left off.

```bash
npm run test:e2e          # runs ftm-assessment-survey-flow.spec.ts (headed off)
npm run test:e2e:headed   # same, with a visible browser
npm run test:e2e:ui       # Playwright UI — inspect each step
```

---

## Isolated spec files (`isolated/`)

The `isolated/` subfolder contains the same 16 TCs split by feature area. Each file is **self-contained** — it navigates from scratch to its required starting state — so you can run one file on its own when debugging a failure without re-running the full suite.

Files use 3-digit zero-padded prefixes so they sort into TC flow order alphabetically.
Audio is **not** mocked in isolated files — real audio plays (same as the primary flow file).

| File | TCs | What it covers |
|------|-----|----------------|
| [isolated/tc-001-app-launch.spec.ts](isolated/tc-001-app-launch.spec.ts) | TC_001 | App loads; loading screen hides; start screen appears |
| [isolated/tc-002-003-start-screen.spec.ts](isolated/tc-002-003-start-screen.spec.ts) | TC_002–TC_003 | Start screen elements; navigate to level selection |
| [isolated/tc-004-005-level-selection.spec.ts](isolated/tc-004-005-level-selection.spec.ts) | TC_004–TC_005 | Level grid unlocked in debug mode; navigate to gameplay |
| [isolated/tc-006-008-gameplay.spec.ts](isolated/tc-006-008-gameplay.spec.ts) | TC_006–TC_008 | Gameplay UI; stones appear on canvas; drag-and-drop |
| [isolated/tc-009-013-assessment.spec.ts](isolated/tc-009-013-assessment.spec.ts) | TC_009–TC_013 | Assessment overlay; correct drag; green feedback; wrong drag |
| [isolated/tc-014-015-mini-game.spec.ts](isolated/tc-014-015-mini-game.spec.ts) | TC_0014–TC_0015 | Treasure chest canvas visible; click 5 stones; mini game completes |
| [isolated/tc-016-level-completion.spec.ts](isolated/tc-016-level-completion.spec.ts) | TC_0016 | Jar fill animation; level end screen; map/next buttons |

These files are excluded from `npm run test:e2e` via `testIgnore: ['**/isolated/**']` in `playwright.config.ts`.

```bash
# Run the full isolated suite (all 7 files, sequential)
npm run test:e2e:isolated

# Run one specific file
npx playwright test e2e/tests/isolated/tc-006-008-gameplay.spec.ts
```

---

## Test design notes

- `ftm-assessment-survey-flow.spec.ts` uses `test.describe.serial` — tests run in declaration order,
  a failure stops the remaining tests in the suite.
- State shared between consecutive TCs (`capturedStonePos`, `monsterHitboxCenter`,
  `correctAssessmentBtnId`) is declared at the describe-block level and written by
  earlier tests, read by later ones.
- `playwright.config.ts` enforces `workers: 1` and `fullyParallel: false` globally,
  so even the isolated files never run in parallel.
