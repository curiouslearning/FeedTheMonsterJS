import {
  FirebaseUserClicked,
  PWAInstallStatus,
  StartScene1,
} from "../common/common";
import { StoneConfig } from "../common/stone-config";
import { Monster } from "../components/monster";
import { DataModal } from "../data/data-modal";
import { Debugger, lang } from "../../global-variables";
import { Background } from "../components/background";
import { AudioPlayer } from "../components/audio-player";
import { FirebaseIntegration } from "../Firebase/firebase-integration";
import { Utils } from "../common/utils";
import PlayButton from "../components/play-button";

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
  public background1: Background;
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
    this.monster = new Monster(this.canvas, 4);
    this.switchSceneToLevelSelection = switchSceneToLevelSelection;
    this.background1 = new Background(this.context, this.width, this.height, 1);
    this.audioPlayer = new AudioPlayer();

    this.pwa_status = localStorage.getItem(PWAInstallStatus);
    this.handler = document.getElementById("canvas") as HTMLCanvasElement;
    this.devToggle();
    this.createPlayButton();

    StartScene.SceneName = StartScene1;
    window.addEventListener("beforeinstallprompt", this.handlerInstallPrompt);
  }

  devToggle = () => {
    this.toggleBtn.addEventListener("click", () => {
      this.toggleBtn.classList.toggle("on");

      if (this.toggleBtn.classList.contains("on")) {
        Debugger.DebugMode = true;
        this.toggleBtn.innerText = "Dev";
      } else {
        Debugger.DebugMode = false;
        this.toggleBtn.innerText = "Dev";
      }
    });
  }

  animation = (deltaTime: number) => {
    this.titleFont = this.getFontWidthOfTitle();

    this.context.clearRect(0, 0, this.width, this.height);
    if (StartScene.SceneName == StartScene1) {
      this.background1.draw();
      this.context.font = `${this.titleFont}px ${Utils.getLanguageSpecificFont(
        lang
      )}, monospace`;
      this.context.fillStyle = "white";
      this.context.textAlign = "center";
      this.context.fillText(
        this.data.title,
        this.width * 0.5,
        this.height / 10
      );
      this.monster.update(deltaTime);
      this.playButton.draw();
    }
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
    const selfElement = <HTMLElement>document.getElementById("canvas");
    event.preventDefault();
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (self.playButton.onClick(x, y)) {
      FirebaseIntegration.getInstance().sendUserClickedOnPlayEvent();
      // @ts-ignore
      fbq("trackCustom", FirebaseUserClicked, {
        event: "click",
      });
      this.toggleBtn.style.display = "none";
      this.audioPlayer.playAudio(false, "./assets/audios/ButtonClick.mp3");
      self.switchSceneToLevelSelection("StartScene");
    }
  };

  dispose() {
    this.audioPlayer.stopAudio();
    this.handler.removeEventListener("click", this.handleMouseClick, false);
    window.removeEventListener("beforeinstallprompt", this.handlerInstallPrompt, false);
  }

  getFontWidthOfTitle() {
    return (this.width + 200) / this.data.title.length;
  }

  handlerInstallPrompt = (event) => {
    event.preventDefault();
    this.pwa_install_status = event;
    localStorage.setItem(PWAInstallStatus, "false");
  }
}
