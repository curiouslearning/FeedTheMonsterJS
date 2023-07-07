import {
  ButtonClick,
  FirebaseUserClicked,
  FirebaseUserInstall,
  loadingScreen,
  MonsterLayer,
  PlayButtonLayer,
  PWAInstallStatus,
  StartSceneLayer,
  UserCancelled,
  StartScene1,
  LevelSelection1,
  GameScene1
} from "../common/common";
import Sound from "../common/sound";
import InstallButton from "../components/buttons/install_button";
import PlayButton from "../components/buttons/play_butoon";
import { Monster } from "../components/monster";
import { DataModal } from "../data/data-modal";
import { CanvasStack } from "../utility/canvas-stack";
import { LevelSelectionScreen } from "./level-selection-scene";
import { Debugger, lang } from "../../global-variables";

var bgImg = new Image();
bgImg.src = "./assets/images/bg_v01.jpg";
var hillImg = new Image();
hillImg.src = "./assets/images/hill_v01.png";
var pillerImg = new Image();
pillerImg.src = "./assets/images/Totem_v02_v01.png";
var grassImg = new Image();
grassImg.src = "./assets/images/FG_a_v01.png";
var fenchImg = new Image();
fenchImg.src = "./assets/images/fence_v01.png";
// var title = new Image();
// title.src = "./lang/" + lang + "/images/title.png";
var profileMonster = new Image();
profileMonster.src = "./assets/images/idle4.png";
var self: any;
let lastTime = 0;
let pwa_install_status: any;
const toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  pwa_install_status = e;
  localStorage.setItem(PWAInstallStatus, "false");
});

// let SceneName = StartScene1;
export class StartScene {
  public canvas: HTMLCanvasElement;
  public data: any;
  public width: number;
  public height: number;
  public canvasStack: any;
  public monster: Monster;
  public pwa_status: string;
  public firebase_analytics: { logEvent: any };
  public id: string;
  public canavsElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public buttonContext: CanvasRenderingContext2D;
  public outcome: any;
  public playButton: PlayButton | InstallButton;
  public levelSelectionScene: any;
  public static SceneName: string;

  constructor(
    canvas: HTMLCanvasElement,
    data: DataModal,
    firebase_analytics: { logEvent: any }
  ) {
    self = this;
    this.canvas = canvas;
    this.data = data;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvasStack = new CanvasStack("canvas");
    this.monster = new Monster(this.canvas);
    this.pwa_status = localStorage.getItem(PWAInstallStatus);
    this.levelSelectionScene = new LevelSelectionScreen(this.canvas, data, (arg1, arg2) => {
      StartScene.SceneName = arg2
      console.log(arg1, arg2, StartScene.SceneName);
    });
    this.createCanvas();
    this.createPlayButton();
    this.firebase_analytics = firebase_analytics;
    console.log(this.data);
    StartScene.SceneName = StartScene1;
    this.animation(0);

  }
  createCanvas() {
    toggleBtn.addEventListener("click", () => {
      toggleBtn.classList.toggle("on");

      if (toggleBtn.classList.contains("on")) {
        Debugger.DebugMode = true;
        toggleBtn.innerText = "Dev";
      } else {
        Debugger.DebugMode = false;
        toggleBtn.innerText = "Dev";
      }
    });
    this.id = this.canvasStack.createLayer(
      this.height,
      this.width,
      "canvas"
    );
    // aboutCompanyElement.style.display = "block";
    // aboutCompanyElement.innerHTML = globalThis.aboutCompany;
    this.canavsElement = document.getElementById(this.id) as HTMLCanvasElement;
    this.context = this.canavsElement.getContext("2d");

    // this.canavsElement.style.zIndex = 2;
    // this.canavsElement.style.bottom = 0;
    var id = this.id;

    // this.draw();

    // loadingScreen(false);
    //  document.getElementById("loading-screen").style.display = "none";
  }

  animation = (timeStamp) => {
    let deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    // console.log(" ffffggg ", StartScene.SceneName);
    this.context.clearRect(0, 0, this.width, this.height);
    if (StartScene.SceneName == StartScene1) {
      this.context.drawImage(bgImg, 0, 0, this.width, this.height);
      this.context.drawImage(
        pillerImg,
        this.width * 0.6,
        this.height / 6,
        this.width,
        this.height / 2
      );
      this.context.drawImage(
        fenchImg,
        -this.width * 0.4,
        this.height / 3,
        this.width,
        this.height / 3
      );
      this.context.drawImage(
        hillImg,
        -this.width * 0.25,
        this.height / 2,
        this.width * 1.5,
        this.height / 2
      );
      this.context.drawImage(
        grassImg,
        -this.width * 0.25,
        this.height / 2 + (this.height / 2) * 0.1,
        this.width * 1.5,
        this.height / 2
      );

      this.context.font = "bold 40px Arial";
      this.context.fillStyle = "white";
      this.context.textAlign = "center";
      this.context.fillText(self.data.title, this.width * 0.5, this.height / 10);
      // self.update(deltaTime);
      this.monster.animation(deltaTime);
      this.playButton.draw();
    }
    else if (StartScene.SceneName == LevelSelection1) {
      // this.levelSelectionScene.draw(1);
      this.levelSelectionScene.testDraw();

    }
    else {
      // console.log(" rendering game scene", StartScene.SceneName);
      // render gameplay screen for now
    }
    requestAnimationFrame(self.animation);
  }

  draw() {
    // this.context.clearRect(0, 0, this.width, this.height);
  }

  createPlayButton() {
    /// not getting used ---delete it
    const playButtonLayerElement = <HTMLElement>(
      document.getElementById("canvas")
    );
    // console.log("  ggggg ",this.context);
    var self = this;
    var data = this.data;
    var playButtonId = this.canvasStack.createLayer(
      this.height,
      this.width,
      "canvas"
    );
    this.canavsElement = document.getElementById(playButtonId) as HTMLCanvasElement;
    this.buttonContext = this.canavsElement.getContext("2d");
    // this.canavsElement.style.zIndex = 7;
    if (true) {
      self.playButton = new PlayButton(
        this.context,
        self.canvas,
        self.canvas.width * 0.35,
        self.canvas.height / 7
      );
    } else {
      self.playButton = new InstallButton(
        self.buttonContext,
        self.canvas,
        self.canvas.width * 0.35,
        self.canvas.height / 5
      );
    }
    document.addEventListener("selectstart", function (e) {
      e.preventDefault();
    });
    document.getElementById("canvas").addEventListener(
      "click",
      async function (event) {
        const selfElement = <HTMLElement>document.getElementById(self.id);
        event.preventDefault();
        var rect = selfElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (self.playButton.onClick(x, y)) {
          self.firebase_analytics
            ? self.firebase_analytics.logEvent(FirebaseUserClicked, "click")
            : null;
          fbq("trackCustom", FirebaseUserClicked, {
            event: "click",
          });
          toggleBtn.style.display = "none";
          // aboutCompanyElement.style.display = "none";
          new Sound().playSound("./assets/audios/ButtonClick.mp3", ButtonClick);
          // self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
          StartScene.SceneName = LevelSelection1;
          // new LevelSelectionScreen(self.canvas, data);
          // self.canvasStack.deleteLayer(PlayButtonLayer);
          // self.monster.deleteCanvas();
          // delete self.monster;
          // self.canvasStack.deleteLayer(StartSceneLayer);
          // if (self.pwa_status == "false" || !self.pwa_status) {
          //   pwa_install_status.prompt();
          //   const { outcome } = await pwa_install_status.userChoice;
          //   if (outcome === "accepted") {
          //     pwa_install_status = null;
          //     localStorage.setItem(PWAInstallStatus, "true");
          //     fbq("trackCustom", FirebaseUserInstall, {
          //       event: "install_count",
          //     });
          //     self.firebase_analytics
          //       ? self.firebase_analytics.logEvent(
          //           FirebaseUserInstall,
          //           "Install"
          //         )
          //       : null;
          //     window.location.reload();
          //   } else {
          //     fbq("trackCustom", UserCancelled, {
          //       event: "cancel_count",
          //     });
          //     self.firebase_analytics
          //       ? self.firebase_analytics.logEvent(UserCancelled, "Cancelled")
          //       : null;
          //   }
          // } else {
          //   if (
          //     !window.matchMedia("(display-mode: standalone)").matches &&
          //     self.pwa_status == "true"
          //   ) {
          //     alert("PWA is installed on your device \nPlease play from there");
          //   } else {
          //     aboutCompanyElement.style.display = "none";
          //     new Sound().changeSourse("./assets/audios/ButtonClick.wav");
          //     self.context.clearRect(
          //       0,
          //       0,
          //       self.canvas.width,
          //       self.canvas.height
          //     );
          //     new LevelSelectionScreen(self.canvas, data);
          //     self.canvasStack.deleteLayer(PlayButtonLayer);
          //     self.monster.deleteCanvas();
          //     delete self.monster;
          //     self.canvasStack.deleteLayer(StartSceneLayer);
          //   }
          // }
        }
      },
      false
    );
  }
}
