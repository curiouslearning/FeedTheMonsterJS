import { StoneConfig } from "src/common";
import { Monster, Background, AudioPlayer } from "src/components";
import PlayButton from "src/components/buttons/play-button";

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
  SceneName: string;
  switchSceneToLevelSelection: Function;
  titleFont: number;
  background1: Background;
  audioPlayer: AudioPlayer;
  toggleBtn: HTMLElement;
  pwa_install_status: Event;

  devToggle(): void;
  animation(deltaTime: number): void;
  createPlayButton(): void;
  handleMouseClick(event: MouseEvent): void;
  dispose(): void;
  getFontWidthOfTitle(): number;
  handlerInstallPrompt(event: Event): void;
}
