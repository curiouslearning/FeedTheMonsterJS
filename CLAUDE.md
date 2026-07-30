# FeedTheMonsterJS — Claude Code Guide

## Project Overview
Browser-based literacy game. Children drag stones with letters onto a monster to build words/sounds. Built in TypeScript + Webpack, rendered on `<canvas>` + Rive animations + HTML overlays.

## Tech Stack
- **Language:** TypeScript (target ES2022, moduleResolution: bundler)
- **Bundler:** Webpack 5 (dev server: `localhost:8080`)
- **Unit Tests:** Jest + jsdom + ts-jest  (`npm test`)
- **E2E Tests:** Playwright (`npm run test:e2e`)
- **Animations:** Rive (`@rive-app/canvas`)
- **Audio:** Howler.js
- **Analytics:** Firebase (config via `.env` + `dotenv`) + custom `AnalyticsIntegration` singleton, backed by `@curiouslearning/analytics`
- **Error tracking:** Sentry (`@sentry/browser`)
- **Native wrapper:** Capacitor (`@capacitor/core`, `@capacitor/android`)
- **PWA/offline:** Workbox (`src/sw-src.js` service worker source, built via `npm run wb:inject`)
- **Internal packages:** `@curiouslearning/core`, `@curiouslearning/features` (feature flags), `@curiouslearning/assessment-survey` (drives `src/assessment/`)
- **Linting/formatting:** ESLint + Prettier via `gts` (Google TypeScript Style) — `.eslintrc.json`, `.prettierrc.js`

## Folder Structure
```
src/
  feedTheMonster.ts          # App entry point
  app-config/                # AppConfig interface + __APP_CONFIG__ webpack define (ENV, DEBUG_MODE)
  analytics/                 # Firebase analytics wrapper
  assessment/                # Survey/assessment flow (config/, ui/, assessment-flow-coordinator.ts, etc.)
  common/                    # Shared utils, event-names, global-vars
  components/                # All reusable UI components
    background/
    baseHTML/                # BaseHTML – base class for all HTML components
    buttons/                 # BaseButtonComponent + all button subclasses
    cursor/                  # Custom cursor component
    evolutionAnimation/
    feedback-text/
    jarRiveAnimation/        # Jar Rive animation (progress scene)
    level-field/
    level-indicator/
    popups/                  # BasePopupComponent + PausePopup + ConfirmPopup
    prompt-text/
    riveComponent/           # Generic Rive component wrapper
    riveMonster/
    stone-handler/
    timerHtml/
    trail-effects/
  constants/                 # index.ts – all string constants (IDs, paths, event names)
  data/                      # DataModal, GameScore, API fetch, font map
  events/                    # PubSub event bus
  gameSettingsService/       # Canvas/rive element references
  gameStateService/          # Singleton state + EVENTS enum
  gamepuzzles/               # Puzzle logic (letter, word, audio)
  miniGame/                  # miniGameStateService/ + miniGames/treasureChest/ (treasure-chest mini-game)
  modules/android/           # Capacitor/Android-specific analytics strategy
  sceneHandler/              # SceneHandler – mounts/unmounts scenes
  scenes/
    start-scene/             # StartScene
    level-selection-scene/   # LevelSelectionScreen + levelSelectionController
    gameplay-scene/          # GameplayScene (+ flow/input/ui managers)
    levelend-scene/          # LevelEndScene
    progress-scene/          # ProgressionScene (jar fill animation)
    loading-scene.ts         # LoadingScene (cloud animation)
  services/                  # scheduler.ts, features/ (feature flags)
  styles/                    # Global SCSS
  tutorials/                 # Tutorial overlays
  sw-src.js                  # Service worker source (built via `npm run wb:inject`)
public/
  index.html                 # Single-page shell – all canvas IDs live here
  assets/                    # Images, audio, fonts, Rive files
lang/
  english/                   # ftm_english.json + audio/images
  <other languages>/
e2e/                         # Playwright E2E tests
  playwright.config.ts       # At repo root
  tsconfig.json
  constants/                 # selectors.ts, urls.ts, timeouts.ts
  fixtures/                  # game-fixtures.ts (custom test + page instances)
  helpers/                   # navigation, canvas, mock, game-state helpers
  pages/                     # Page Object Models
  tests/                     # *.spec.ts test files (+ tests/isolated/ per-feature specs)
```

## Key DOM IDs (stable, safe to use as selectors)
| ID | Scene | Purpose |
|----|-------|---------|
| `#loading-screen` | Loading | Shown while assets load; hidden via `display:none` |
| `#progress-bar` | Loading | CSS width shows download progress |
| `#background` | All | Main game wrapper div |
| `#title-and-play-button` | Start | Container for title + play button |
| `#play-button` | Start | Play button |
| `#title` | Start | Game title text |
| `#start-scene-click-area` | Start | Full-screen click area |
| `#level-selection-container` | Level Select | Container injected by levelSelectionController |
| `#level-selection-grid` | Level Select | Button grid |
| `{n}-level-button` | Level Select | `n` = 0–8 game levels (0-based), 9=Prev, 11=Next |
| `#canvas` | Gameplay | Stone rendering canvas |
| `#rivecanvas` | All | Rive monster canvas |
| `#game-control` | Gameplay | Button container (pause etc.) |
| `#pause-button` | Gameplay | Pause button |
| `#feedback-text` | Gameplay | "Fantastic!" / "Great!" feedback |
| `#pause-popup` | Gameplay | Pause modal; visible when `.show` class present |
| `[data-click="close"]` | Popup | Closes any popup with this data attribute |
| `#confirm-popup` | Gameplay | Yes/No confirmation modal |
| `#yes-button` / `#cancel-button` | Confirm | Confirm dialog buttons |
| `#levelEnd` | Level End | Level-end background; `display:block` when active |
| `.stars-container` | Level End | Holds star `<img>` elements |
| `.stars` | Level End | Individual star images (added class `show` after animation) |
| `#levelEndButtons` | Level End | Button container |
| `#levelend-map-btn` | Level End | Map / return button |
| `#levelend-next-btn` | Level End | Next level button |
| `#levelend-retry-btn` | Level End | Replay button |
| `#treasurecanvas` | Mini-game | Treasure-chest mini-game canvas |
| `#assessment-survey-overlay` | Assessment | Assessment survey overlay container |
| `#assessment-survey-close-button` | Assessment | Closes the assessment survey overlay |
| `.popup__overlay` / `.popup__content-wrapper` | Popup | Generic popup overlay/content classes (assessment + others) |

## URL Parameters
| Param | Default | Purpose |
|-------|---------|---------|
| `cr_lang` | `english` | Language pack (loads `./lang/{lang}/ftm_{lang}.json`) |
| `cr_user_id` | `null` | Analytics user ID |
| `source` | `null` | Traffic source |
| `campaign_id` | `null` | Campaign tracking |
| `container_app_version` | `null` | Native wrapper version |

## Game State Events (gameStateService.EVENTS)
```
SWITCH_SCENE_EVENT               – arg: scene name string
GAMEPLAY_DATA_EVENT               – arg: { currentLevelData, selectedLevelNumber }
LEVEL_END_DATA_EVENT              – arg: { starCount, currentLevel, data, monsterPhaseNumber }
GAME_PAUSE_STATUS_EVENT
START_GAME
GAME_HAS_STARTED
CORRECT_STONE_POSITION
WORD_PUZZLE_SUBMITTED_LETTERS_COUNT
LOAD_NEXT_GAME_PUZZLE
STONEDROP                         – imported from @common (event-names.ts)
LOADPUZZLE                        – imported from @common (event-names.ts)
```

## Scene Names (constants)
```
SCENE_NAME_START           = 'StartScene'
SCENE_NAME_LEVEL_SELECT    = 'LevelSelection'
SCENE_NAME_GAME_PLAY       = 'GamePlay'
SCENE_NAME_GAME_PLAY_REPLAY= 'GamePlay_Replay'
SCENE_NAME_LEVEL_END       = 'LevelEnd'
SCENE_NAME_PROGRESS_LEVEL  = 'ProgressLevel'
```

## Coding Conventions
- Path aliases via tsconfig (mirrored separately in `jest.config.js`'s `moduleNameMapper` — keep both in sync):
  `@components(/*)`, `@buttons`, `@popups/*`, `@common`, `@constants`, `@data(/*)`, `@sceneHandler/*`, `@scenes`,
  `@events(/*)`, `@feedbackText/*`, `@gamepuzzles(/*)`, `@gameStateService(/*)`, `@gameSettingsService(/*)`,
  `@tutorials`, `@assessment/*`, `@services/*`, `@miniGameStateService(/*)`, `@miniGames(/*)`, `@appConfig`
- Scenes are plain TS classes with `dispose()` for cleanup — no framework lifecycle.
- All HTML components extend `BaseHTML`; all buttons extend `BaseButtonComponent`.
- Popups show/hide via `.show` CSS class + PubSub events.
- Audio via `AudioPlayer` wrapper (wraps Howler).
- Analytics via `AnalyticsIntegration.getInstance().track(eventType, data)`.
- No React/Vue/Angular — pure DOM manipulation.

## Running the App
```bash
npm run dev          # Dev server on http://localhost:8080
npm run build        # Production build -> ./build/ (also runs wb:inject for the service worker)
npm run build:dev    # Dev-mode build (no minify)
npm run build:test   # Test-env build
npm run build:prod   # Prod build (same as `npm run build`)
npm run lint         # ESLint over src/ (gts config)
```

## Running Tests
```bash
npm test                    # Jest unit tests (with coverage)
npm run test:local          # Jest unit tests, no coverage (faster)
npm run test:e2e            # Primary Playwright E2E suite (headless)
npm run test:e2e:headed     # Headed browser (visible)
npm run test:e2e:ui         # Playwright UI mode
npm run test:e2e:debug      # Step-through debugger
npm run test:e2e:report     # Open last HTML report
npm run test:e2e:isolated   # Per-feature specs in e2e/tests/isolated/ (excluded from the default run)
```

## E2E Test Architecture

### Page Objects (e2e/pages/)
Each game scene has a dedicated Page Object extending BasePage.
- `LoadingPage` – loading screen assertions
- `StartPage` – start scene interactions
- `LevelSelectionPage` – level grid, navigation buttons
- `GameplayPage` – canvas, pause, feedback
- `PausePopupPage` – pause modal + confirm dialog
- `LevelEndPage` – stars, next/retry/map buttons

### Fixtures (e2e/fixtures/game-fixtures.ts)
Custom `test` export with pre-navigated convenience fixtures:
- `atStartScene` – page loaded, loading done, start scene ready
- `atLevelSelection` – past start scene, level grid visible
- `atGameplay` – level 1 gameplay active
- `createSharedState` / `SharedFlowState` and `createFullGameplayFlowState` / `FullGameplayFlowState` – state-sharing helpers used by the serial assessment-flow test

### Helpers (e2e/helpers/)
- `navigation-helpers.ts` – navigateTo*, seedLevelProgress, clearGameProgress
- `canvas-helpers.ts` – canvasDrag, getCanvasPixelColor, assertCanvasHasContent
- `mock-helpers.ts` – applyStandardMocks (audio + analytics stubs), mockRiveWasm
- `game-state-helpers.ts` – triggering/waiting for game-state events directly (e.g. `triggerAssessment`, `completeAssessmentSurvey`, `speedUpMiniGame`, `waitForMiniGameComplete`, `triggerLevelEndScene`, `publishGameEvent`)

### Constants (e2e/constants/)
- `selectors.ts` – all DOM selectors
- `urls.ts` – Routes.game() URL builder
- `timeouts.ts` – named timeout constants

### Test Files (e2e/tests/)
- `ftm-assessment-survey-flow.spec.ts` – the primary suite, run via `npm run test:e2e`. Contains all test cases (`FTM_TC_001`–`FTM_TC_0016`) in a single `test.describe.serial` block covering app launch, start screen, level selection, gameplay, assessment, mini-game, and level completion.
- `isolated/` – 7 self-contained per-feature specs (`tc-001-app-launch`, `tc-002-003-start-screen`, `tc-004-005-level-selection`, `tc-006-008-gameplay`, `tc-009-013-assessment`, `tc-014-015-mini-game`, `tc-016-level-completion`), excluded from the default run (`testIgnore: ['**/isolated/**']` in `playwright.config.ts`), run via `npm run test:e2e:isolated`.
- `README.md` – documents the TC-numbering scheme and this structure in detail.

### Important Notes for Canvas Tests
- Stones are rendered on #canvas — interactions use page.mouse.move/down/up.
- Rive animations are on #rivecanvas — cannot assert Rive state via DOM.
- Level-end can be triggered in tests via gameStateService published events (page.evaluate).
- Audio requests should always be mocked (applyStandardMocks) to prevent test hangs.

## localStorage Keys
| Key | Purpose |
|-----|---------|
| `storePreviousPlayedLevel{lang}` (+ `...Debug` variant) | Last played level number |
| `{lang}gamePlayedInfo` | JSON array of completed level scores |
| `pwa_installed_status` | PWA installation state |
| `lastSessionEndTime` | Timestamp used for session-gap analytics |
| `is_cached` | Whether the cached language version info is valid |
| `version{lang}` | Cached content version per language |
| `{lang}totalStarCount` | Total stars earned for a language |
| `{lang}highestLevelReached` | Highest level reached for a language |

## Prerequisites for E2E Tests
1. npm install — installs all dependencies including @playwright/test
2. npx playwright install chromium — downloads Chromium browser
3. Dev server must be running (npm run dev) OR set CI=true (auto-starts)

## CI/CD
CircleCI (`.circleci/config.yml`), no GitHub Actions test workflow (only `.github/workflows/release.yml` for releases):
- `node/test` job — runs `npm test`.
- `e2e-tests` job — runs on the `mcr.microsoft.com/playwright` image, runs `npm run test:e2e` with `CI: 'true'`, uploads the Playwright HTML report to S3 and stores JUnit results.
- `build-and-deploy-{dev,test,release,prod}` jobs — build with `build:dev`/`build:test`/`build:prod` and sync `./build/` to per-environment S3 buckets, gated by branch (`develop`, `test`, `/.*epic.*/`, `main`); all require `node/test` and `e2e-tests` to pass first.
- `invalidate-cloudfront-cache-prod` — runs after a prod deploy.
- Releases/versioning use `release-it` (conventional-commit types: `feat`, `fix`, `cont`, `other`).

## Tooling & Config Files
- **ESLint/Prettier:** `.eslintrc.json` and `.prettierrc.js` both extend `gts` (Google TypeScript Style); lint only covers `src/**/*.ts` (not `e2e/`). No husky/lint-staged git hooks are configured.
- **Jest:** `jest.config.js` — ts-jest preset, jsdom environment, `setupFiles: ['<rootDir>/setupJest.js']`, `collectCoverage: true` by default (use `test:local` to skip). Has its own `moduleNameMapper` mirroring the tsconfig path aliases plus mocks for images/audio/scss and `@curiouslearning/*` packages — update both if you add a new alias.
- **Playwright:** `playwright.config.ts` — `testDir: e2e/tests`, `testIgnore: ['**/isolated/**']`, `fullyParallel: false` / `workers: 1` (fully sequential), auto-starts `npm run dev` when not in CI, Chromium only, HTML + JUnit + JSON reporters.
- **`.env`:** Firebase config (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_DATABASE_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID`), loaded via `dotenv` and injected at build time.
- **`webpack.config.js`** — build/dev-server config; **`workbox-config.js`** — service-worker manifest config for `npm run wb:inject`.