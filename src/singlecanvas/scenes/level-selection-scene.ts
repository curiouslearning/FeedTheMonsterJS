import { StartScene } from "./start-scene";
import { CanvasStack } from "../../utility/canvas-stack";
import { LevelConfig } from "../../common/level-config";
import { Game } from "../../scenes/game";
import {
  ButtonClick,
  IntroMusic,
  LevelSelectionLayer,
  PreviousPlayedLevel,
  GameScene1,
  loadImages,
} from "../../common/common";
import Sound from "../../common/sound";
import { getDatafromStorage } from "../../data/profile-data";
import { Debugger, lang } from "../../../global-variables";
import { GameScore } from "../data/game-score";
import { AudioPlayer } from "../components/audio-player";

var levelNumber: number;
var self: any;
var unlockLevelIndex = -1;
var previousPlayedLevel: number =
  parseInt(
    Debugger.DebugMode
      ? localStorage.getItem(PreviousPlayedLevel + lang + "Debug")
      : localStorage.getItem(PreviousPlayedLevel + lang)
  ) | 0;
var level: number;
if (previousPlayedLevel != null) {
  level = 10 * Math.floor(previousPlayedLevel / 10);
}
export class LevelSelectionScreen {
  public canvas: HTMLCanvasElement;
  public width: number;
  public height: number;
  public canvasStack: any;
  public data: any;
  public levels: any[];
  public sound: Sound;
  public id: string;
  public canavsElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public levelButtonpos: any;
  public starsId: any;
  public starsCanavsElement: HTMLElement;
  public starsContext: any;
  public levelsSectionCount: number;
  public gameLevelData: any;
  public callback: any;
  public images: Object;
  public loadedImages: any;
  public imagesLoaded: boolean = false;
  public levelNumber: number;
  audioPlayer: AudioPlayer;

  constructor(canvas: HTMLCanvasElement, data: any, callback: any) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvasStack = new CanvasStack("canvas");
    self = this;
    this.data = data;
    this.levels = [];
    this.levelsSectionCount =
      self.data.levels.length / 10 > Math.floor(self.data.levels.length / 10)
        ? Math.floor(self.data.levels.length / 10) + 1
        : Math.floor(self.data.levels.length / 10);
    this.sound = new Sound();
    this.initialiseButtonPos();
    this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canavsElement.getContext("2d");
    this.createLevelButtons(this.levelButtonpos);
    this.audioPlayer = new AudioPlayer();
    this.gameLevelData = GameScore.getAllGameLevelInfo();
    this.callback = callback;

    // loading images
    this.images = {
      mapIcon: "./assets/images/mapIcon.png",
      mapLock: "./assets/images/mapLock.png",
      map: "./assets/images/map.jpg",
      star: "./assets/images/star.png",
      nextbtn: "./assets/images/next_btn.png",
      backbtn: "./assets/images/back_btn.png",
    };

    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
      // this.audioPlayer.playAudio(false, "./assets/audios/intro.mp3");
      this.sound.playSound("./assets/audios/intro.mp3", IntroMusic);
    });
    this.addListeners();
  }

  private initialiseButtonPos() {
    this.levelButtonpos = [
      [
        [this.canvas.width / 10, this.canvas.height / 10],
        [this.canvas.width / 2.5, this.canvas.height / 10],
        [
          this.canvas.width / 3 + this.canvas.width / 2.8,
          this.canvas.height / 10,
        ],
        [this.canvas.width / 10, this.canvas.height / 3],
        [this.canvas.width / 2.5, this.canvas.height / 3],
        [
          this.canvas.width / 3 + this.canvas.width / 2.8,
          this.canvas.height / 3,
        ],
        [this.canvas.width / 10, this.canvas.height / 1.8],
        [this.canvas.width / 2.5, this.canvas.height / 1.8],
        [
          this.canvas.width / 3 + this.canvas.width / 2.8,
          this.canvas.height / 1.8,
        ],
        [this.canvas.width / 2.5, this.canvas.height / 1.3],
      ],
    ];
  }

  addListeners() {
    // next prev button listner #1
    document
      .getElementById("canvas")
      .addEventListener("mousedown", this.handleMouseDown, false);

    // when app goes background #2
    document.addEventListener(
      "visibilitychange",
      function () {
        self.sound.activeScreen();
      },
      false
    );

    /// swipe listener #3
    document
      .getElementById("canvas")
      .addEventListener("touchstart", handleTouchStart, false);
    // #4
    document
      .getElementById("canvas")
      .addEventListener("touchmove", handleTouchMove, false);

    var xDown = null;
    var yDown = null;

    function getTouches(evt) {
      return (
        evt.touches || // browser API
        evt.originalEvent.touches
      ); // jQuery
    }

    function handleTouchStart(evt) {
      const firstTouch = getTouches(evt)[0];
      xDown = firstTouch.clientX;
      yDown = firstTouch.clientY;
    }

    function handleTouchMove(evt) {
      if (!xDown || !yDown) {
        return;
      }

      var xUp = evt.touches[0].clientX;
      var yUp = evt.touches[0].clientY;

      var xDiff = xDown - xUp;
      var yDiff = yDown - yUp;

      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        /*most significant*/
        if (xDiff > 0) {
          if (level != self.levelsSectionCount * 10 - 10) {
            level = level + 10;
            self.downButton(level);
          }
          /* right swipe */
        } else {
          if (level != 0) {
            level = level - 10;
          }
          self.downButton(level);
          /* left swipe */
        }
      } else {
        if (yDiff > 0) {
          /* down swipe */
        } else {
          /* up swipe */
        }
      }
      /* reset values */
      xDown = null;
      yDown = null;
    }
  }

  handleMouseDown = (event) => {
    // return function (event) {
    event.preventDefault();
    var rect = document.getElementById("canvas").getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (
      x >= self.canvas.width * 0.7 &&
      x < self.canvas.width * 0.7 + self.canvas.height / 10 &&
      y > self.canvas.height / 1.3 &&
      y < self.canvas.height / 1.3 + self.canvas.height / 10
    ) {
      if (level != self.levelsSectionCount * 10 - 10) {
        level = level + 10;
        self.downButton(level);
      }
    }

    if (
      x >= self.canvas.width / 10 &&
      x < self.canvas.width / 10 + self.canvas.height / 10 &&
      y > self.canvas.height / 1.3 &&
      y < self.canvas.height / 1.3 + self.canvas.height / 10
    ) {
      if (level != 0) {
        level = level - 10;
      }
      self.downButton(level);
    }
    for (let s of self.levels) {
      if (
        Math.sqrt(
          (x - s.x - self.canvas.height / 20) *
            (x - s.x - self.canvas.height / 20) +
            (y - s.y - self.canvas.height / 20) *
              (y - s.y - self.canvas.height / 20)
        ) < 45
      ) {
        if (Debugger.DebugMode) {
          this.audioPlayer.playAudio(false, "./assets/audios/ButtonClick.mp3");
          // self.sound.pauseSound();
          levelNumber = s.index + level - 1;
          self.startGame(levelNumber);
        } else if (s.index + level - 1 <= unlockLevelIndex + 1) {
          this.audioPlayer.playAudio(false, "./assets/audios/ButtonClick.mp3");
          // self.sound.pauseSound();
          levelNumber = s.index + level - 1;
          self.startGame(levelNumber);
        }
      }
    }
    // };
  };

  testDraw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.loadedImages.map,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      this.draw(1);
      this.downButton(level);
      this.drawStars(this.gameLevelData);
    }
  }
  gameSceneCallBack(button_name: string) {
    switch (button_name) {
      case "next_button": {
        self.startGame((levelNumber += 1));
        break;
      }
      case "retry_button": {
        self.startGame(levelNumber);
        break;
      }
      case "close_button": {
        self.sound.playSound("./assets/audios/intro.mp3", IntroMusic);
        self.drawStars();
      }
    }
  }
  createCanvas() {
    this.sound.playSound("./assets/audios/intro.mp3", IntroMusic);
  }
  createLevelButtons(levelButtonpos: any) {
    var poss = levelButtonpos[0];
    var i = 0;
    for (let s = 0; s < 10; s++) {
      var ns = new LevelConfig(poss[i][0], poss[i][1], i + 1);
      self.levels.push(ns);
      i += 1;
    }
    // this.draw(level);
    // this.downButton(level);
  }
  draw(level: number) {
    for (let s of self.levels) {
      this.drawlevel(s, self.canvas);
    }
  }

  // hides or shows next and previous buttons
  downButton(level: number) {
    var imageSize = self.canvas.height / 10;
    if (level != self.levelsSectionCount * 10 - 10) {
      this.context.drawImage(
        this.loadedImages.nextbtn,
        this.canvas.width * 0.7,
        this.canvas.height / 1.3,
        imageSize,
        imageSize
      );
    }
    if (level != 0) {
      this.context.drawImage(
        this.loadedImages.backbtn,
        this.canvas.width / 10,
        this.canvas.height / 1.3,
        imageSize,
        imageSize
      );
    }
  }
  // drawing level bg icon+ leevel numer
  drawlevel(s: any, canvas: { height: number }) {
    var imageSize = canvas.height / 5;
    var textFontSize = imageSize / 6;
    if (s.index + level <= self.data.levels.length) {
      this.context.drawImage(
        this.loadedImages.mapIcon,
        s.x,
        s.y,
        imageSize,
        imageSize
      );
      this.context.fillStyle = "white";
      this.context.font = textFontSize + "px Arial";
      this.context.textAlign = "center";
      this.context.fillText(
        s.index + level,
        s.x + imageSize / 3.5,
        s.y + imageSize / 3
      );
      this.context.font = textFontSize - imageSize / 30 + "px Arial";
      Debugger.DebugMode
        ? this.context.fillText(
            this.data.levels[s.index + level - 1].levelMeta.levelType,
            s.x + imageSize / 3.5,
            s.y + imageSize / 1.3
          )
        : null;
    }
  }
  startGame(level_number: string | number) {
    this.dispose();
    this.sound.pauseSound();
    // StartScene.SceneName = GameScene1;
    let gamePlayData = {
      currentLevelData: self.data.levels[level_number],
      selectedLevelNumber: level_number,
    };
    this.callback(gamePlayData);
  }

  // draw stars on top of level number
  drawStars(gameLevelData) {
    let canvas = document.getElementById("canvas");
    var canavsElement = <HTMLCanvasElement>document.getElementById("canvas");
    var context = canavsElement.getContext("2d");
    // context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (gameLevelData != null) {
      if (gameLevelData.length != undefined) {
        for (let game of gameLevelData) {
          if (unlockLevelIndex < parseInt(game.levelNumber)) {
            game.starCount >= 2
              ? (unlockLevelIndex = parseInt(game.levelNumber))
              : null;
          }
        }
      }
      for (let s of self.levels) {
        if (s.index + level <= self.data.levels.length) {
          if (!Debugger.DebugMode) {
            s.index + level - 1 > unlockLevelIndex + 1
              ? context.drawImage(
                  this.loadedImages.mapLock,
                  s.x,
                  s.y,
                  this.canvas.height / 13,
                  this.canvas.height / 13
                )
              : null;
          }
          for (let i = 0; i < gameLevelData.length; i++) {
            if (s.index - 1 + level == parseInt(gameLevelData[i].levelNumber)) {
              this.drawStar(s, canvas, gameLevelData[i].starCount, context);
              break;
            }
          }
        }
      }
    }
  }
  drawStar(s: any, canvas: any, starCount: number, context) {
    var imageSize = canvas.height / 5;
    if (starCount >= 1) {
      context.drawImage(
        this.loadedImages.star,
        s.x,
        s.y - imageSize * 0.01,
        imageSize / 5,
        imageSize / 5
      );
    }
    if (starCount > 1) {
      context.drawImage(
        this.loadedImages.star,
        s.x + imageSize / 2.5,
        s.y - imageSize * 0.01,
        imageSize / 5,
        imageSize / 5
      );
    }
    if (starCount == 3) {
      context.drawImage(
        this.loadedImages.star,
        s.x + imageSize / 5,
        s.y - imageSize * 0.1,
        imageSize / 5,
        imageSize / 5
      );
    }
  }

  dispose() {
    // remove listeners
    this.audioPlayer.stopAudio();
    document
      .getElementById("canvas")
      .removeEventListener("mousedown", this.handleMouseDown, false);
  }
}
