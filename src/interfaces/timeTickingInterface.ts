import { AudioPlayer } from "@components";

export interface TimerTickingInterface {
  width: number;
  height: number;
  timerWidth: number;
  timerHeight: number;
  widthToClear: number;
  timer: number;
  isTimerStarted: boolean;
  isTimerEnded: boolean;
  isTimerRunningOut: boolean;
  canavsElement: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  timer_full: HTMLImageElement;
  pauseButtonClicked: boolean;
  images: Object;
  loadedImages: any;
  callback: Function;
  imagesLoaded: boolean;
  startMyTimer: boolean;
  isMyTimerOver: boolean;
  isStoneDropped: boolean;
  audioPlayer: AudioPlayer;
  playLevelEndAudioOnce: boolean;

  startTimer(): void;
  readyTimer(): void;
  update(deltaTime: number): void;
  draw(): void;
  handleStoneDrop(event: CustomEvent): void;
  handleLoadPuzzle(event: CustomEvent): void;
  dispose(): void;
}
