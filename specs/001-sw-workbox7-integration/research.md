# Phase 0 Research: Service Worker & Workbox 7 Integration

All Technical Context unknowns are resolved below. Format: Decision / Rationale /
Alternatives considered.

## R1. How the TypeScript worker gets bundled by `InjectManifest`

- **Decision**: Author `src/sw-src.ts` and register `InjectManifest({ swSrc:
  'src/sw-src.ts', ... })`. `workbox-webpack-plugin@7` compiles `swSrc` in a **child
  compilation that inherits the parent compiler's `module.rules`**, so the existing
  `/\.ts$/ → ts-loader` rule transpiles the worker with no extra loader wiring. The
  child compilation is forced to a single chunk, satisfying the "SW must be one file"
  requirement.
- **Rationale**: Keeps a single webpack pass and reuses existing ts-loader config —
  smallest footprint. No separate `tsc`/pre-compile step, honoring FR-017/FR-018.
- **Alternatives considered**: (a) Pre-compile `sw-src.ts` with a standalone tsc/webpack
  entry then inject — reintroduces the two-step build we're removing. (b) Keep worker as
  `.js` — violates FR-014 (TypeScript). Rejected.

## R2. Service-worker global types in a DOM-lib tsconfig

- **Decision**: Add `/// <reference lib="webworker" />` at the top of `sw-src.ts` and
  declare the scope locally: `declare const self: ServiceWorkerGlobalScope & typeof
  globalThis;`. Type `self.__WB_MANIFEST` via workbox-precaching's
  `PrecacheEntry`/`string` union (or a local `declare` if simpler).
- **Rationale**: The root `tsconfig.json` uses `lib: ["dom", ...]` for the app; the
  worker needs the WebWorker lib without changing the global app config. A file-scoped
  reference directive is the standard, lowest-footprint way to do this.
- **Alternatives considered**: A dedicated `tsconfig.sw.json` — unnecessary extra config
  surface for one file. Rejected for footprint.

## R3. Update-notification lifecycle: worker + client wiring

- **Decision**: Worker calls `registerUpdateNotifier()` (defaults:
  `DEFAULT_CHANNEL_NAME='sw-update-channel'`, `DEFAULT_READY_MESSAGE='UpdateReady'`)
  after `precacheAndRoute(self.__WB_MANIFEST)`. Client calls
  `registerServiceWorkerUpdates({ swUrl: './sw.js', mode: 'confirm' })` where FTM
  currently constructs `new Workbox('./sw.js')`. This replaces the hand-rolled
  `install→skipWaiting`, `activate→clients.claim→postMessage('Update Found')`, and the
  client-side `confirm()/reload` in `handleUpdateFoundMessage`.
- **Rationale**: The library computes `isUpdate = !!self.registration.active` at
  evaluation time and only broadcasts after `clients.claim()` resolves — this is the
  exact lifecycle fix the package exists for (FR-001, FR-002). `mode:'confirm'` reproduces
  today's blocking-dialog + reload UX with zero behavior change (FR-003, FR-004).
- **Alternatives considered**: `mode:'custom'` with a bespoke `onUpdateAvailable` — only
  needed if we change the UX, which is out of scope. `mode:'silent'` — changes behavior.
  Rejected.

## R4. Two BroadcastChannels — do NOT conflate update lifecycle with progress messaging

- **Decision**: The library's update channel (`'sw-update-channel'`) is **separate** from
  FTM's existing app channel (`'my-channel'`) used for `Cache`/`CacheUpdate`/`Loading`/
  `CacheAssessmentLanguage`/`AssessmentLanguageCached`. Keep FTM's `'my-channel'`
  messaging intact for progress/caching; only the "Update Found" message migrates to the
  library channel. In `feedTheMonster.ts`, `handleServiceWorkerMessage` drops its
  `"Update Found"` branch (now owned by the library) but keeps the `"Loading"` branch.
- **Rationale**: Progress/bulk-caching is FTM-specific and out of the minimal scope; the
  library only owns the update lifecycle. Conflating them would expand the footprint and
  risk regressions. Preserves FR-006..FR-012.
- **Alternatives considered**: Point FTM's app messaging at the library channel — no
  benefit, higher risk. Rejected.

## R5. Manifest injection config via the library

- **Decision**: Build `InjectManifest` options from
  `createInjectManifestOptions({ swSrc: 'src/sw-src.ts', swDest: 'sw.js', globIgnores:
  [...existing lang + assessment-audio ignores], /* globPatterns override as needed */ })`.
  The helper supplies shared defaults (`globDirectory: 'build/'`, 10 MiB ceiling,
  swSrc/swDest conventions); FTM passes only the deltas from `workbox-config.js`.
- **Rationale**: Single source of shared defaults across CL apps (FR-013, FR-017);
  `workbox-config.js` is deleted. Note `swDest` in `InjectManifest` is relative to
  webpack `output.path` (`build/`), so `'sw.js'` lands at `build/sw.js` — unchanged URL.
- **Alternatives considered**: Hand-write the full InjectManifest options — duplicates the
  shared defaults the library centralizes. Rejected.

## R6. Dependency delta (package.json)

- **Decision**:
  - **Add**: `@curiouslearning/sw@^1.0.0`; `workbox-core`, `workbox-precaching`,
    `workbox-routing` `@^7.4.1` (dependencies); `workbox-webpack-plugin@^7.4.1`
    (devDependency).
  - **Remove**: `workbox@^0.0.0` (bogus placeholder), `workbox-window@^4.3.1` and
    `@types/workbox-window@^4.3.4` (client registration now via the library, not
    workbox-window), `workbox-cli@^7.3.0` (replaced by the webpack plugin).
  - **Scripts**: delete `wb:inject`; drop `&& npm run wb:inject` from `build`,
    `build:dev`, `build:test`, `build:prod`. `dev` unchanged (InjectManifest runs inside
    the webpack serve pass once the shell-out plugin is removed).
- **Rationale**: Net reduction in dependency surface (FR-019); every removed item is
  genuinely superseded. Confirmed the library declares `deps: none` and only
  workbox-core/precaching/routing as peers — so it does **not** pull workbox-window,
  making that removal safe.
- **Alternatives considered**: Keep `workbox-window` "just in case" — dead weight,
  contradicts the small-footprint directive. Rejected.

## R7. Stray CDN artifacts to remove

- **Decision**: Remove `importScripts('.../workbox-cdn/releases/4.3.1/workbox-sw.js')`
  from the worker (replaced by npm `import`s) and the unused
  `<script src=".../workbox-cdn/releases/6.4.1/workbox-sw.js">` in
  `public/index.html:86`.
- **Rationale**: Both are runtime CDN loads of Workbox that the npm migration makes
  obsolete; the 6.4.1 client script is already unused. Removing them eliminates an
  external network dependency at startup (supports offline reliability, FR-015).
- **Alternatives considered**: Leave index.html script — dead external request on every
  load. Rejected.

## Future Work (nice-to-haves, explicitly out of scope)

Deferred to keep the footprint minimal; each is additive and independently shippable:

- **F1 — Adopt `cacheUrlsWithProgress`** for FTM's bulk audio/feedback/common-asset
  caching (`cacheAudiosFiles`, `cacheFeedBackAudio`, `cacheCommonAssets`). These carry
  FTM-specific URL-rewriting (dev/test host swaps) and batching/timeout tuning; folding
  them into the library helper is a larger, higher-risk refactor. The library helper's
  batch/timeout/`onProgress`/`onItemError` options map cleanly, so this is a good later
  cleanup.
- **F2 — `registerNavigationFallback`** for app-shell navigation fallback. FTM currently
  serves everything via a catch-all cache-first `fetch` handler and has no SPA router;
  adopting the fallback route is an optional robustness improvement.
- **F3 — Enable TS `strict` for the worker** (and eventually the app) once the migrated
  worker type-checks cleanly under the current loose config.
- **F4 — Extract FTM-specific handlers** (assessment aliasing, content-version
  invalidation) into candidate additions to `@curiouslearning/sw` if they prove common
  across CL apps.
