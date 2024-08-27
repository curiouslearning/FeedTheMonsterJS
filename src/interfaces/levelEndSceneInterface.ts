import { Monster, Background, AudioPlayer } from @components";
import CloseButton from "@components/buttons/close-button";
import NextButton from "@components/buttons/next-button";
import RetryButton from "@components/buttons/retry-button";

export interface LevelEndSceneInterface {
  canvas: HTMLCanvasElement;
  height: number;
  width: number;
  images: any;
  loadedImages: any;
  imagesLoaded: any;
  id: string;
  context: CanvasRenderingContext2D;
  monster: Monster;
  closeButton: CloseButton;
  retryButton: RetryButton;
  nextButton: NextButton;
  starCount: number;
  currentLevel: number;
  switchToGameplayCB: Function;
  switchToLevelSelectionCB: Function;
  data: any;
  background: Background;
  audioPlayer: AudioPlayer;
  timeouts: any[];
  starDrawnCount: number;
  draw(deltaTime: number): void;
  switchToReactionAnimation: () => void;
  starAnimation(): void;
  addEventListener(): void;
  handleMouseClick: (event: MouseEvent) => void;
  pauseAudios: () => void;
  dispose: () => void;
}
