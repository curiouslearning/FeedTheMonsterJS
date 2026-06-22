/**
 * Shared DOM selectors used across multiple pages, helpers, or spec files.
 * Page-specific selectors live on their respective page class as static SELECTORS.
 */

export const Selectors = {
  // ── Loading screen ────────────────────────────────────────────────────────────
  // Used in BasePage.waitForLoadingComplete and multiple spec files.
  loadingScreen: '#loading-screen',

  // ── Shared layout ─────────────────────────────────────────────────────────────
  background: '#background',
  riveCanvas: '#rivecanvas',
  mainCanvas: '#canvas',
  treasureCanvas: '#treasurecanvas',
  riveContainer: '#rive-container',
  backgroundElements: '#background-elements',
  gameScene: '.game-scene',

  // ── Gameplay feedback (also used in game-state-helpers.ts) ───────────────────
  feedbackText: '#feedback-text',

  // ── Assessment survey (no dedicated page class) ───────────────────────────────
  assessmentOverlay: '#assessment-survey-overlay',
  assessmentPlayer: 'assessment-survey-player',
  assessmentCloseBtn: '#assessment-survey-close-button',

  // ── Generic popup ─────────────────────────────────────────────────────────────
  popupOverlay: '.popup__overlay',
  popupContentWrapper: '.popup__content-wrapper',
} as const;
