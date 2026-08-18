# Quickstart & Validation: Service Worker & Workbox 7 Integration

Runnable validation that the migration works end-to-end. See
[contracts/sw-integration.md](./contracts/sw-integration.md) for the interfaces and
[data-model.md](./data-model.md) for message/config shapes.

## Prerequisites

```sh
npm install   # after package.json delta (contracts C4) is applied
```

Expect `@curiouslearning/sw`, `workbox-core`, `workbox-precaching`, `workbox-routing`, and
`workbox-webpack-plugin` present; `workbox`, `workbox-window`, `@types/workbox-window`,
and `workbox-cli` gone.

## V1. Single-pass build emits a valid worker (FR-017, FR-018, SC-004)

```sh
npm run build          # production
```

**Expect**: build succeeds; no `workbox injectManifest` CLI invocation in the output;
`build/sw.js` exists, contains a precache manifest (an array of `{url, revision}` entries
replacing `self.__WB_MANIFEST`), and references no `importScripts(... workbox-cdn ...)`.
Repeat for `npm run build:dev` and `npm run build:test`.

## V2. Worker type-checks as TypeScript (FR-014, US3)

```sh
npx tsc --noEmit       # or the project's typecheck path
```

**Expect**: `src/sw-src.ts` compiles with no errors; `self` is typed as
`ServiceWorkerGlobalScope`, `self.__WB_MANIFEST` resolves.

## V3. Unit tests green (FR-021, FR-022, SC-006)

```sh
npm test
```

**Expect**: new Gherkin specs pass —
- `src/sw-src.spec.ts`: Given a worker scope, When the script evaluates, Then
  `registerUpdateNotifier` is called after `precacheAndRoute`, and cache-bust requests are
  detected via `isCacheBustRequest`.
- `src/feedTheMonster.sw.spec.ts`: Given the app boots, When it registers the worker, Then
  `registerServiceWorkerUpdates({ swUrl:'./sw.js', mode:'confirm' })` is invoked and the
  returned registration feeds the existing warmup/content-version flow.

## V4. Update lifecycle — no stale reload (FR-001..004, SC-001, SC-002)

Manual, in a browser (serve `build/`):

1. Build + load the app; let it install and cache (version A).
2. Change any precached asset, rebuild (version B), keep the tab open, reload.
3. **Expect**: a `confirm()` "Update Found" dialog appears **only after** the new worker
   is active; accepting reloads and every asset served is version B (no mixed versions).
4. First-ever install (clear site data, load once): **Expect no** update dialog.

## V5. Offline behavior preserved (FR-006..012, SC-003)

1. Online: select a language, let audio caching complete (progress bar reaches 100%).
2. DevTools → Network → Offline; cold-reload.
3. **Expect**: app shell loads from cache; the cached language's prompts/feedback
   audio/images play; navigation between scenes works; cache-bust requests still hit
   network when online; assessment `/data/*.json` requests resolve from the aliased cache.

## Definition of Done

- [ ] V1–V3 pass in CI (green build + tests).
- [ ] V4 and V5 verified manually before merge.
- [ ] `git grep -n "workbox-window\|workbox-cli\|workbox-cdn\|__WB_MANIFEST"` shows only
      the intended remaining references (the `__WB_MANIFEST` placeholder in `sw-src.ts`).
