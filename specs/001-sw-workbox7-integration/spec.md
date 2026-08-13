# Feature Specification: Service Worker & Workbox 7 Integration

**Feature Branch**: `feature/mr-188-service-worker-updates`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "using @curiouslearning/sw and latest workbox version (7), update the serviceworker integration. use whatever is avaiable and applicable from @curiouslearning/sw. update workbox implementation into typescript using version 7. update wiring implementation of sw and workbox. update webpack to use inject manifest in it. update package json build scripts."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable update notifications for returning players (Priority: P1)

A returning player opens the game after a new version has been released. The game
detects that fresh content is available and prompts them to reload, and after the
reload every asset they see is the new version — never a mix of old and new.

**Why this priority**: This is the core reason the shared service-worker library
exists. The previous in-app implementation could announce an update before the new
worker had taken control, so a reload could still serve stale content. Getting this
right protects every player from a broken, half-updated experience and is the highest
business risk if it regresses.

**Independent Test**: Deploy version A, load and cache it, deploy version B, reopen
the app, accept the reload prompt, and confirm the running app and all served assets
are version B with no stale artifacts remaining.

**Acceptance Scenarios**:

1. **Given** a player has version A cached and version B is deployed, **When** they
   reopen the app, **Then** they are prompted that an update is ready only after the
   new worker has activated and taken control.
2. **Given** the update prompt is shown, **When** the player accepts it, **Then** the
   page reloads and is served entirely by the new worker.
3. **Given** a player is installing the app for the very first time, **When** the
   worker installs and activates, **Then** no "update ready" prompt is shown.
4. **Given** a player has the current version and no update is available, **When** they
   reopen the app, **Then** no update prompt appears and the cached experience loads.

### User Story 2 - Uninterrupted offline play (Priority: P1)

A player who has already played the game (and cached its content) loses network
connectivity. They can still launch the game, load previously played languages and
levels, and hear all audio, because the app shell and content are served from cache.

**Why this priority**: Offline capability is a defining feature of the product for
low-connectivity regions. The migration MUST preserve every existing caching behavior
(app-shell precaching, per-language bulk audio caching with progress, assessment asset
caching, content-version invalidation, and navigation fallback) or players in the
field lose access.

**Independent Test**: Cache a language while online, go offline, cold-launch the app,
and complete a level end-to-end including audio playback and navigation between scenes.

**Acceptance Scenarios**:

1. **Given** the app shell has been precached, **When** the player launches offline,
   **Then** the game loads from cache.
2. **Given** a language's audio is being cached, **When** caching progresses, **Then**
   the player sees loading progress advance to completion.
3. **Given** a language was cached earlier, **When** the player selects it offline,
   **Then** its prompts, feedback audio, and images are served from cache.
4. **Given** the player's cached content version is behind the server, **When** they
   reopen online, **Then** the stale language cache is cleared and refreshed content is
   loaded.
5. **Given** a navigation request cannot reach the network, **When** it is a
   client-side route, **Then** the app shell is served as the fallback response.

### User Story 3 - Maintainable, shared, type-safe service-worker code (Priority: P2)

A developer maintaining the game (or a sibling Curious Learning app) works on the
service-worker code. The lifecycle, registration, precaching, and bulk-caching logic
comes from the shared `@curiouslearning/sw` library and the worker source is written
in TypeScript, so there is one authoritative implementation to reason about instead of
duplicated, drifting boilerplate.

**Why this priority**: The library was created specifically to end the copy-paste
divergence between this app and assessment-survey-js. Adopting it improves long-term
maintainability and reduces the chance of the update-lifecycle bug reappearing, but it
delivers no new end-user capability on its own, so it ranks below the player-facing
guarantees.

**Independent Test**: Review the service-worker source and client wiring and confirm
lifecycle, registration, and bulk-caching behaviors are provided by `@curiouslearning/sw`
rather than hand-rolled locally, and that the worker source is TypeScript that type-checks.

**Acceptance Scenarios**:

1. **Given** the worker source, **When** it is inspected, **Then** update-notification,
   navigation-fallback, and bulk-caching behaviors are sourced from the shared library.
2. **Given** the client registration code, **When** it is inspected, **Then** service
   worker registration and update handling are performed through the shared library.
3. **Given** the worker source, **When** the project type-checks, **Then** it compiles
   as TypeScript with no type errors.
4. **Given** channel names and message payloads, **When** worker and client exchange
   them, **Then** both sides use the library's shared constants rather than local string
   literals.

### User Story 4 - Single-step, modern build (Priority: P2)

A developer runs the build. The service worker is produced in one build pass using the
current Workbox 7 tooling integrated into the bundler, with no separate manual manifest
injection step to remember or run.

**Why this priority**: Removing the extra CLI step and stale tooling reduces build
friction and the risk of shipping a worker with an outdated or missing precache
manifest, but it is a developer-experience improvement rather than a user-facing one.

**Independent Test**: Run each build script from a clean state and confirm a valid
service worker with a current precache manifest is emitted without invoking a separate
manifest-injection command.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** the production build runs, **Then** a service
   worker containing an up-to-date precache manifest is emitted in a single pass.
2. **Given** a development build, **When** it runs, **Then** the service worker is
   regenerated as part of the same build without a separate manual step.
3. **Given** the dependency manifest, **When** it is inspected, **Then** it declares the
   shared library and Workbox 7 packages and no longer declares the superseded
   service-worker tooling and stale placeholder dependencies.

### Edge Cases

- A returning player dismisses/declines the update prompt — the app continues on the
  currently active worker without forcing a reload.
- Bulk audio caching encounters individual files that fail to fetch or store — those
  items are skipped and reported, progress still completes, and the overall caching
  operation does not fail.
- A request carries the cache-bust query parameter — it bypasses the cache and goes
  straight to the network.
- The assessment package requests data under a path the app serves elsewhere — the
  request is aliased to the correct cached asset location.
- The worker-side lifecycle helper is invoked in a non-service-worker context — it
  fails fast rather than behaving unpredictably.
- A first-time install has no previously active worker — no update notification is
  broadcast.

## Requirements *(mandatory)*

### Functional Requirements

#### Update lifecycle

- **FR-001**: The system MUST notify clients that an update is ready only after the new
  service worker has activated and claimed all clients, never before.
- **FR-002**: The system MUST NOT show an "update ready" prompt on a first-time install
  where no previously active worker exists.
- **FR-003**: When an update is ready, the system MUST present the player with a
  confirmation prompt and reload the page upon acceptance, preserving the current
  update experience.
- **FR-004**: When the player declines the update prompt, the system MUST continue on
  the current worker without reloading.
- **FR-005**: The worker and client MUST coordinate the update lifecycle using a shared,
  consistent channel name and message payload rather than independently declared string
  literals.

#### Offline caching (behavior preservation)

- **FR-006**: The system MUST precache the application shell and static assets so the
  game launches and runs offline after a first successful load.
- **FR-007**: The system MUST support bulk caching of per-language audio and image
  assets and report caching progress to the player through completion.
- **FR-008**: Bulk caching MUST tolerate individual item failures — failed items are
  reported and counted toward progress but MUST NOT cause the overall caching operation
  to fail.
- **FR-009**: The system MUST cache assessment-survey assets and correctly serve
  assessment data requests, including aliasing requests to the location where the
  assets are cached.
- **FR-010**: The system MUST detect a content-version mismatch against the server,
  clear the stale language cache, and refresh to the current content.
- **FR-011**: The system MUST serve the application shell as a fallback for client-side
  navigation requests that cannot reach the network.
- **FR-012**: The system MUST bypass the cache for requests carrying the designated
  cache-bust query parameter.

#### Library adoption & implementation

- **FR-013**: The system MUST source the service-worker update-notification lifecycle,
  client-side registration, navigation fallback, bulk-caching-with-progress, cache-bust
  detection, and shared lifecycle constants from the `@curiouslearning/sw` library
  wherever the library provides an applicable capability, rather than maintaining local
  duplicates of that logic.
- **FR-014**: The service-worker source MUST be authored in TypeScript.
- **FR-015**: The service-worker precaching and routing MUST use Workbox version 7
  modules consumed as project dependencies, replacing runtime loading of Workbox from an
  external CDN and the superseded Workbox major version.
- **FR-016**: The client-side wiring MUST register and manage the service worker through
  the shared library's client entry point rather than a hand-rolled registration path.

#### Build & tooling

- **FR-017**: The build MUST produce the service worker with an up-to-date precache
  manifest injected by the bundler in a single build pass, using the shared
  library's manifest-injection configuration defaults with app-specific overrides.
- **FR-018**: The build scripts MUST NOT require a separate, manually invoked
  manifest-injection command as a distinct step.
- **FR-019**: The dependency manifest MUST declare the shared library and the required
  Workbox 7 packages, and MUST remove the superseded standalone service-worker tooling
  and stale placeholder dependencies that are no longer used.
- **FR-020**: All existing build entry points (development, test, and production builds,
  and the dev server) MUST continue to produce a valid service worker.

#### Quality

- **FR-021**: The service-worker and client-wiring changes MUST ship with Jest unit
  tests written in Given/When/Then style covering at least the happy path of the update
  lifecycle and caching behaviors.
- **FR-022**: The project build MUST succeed and the unit-test suite MUST pass with the
  migrated implementation.

### Key Entities *(include if feature involves data)*

- **Service Worker**: The background script that intercepts requests, precaches the app
  shell, serves cached content offline, and drives the update lifecycle. Authored in
  TypeScript, built with Workbox 7.
- **Precache Manifest**: The generated list of app-shell/static assets (with revision
  identifiers) injected into the worker at build time so it knows what to precache.
- **Update Notification Channel**: The broadcast channel and message payload shared
  between worker and client to signal that a new version is ready.
- **Language Content Cache**: Per-language collection of audio, image, and content-JSON
  assets, populated via progress-reporting bulk caching and invalidated on content
  version change.
- **Assessment Asset Cache**: Assessment-survey data and shared audio assets, with
  request aliasing so the assessment package's data requests resolve to cached assets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of update prompts appear only after the new worker controls the page;
  a post-update reload never serves any stale asset (0 mixed-version reloads observed in
  the update test).
- **SC-002**: A returning player who reopens after an update reaches the updated,
  fully-served experience in a single reload.
- **SC-003**: All offline-play behaviors verified before the change (offline launch,
  per-language cached playback, caching progress to completion, content-version refresh,
  navigation fallback) remain verified after the change, with no regressions.
- **SC-004**: A production build produces a valid service worker with a current precache
  manifest in a single build command, with zero separate manual manifest-injection steps.
- **SC-005**: The service-worker lifecycle, registration, navigation fallback, and
  bulk-caching logic previously maintained locally is provided by the shared library,
  measurably reducing duplicated service-worker boilerplate in this app.
- **SC-006**: The unit-test suite passes and the build succeeds after the migration
  (green build).

## Assumptions

- The update experience remains a blocking confirmation dialog with reload-on-accept
  (the shared library's default "confirm" mode), matching current behavior; no new
  update UX (e.g. toast/snackbar) is introduced by this feature.
- All current app-specific caching behaviors are in scope to preserve: app-shell
  precaching, per-language bulk audio/image caching with progress, assessment asset
  caching and data-request aliasing, content-version invalidation, cache-bust bypass,
  and navigation fallback.
- The shared `@curiouslearning/sw` library (latest published version) and Workbox 7
  packages are available from the package registry and may be added as dependencies;
  favoring the `@curiouslearning`-scoped library aligns with the project constitution.
- App-specific caching logic that the shared library does not (yet) cover — for example
  content-version invalidation and assessment data-request aliasing — remains
  implemented in this app's worker while still using the library's shared constants and
  helpers where applicable.
- Manifest injection moves into the bundler build via the Workbox 7 bundler plugin,
  configured from the shared library's injection-config defaults; the standalone
  manifest-injection CLI is retired.
- The service worker's built output path and public URL (e.g. `sw.js` at the app root)
  and registration scope remain unchanged so existing installs update cleanly.
- The 10 MiB per-file precache ceiling and the existing precache glob include/ignore
  intent (excluding language-specific media that is cached on demand) are preserved.
- The branch name shown reflects the current working branch; specs are tracked
  independently of branch naming.
