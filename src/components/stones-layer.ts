import {
  MonsterAudio,
  PromptAudio,
  StoneLayer,
  UrlSubstring,
} from "../common/common";
import Sound from "../common/sound";
import { StoneConfig } from "../common/stones-config";
import { LevelStartScene } from "../scenes/level-start-scene";
import { CanvasStack } from "../utility/canvas-stack";
import PauseButton from "./buttons/pause_button";
import PausePopUp from "./pause-popup";
import { Tutorial } from "../components/tutorial";
import { getDatafromStorage } from "../data/profile-data";
import { Debugger } from "../../global-variables";

var gs: any = {
  mode: "gameplay",
  levelnum: 0,
};
gs.puzzle = {
  target: [],
  stones: [],
};
gs.stones = <any>[];
var pickedStone: {
  x: number;
  y: number;
  text: any;
  origx: number;
  origy: number;
} | null;
var offsetCoordinateValue = 32;
const dragAudio = new Audio();
dragAudio.src = "./assets/audios/onDrag.mp3";
dragAudio.preload = "auto";
let timeout;
let timeout2;
let timeoutRunning = true;
export default class StonesLayer {
  canvas: { width?: number; height: number; scene?: any };
  levelStart: LevelStartScene;
  width: number;
  pausebutton: PauseButton;
  canvasStack: any;
  height: number;
  puzzleData: any;
  callBack: any;
  id: string;
  puzzleIndex: number;
  public fps: number;
  public frameTimer: number;
  public frameInterval: number;
  targetStonePositions: Promise<any[]>;
  context: CanvasRenderingContext2D;
  public tutorial: Tutorial;
  public showTutorial: Boolean;
  pickedStones: Array<string> = [];
  constructor(
    canvas: any,
    puzzleData: any,
    pausebutton: PauseButton,
    callBack: any,
    levelStart: LevelStartScene,
    puzzleIndex: number
  ) {
    this.canvas = canvas;
    this.levelStart = levelStart;
    this.width = canvas.width;
    this.pausebutton = pausebutton;
    this.height = canvas.height;
    this.canvasStack = new CanvasStack("canvas");
    this.puzzleData = puzzleData;
    this.setCurrentPuzzle();
    this.levelStart = levelStart;
    this.callBack = callBack;
    this.puzzleIndex = puzzleIndex;
    this.fps = 144;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;
    // this.targetStonePositions = this.getTargetStonePosition(gs.stones);
    this.tutorial = new Tutorial(canvas);
    this.showTutorial = getDatafromStorage().length == undefined ? true : false;
    this.createCanvas();
    this.tutorial.updateTargetStonePositions(
      this.getTargetStonePosition(gs.stones)
    );
    timeoutRunning = true;
    this.tutorial.createCanvas();
  }

  setNewPuzzle(currentPuzzle: any) {
    this.puzzleData = currentPuzzle;
    this.setCurrentPuzzle();
    // timeout = setTimeout(() => {
    this.createStones(<any>this.stonepos);
    // }, 3000);
  }
  stonepos(stonepos: any) {
    throw new Error("Method not implemented.");
  }
  setCurrentPuzzle() {
    this.levelStart.audio.playSound(
      Debugger.DevelopmentLink
        ? this.puzzleData.prompt.promptAudio.slice(
          0,
          this.puzzleData.prompt.promptAudio.indexOf(UrlSubstring) +
          UrlSubstring.length
        ) +
        "dev" +
        this.puzzleData.prompt.promptAudio.slice(
          this.puzzleData.prompt.promptAudio.indexOf(UrlSubstring) +
          UrlSubstring.length
        )
        : this.puzzleData.prompt.promptAudio,
      PromptAudio
    );
    gs.puzzle.stones = [];
    gs.puzzle.target = [];
    for (let target of this.puzzleData.targetStones) {
      gs.puzzle.target.push(target);
    }
    gs.puzzle.stones = this.gameStoneOptions(
      this.puzzleData.foilStones,
      this.puzzleData.targetStones
    );
    gs.puzzle.prompt = this.puzzleData.prompt.promptText;
  }
  isTimerEnded() {
    pickedStone = null;
    this.pickedStones = [];
  }
  gameStoneOptions(foilStones: Array<String>, targetStones: Array<String>) {
    targetStones.forEach((e) => {
      foilStones.indexOf(e) != -1
        ? foilStones.splice(foilStones.indexOf(e), 1)
        : null;
    });
    targetStones.forEach((e) => {
      foilStones.push(e);
    });
    return foilStones.sort(() => Math.random() - 0.5);
  }
  createCanvas() {
    var self = this;
    this.id = this.canvasStack.createLayer(this.height, this.width, "canvas");
    const selfElelementId = document.getElementById(
      this.id
    ) as HTMLCanvasElement;
    this.context = selfElelementId.getContext("2d");
    selfElelementId.style.zIndex = "7";
    selfElelementId.style.bottom = "0";
    this.stonepos = <any>[
      [
        [
          this.canvas.width / 5 - offsetCoordinateValue,
          this.canvas.height / 1.9 - offsetCoordinateValue,
        ],
        [
          this.canvas.width / 2 - offsetCoordinateValue,
          this.canvas.height / 1.15 - offsetCoordinateValue,
        ],
        [
          this.canvas.width / 3.5 +
          this.canvas.width / 2 -
          offsetCoordinateValue,
          this.canvas.height / 1.2 - offsetCoordinateValue,
        ],
        [
          this.canvas.width / 4 - offsetCoordinateValue,
          this.canvas.height / 1.28 - offsetCoordinateValue,
        ],
        [
          this.canvas.width / 7 - offsetCoordinateValue,
          this.canvas.height / 1.5 - offsetCoordinateValue,
        ],
        [
          this.canvas.width / 2.3 +
          this.canvas.width / 2.1 -
          offsetCoordinateValue,
          this.canvas.height / 1.9 - offsetCoordinateValue,
        ],
        [
          this.canvas.width / 2.3 +
          this.canvas.width / 2.1 -
          offsetCoordinateValue,
          this.canvas.height / 1.42 - offsetCoordinateValue,
        ],
        [
          this.canvas.width / 6 - offsetCoordinateValue,
          this.canvas.height / 1.15 - offsetCoordinateValue,
        ],
      ],
    ];
    selfElelementId.addEventListener("click", function (event) {
      var rect = selfElelementId.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (
        Math.sqrt(
          (x -
            self.canvas.scene.monster.x -
            self.canvas.scene.monster.width / 4) *
          (x -
            self.canvas.scene.monster.x -
            self.canvas.scene.monster.width / 4) +
          (y -
            self.canvas.scene.monster.y -
            self.canvas.scene.monster.height / 2.7) *
          (y -
            self.canvas.scene.monster.y -
            self.canvas.scene.monster.height / 2.7)
        ) <= 100
      ) {
        console.log(" itsactuallyhere ");
        if (timeoutRunning) {
          // clearTimeout(timeout);
          // clearTimeout(timeout2);
          self.createStones(<any>self.stonepos);
          self.levelStart.timerTicking.resumeTimer();
          timeoutRunning = false;
          // timeoutRunning = false
        }
      }

      if (
        Math.sqrt(x - this.width / 3) < 12 &&
        Math.sqrt(y - this.height / 5.5) < 10
      ) {
        console.log(" iamclickingandplaying ");
        self.levelStart.audio.playSound(
          Debugger.DevelopmentLink
            ? self.puzzleData.prompt.promptAudio.slice(
              0,
              self.puzzleData.prompt.promptAudio.indexOf(UrlSubstring) +
              UrlSubstring.length
            ) +
            "dev" +
            self.puzzleData.prompt.promptAudio.slice(
              self.puzzleData.prompt.promptAudio.indexOf(UrlSubstring) +
              UrlSubstring.length
            )
            : self.puzzleData.prompt.promptAudio,
          PromptAudio
        );
      }
      if (
        Math.sqrt(
          (x - this.width / 2 - (this.width * 0.3) / 2) *
          (x - this.width / 2 - (this.width * 0.3) / 2)
        ) +
        (y - this.height * 0.15) * (y - this.height * 0.15) <=
        1000
      ) {
        console.log("prompt");
      }
    });

    selfElelementId.addEventListener(
      "mousedown",
      function (event) {
        console.log(" mousedownhere ");
        var rect = selfElelementId.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (self.pausebutton.onClick(x, y)) {
          self.levelStart.timerTicking.pauseTimer();
          self.levelStart.levelEndCallBack();
          new PausePopUp(document.getElementById(self.id), self.levelStart);
        }
        for (let s of gs.stones) {
          if (Math.sqrt((x - s.x) * (x - s.x) + (y - s.y) * (y - s.y)) <= 40) {
            dragAudio.currentTime = 0;
            dragAudio.play();
            pickedStone = s;
            console.log(" this is picked stone : ", pickedStone);
            self.callBack("dragMonsterAnimation");
          }
        }
      },
      false
    );
    selfElelementId.addEventListener(
      "mouseup",
      function (event) {
        var rect = selfElelementId.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (
          Math.sqrt(
            (x -
              self.canvas.scene.monster.x -
              self.canvas.scene.monster.width / 4) *
            (x -
              self.canvas.scene.monster.x -
              self.canvas.scene.monster.width / 4) +
            (y -
              self.canvas.scene.monster.y -
              self.canvas.scene.monster.height / 2.7) *
            (y -
              self.canvas.scene.monster.y -
              self.canvas.scene.monster.height / 2.7)
          ) <= 60
        ) {
          console.log(" beemer ");
          if (pickedStone) {
            pickedStone.x = -900;
            pickedStone.y = -900;
            if (pickedStone.text == gs.puzzle.target[0]) {
              console.log(" beemer1 ");
              self.pickedStones.push(pickedStone.text);

              gs.puzzle.target.shift();
              if (gs.puzzle.target.length == 0) {
                gs.stones = [];

                self.callBack(
                  undefined,
                  true,
                  true,
                  pickedStone.text,
                  self.pickedStones
                );
                self.pickedStones = [];
              } else {
                self.callBack(
                  undefined,
                  true,
                  false,
                  pickedStone.text,
                  self.pickedStones
                );
              }
            } else {
              console.log(" beemer2 ");
              self.pickedStones.push(pickedStone.text);
              gs.stones = [];
              self.callBack(
                undefined,
                false,
                true,
                pickedStone.text,
                self.pickedStones
              );
              self.pickedStones = [];
            }
          }
          pickedStone = null;
        }
        if (pickedStone) {
          console.log(" beemer3 ");
          pickedStone.x = pickedStone.origx;
          pickedStone.y = pickedStone.origy;
          self.callBack("stopDragMonsterAnimation");
        }
        pickedStone = null;
      },
      false
    );
    selfElelementId.addEventListener(
      "mousemove",
      function (event) {
        console.log(" mousemove ");
        var rect = selfElelementId.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (pickedStone) {
          pickedStone.x = x;
          pickedStone.y = y;
        }
      },
      false
    );

    selfElelementId.addEventListener(
      "touchstart",
      function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        selfElelementId.dispatchEvent(mouseEvent);
      },
      false
    );

    selfElelementId.addEventListener(
      "touchmove",
      function (e) {
        console.log(" itstouchmove ");
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        selfElelementId.dispatchEvent(mouseEvent);
      },
      false
    );

    selfElelementId.addEventListener(
      "touchend",
      function (e) {
        var touch = e.changedTouches[0];
        var mouseEvent = new MouseEvent("mouseup", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        selfElelementId.dispatchEvent(mouseEvent);
      },
      false
    );

    // timeout2 = setTimeout(() => {
    this.createStones(<any>this.stonepos);
    timeoutRunning = false;
    // }, 3400);
  }

  setTimeoutRunning(value) {
    timeoutRunning = value;
  }
  makeStoneArrayEmpty() {
    gs.stones.splice(0, gs.stones.length);
  }
  getTargetStonePosition(stones) {
    let targetPositions = [];
    for (let i = 0; i < gs.stones.length; i++) {
      if (gs.stones[i].text == gs.puzzle.target[0]) {
        targetPositions.push(gs.stones[i].origx);
        targetPositions.push(gs.stones[i].origy);
        break;
      }
    }
    return targetPositions;
  }
  setPrompt() {
    this.context.fillStyle = "black";
    this.context.font = this.width * 0.09 + "px Arial";
    this.context.textAlign = "center";
    this.context.fillText(gs.puzzle.prompt, this.width / 2, this.height * 0.27);
  }
  deleteCanvas() {
    this.canvasStack.deleteLayer(this.id);
  }

  draw(deltaTime) {

    if (this.frameTimer >= this.frameInterval) {
      // console.log(deltaTime," bb ",this.frameTimer);
      this.frameTimer = 0;
      // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let s of gs.stones) {
        this.drawstone(s, this.canvas);
      }
    } else {
      this.frameTimer += 16.9;
    }


  }

  clearCanvas() {
    // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawstone(
    s: { img: any; x: number; y: number; text: any },
    canvas: { height: number }
  ) {
    var imageSize;
    var textFontSize;
    if (this.context.measureText(s.text).width * 1.4 > canvas.height / 13) {
      imageSize = this.context.measureText(s.text).width * 1.1;
      textFontSize = canvas.height / 25;
    } else {
      imageSize = canvas.height / 13;
      textFontSize = canvas.height / 20;
    }

    var imageCenterOffsetX = imageSize / 2.3;
    var imageCenterOffsetY = imageSize / 1.5;

    this.context.drawImage(
      s.img,
      s.x - imageCenterOffsetX,
      s.y - imageCenterOffsetY,
      imageSize,
      imageSize
    );

    this.context.fillStyle = "white";
    this.context.font = textFontSize + "px Arial";
    this.context.textAlign = "center";
    this.context.fillText(s.text, s.x, s.y);
  }
  createStones(stonepos: any[]) {
    var poss = stonepos[0];
    var i = 0;
    gs.stones.splice(0, gs.stones.length);
    for (let s of gs.puzzle.stones) {
      var ns = new StoneConfig(s, poss[i][0], poss[i][1]);
      gs.stones.push(ns);
      i += 1;
    }
    // setTimeout(() => {
    this.tutorial.updateTargetStonePositions(
      this.getTargetStonePosition(gs.stones)
    );
    this.showTutorial && this.puzzleIndex == 0
      ? this.tutorial.animateImage()
      : () => { };
    // }, 500);

    // this.draw(deltaTime);
  }

  update(deltaTime) {
    this.draw(deltaTime);
  }
}
