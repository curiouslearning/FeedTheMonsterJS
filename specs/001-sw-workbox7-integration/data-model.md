# Phase 1 Data Model: Service Worker & Workbox 7 Integration

This feature is a migration; it introduces no persistent data schema. The relevant
"entities" are the build-time and runtime message/config structures exchanged between the
worker, the client, and the build tooling.

## E1. Precache Manifest

- **What**: Generated list of app-shell/static assets with revision hashes, injected into
  the worker at build time by `InjectManifest` at the `self.__WB_MANIFEST` placeholder.
- **Produced by**: `workbox-webpack-plugin` `InjectManifest`, configured via
  `createInjectManifestOptions`.
- **Key fields** (per entry): `url: string`, `revision: string | null`.
- **Rules**: per-file size ≤ 10 MiB (shared default); `globDirectory: 'build/'`;
  `globIgnores` excludes per-language media (`lang/**/*.{wav,mp3,...}`) and
  assessment-language mp3s (cached on demand at runtime); `swDest: 'sw.js'` relative to
  webpack `output.path`.

## E2. Update-Notification Message (library-owned)

- **What**: Signal that a newly activated worker has claimed clients and an update is
  safe to announce.
- **Channel**: `DEFAULT_CHANNEL_NAME` = `'sw-update-channel'` (BroadcastChannel).
- **Payload**: `DEFAULT_READY_MESSAGE` = `'UpdateReady'` (type tag `SwMessageType`).
- **Lifecycle rules**:
  - Worker: `isUpdate = !!self.registration.active` computed at script-evaluation time.
  - Broadcast fires only after `self.clients.claim()` resolves, and only when `isUpdate`.
  - First install (no previously active worker) ⇒ no broadcast.
  - Client (`mode: 'confirm'`): on receipt, blocking `confirm()`; reload on accept, no-op
    on decline.

## E3. App Progress/Cache Messages (FTM-owned, preserved)

- **What**: Existing FTM bulk-caching coordination — unchanged by this feature.
- **Channel**: `'my-channel'` (BroadcastChannel), separate from E2.
- **Payloads** (existing): commands `Cache`, `CacheUpdate`, `CacheAssessmentLanguage`;
  notifications `Loading` (`{ msg:'Loading', data: 0–100 }`), `AssessmentLanguageCached`.
- **Rules**: `Loading` drives the client progress bar + 25/50/75/100 analytics thresholds
  (unchanged). The client's `"Update Found"` message branch is removed (now E2); the
  `"Loading"` branch is retained.

## E4. InjectManifest Config Object

- **What**: Options object passed to the webpack `InjectManifest` plugin.
- **Shape** (`InjectManifestConfig`): `swSrc`, `swDest`, `globDirectory`,
  `maximumFileSizeToCacheInBytes`, plus pass-through keys (`globPatterns`, `globIgnores`,
  `maximumFileSizeToCacheInBytes` override, etc.).
- **Source**: `createInjectManifestOptions(overrides)` merges shared defaults with FTM
  deltas migrated from the deleted `workbox-config.js`.

## E5. Cache-Bust Request Predicate

- **What**: Requests carrying the `CACHE_BUST_PARAM` (`'cache-bust'`) query param bypass
  the cache and go to network.
- **Rule**: Worker `fetch` handler calls `isCacheBustRequest(event.request.url)` and, if
  true, returns without `respondWith` (browser handles it) — replacing FTM's inline
  `searchParams.has('cache-bust')` check while preserving identical behavior.

## Runtime Caches (unchanged, for reference)

| Cache | Contents | Populated by | Invalidation |
|-------|----------|--------------|--------------|
| Workbox precache | app shell + static assets | `precacheAndRoute` (build manifest) | revision hash change |
| `<language>` | per-language audio/images/content JSON | FTM bulk caching (E3) | content-version mismatch clears `caches.delete(lang)` |
| `assessment-<key>` | assessment data + shared audio | `cacheAssessmentLanguage` | manual |
| `dynamic-cache` | preload rive/wasm assets | `preloadAdditionalAssets` (install) | manual |
