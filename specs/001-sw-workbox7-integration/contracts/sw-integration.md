# Contracts: Service Worker & Workbox 7 Integration

The external interfaces this feature relies on and wires. Source of truth for the library
API is `@curiouslearning/sw@1.0.0` (`dist/sw.d.ts`). FTM consumes these; it does not
expose new public APIs of its own.

## C1. Worker-side contract — `src/sw-src.ts`

Evaluated once, synchronously, at worker script load, in this order:

```ts
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerUpdateNotifier, isCacheBustRequest, CACHE_BUST_PARAM } from '@curiouslearning/sw';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

precacheAndRoute(self.__WB_MANIFEST, {
  ignoreURLParametersMatching: [/^cr_/],
  exclude: [/^lang\//],
});
registerUpdateNotifier(); // channel 'sw-update-channel', ready msg 'UpdateReady'

// FTM-specific handlers PRESERVED (out of minimal scope to change):
//  - install: skipWaiting + preloadAdditionalAssets()
//  - 'my-channel' BroadcastChannel: Cache / CacheUpdate / CacheAssessmentLanguage
//  - fetch: isCacheBustRequest() guard, assessment /data/ aliasing, cache-first fallback
```

**Guarantees consumed**:
- `registerUpdateNotifier()` throws `TypeError` if `self.registration` is undefined
  (non-SW scope). Called exactly once, after precaching.
- `isCacheBustRequest(url)` is pure; replaces the inline `searchParams.has('cache-bust')`.

**Behavior that MUST NOT change**: the `activate → clients.claim → postMessage('Update
Found')` block is **removed** (library owns it); all other listeners keep current logic.

## C2. Client-side contract — `src/feedTheMonster.ts`

Replaces `registerWorkbox()`'s `new Workbox('./sw.js')` + `wb.register()` +
`handleUpdateFoundMessage` confirm/reload:

```ts
import { registerServiceWorkerUpdates } from '@curiouslearning/sw';

const registration = await registerServiceWorkerUpdates({
  swUrl: './sw.js',
  mode: 'confirm',          // default; blocking confirm() + reload on accept
  // callUpdateOnReady defaults true → registration.update() after ready
});
```

**Guarantees consumed**:
- Returns `Promise<ServiceWorkerRegistration>` — the awaited value replaces the previous
  `registration`, so the downstream `warmupAssessmentLanguageCaches` / content-version
  logic keeps working.
- `mode:'custom'` throws synchronously without `onUpdateAvailable` — N/A here (using
  `'confirm'`).

**Behavior that MUST NOT change**:
- `channelName`/`readyMessage` are omitted ⇒ library defaults, which must match the
  worker's `registerUpdateNotifier()` defaults (they do).
- `handleServiceWorkerMessage` keeps its `"Loading"` branch (FTM `'my-channel'`); the
  `"Update Found"` branch is removed.
- `navigator.serviceWorker.ready`, `registration.update()`, assessment warmup, and the
  content-version fetch/compare/reload flow are preserved.

## C3. Build-side contract — `webpack.config.js`

```js
const { InjectManifest } = require('workbox-webpack-plugin');
const { createInjectManifestOptions } = require('@curiouslearning/sw');

plugins: [
  // ...existing plugins (DefinePlugin, CopyPlugin, ...)
  new InjectManifest(createInjectManifestOptions({
    swSrc: 'src/sw-src.ts',
    swDest: 'sw.js',
    globIgnores: [
      'lang/**/*.{wav,mp3,WAV,png,jpg,webp,svg,riv,wasm,js}',
      'assessment-survey/audio/**/*.mp3',
    ],
    // globPatterns override if the shared default differs from workbox-config.js intent
  })),
]
// REMOVE: WorkboxInjectOnDevBuildPlugin class + its (isDev ? [...] : []) usage
```

**Guarantees consumed**:
- `createInjectManifestOptions` is pure/synchronous; supplies `globDirectory:'build/'`,
  10 MiB ceiling, swSrc/swDest conventions merged with the overrides above.
- `InjectManifest` child compilation inherits `module.rules` (ts-loader) → compiles the
  `.ts` worker; forces single-chunk output to `build/sw.js`.

## C4. Package manifest contract — `package.json`

| Change | Item |
|--------|------|
| add (deps) | `@curiouslearning/sw@^1.0.0`, `workbox-core@^7.4.1`, `workbox-precaching@^7.4.1`, `workbox-routing@^7.4.1` |
| add (devDeps) | `workbox-webpack-plugin@^7.4.1` |
| remove (deps) | `workbox@^0.0.0`, `workbox-window@^4.3.1` |
| remove (deps) | `@types/workbox-window@^4.3.4` |
| remove (devDeps) | `workbox-cli@^7.3.0` |
| remove (scripts) | `wb:inject`; strip `&& npm run wb:inject` from `build`, `build:dev`, `build:test`, `build:prod` |

## C5. Files deleted

- `workbox-config.js` — superseded by C3.
- `src/sw-src.js` — replaced by `src/sw-src.ts` (C1).
- `public/index.html` — remove the stray `workbox-cdn/releases/6.4.1/workbox-sw.js` `<script>` (not a file delete, a line delete).
