import { Debugger, lang } from "../../global-variables";
import { PreviousPlayedLevel, loadImages } from "../common/common";
import { LevelConfig } from "../common/level-config";
import { Utils } from "../common/utils";
import { AudioPlayer } from "../components/audio-player";
import { GameScore } from "../data/game-score";


export class LevelSelectionScreen{
  private canvas: HTMLCanvasElement;
  private data:any;
  private levelButtonPos:any;
  private canvasElement:HTMLCanvasElement;
  private context:CanvasRenderingContext2D;
  private levels:[];
  private gameLevelData:any;
  public callBack:any;
  private audioPlayer:AudioPlayer;
  private images:object;
  private loadedImages:any;
  private imagesLoaded:boolean=false;
  private xDown:number;
  private yDown:number;
  private previousPlayedLevelNumber:number;
  private levelSelectionPageIndex:number=0;
  private levelNumber:number;
  private levelsSectionCount:number;
  private unlockLevelIndex:number;
  constructor(canvas:HTMLCanvasElement,data:any,callBack:any){
    this.canvas = canvas;
    this.data = data;
    let self =this;
    this.callBack=callBack;
    this.levelsSectionCount =
      self.data.levels.length / 10 > Math.floor(self.data.levels.length / 10)
        ? Math.floor(self.data.levels.length / 10) + 1
        : Math.floor(self.data.levels.length / 10);
    this.initialiseButtonPos();
    this.levels = [];
    this.canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvasElement.getContext("2d");
    this.createLevelButtons(this.levelButtonPos);
    this.gameLevelData = GameScore.getAllGameLevelInfo();
    this.callBack = callBack;
    this.audioPlayer = new AudioPlayer();
    this.unlockLevelIndex=-1;
    this.previousPlayedLevelNumber=parseInt(
      Debugger.DebugMode
        ? localStorage.getItem(PreviousPlayedLevel + lang + "Debug")
        : localStorage.getItem(PreviousPlayedLevel + lang)
    ) | 0;
    if (this.previousPlayedLevelNumber != null) {
      this.levelSelectionPageIndex = 10 * Math.floor(this.previousPlayedLevelNumber / 10);
    }
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
      if (document.visibilityState === "visible") {
      this.audioPlayer.playAudio( "./assets/audios/intro.mp3");
      }
    });
    this.addListeners();
  }
  private initialiseButtonPos() {
    this.levelButtonPos = [
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
  private createLevelButtons(levelButtonpos: any) {
    let poss = levelButtonpos[0];
    let i = 0;
    for (let s = 0; s < 10; s++) {
      let ns = new LevelConfig(poss[i][0], poss[i][1], i + 1);
      this.levels.push(ns);
      i += 1;
    }
  }
  private addListeners() {
    // next prev button listner #1
    document
      .getElementById("canvas")
      .addEventListener("mousedown", this.handleMouseDown, false);

    // when app goes background #2
    document.addEventListener("visibilitychange", this.pausePlayAudios, false);

    /// swipe listener #3
    document
      .getElementById("canvas")
      .addEventListener("touchstart", this.handleTouchStart, false);
    // #4
    document
      .getElementById("canvas")
      .addEventListener("touchmove", this.handleTouchMove, false);
  }
  private pausePlayAudios = () => {
    if (document.visibilityState === "visible") {
      this.audioPlayer.playAudio( "./assets/audios/intro.mp3");
    } else {
      this.audioPlayer.stopAllAudios();
    }
  };
  private getTouches(evt) {
    return (
      evt.touches || // browser API
      evt.originalEvent.touches
    ); // jQuery
  }
  private handleTouchStart = (evt) => {
    const firstTouch = this.getTouches(evt)[0];
    this.xDown = firstTouch.clientX;
    this.yDown = firstTouch.clientY;
  };

  private handleTouchMove = (evt) => {
    if (!this.xDown || !this.yDown) {
      return;
    }

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = this.xDown - xUp;
    var yDiff = this.yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      /*most significant*/
      if (xDiff > 0) {
        if (this.levelSelectionPageIndex != this.levelsSectionCount * 10 - 10) {
          this.levelSelectionPageIndex = this.levelSelectionPageIndex + 10;
          this.downButton(this.levelSelectionPageIndex);
        }
        /* right swipe */
      } else {
        if (this.levelSelectionPageIndex != 0) {
          this.levelSelectionPageIndex = this.levelSelectionPageIndex - 10;
        }
        this.downButton(this.levelSelectionPageIndex);
        /* left swipe */
      }
    }
    /* reset values */
    this.xDown = null;
    this.yDown = null;
  };

  private handleMouseDown = (event) => {
    // return function (event) {
    event.preventDefault();
    var rect = document.getElementById("canvas").getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (
      x >= this.canvas.width * 0.7 &&
      x < this.canvas.width * 0.7 + this.canvas.height / 10 &&
      y > this.canvas.height / 1.3 &&
      y < this.canvas.height / 1.3 + this.canvas.height / 10
    ) {
      if (this.levelSelectionPageIndex != this.levelsSectionCount * 10 - 10) {
        this.levelSelectionPageIndex = this.levelSelectionPageIndex + 10;
        this.downButton(this.levelSelectionPageIndex);
      }
    }

    if (
      x >= this.canvas.width / 10 &&
      x < this.canvas.width / 10 + this.canvas.height / 10 &&
      y > this.canvas.height / 1.3 &&
      y < this.canvas.height / 1.3 + this.canvas.height / 10
    ) {
      if (this.levelSelectionPageIndex != 0) {
        this.levelSelectionPageIndex = this.levelSelectionPageIndex - 10;
      }
      this.downButton(this.levelSelectionPageIndex);
    }
    for (let s of this.levels) {
      if (
        Math.sqrt(
          (x - s.x - this.canvas.height / 20) *
            (x - s.x - this.canvas.height / 20) +
            (y - s.y - this.canvas.height / 20) *
              (y - s.y - this.canvas.height / 20)
        ) < 45
      ) {
        if (Debugger.DebugMode) {
          this.audioPlayer.playButtonClickSound("./assets/audios/ButtonClick.mp3");
          this.levelNumber = s.index + this.levelSelectionPageIndex - 1;
          this.startGame(this.levelNumber);
        } else if (s.index + this.levelSelectionPageIndex - 1 <= this.unlockLevelIndex + 1) {
          this.audioPlayer.playButtonClickSound( "./assets/audios/ButtonClick.mp3");
          this.levelNumber = s.index + this.levelSelectionPageIndex - 1;
          this.startGame(this.levelNumber);
        }
      }
    }
  };
  private drawLevel(s: any, canvas: { height: number }){
    var imageSize = canvas.height / 5;
    var textFontSize = imageSize / 6;
    if (s.index + this.levelSelectionPageIndex <= this.data.levels.length) {
      this.context.drawImage(
        this.loadedImages.mapIcon,
        s.x,
        s.y,
        imageSize,
        imageSize
      );
      this.context.fillStyle = "white";
      this.context.font = textFontSize + `px ${Utils.getLanguageSpecificFont(lang)}, monospace`;
      this.context.textAlign = "center";
      this.context.fillText(
        s.index + this.levelSelectionPageIndex,
        s.x + imageSize / 3.5,
        s.y + imageSize / 3
      );
      this.context.font = textFontSize - imageSize / 30 + `px ${Utils.getLanguageSpecificFont(lang)}, monospace`;
      Debugger.DebugMode
        ? this.context.fillText(
            this.data.levels[s.index + this.levelSelectionPageIndex - 1].levelMeta.levelType,
            s.x + imageSize / 3.5,
            s.y + imageSize / 1.3
          )
        : null;
    }
  }
  private draw(){
    for (let s of this.levels) {
      this.drawLevel(s, this.canvas);
    }
  }
  private downButton(level: number) {
    var imageSize = this.canvas.height / 10;
    if (level != this.levelsSectionCount * 10 - 10) {
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
  // draw stars on top of level number
  private drawStars(gameLevelData) {
    
    if (gameLevelData != null) {
      if (gameLevelData.length != undefined) {
        for (let game of gameLevelData) {
          if (this.unlockLevelIndex < parseInt(game.levelNumber)) {
            game.starCount >= 2
              ? (this.unlockLevelIndex = parseInt(game.levelNumber))
              : null;
          }
        }
      }
      for (let s of this.levels) {
        if (s.index + this.levelSelectionPageIndex <= this.data.levels.length) {
          if (!Debugger.DebugMode) {
            s.index + this.levelSelectionPageIndex - 1 > this.unlockLevelIndex + 1
              ? this.context.drawImage(
                  this.loadedImages.mapLock,
                  s.x,
                  s.y,
                  this.canvas.height / 13,
                  this.canvas.height / 13
                )
              : null;
          }
          for (let i = 0; i < gameLevelData.length; i++) {
            if (s.index - 1 + this.levelSelectionPageIndex == parseInt(gameLevelData[i].levelNumber)) {
              this.drawStar(s, canvas, gameLevelData[i].starCount, this.context);
              break;
            }
          }
        }
      }
    }
  }
  private startGame(level_number: string | number) {
    this.dispose();
    this.audioPlayer.stopAllAudios();
    // StartScene.SceneName = GameScene1;
    let gamePlayData = {
      currentLevelData: this.data.levels[level_number],
      selectedLevelNumber: level_number,
    };
    this.callBack(gamePlayData,'LevelSelection');
  }
public drawLevelSelection(){
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.loadedImages.map,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      this.draw();
      this.downButton(this.levelSelectionPageIndex);
      this.drawStars(this.gameLevelData);
    }
}
public dispose(){
  this.audioPlayer.stopAllAudios();
  document
  .getElementById("canvas")
  .removeEventListener("mousedown", this.handleMouseDown, false);

// when app goes background #2
document.removeEventListener("visibilitychange", this.pausePlayAudios, false);

/// swipe listener #3
document
  .getElementById("canvas")
  .removeEventListener("touchstart", this.handleTouchStart, false);
// #4
document
  .getElementById("canvas")
  .removeEventListener("touchmove", this.handleTouchMove, false);
}
}