import { TimeOver, TimetickerLayer } from "../common/common.js";
import { CanvasStack } from "../utility/canvas-stack.js";
import { Game } from "../scenes/game.js";
import { LevelStartScene } from "../scenes/level-start-scene.js";
import { Tutorial } from "./tutorial.js";

declare global {
  interface Window {
    Android?: any;
  }
}

export class TimerTicking {
  public game: Game;
  public width: number;
  public height: number;
  public widthToClear: number;
  public maxLimitExhausted: boolean;
  public timer: number;
  public isTimerStarted: boolean;
  public isTimerEnded: boolean;
  public levelStart: LevelStartScene;
  public isTimerRunningOut: boolean;
  public canavsElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public timer_full: HTMLImageElement;
  public pauseButtonClicked: boolean;
  public canvasStack: any;
  public id: string;
  private lastFrameTime: number;

  constructor(game: Game, levelStart: LevelStartScene) {
    this.game = game;
    this.width = game.width;
    this.height = game.height;
    this.widthToClear = this.game.width / 3.4;
    this.maxLimitExhausted = false;
    this.canvasStack = new CanvasStack("canvas");
    this.timer = 0;
    this.isTimerStarted = false;
    this.isTimerEnded = false;
    this.levelStart = levelStart;
    this.isTimerRunningOut = false;
    this.createCanvas();
    this.lastFrameTime = performance.now();
  }

  createCanvas() {
    this.id = this.canvasStack.createLayer(
      this.height,
      this.width,
      "canvas"
    );
    this.canavsElement = document.getElementById(this.id) as HTMLCanvasElement;
    this.context = this.canavsElement.getContext("2d");
    this.canavsElement.style.zIndex = "4";
  }

  deleteCanvas() {
    this.canvasStack.deleteLayer(this.id);
  }

  createBackgroud() {
    const self = this;
    this.timer_full = new Image();
    this.timer_full.src = "./assets/images/timer_full.png";
    this.timer_full.onload = function (e) {
      self.draw();
      self.beginTimerOnStart();
    };
  }

  update(deltaTime: number) {
    if (this.isTimerStarted) {
      // const timerSpeed = 0.06; // Adjust the timer speed as needed

      this.timer += deltaTime * 0.004;
      if (this.game.width * 1.3 - this.widthToClear - 10 * this.timer > 55) {
        this.context.clearRect(
          this.game.width * 1.3 - this.widthToClear - 10 * this.timer,
          0,
          this.width,
          this.height
        );
      }

      if (
        this.game.width * 1.3 - this.widthToClear - 10 * this.timer < 100 &&
        this.game.width * 1.3 - this.widthToClear - 10 * this.timer > 54 &&
        !this.isTimerRunningOut
      ) {
        this.isTimerRunningOut = true;
        this.levelStart.audio.playSound(
          "./assets/audios/timeout.mp3",
          TimeOver
        );
      }
      if (
        this.game.width * 1.3 - this.widthToClear - 10 * this.timer < 55 &&
        this.game.width * 1.3 - this.widthToClear - 10 * this.timer > 54
      ) {
        console.log("this.game.width: ", this.game.width, "this.widthToClear : ", this.widthToClear, "this.timer: ", this.timer);
        this.isTimerRunningOut = false;
        this.isTimerEnded = true;
        this.isTimerEnded ? this.levelStart.changePuzzle() : null;
        this.timer = 0;
      }
    }
  }

  beginTimerOnStart() {
    const self = this;

    // setTimeout(() => {
    if (!this.pauseButtonClicked) {
      if (!self.isTimerStarted && self.timer == 0) {
        self.timer = 0;
        self.isTimerStarted = true;
      }
    }
    // }, 3000);
  }

  stopTimer() {
    this.isTimerStarted = false;
    console.log("Timer Stopped");
  }

  pauseTimer() {
    this.isTimerStarted = false;
    this.pauseButtonClicked = true;
  }

  resumeTimer() {
    this.isTimerStarted = true;
    this.pauseButtonClicked = false;
  }

  draw() {
    // console.log(" timeristicking ")
    this.isTimerStarted = false;
    // this.context.clearRect(0, 0, this.width, this.height);
    this.context.drawImage(
      this.timer_full,
      this.game.width * 0.12,
      this.height * 0.099,
      this.game.width - 50,
      this.height * 0.05
    );
    this.timer = 0;
    // this.beginTimerOnStart();
  }
}
