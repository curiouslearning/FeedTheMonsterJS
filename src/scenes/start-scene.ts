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
import { createBackground, defaultBgDrawing } from "@compositions/background";
import {
  FirebaseUserClicked,
  PWAInstallStatus,
  DEFAULT_BG_GROUP_IMGS,
} from "@constants";
import { RiveMonster } from "../components/rive-monster";
export class StartScene {
  public canvas: HTMLCanvasElement;
  public data: any;
  public width: number;
  public height: number;
  public monster: Monster;
  public riveMonster: RiveMonster;
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
    this.riveMonster = new RiveMonster(this.canvas);
    this.switchSceneToLevelSelection = switchSceneToLevelSelection;
    this.audioPlayer = new AudioPlayer();
    this.pwa_status = localStorage.getItem(PWAInstallStatus);
    this.handler = document.getElementById("canvas") as HTMLCanvasElement;
    this.devToggle();
    this.createPlayButton();
    this.riveMonster.initialiseRiveMonster();
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

  animation = (deltaTime: number) => {
    this.titleFont = this.getFontWidthOfTitle();
    this.context.clearRect(0, 0, this.width, this.height);
    this.background?.draw();
    this.context.font = `${this.titleFont}px ${font}, monospace`;
    this.context.fillStyle = "white";
    this.context.textAlign = "center";
    this.context.fillText(this.data.title, this.width * 0.5, this.height / 10);
    // this.monster.update(deltaTime);
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
    
    // Identify which canvas was clicked
    const selfElement = event.target.id === "canvas" 
      ? document.getElementById("canvas") as HTMLCanvasElement 
      : document.getElementById("newcanvas") as HTMLCanvasElement;
    
    if (!selfElement) return; // Ensure the element exists
    
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
      
      setTimeout(() => {
        this.riveMonster.stopRiveMonster();
      }, 500);
    }
  };


  dispose() {
    // this.monster.dispose()
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
