import { Monster, AudioPlayer } from "@components";
import { PlayButton } from "@buttons";
import { DataModal } from "@data";
import {
  font,
  StoneConfig,
  toggleDebugMode,
  Utils,
} from "@common";
import { FirebaseIntegration } from "../Firebase/firebase-integration";
import { createBackground, defaultBgDrawing } from '@compositions';
import {
  FirebaseUserClicked,
  PWAInstallStatus,
  DEFAULT_BG_GROUP_IMGS,
} from "@constants";
export class StartScene {
  public canvas: HTMLCanvasElement;
  public data: any;
  public width: number;
  public height: number;
  public monster: Monster;
  public pickedStone: StoneConfig;
  public pwa_status: string;
  public firebase_analytics: { logEvent: any };
  public id: string;
  public canavsElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public buttonContext: CanvasRenderingContext2D;
  public playButton: PlayButton;
  public images: Object;
  public loadedImages: any;
  public imagesLoaded: boolean = false;
  public handler: HTMLCanvasElement;
  public static SceneName: string;
  public switchSceneToLevelSelection: Function;
  public titleFont: number;
  public background: any;
  audioPlayer: AudioPlayer;
  private toggleBtn: HTMLElement;
  private pwa_install_status: Event;

  constructor(
    canvas: HTMLCanvasElement,
    data: DataModal,
    switchSceneToLevelSelection: Function
  ) {
    this.canvas = canvas;
    this.data = data;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canavsElement.getContext("2d");
    this.toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
    this.monster = new Monster(this.canvas);
    this.switchSceneToLevelSelection = switchSceneToLevelSelection;
    this.audioPlayer = new AudioPlayer();
    this.pwa_status = localStorage.getItem(PWAInstallStatus);
    this.handler = document.getElementById("canvas") as HTMLCanvasElement;
    this.devToggle();
    this.monster.initialiseRiveMonster();
    window.addEventListener("beforeinstallprompt", this.handlerInstallPrompt);
    this.setupBg();
  }

  private setupBg = async () => {
    this.background = await createBackground(
      this.context,
      this.width,
      this.height,
      DEFAULT_BG_GROUP_IMGS,
      defaultBgDrawing
    );
  };

  devToggle = () => {
    this.toggleBtn.addEventListener("click", () =>
      toggleDebugMode(this.toggleBtn)
    );
  };



  handleMouseClick = (event) => {
    let self = this;
    const selfElement = document.getElementById("canvas") as HTMLCanvasElement;
    event.preventDefault();
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const { excludeX, excludeY } = Utils.getExcludedCoordinates(
      selfElement,
      15
    );
    if (!(x < excludeX && y < excludeY)) {
      FirebaseIntegration.getInstance().sendUserClickedOnPlayEvent();
      // @ts-ignore
      fbq("trackCustom", FirebaseUserClicked, {
        event: "click",
      });
      this.toggleBtn.style.display = "none";
      this.audioPlayer.playButtonClickSound();
      self.switchSceneToLevelSelection("StartScene");
    }
  };

  dispose() {
    this.monster.dispose();
    this.audioPlayer.stopAllAudios();
    this.handler.removeEventListener("click", this.handleMouseClick, false);
    window.removeEventListener(
      "beforeinstallprompt",
      this.handlerInstallPrompt,
      false
    );
  }

  getFontWidthOfTitle() {
    return (this.width + 200) / this.data.title.length;
  }

  handlerInstallPrompt = (event) => {
    event.preventDefault();
    this.pwa_install_status = event;
    localStorage.setItem(PWAInstallStatus, "false");
  };
}
