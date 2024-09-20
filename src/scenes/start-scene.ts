import { Monster, AudioPlayer } from "@components";
import { PlayButton } from "@buttons";
import { DataModal, titleTextCustomFonts } from "@data";
import {
  applyFontToElement,
  font,
  lang,
  StoneConfig,
  toggleDebugMode,
  Utils,
} from "@common";
import { FirebaseIntegration } from "../Firebase/firebase-integration";
import { createBackground, defaultBgDrawing } from "@compositions";
import {
  FirebaseUserClicked,
  PWAInstallStatus,
  DEFAULT_BG_GROUP_IMGS,
  FONT_BASE_PATH,
  titleTextDefaultFont,
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
  private titleTextElement: HTMLElement | null;

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
    this.monster = new Monster(this.canvas, 4);
    this.switchSceneToLevelSelection = switchSceneToLevelSelection;
    this.audioPlayer = new AudioPlayer();
    this.pwa_status = localStorage.getItem(PWAInstallStatus);
    this.handler = document.getElementById("canvas") as HTMLCanvasElement;
    this.devToggle();
    this.createPlayButton();
    window.addEventListener("beforeinstallprompt", this.handlerInstallPrompt);
    this.setupBg();
    this.titleTextElement = document.getElementById("title");
    this.displayGameTitle();
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

  displayGameTitle = () => {
    this.titleFont = this.getFontWidthOfTitle();
    this.titleTextElement.style.fontSize = `${this.titleFont}px`;
    this.titleTextElement.textContent = this.data.title;
  
    const fontOptions = {
      customFonts: titleTextCustomFonts,
      defaultFont: titleTextDefaultFont,
      lang: lang
    };
  
    applyFontToElement(this.titleTextElement, fontOptions, FONT_BASE_PATH);
  }

  animation = (deltaTime: number) => {
    this.context.clearRect(0, 0, this.width, this.height);
    this.background?.draw();
    this.monster.update(deltaTime);
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
