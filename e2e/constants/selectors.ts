/** All stable DOM selectors used across E2E tests. Single source of truth. */

export const Selectors = {
  // ── Loading screen ───────────────────────────────────────────────────────────
  loadingScreen: '#loading-screen',
  loadingGif: '#loading-gif',
  progressBar: '#progress-bar',
  progressBarContainer: '#progress-bar-container',

  // ── Shared layout ────────────────────────────────────────────────────────────
  background: '#background',
  gameControl: '#game-control',
  feedbackText: '#feedback-text',
  riveContainer: '#rive-container',
  riveCanvas: '#rivecanvas',
  mainCanvas: '#canvas',
  treasureCanvas: '#treasurecanvas',
  backgroundElements: '#background-elements',
  titleAndPlayButton: '#title-and-play-button',
  versionInfo: '#version-info-id',
  gameScene: '.game-scene',

  // ── Start scene ──────────────────────────────────────────────────────────────
  startSceneClickArea: '#start-scene-click-area',
  playButton: '#play-button',
  gameTitle: '#title',
  toggleDevBtn: '#toggle-btn',
  devAssessmentBtn: '#dev-assessment-btn',

  // ── Level selection ──────────────────────────────────────────────────────────
  levelSelectionContainer: '#level-selection-container',
  levelSelectionGrid: '#level-selection-grid',
  /** Returns selector for button at grid index (0-based). Index 9 = Prev, 11 = Next. */
  levelButton: (index: number) => `[id="${index}-level-button"]`,
  prevNavButton: '[id="9-level-button"]',
  nextNavButton: '[id="11-level-button"]',

  // ── Gameplay scene ────────────────────────────────────────────────────────────
  pauseButton: '#pause-button',

  // Prompt elements (created by PromptText component)
  promptContainer: '#prompt-container',
  promptBubble: '#prompt-bubble',
  promptText: '#prompt-text',
  promptPlayButton: '#prompt-play-button',
  promptSlots: '#prompt-slots',

  // Timer elements (created by TimerHtml component)
  timerComponent: '#timer-html-component',
  timerEmpty: '#timer-empty',
  rotatingClock: '#rotating-clock',

  // ── Pause popup ──────────────────────────────────────────────────────────────
  pausePopup: '#pause-popup',
  pausePopupClose: '[data-click="close"]',
  pausePopupMapBtn: '#pause-popup #map-button',
  pausePopupRetryBtn: '#pause-popup #retry-button',

  // ── Confirm popup ────────────────────────────────────────────────────────────
  confirmPopup: '#confirm-popup',
  yesButton: '#yes-button',
  cancelButton: '#cancel-button',

  // ── Assessment survey overlay ─────────────────────────────────────────────────
  assessmentOverlay: '#assessment-survey-overlay',
  assessmentPlayer: 'assessment-survey-player',
  assessmentCloseBtn: '#assessment-survey-close-button',

  // ── Level-end scene ───────────────────────────────────────────────────────────
  levelEndContainer: '#levelEnd',
  starsContainer: '.stars-container',
  starItem: '.stars',
  levelEndButtons: '#levelEndButtons',
  levelEndMapBtn: '#levelend-map-btn',
  levelEndNextBtn: '#levelend-next-btn',
  levelEndRetryBtn: '#levelend-retry-btn',

  // ── Generic popup ─────────────────────────────────────────────────────────────
  popupOverlay: '.popup__overlay',
  popupContentWrapper: '.popup__content-wrapper',
} as const;
