import { Monster, AudioPlayer } from "@components";
import { PlayButton } from "@buttons";
import { DataModal } from "@data";
import {
  StoneConfig,
  toggleDebugMode,
  Utils,
} from "@common";
import { FirebaseIntegration } from "../Firebase/firebase-integration";
import { createBackground, defaultBgDrawing } from "@compositions"; // to be removed once background component has been fully used
import {
  FirebaseUserClicked,
  PWAInstallStatus,
  DEFAULT_BG_GROUP_IMGS,
} from "@constants";
import { RiveMonsterComponent } from "@components/riveMonster/rive-monster-component";
import gameStateService from '@gameStateService';

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
  public riveMonsterElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public buttonContext: CanvasRenderingContext2D;
  public playButton: PlayButton;
  public images: Object;
  public loadedImages: any;
  public imagesLoaded: boolean = false;
  public handler: HTMLCanvasElement;
  public static SceneName: string;
  public switchSceneToLevelSelection: Function;
  public background: any;
  audioPlayer: AudioPlayer;
  private toggleBtn: HTMLElement;
  private pwa_install_status: Event;
  private titleTextElement: HTMLElement | null;
  public riveMonster: RiveMonsterComponent;
  constructor(
    canvas: HTMLCanvasElement,
    data: DataModal,
    switchSceneToLevelSelection: Function
  ) {
    this.canvas = canvas;
    this.data = data;
    this.width = canvas.width;
    this.height = canvas.height;
    this.riveMonsterElement = document.getElementById("rivecanvas") as HTMLCanvasElement;
    this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canavsElement.getContext("2d");
    this.toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
    this.riveMonster = new RiveMonsterComponent({
      canvas: this.riveMonsterElement,
      autoplay: true,
      fit: "contain",
      alignment: "topCenter",
      width: this.canavsElement.width, // Example width and height, adjust as needed
      height: this.canavsElement.height,
      onLoad: () => {
        this.riveMonster.play(RiveMonsterComponent.Animations.IDLE); // Start with the "Idle" animation
      }
    });
    this.switchSceneToLevelSelection = switchSceneToLevelSelection;
    this.audioPlayer = new AudioPlayer();
    this.pwa_status = localStorage.getItem(PWAInstallStatus);
    this.handler = document.getElementById("canvas") as HTMLCanvasElement;
    this.devToggle();
    this.createPlayButton();
    window.addEventListener("beforeinstallprompt", this.handlerInstallPrompt);
    this.setupBg();
    this.titleTextElement = document.getElementById("title");
    this.generateGameTitle();
    this.riveMonsterElement.style.zIndex = '6';
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

  generateGameTitle = () => {
    this.titleTextElement.textContent = this.data.title;
  };

  draw = (deltaTime: number) => {
    this.context.clearRect(0, 0, this.width, this.height);
    this.background?.draw();
    this.playButton.draw();
  };

  createPlayButton() {
    this.playButton = new PlayButton(
      this.context,
      this.canvas,
      this.canvas.width * 0.35,
      this.canvas.height / 7
    );
    document.addEventListener("selectstart", function (e) {
      e.preventDefault();
    });
    this.handler.addEventListener("click", this.handleMouseClick, false);
  }

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
      gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true);
      self.switchSceneToLevelSelection();
    }
  };

  dispose() {
    this.audioPlayer.stopAllAudios();
    this.handler.removeEventListener("click", this.handleMouseClick, false);
    window.removeEventListener(
      "beforeinstallprompt",
      this.handlerInstallPrompt,
      false
    );
  }

  handlerInstallPrompt = (event) => {
    event.preventDefault();
    this.pwa_install_status = event;
    localStorage.setItem(PWAInstallStatus, "false");
  };
}
