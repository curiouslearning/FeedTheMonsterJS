import {
  ASSETS_PATH_FENCE,
  ASSETS_PATH_HILL,
  ASSETS_PATH_MONSTER_IDLE,
  ASSETS_PATH_TOTEM,
  DEFAULT_BACKGROUND_1,
  FirebaseUserClicked,
  PWAInstallStatus,
} from "@constants";
import {
  LevelIndicators,
  PromptText,
  TimerTicking,
  StoneHandler,
  Monster,
  Tutorial,
} from "@components";
import { PlayButton } from "@buttons";
import { DataModal } from "@data";
import { loadImages, StoneConfig, toggleDebugMode } from "@common";
const toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  localStorage.setItem(PWAInstallStatus, "false");
});
export class TestGameplayScene {
  public canvas: HTMLCanvasElement;
  public data: any;
  public width: number;
  public height: number;
  public monster: Monster;
  public levelIndicator: LevelIndicators;
  public promptText: PromptText;
  public timerTicking: TimerTicking;
  public stoneHandler: StoneHandler;
  public pickedStone: StoneConfig;
  public pwa_status: string;
  public firebase_analytics: { logEvent: any };
  public id: string;
  public canavsElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public buttonContext: CanvasRenderingContext2D;
  public outcome: any;
  public playButton: PlayButton;
  public levelSelectionScene: any;
  public images: Object;
  public loadedImages: any;
  public imagesLoaded: boolean = false;
  public handler: any;
  public static SceneName: string;
  public switchSceneToLevelSelection: any;
  public counter: any = 0;
  tutorial: Tutorial;


  constructor(
    canvas: HTMLCanvasElement,
    data: DataModal,
    firebase_analytics: { logEvent: any },
    switchSceneToLevelSelection
  ) {
    this.canvas = canvas;
    this.data = data;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canavsElement.getContext("2d");
    this.monster = new Monster(this.canvas, 0);
    console.log(Date.now, " ::: ", performance.now);
    this.switchSceneToLevelSelection = switchSceneToLevelSelection;
    this.stoneHandler = new StoneHandler(
      this.context,
      this.canvas,
      2,
      this.data.levels[92],
      this.data.feedbackAudios,
      this.timerTicking
    );

    /// testing promptexr
    this.promptText = new PromptText(
      this.width,
      this.height,
      this.data.levels[92].puzzles[2],
      this.data.levels[92],
      false
    );
    this.timerTicking = new TimerTicking(
      this.width,
      this.height,
      this.timeOverCallback
    );
    //////////////////////end
    this.levelIndicator = new LevelIndicators();
    this.levelIndicator.setIndicators(3);
    this.tutorial.updateTargetStonePositions([100, 100]);

    this.pwa_status = localStorage.getItem(PWAInstallStatus);
    this.handler = document.getElementById("canvas");
    this.devToggle();
    this.createPlayButton();
    this.firebase_analytics = firebase_analytics;

    this.animation(0);

    this.images = {
      pillerImg: ASSETS_PATH_TOTEM,
      bgImg: DEFAULT_BACKGROUND_1,
      hillImg: ASSETS_PATH_HILL,
      fenchImg: ASSETS_PATH_FENCE,
      profileMonster: ASSETS_PATH_MONSTER_IDLE,
    };

    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
    });
  }

  timeOverCallback = () => {
    // time to load new puzzle
    this.timerTicking.readyTimer();
    this.timerTicking.startTimer();
    this.timerTicking.isMyTimerOver = false;
    if (this.counter == 5) this.counter = 0;
    this.levelIndicator.setIndicators(this.counter++);
  };

  devToggle = () => {
    toggleBtn.addEventListener("click", () =>
      toggleDebugMode(toggleBtn)
    );
  };

  handleMouseUp = (event) => {
    let self = this;
    const selfElement = <HTMLElement>document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (
      Math.sqrt(
        (x - self.monster.x - self.canvas.width / 4) *
          (x - self.monster.x - self.canvas.width / 4) +
          (y - self.monster.y - self.canvas.height / 2.7) *
            (y - self.monster.y - self.canvas.height / 2.7)
      ) <= 60
    ) {
    } else {
      self.monster.changeToIdleAnimation();
    }

    self.pickedStone = null;
  };

  handleMouseDown = (event) => {
    let self = this;
    const selfElement = <HTMLElement>document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    ///////// sending data to stone config
    for (let sc of self.stoneHandler.foilStones) {
      if (Math.sqrt((x - sc.x) * (x - sc.x) + (y - sc.y) * (y - sc.y)) <= 40) {
        this.pickedStone = sc;
      }
    }
    /////// end of stone data sending
  };

  handleMouseMove = (event) => {
    let self = this;
    const selfElement = <HTMLElement>document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (self.pickedStone) {
      self.monster.changeToDragAnimation();
      self.pickedStone.x = x;
      self.pickedStone.y = y;
    }
  };

  animation = (deltaTime) => {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.loadedImages.bgImg,
        0,
        0,
        this.width,
        this.height
      );
      this.context.drawImage(
        this.loadedImages.pillerImg,
        this.width * 0.6,
        this.height / 6,
        this.width,
        this.height / 2
      );
      this.context.drawImage(
        this.loadedImages.fenchImg,
        -this.width * 0.4,
        this.height / 3,
        this.width,
        this.height / 3
      );
      this.context.drawImage(
        this.loadedImages.hillImg,
        -this.width * 0.25,
        this.height / 2,
        this.width * 1.5,
        this.height / 2
      );

      this.context.font = "bold 40px Arial";
      this.context.fillStyle = "white";
      this.context.textAlign = "center";
      this.context.fillText(
        "Testing Gameplay",
        this.width * 0.5,
        this.height / 10
      );
      // this.monster.update(deltaTime); there's no more update method
      this.promptText.draw(deltaTime);
      this.stoneHandler.draw(deltaTime);

      this.timerTicking.update(deltaTime);
    }
  };

  draw() {}

  createPlayButton = () => {
    this.playButton = new PlayButton(
      this.context,
      this.canvas,
      this.canvas.width * 0.35,
      this.canvas.height / 7
    );
    this.handler.addEventListener("mouseup", this.handleMouseUp, false);
    this.handler.addEventListener("mousemove", this.handleMouseMove, false);
    this.handler.addEventListener("mousedown", this.handleMouseDown, false);

    this.handler.addEventListener(
      "touchstart",
      function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        document.getElementById("canvas").dispatchEvent(mouseEvent);
      },
      false
    );
    this.handler.addEventListener(
      "touchmove",
      function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        document.getElementById("canvas").dispatchEvent(mouseEvent);
      },
      false
    );
    this.handler.addEventListener(
      "touchend",
      function (e) {
        var touch = e.changedTouches[0];
        var mouseEvent = new MouseEvent("mouseup", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        document.getElementById("canvas").dispatchEvent(mouseEvent);
      },
      false
    );
  };

  handleMouseClick = (event) => {
    let self = this;
    const selfElement = <HTMLElement>document.getElementById("canvas");
    event.preventDefault();
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (self.playButton.onClick(x, y)) {
      self.firebase_analytics
        ? self.firebase_analytics.logEvent(FirebaseUserClicked, "click")
        : null;
      // @ts-ignore
      fbq("trackCustom", FirebaseUserClicked, {
        event: "click",
      });
      toggleBtn.style.display = "none";
      self.switchSceneToLevelSelection();
    }
  };

  dispose() {
    this.handler.removeEventListener("click", this.handleMouseClick, false);
  }
}
