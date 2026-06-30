export {
  navigateToStartScene,
  navigateToLevelSelection,
  navigateToGameplay,
  seedLevelProgress,
  clearGameProgress,
} from './navigation-helpers';

export {
  canvasDrag,
  getCanvasPixelColor,
  assertCanvasHasContent,
} from './canvas-helpers';

export {
  mockAudioRequests,
  mockAnalytics,
  mockRiveWasm,
  applyStandardMocks,
} from './mock-helpers';

export {
  exposeGameInternals,
  getCurrentPuzzleTargets,
  publishGameEvent,
  triggerAssessment,
  pauseFtmGame,
  resumeFtmGame,
  hidePausePopupForMiniGame,
  waitForAssessmentElement,
  getAssessmentElementBbox,
  triggerLevelEndScene,
  waitForPositiveFeedback,
  subscribeToCorrectStonePosition,
  getCapturedCorrectStonePos,
  getHitboxCenter,
  waitForTreasureCanvasVisible,
  waitForMiniGameComplete,
  // Dynamic assessment + full-level progression
  getAssessmentTriggerPuzzle,
  getMiniGameTriggerPuzzle,
  getTotalPuzzleCount,
  getCurrentPuzzleIndexFromManager,
  waitForPuzzleAdvance,
  waitForNaturalAssessmentTrigger,
  getCorrectStonePositionForCurrentPuzzle,
  // Assessment survey interaction helpers
  getCorrectAssessmentAnswer,
  getWrongAssessmentAnswer,
  waitForAssessmentAnswerButtons,
  dragAssessmentAnswerToChest,
  waitForAssessmentFeedback,
  waitForAssessmentFeedbackToHide,
  hasAssessmentCurrentQuestion,
  getAssessmentTotalQuestions,
  subscribeToAssessmentCompletion,
  wasAssessmentCompleted,
  isAssessmentCompletedByCoordinator,
  isAssessmentOverlayVisible,
  completeAssessmentSurvey,
  answerAssessmentQuestionWithWrongThenCorrect,
} from './game-state-helpers';
