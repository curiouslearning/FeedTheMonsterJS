---
description: "Task list for Service Worker & Workbox 7 Integration"
---

# Tasks: Service Worker & Workbox 7 Integration

**Input**: Design documents from `specs/001-sw-workbox7-integration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sw-integration.md, quickstart.md

**Tests**: INCLUDED — Jest Gherkin (Given/When/Then) specs are required by Constitution Principle III and spec FR-021.

**Organization**: Tasks are grouped by user story. Note: this is a tightly-coupled migration — the worker (`src/sw-src.ts`) and client (`src/feedTheMonster.ts`) are each edited by several stories, so many same-file tasks are sequential rather than parallel. File-level dependencies are called out explicitly.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 (maps to spec.md user stories)
- Exact file paths are included in each task

## Path Conventions

Single-project web app; paths are repository-root relative (`src/`, `webpack.config.js`, `package.json`, `public/`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the dependency tree every subsequent task relies on.

- [X] T001 Update `package.json` dependencies and scripts per [contracts/sw-integration.md](./contracts/sw-integration.md) C4: **add** `@curiouslearning/sw@^1.0.0`, `workbox-core@^7.4.1`, `workbox-precaching@^7.4.1`, `workbox-routing@^7.4.1` (dependencies) and `workbox-webpack-plugin@^7.4.1` (devDependencies); **remove** `workbox@^0.0.0`, `workbox-window@^4.3.1`, `@types/workbox-window@^4.3.4` (dependencies) and `workbox-cli@^7.3.0` (devDependencies); **delete** the `wb:inject` script and strip `&& npm run wb:inject` from `build`, `build:dev`, `build:test`, and `build:prod`.
- [X] T002 Run `npm install` to resolve the new tree and regenerate `package-lock.json`; confirm `@curiouslearning/sw` and the three `workbox-*@7.4.1` runtime packages install and that `workbox-window`/`workbox-cli` are gone from `node_modules`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the TypeScript worker base and test scaffolding that ALL worker-side stories build on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Convert `src/sw-src.js` → `src/sw-src.ts` (base only): add `/// <reference lib="webworker" />`, declare `declare const self: ServiceWorkerGlobalScope & typeof globalThis;`, replace the `importScripts('.../workbox-cdn/releases/4.3.1/workbox-sw.js')` line with `import { precacheAndRoute } from 'workbox-precaching';`, and rewrite `workbox.precaching.precacheAndRoute(self.__WB_MANIFEST, {...})` as `precacheAndRoute(self.__WB_MANIFEST, { ignoreURLParametersMatching: [/^cr_/], exclude: [/^lang\//] })`. Preserve **all** existing FTM handlers verbatim for now (install/activate/`my-channel`/fetch/caching functions). Delete `src/sw-src.js`.
- [X] T004 [P] Add service-worker test scaffolding in `src/test-utils/sw-mocks.ts`: a `BroadcastChannel` mock and a `ServiceWorkerGlobalScope`-shaped `self` mock (with `registration`, `clients`, `addEventListener`, `skipWaiting`) reusable by the worker specs; wire it into `jest.config.js` if a setup file is needed.

**Checkpoint**: `src/sw-src.ts` exists and mirrors current behavior on Workbox 7 imports; worker specs can now be written.

---

## Phase 3: User Story 1 - Reliable update notifications (Priority: P1) 🎯 MVP

**Goal**: Update prompts fire only after the new worker has activated and claimed clients; no prompt on first install; accept → reload, decline → no-op — delivered via `@curiouslearning/sw`.

**Independent Test**: Deploy version A → cache → deploy version B → reopen → prompt appears only post-activation → accept reloads to fully version-B assets; a clean first install shows no prompt.

### Tests for User Story 1

- [X] T005 [US1] Write Given/When/Then worker lifecycle specs in `src/sw-src.spec.ts`: Given a SW scope with an active registration, When the script evaluates, Then `registerUpdateNotifier` is called after `precacheAndRoute`; Given no prior active worker (first install), Then no update broadcast is emitted. (Uses `src/test-utils/sw-mocks.ts`.)
- [X] T006 [P] [US1] Write Given/When/Then client registration spec in `src/feedTheMonster.sw.spec.ts`: Given the app boots, When it registers the worker, Then `registerServiceWorkerUpdates` is invoked with `{ swUrl: './sw.js', mode: 'confirm' }` and the returned registration is awaited.

### Implementation for User Story 1

- [X] T007 [US1] In `src/sw-src.ts`, import `registerUpdateNotifier` from `@curiouslearning/sw` and call `registerUpdateNotifier()` immediately after `precacheAndRoute(...)`; **remove** the hand-rolled update lifecycle — the `isUpdate = !!self.registration.active` line and the `activate` handler's `clients.claim().then(... postMessage({ msg: 'Update Found' }))` broadcast. Keep the `install` handler's `skipWaiting()` + `preloadAdditionalAssets()`. (Depends on T003; same file as T011/T013 — sequential.)
- [X] T008 [US1] In `src/feedTheMonster.ts` `registerWorkbox()`, replace `new Workbox('./sw.js')` + `wb.register()` with `const registration = await registerServiceWorkerUpdates({ swUrl: './sw.js', mode: 'confirm' })` (import from `@curiouslearning/sw`); preserve the subsequent `navigator.serviceWorker.ready`, `registration.update()`, `warmupAssessmentLanguageCaches`, and content-version fetch/compare/reload flow.
- [X] T009 [US1] In `src/feedTheMonster.ts`, remove the `"Update Found"` branch from `handleServiceWorkerMessage` (now owned by the library) while keeping the `"Loading"` branch; remove the now-unused `import { Workbox } from 'workbox-window'`. (Same file as T008 — sequential.)

**Checkpoint**: Update lifecycle is library-driven end-to-end; T005/T006 pass.

---

## Phase 4: User Story 2 - Uninterrupted offline play (Priority: P1)

**Goal**: All existing offline behaviors survive the TS/Workbox-7 conversion — app-shell precache, per-language bulk audio caching with progress, assessment caching + `/data/` aliasing, content-version invalidation, cache-bust bypass.

**Independent Test**: Cache a language online → go offline → cold-launch → complete a level with audio and scene navigation from cache.

### Tests for User Story 2

- [X] T010 [US2] Add Given/When/Then caching/fetch specs to `src/sw-src.spec.ts`: Given a precache config, Then `precacheAndRoute` receives the `exclude: [/^lang\//]` + ignore options; Given a `fetch` for `/data/*.json`, Then it is aliased to the assessment asset path and served cache-first; Given a bulk cache with a failing item, Then the item is tolerated and progress still completes. (Same file as T005 — sequential.)

### Implementation for User Story 2

- [X] T011 [US2] In `src/sw-src.ts`, preserve and TS-type the FTM caching surface carried over in T003: the `my-channel` `Cache`/`CacheUpdate`/`CacheAssessmentLanguage` handlers, `preloadAdditionalAssets`, `cacheAudiosFiles`/`cacheFeedBackAudio`/`cacheCommonAssets`, `getALLAudioUrls`/`getAssessmentAssetPath`/`cacheAssessmentLanguage`, and the `fetch` handler (assessment `/data/` aliasing + cache-first fallback). Add parameter/return types as needed so the file type-checks; make **no** behavior changes. (Depends on T007; same file — sequential.)

**Checkpoint**: Offline caching parity verified; T010 passes; no behavior drift from pre-migration.

---

## Phase 5: User Story 3 - Maintainable, shared, type-safe SW code (Priority: P2)

**Goal**: Lifecycle/registration/cache-bust/constants come from `@curiouslearning/sw` (no local duplicates), and the worker compiles cleanly as TypeScript.

**Independent Test**: Inspect worker + client — shared library provides lifecycle, registration, and cache-bust; `npx tsc --noEmit` reports no errors for the worker.

### Tests for User Story 3

- [X] T012 [US3] Add a Given/When/Then spec to `src/sw-src.spec.ts`: Given a request whose URL carries the cache-bust param, When the `fetch` handler runs, Then `isCacheBustRequest` returns true and the request bypasses the cache. (Same file as T005/T010 — sequential.)

### Implementation for User Story 3

- [X] T013 [US3] In `src/sw-src.ts`, replace the inline `requestUrl.searchParams.has('cache-bust')` check with `isCacheBustRequest(event.request.url)` and import `isCacheBustRequest` (and `CACHE_BUST_PARAM` if referenced) from `@curiouslearning/sw`. (Same file — sequential after T011.)
- [X] T014 [US3] Confirm the update channel uses library defaults on both sides: no local `'sw-update-channel'`/`'UpdateReady'` literals in `src/sw-src.ts` or `src/feedTheMonster.ts`, and `registerServiceWorkerUpdates` in `src/feedTheMonster.ts` omits `channelName`/`readyMessage` so both default to the shared constants.
- [X] T015 [US3] Run `npx tsc --noEmit` and resolve any worker type errors (e.g. `self.__WB_MANIFEST` typing, handler signatures) in `src/sw-src.ts` until it type-checks with zero errors.

**Checkpoint**: Worker is native TS, library-sourced, and type-clean.

---

## Phase 6: User Story 4 - Single-step, modern build (Priority: P2)

**Goal**: One build pass emits `build/sw.js` with a current precache manifest via `workbox-webpack-plugin`; no separate CLI injection step; workbox artifacts removed.

**Independent Test**: From a clean tree, run each build script and confirm a valid `build/sw.js` with an injected manifest is produced with no `workbox injectManifest` invocation.

### Implementation for User Story 4

- [X] T016 [US4] In `webpack.config.js`, add `const { InjectManifest } = require('workbox-webpack-plugin');` and `const { createInjectManifestOptions } = require('@curiouslearning/sw');`, then add to `plugins` a `new InjectManifest(createInjectManifestOptions({ swSrc: 'src/sw-src.ts', swDest: 'sw.js', globIgnores: ['lang/**/*.{wav,mp3,WAV,png,jpg,webp,svg,riv,wasm,js}', 'assessment-survey/audio/**/*.mp3'] }))`. Remove the `WorkboxInjectOnDevBuildPlugin` class and its `...(isDev ? [new WorkboxInjectOnDevBuildPlugin()] : [])` usage (and the now-unused `exec`/`child_process` import if orphaned).
- [X] T017 [P] [US4] Delete `workbox-config.js` (superseded by `createInjectManifestOptions`).
- [X] T018 [P] [US4] Remove the stray `<script type="module" src="https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js"></script>` from `public/index.html`.
- [X] T019 [US4] Verify single-pass builds: run `npm run build`, `npm run build:dev`, and `npm run build:test`; confirm each succeeds, emits `build/sw.js` containing an injected precache manifest (array replacing `self.__WB_MANIFEST`), performs no separate `workbox injectManifest` CLI call, and produces no `importScripts(.../workbox-cdn/...)` in the output. (Depends on T016.)

**Checkpoint**: Build is single-pass and workbox-CLI-free.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the whole migration and confirm the green-build gate (Constitution IV).

- [X] T020 Run `npm test` and confirm all specs — including `src/sw-src.spec.ts` and `src/feedTheMonster.sw.spec.ts` — pass.
- [ ] T021 [P] Execute [quickstart.md](./quickstart.md) V4 (update lifecycle, no stale reload) and V5 (offline parity) manually in a browser against a served `build/`. **(MANUAL QA — pending: requires a human in a browser; cannot be automated. All automated gates (V1 builds, V2 typecheck, V3 unit tests) pass.)**
- [X] T022 [P] Run a leftover-reference sweep: `git grep -n "workbox-window\|workbox-cli\|workbox-cdn\|new Workbox"` should return no results, and `git grep -n "__WB_MANIFEST"` should only match the placeholder in `src/sw-src.ts`.
- [X] T023 Final gate: confirm `npm test` is green AND a production build (`npm run build`) succeeds together (spec SC-006 / FR-022).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately. T002 depends on T001.
- **Foundational (Phase 2)**: depends on Setup. T003 depends on T002; T004 is independent [P]. **BLOCKS all user stories.**
- **User Stories (Phases 3–6)**: all depend on Foundational.
- **Polish (Phase 7)**: depends on all stories being complete.

### User Story Dependencies (file-level reality)

- **US1 (P1)**: after Foundational. T007 edits `src/sw-src.ts` (after T003); T008/T009 edit `src/feedTheMonster.ts` (sequential).
- **US2 (P1)**: after Foundational; T011 edits `src/sw-src.ts` after T007 (same file — sequential with US1's worker edit).
- **US3 (P2)**: after US2; T013 edits `src/sw-src.ts` after T011; T015 typecheck should run last among worker edits.
- **US4 (P2)**: after US3 (needs the final `src/sw-src.ts` as `swSrc`). T017/T018 are independent [P]; T016 before T019.

> Ordering note: because US1→US2→US3 all edit `src/sw-src.ts`, they are executed **sequentially in that order** rather than in parallel, even though US1 and US2 are both P1. The two P1 stories remain independently *testable* (distinct specs), just not independently *editable* on the shared worker file.

### Within Each User Story

- Tests are written before implementation and expected to fail first.
- Worker (`src/sw-src.ts`) edits are strictly sequential (shared file).
- Client (`src/feedTheMonster.ts`) edits are strictly sequential (shared file).

### Parallel Opportunities

- T004 (test scaffolding) ∥ nothing blocking — can run alongside T003.
- T006 (client spec) ∥ T005 (worker spec) — different files.
- T017 (delete `workbox-config.js`) ∥ T018 (edit `public/index.html`) ∥ T016 prep — different files.
- T021 ∥ T022 in Polish — independent validation activities.

---

## Parallel Example: User Story 1

```bash
# Author both story specs in parallel (different files):
Task: "T005 [US1] Worker lifecycle specs in src/sw-src.spec.ts"
Task: "T006 [US1] Client registration spec in src/feedTheMonster.sw.spec.ts"
```

## Parallel Example: User Story 4

```bash
# Independent cleanup tasks in parallel (different files):
Task: "T017 [US4] Delete workbox-config.js"
Task: "T018 [US4] Remove workbox-cdn script from public/index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & VALIDATE** the update lifecycle (quickstart V4). US1 is the highest-risk, highest-value slice and the reason `@curiouslearning/sw` exists.

### Incremental Delivery

1. Setup + Foundational → TS worker on Workbox 7, behavior unchanged.
2. US1 → library-driven update lifecycle (MVP) → validate.
3. US2 → confirm offline parity → validate.
4. US3 → type-safety + full library adoption → validate.
5. US4 → single-pass build + artifact cleanup → validate.
6. Polish → green build + manual quickstart runs.

### Notes

- Future Work (F1 `cacheUrlsWithProgress`, F2 `registerNavigationFallback`, F3 worker `strict`, F4 upstreaming FTM handlers) from [research.md](./research.md#future-work) is intentionally **out of scope** and not tasked here.
- Commit after each task or logical group; keep each worker edit small since they stack on one file.
