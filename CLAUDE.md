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
- **Analytics:** Firebase + custom `AnalyticsIntegration` singleton

## Folder Structure
```
src/
  feedTheMonster.ts          # App entry point
  analytics/                 # Firebase analytics wrapper
  assessment/                # Survey/assessment flow
  common/                    # Shared utils, event-names, global-vars
  components/                # All reusable UI components
    background/
    baseHTML/                # BaseHTML – base class for all HTML components
    buttons/                 # BaseButtonComponent + all button subclasses
    evolutionAnimation/
    feedback-text/
    level-field/
    level-indicator/
    popups/                  # BasePopupComponent + PausePopup + ConfirmPopup
    prompt-text/
    riveMonster/
    stone-handler/
    timerHtml/
    trail-effects/
  constants/                 # All string constants (IDs, paths, event names)
  data/                      # DataModal, GameScore, API fetch, font map
  events/                    # PubSub event bus
  gameSettingsService/       # Canvas/rive element references
  gameStateService/          # Singleton state + EVENTS enum
  gamepuzzles/               # Puzzle logic (letter, word, audio)
  miniGame/                  # Treasure-chest mini-game
  sceneHandler/              # SceneHandler – mounts/unmounts scenes
  scenes/
    start-scene/             # StartScene
    level-selection-scene/   # LevelSelectionScreen + levelSelectionController
    gameplay-scene/          # GameplayScene (+ flow/input/ui managers)
    levelend-scene/          # LevelEndScene
    progress-scene/          # ProgressionScene (jar fill animation)
    loading-scene.ts         # LoadingScene (cloud animation)
  services/                  # Scheduler, feature flags
  styles/                    # Global SCSS
  tutorials/                 # Tutorial overlays
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
  helpers/                   # navigation, canvas, mock helpers
  pages/                     # Page Object Models
  tests/                     # *.spec.ts test files
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
SWITCH_SCENE_EVENT   – arg: scene name string
GAMEPLAY_DATA_EVENT  – arg: { currentLevelData, selectedLevelNumber }
LEVEL_END_DATA_EVENT – arg: { starCount, currentLevel, data, monsterPhaseNumber }
GAME_PAUSE_STATUS_EVENT
START_GAME
GAME_HAS_STARTED
STONEDROP
LOADPUZZLE
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
- Path aliases via tsconfig: `@components`, `@constants`, `@common`, `@gameStateService`, etc.
- Scenes are plain TS classes with `dispose()` for cleanup — no framework lifecycle.
- All HTML components extend `BaseHTML`; all buttons extend `BaseButtonComponent`.
- Popups show/hide via `.show` CSS class + PubSub events.
- Audio via `AudioPlayer` wrapper (wraps Howler).
- Analytics via `AnalyticsIntegration.getInstance().track(eventType, data)`.
- No React/Vue/Angular — pure DOM manipulation.

## Running the App
```bash
npm run dev          # Dev server on http://localhost:8080
npm run build        # Production build -> ./build/
```

## Running Tests
```bash
npm test                    # Jest unit tests
npm run test:e2e            # All Playwright E2E tests (headless)
npm run test:e2e:headed     # Headed browser (visible)
npm run test:e2e:ui         # Playwright UI mode
npm run test:e2e:debug      # Step-through debugger
npm run test:e2e:report     # Open last HTML report
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

### Helpers (e2e/helpers/)
- `navigation-helpers.ts` – navigateTo*, seedLevelProgress, clearGameProgress
- `canvas-helpers.ts` – canvasDrag, getCanvasPixelColor, assertCanvasHasContent
- `mock-helpers.ts` – applyStandardMocks (audio + analytics stubs), mockRiveWasm

### Constants (e2e/constants/)
- `selectors.ts` – all DOM selectors
- `urls.ts` – Routes.game() URL builder
- `timeouts.ts` – named timeout constants

### Test Files (e2e/tests/)
| File | Coverage |
|------|----------|
| `loading-screen.spec.ts` | Initial load, progress bar, page title |
| `start-scene.spec.ts` | Play button, title, nav to level selection |
| `level-selection.spec.ts` | Level grid, locked state, nav buttons |
| `gameplay.spec.ts` | Canvas, pause popup, resume, map nav |
| `level-end.spec.ts` | Stars, buttons, next/map navigation |
| `navigation-flow.spec.ts` | Full end-to-end user journey |

### Important Notes for Canvas Tests
- Stones are rendered on #canvas — interactions use page.mouse.move/down/up.
- Rive animations are on #rivecanvas — cannot assert Rive state via DOM.
- Level-end can be triggered in tests via gameStateService published events (page.evaluate).
- Audio requests should always be mocked (applyStandardMocks) to prevent test hangs.

## localStorage Keys
| Key | Purpose |
|-----|---------|
| `storePreviousPlayedLevel{lang}` | Last played level number |
| `{lang}gamePlayedInfo` | JSON array of completed level scores |
| `pwa_installed_status` | PWA installation state |

## Prerequisites for E2E Tests
1. npm install — installs all dependencies including @playwright/test
2. npx playwright install chromium — downloads Chromium browser
3. Dev server must be running (npm run dev) OR set CI=true (auto-starts)
