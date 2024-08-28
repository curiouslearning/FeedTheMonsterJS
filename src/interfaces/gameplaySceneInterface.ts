import { StoneConfig } from "@common";
import {
  AudioPlayer,
  Background,
  FeedbackTextEffects,
  LevelIndicators,
  Monster,
  PauseButton,
  PausePopUp,
  PromptText,
  StoneHandler,
  TimerTicking,
  Tutorial,
} from "@components";
import { FirebaseIntegration } from "../Firebase/firebase-integration";

export interface GameplaySceneInterface {
  width: number;
  height: number;
  monster: Monster;
  jsonVersionNumber: string;
  canvas: HTMLCanvasElement;
  levelData: any;
  timerTicking: TimerTicking;
  promptText: PromptText;
  pauseButton: PauseButton;
  tutorial: Tutorial;
  puzzleData: any;
  id: string;
  context: CanvasRenderingContext2D;
  levelIndicators: LevelIndicators;
  stonesCount: number;
  monsterPhaseNumber: number;
  pickedStone: StoneConfig;
  puzzleStartTime: number;
  showTutorial: boolean;
  feedBackTexts: any;
  isPuzzleCompleted: boolean;
  rightToLeft: boolean;
  imagesLoaded: boolean;
  switchSceneToEnd: Function;
  levelNumber: Function;
  loadedImages: any;
  stoneHandler: StoneHandler;
  counter: number;
  images: {
    profileMonster: string;
  };
  handler: HTMLElement;
  pickedStoneObject: StoneConfig;
  pausePopup: PausePopUp;
  isPauseButtonClicked: boolean;
  feedBackTextCanavsElement: HTMLCanvasElement;
  feedbackTextEffects: FeedbackTextEffects;
  isGameStarted: boolean;
  time: number;
  score: number;
  tempWordforWordPuzzle: string;
  switchToLevelSelection: Function;
  reloadScene: Function;
  audioPlayer: AudioPlayer;
  firebaseIntegration: FirebaseIntegration;
  startTime: number;
  puzzleTime: number;
  isDisposing: boolean;

  resumeGame(): void;
  getRandomFeedBackText(randomIndex: number): string;
  getRandomInt(min: number, max: number): number;
  handleMouseUp(event: MouseEvent): void;
  handleMouseDown(event: MouseEvent): void;
  handleMouseMove(event: MouseEvent): void;
  handleMouseClick(event: MouseEvent): void;
  handleTouchStart(event: TouchEvent): void;
  handleTouchMove(event: TouchEvent): void;
  handleTouchEnd(event: TouchEvent): void;
  draw(deltaTime: number): void;
  addEventListeners(): void;
  removeEventListeners(): void;
  loadPuzzle(isTimerEnded?: boolean): void;
  dispose(): void;
  letterPuzzle(droppedStone: string): void;
  wordPuzzle(droppedStone: string, droppedStoneInstance: StoneConfig): void;
  startGameTime(): void;
  startPuzzleTime(): void;
  pauseGamePlay(): void;
  handleVisibilityChange(): void;
  logPuzzleEndFirebaseEvent(isCorrect: boolean, puzzleType?: string): void;
  logLevelEndFirebaseEvent(): void;
}
