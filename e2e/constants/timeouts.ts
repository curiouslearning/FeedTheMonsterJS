/** Centralised timeout values (ms) used across all E2E tests. */

export const Timeouts = {
  /** Max time for the initial app load + Rive assets to finish */
  appReady: 90_000,

  /** Max time for a scene transition animation to settle */
  sceneTransition: 15_000,

  /** Max time for the loading screen to hide after assets load */
  loadingHide: 15_000,

  /** Max time for level-end star animations (3 stars × 500 ms + buffer) */
  starAnimation: 5_000,

  /** Evolution animation before buttons appear */
  evolutionDelay: 7_000,

  /** Short delay for button click animations to complete */
  buttonAnimation: 500,

  /** Canvas stone drag-and-drop settle time */
  stoneDrop: 1_000,

  /** Standard assertion timeout for DOM changes */
  domUpdate: 5_000,

  /** Network request to fetch language JSON data */
  dataFetch: 10_000,
} as const;
