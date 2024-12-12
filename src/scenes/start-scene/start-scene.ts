import { AudioPlayer, BackgroundHtmlGenerator } from "@components";
import { PlayButtonHtml } from '@components/buttons';
import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';
import { RiveMonsterComponent } from "@components/riveMonster/rive-monster-component";
import { DataModal } from "@data";
import {
  StoneConfig,
  toggleDebugMode,
  Utils,
  pseudoId,
  lang
} from "@common";
import { FirebaseIntegration } from "../../Firebase/firebase-integration";
import { TappedStart } from "../../Firebase/firebase-event-interface";
import {
  FirebaseUserClicked,
  PWAInstallStatus,
} from "@constants";
import gameStateService from '@gameStateService';

export class StartScene {
  public canvas: HTMLCanvasElement;
  public data: any;
  public width: number;
  public height: number;
  public pickedStone: StoneConfig;
  public pwa_status: string;
  public firebase_analytics: { logEvent: any };
  public id: string;
  public canavsElement: HTMLCanvasElement;
  public riveMonsterElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public buttonContext: CanvasRenderingContext2D;
  public playButton: BaseButtonComponent;
  public images: Object;
  public loadedImages: any;
  public imagesLoaded: boolean = false;
  public handler: HTMLCanvasElement;
  public static SceneName: string;
  public switchSceneToLevelSelection: Function;
  audioPlayer: AudioPlayer;
  private toggleBtn: HTMLElement;
  private pwa_install_status: Event;
  private titleTextElement: HTMLElement | null;
  public riveMonster: RiveMonsterComponent;
  private firebaseIntegration: FirebaseIntegration;

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
      },
      gameCanvas: this.canvas
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
    this.firebaseIntegration = new FirebaseIntegration();
  }

  private setupBg = async () => {
    // Determine the background type based on the level number using the static method.
    //Level 1 will be used as a default background for Start Scene.
    const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(1);

    // Apply the logic to update the HTML or visual representation of the background
    const backgroundGenerator = new BackgroundHtmlGenerator();

    // Dynamically update the background based on the selected type
    backgroundGenerator.generateBackground(selectedBackgroundType);
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
  };

  createPlayButton() {
    this.playButton = new PlayButtonHtml({ targetId: 'background' });
    this.playButton.onClick(() => {
      this.logTappedStartFirebaseEvent();
      this.audioPlayer.playButtonClickSound();
      gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true);
      this.switchSceneToLevelSelection();
    });
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
    this.playButton.dispose();
    this.playButton.destroy();
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

  /*Note: This was from PlayButton canvas class onclick method.*/
  private logTappedStartFirebaseEvent() {
    let endTime = Date.now();
    const tappedStartData: TappedStart = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number: !!this.data.majVersion && !!this.data.minVersion ? this.data.majVersion.toString() + "." + this.data.minVersion.toString() : "",
    };
    this.firebaseIntegration.sendTappedStartEvent(tappedStartData);
  }
}
