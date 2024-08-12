import { AudioPlayer } from "../components/audio-player";
import { FirebaseIntegration } from "../Firebase/firebase-integration";

export interface LevelSelectionScreenInterface {
  canvas: HTMLCanvasElement;
  data: any;
  levelButtonPos: [number, number][][];
  canvasElement: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  levels: any;
  gameLevelData: any;
  callBack: Function;
  audioPlayer: AudioPlayer;
  images: object;
  loadedImages: any;
  imagesLoaded: boolean;
  xDown: number;
  yDown: number;
  previousPlayedLevelNumber: number;
  levelSelectionPageIndex: number;
  levelNumber: number;
  levelsSectionCount: number;
  unlockLevelIndex: number;
  majVersion: string;
  minVersion: string;
  firebaseIntegration: FirebaseIntegration;

  init(): Promise<void>;
  initialiseButtonPos(): void;
  createLevelButtons(levelButtonPos: [number, number][][]): void;
  addListeners(): void;
  pausePlayAudios(): void;
  getTouches(evt: TouchEvent): TouchList;
  handleTouchStart(evt: TouchEvent): void;
  handleTouchMove(evt: TouchEvent): void;
  handleMouseDown(event: MouseEvent): void;
  drawLevel(s: any, canvas: { height: number }): void;
  draw(): void;
  downButton(level: number): void;
  drawStars(gameLevelData: any): void;
  drawStar(
    s: any,
    canvas: any,
    starCount: number,
    context: CanvasRenderingContext2D
  ): void;
  startGame(level_number: string | number): void;
  logSelectedLevelEvent(): void;
  drawLevelSelection(): void;
  dispose(): void;
}
