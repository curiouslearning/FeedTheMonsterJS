import { StoneConfig } from "../common";
import { AudioPlayer, TimerTicking, Tutorial } from "../components";

export interface StoneHandlerInterface {
  context: CanvasRenderingContext2D;
  canvas: { width: number; height?: number };
  currentPuzzleData: any;
  targetStones: string[];
  stonePos: number[][];
  pickedStone: StoneConfig;
  foilStones: Array<StoneConfig>;
  answer: string;
  puzzleNumber: number;
  levelData: any;
  correctAnswer: string;
  puzzleStartTime: Date;
  showTutorial: boolean;
  correctStoneAudio: HTMLAudioElement;
  tutorial: Tutorial;
  correctTargetStone: string;
  stonebg: HTMLImageElement;
  audioPlayer: AudioPlayer;
  feedbackAudios: string[];
  timerTickingInstance: TimerTicking;
  isGamePaused: boolean;

  createStones(img: HTMLImageElement): void;
  draw(deltaTime: number): void;
  initializeStonePos(): void;
  setTargetStone(puzzleNumber: number): void;
  isDroppedStoneCorrect(droppedStone: string): boolean;
  handleStoneDrop(event: CustomEvent): void;
  handleLoadPuzzle(event: CustomEvent): void;
  dispose(): void;
  isStoneLetterDropCorrect(
    droppedStone: string,
    feedBackIndex: number,
    isWord?: boolean
  ): boolean;
  getCorrectTargetStone(): string;
  getFoilStones(): string[];
  handleVisibilityChange(): void;
  convertFeedBackAudiosToList(feedbackAudios: any): string[];
  setGamePause(isGamePaused: boolean): void;
  playCorrectAnswerFeedbackSound(feedBackIndex: number): void;
}
