# Implementation Plan: Service Worker & Workbox 7 Integration

**Branch**: `feature/mr-188-service-worker-updates` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-sw-workbox7-integration/spec.md`

## Summary

Migrate FeedTheMonster's service worker off the CDN-loaded Workbox 4 runtime and the
standalone `workbox-cli injectManifest` build step onto **Workbox 7 npm modules** and the
shared **`@curiouslearning/sw`** library. The worker source becomes TypeScript
(`src/sw-src.ts`); the update-notification lifecycle, client registration, cache-bust
detection, and manifest-injection config come from `@curiouslearning/sw`; and manifest
injection moves into the webpack build via `workbox-webpack-plugin`'s `InjectManifest`,
so every build produces a current precache manifest in a single pass.

Per the user directive (*"smallest but concise footprint; identify nice-to-haves as
future work"*), scope is limited to the **lifecycle + registration + build** swap and
the dependency cleanup. FTM-specific caching internals (bulk audio caching with URL
rewriting, content-version invalidation, assessment aliasing) are **preserved as-is**;
adopting the library's `cacheUrlsWithProgress` and `registerNavigationFallback` for those
paths is deferred to Future Work (see [research.md](./research.md#future-work)).

## Technical Context

**Language/Version**: TypeScript 5.6 (target/module ES2022, `moduleResolution: bundler`)

**Primary Dependencies**: `@curiouslearning/sw@^1.0.0`; `workbox-core`,
`workbox-precaching`, `workbox-routing` `@^7.4.1` (worker runtime + library peers);
`workbox-webpack-plugin@^7.4.1` (build); webpack 5 + ts-loader (existing)

**Storage**: Browser Cache Storage API (precache + per-language/assessment runtime caches); `localStorage` for cached-version bookkeeping (unchanged)

**Testing**: Jest + ts-jest, Gherkin-style Given/When/Then (constitution Principle III)

**Target Platform**: Evergreen browsers + Android WebView (Capacitor 4); offline-capable PWA

**Project Type**: Single-project web app (TypeScript, no framework), webpack-bundled

**Performance Goals**: No regression vs. current offline behavior; single-pass build emits a valid `sw.js` with current precache manifest

**Constraints**: `sw.js` output path, public URL, and registration scope unchanged so existing installs update cleanly; 10 MiB per-file precache ceiling and existing glob include/ignore intent preserved; update UX stays a blocking `confirm()` + reload

**Scale/Scope**: One worker source file, one client registration path, webpack + package.json + index.html cleanup; ~6 files touched, 2 deleted

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Feature/Domain/Module Structure | ✅ PASS | Legacy `sw-src.js` migrates opportunistically to `sw-src.ts`; service-worker concern kept as a single-purpose module. No new cross-domain coupling. |
| II. OOP + FP Discipline | ✅ PASS | Library helpers are pure/side-effect-scoped; worker keeps existing event-handler structure. No new shared mutable state introduced. |
| III. Jest Gherkin Tests (NON-NEGOTIABLE) | ✅ PASS | New/updated worker + client wiring ship with Given/When/Then Jest specs (FR-021). Library internals are tested upstream in `@curiouslearning/sw`. |
| IV. Green Build & Passing Tests | ✅ PASS | Definition of done = `npm test` green AND build succeeds (FR-022, SC-006). |
| V. Native TypeScript First + prefer `@curiouslearning` | ✅ PASS | Worker converted to native TS; a `@curiouslearning`-scoped library is chosen over hand-rolled/3rd-party equivalents — directly satisfies the sourcing rule. Workbox 7 (3rd-party) justified below. |

**Third-party dependency justification (Principle V)**: Workbox is the industry-standard
precaching/routing toolkit and is the explicit foundation of `@curiouslearning/sw` (its
declared peer dependency). It is a necessary, unavoidable dependency for service-worker
precaching; no `@curiouslearning` equivalent exists. This *reduces* net third-party
surface by removing the CDN-loaded Workbox runtime, the `workbox` placeholder dep,
`workbox-window`, and `workbox-cli`.

**Gate result**: PASS — no violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-sw-workbox7-integration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — decisions + future work
├── data-model.md        # Phase 1 output — entities/message contracts
├── quickstart.md        # Phase 1 output — validation guide
├── contracts/
│   └── sw-integration.md # Phase 1 output — library API + wiring contracts
└── checklists/
    └── requirements.md  # Spec quality checklist (from /speckit-specify)
```

### Source Code (repository root)

```text
src/
├── sw-src.ts            # (was sw-src.js) TS worker: workbox-precaching v7 +
│                        #   registerUpdateNotifier + isCacheBustRequest + shared
│                        #   constants; FTM-specific caching/fetch handlers preserved
├── sw-src.spec.ts       # NEW — Gherkin Jest specs for worker wiring
├── feedTheMonster.ts    # client: registerServiceWorkerUpdates() replaces the
│                        #   hand-rolled Workbox()/confirm/reload path
└── feedTheMonster.sw.spec.ts # NEW — Gherkin Jest specs for client registration wiring

webpack.config.js        # + InjectManifest(createInjectManifestOptions({...}));
                         #   remove WorkboxInjectOnDevBuildPlugin shell-out
package.json             # deps +/- and build-script cleanup (drop wb:inject)
public/index.html        # remove stray workbox-cdn 6.4.1 <script>
workbox-config.js        # DELETED — superseded by createInjectManifestOptions
src/sw-src.js            # DELETED — replaced by sw-src.ts
```

**Structure Decision**: Single-project layout retained. The service worker stays a
single-file concern at `src/sw-src.ts` (opportunistic legacy migration per Principle I);
no folder restructure is introduced, keeping the footprint minimal.

## Complexity Tracking

> No constitution violations — section intentionally empty.
