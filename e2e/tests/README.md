# E2E Test Cases

## Where to find test case documentation

The test cases covered here correspond to the **FeedTheMonsterJS QA Test Case Document** (FTM_TC_001 – FTM_TC_0016).
Refer to that document for:
- Detailed step-by-step instructions
- Expected outcomes per step
- Environment prerequisites
- Test data requirements

Each test in this directory uses the `FTM_TC_XXX` prefix in its title to match the document's TC number directly.

---

## File structure

| File | TCs | What it covers |
|------|-----|----------------|
| [tc-001-app-launch.spec.ts](tc-001-app-launch.spec.ts) | TC_001 | App loads in Chrome; loading screen hides; start screen appears |
| [tc-002-003-start-screen.spec.ts](tc-002-003-start-screen.spec.ts) | TC_002–TC_003 | Start screen elements (title, play button, dev toggle, Rive monster); navigate to level selection |
| [tc-004-005-level-selection.spec.ts](tc-004-005-level-selection.spec.ts) | TC_004–TC_005 | Level grid unlocked in debug mode; level 2 click navigates to gameplay |
| [tc-006-008-gameplay.spec.ts](tc-006-008-gameplay.spec.ts) | TC_006–TC_008 | Gameplay UI elements; stones appear on canvas; drag-and-drop correct stone triggers feedback |
| [tc-009-013-assessment.spec.ts](tc-009-013-assessment.spec.ts) | TC_009–TC_013 | Assessment overlay triggered; audio button; correct drag to chest; green feedback; wrong drag shows red feedback |
| [tc-0014-0015-mini-game.spec.ts](tc-0014-0015-mini-game.spec.ts) | TC_0014–TC_0015 | Treasure chest canvas visible after assessment closes; click 5 stones; mini game completes |
| [tc-0016-level-completion.spec.ts](tc-0016-level-completion.spec.ts) | TC_0016 | Jar fill animation (ProgressionScene); level end screen with stars, Rive monster, map/next buttons |

---

## Running tests

```bash
# All E2E tests
npm run test:e2e

# A single file by name pattern
npx playwright test tc-006

# Headed (visible browser)
npm run test:e2e:headed

# Playwright UI mode (recommended for debugging)
npm run test:e2e:ui
```

## Test design notes

- Each file is **self-contained**: it navigates from scratch to the state it needs in `beforeAll`.
- Tests within a file run **serially** and share one browser session.
  A failure in one test stops the remaining tests in that file.
- TC_006–008 share captured stone position and hitbox state across tests, so they are grouped.
- TC_009–013 share the assessment answer button IDs identified in TC_0011, so they are grouped.
- TC_0014–0015 reuse the full gameplay + assessment + close flow in `beforeAll`, so they are grouped.
