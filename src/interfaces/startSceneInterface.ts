import { StoneConfig } from "@common";
import { Monster, Background, AudioPlayer } from "@components";
import PlayButton from "@components/buttons/play-button";

export interface StartSceneInterface {
  canvas: HTMLCanvasElement;
  data: any;
  width: number;
  height: number;
  monster: Monster;
  pickedStone: StoneConfig;
  pwa_status: string;
  firebase_analytics: { logEvent: any };
  id: string;
  canavsElement: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  buttonContext: CanvasRenderingContext2D;
  playButton: PlayButton;
  images: Object;
  loadedImages: any;
  imagesLoaded: boolean;
  handler: HTMLCanvasElement;
  switchSceneToLevelSelection: Function;
  titleFont: number;
  audioPlayer: AudioPlayer;

  devToggle(): void;
  animation(deltaTime: number): void;
  createPlayButton(): void;
  handleMouseClick(event: MouseEvent): void;
  dispose(): void;
  getFontWidthOfTitle(): number;
  handlerInstallPrompt(event: Event): void;
}
