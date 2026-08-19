import { registerServiceWorkerUpdates } from "@curiouslearning/sw";

/**
 * Registers FeedTheMonster's service worker through the shared
 * update-notification lifecycle (`@curiouslearning/sw`).
 *
 * `mode: 'confirm'` reproduces the app's legacy UX exactly: when the newly
 * activated worker takes control, a blocking `confirm()` is shown and the page
 * reloads on acceptance. Channel name / ready message are omitted so both the
 * client and worker sides default to the library's shared constants and stay in
 * sync. Returns the underlying `ServiceWorkerRegistration` for callers that need
 * to `update()` or await readiness.
 */
export function registerFeedTheMonsterServiceWorker(): Promise<ServiceWorkerRegistration> {
  return registerServiceWorkerUpdates({
    swUrl: "./sw.js",
    mode: "confirm",
  });
}
