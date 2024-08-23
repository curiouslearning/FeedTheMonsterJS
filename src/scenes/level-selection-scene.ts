import { Debugger, font, lang, pseudoId } from "../../global-variables";
import { loadImages } from "../common/";
import { LevelConfig } from "../common/level-config";
import {
  disposeEventListeners,
  drawImageOnCanvas,
  Utils,
} from "../common/utils";
import { AudioPlayer } from "../components/audio-player";
import { getData } from "../data/api-data";
import { GameScore } from "../data/game-score";
import { SelectedLevel } from "../Firebase/firebase-event-interface";
import { FirebaseIntegration } from "../Firebase/firebase-integration";
import {
  createBackground,
  levelSelectBgDrawing,
} from "../compositions/background";
import { PreviousPlayedLevel, LEVEL_SELECTION_BACKGROUND } from "../constants";
import { ILevelSelectionScreen } from "../interfaces/levelSelectionScreenInterface";
export class LevelSelectionScreen implements ILevelSelectionScreen {
  private canvas: HTMLCanvasElement;
  private data: any;
  public width: number;
  public height: number;
  private levelButtonPos: [number, number][][];
  private canvasElement: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private levels: any;
  private gameLevelData: any;
  public callBack: Function;
  private audioPlayer: AudioPlayer;
  private images: { [key: string]: string };
  private loadedImages: any;
  private imagesLoaded: boolean = false;
  private xDown: number;
  private yDown: number;
  private previousPlayedLevelNumber: number;
  private levelSelectionPageIndex: number = 0;
  private levelNumber: number;
  private levelsSectionCount: number;
  private unlockLevelIndex: number;
  private majVersion: string;
  private minVersion: string;
  private firebaseIntegration: FirebaseIntegration;
  public background: any;

  constructor(canvas: HTMLCanvasElement, data: any, callBack: Function) {
    this.canvas = canvas;
    this.data = data;
    this.width = canvas.width;
    this.height = canvas.height;
    let self = this;
    this.callBack = callBack;
    this.levelsSectionCount =
      self.data.levels.length / 10 > Math.floor(self.data.levels.length / 10)
        ? Math.floor(self.data.levels.length / 10) + 1
        : Math.floor(self.data.levels.length / 10);
    this.initialiseButtonPos();
    this.levels = [];
    this.firebaseIntegration = new FirebaseIntegration();
    this.init();
    this.canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvasElement.getContext("2d");
    this.createLevelButtons(this.levelButtonPos);
    this.gameLevelData = GameScore.getAllGameLevelInfo();
    this.audioPlayer = new AudioPlayer();
    this.unlockLevelIndex = -1;
    this.previousPlayedLevelNumber =
      parseInt(
        Debugger.DebugMode
          ? localStorage.getItem(PreviousPlayedLevel + lang + "Debug")
          : localStorage.getItem(PreviousPlayedLevel + lang)
      ) | 0;
    if (this.previousPlayedLevelNumber != null) {
      this.levelSelectionPageIndex =
        10 * Math.floor(this.previousPlayedLevelNumber / 10);
    }
    this.setupBg();
    this.loadAndSetupImages();
    this.addListeners();
  }

  private getCanvasElement(): HTMLCanvasElement {
    return document.getElementById("canvas") as HTMLCanvasElement;
  }

  private loadAndSetupImages() {
    this.images = {
      mapIcon: "./assets/images/mapIcon.png",
      mapIconSpecial: "./assets/images/map_icon_monster_level_v01.png",
      mapLock: "./assets/images/mapLock.png",
      star: "./assets/images/star.png",
      nextbtn: "./assets/images/next_btn.png",
      backbtn: "./assets/images/back_btn.png",
    };

    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
      if (document.visibilityState === "visible") {
        this.audioPlayer.playAudio("./assets/audios/intro.mp3");
      }
    });
  }

  private async init() {
    const data = await getData();
    this.majVersion = data.majversion;
    this.minVersion = data.minversion;
  }

  private setupBg = async () => {
    this.background = await createBackground(
      this.context,
      this.width,
      this.height,
      { LEVEL_SELECTION_BACKGROUND },
      levelSelectBgDrawing
    );
  };

  private initialiseButtonPos() {
    const rows = 3;
    const columns = 3;
    const positions = [];

    const xOffsets = [
      this.canvas.width / 10,
      this.canvas.width / 2.5,
      this.canvas.width / 3 + this.canvas.width / 2.8,
    ];

    const yOffsets = [
      this.canvas.height / 10,
      this.canvas.height / 3,
      this.canvas.height / 1.8,
    ];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        positions.push([xOffsets[col], yOffsets[row]]);
      }
    }

    // Adding the last position which is a special case
    positions.push([this.canvas.width / 2.5, this.canvas.height / 1.3]);

    this.levelButtonPos = [positions];
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

  private setupEventListeners(
    action: "add" | "remove",
    element: HTMLElement,
    listeners: { type: string; listener: EventListenerOrEventListenerObject }[]
  ) {
    listeners.forEach(({ type, listener }) => {
      if (action === "add") {
        element.addEventListener(type, listener, false);
      } else {
        element.removeEventListener(type, listener, false);
      }
    });
  }

  private addListeners() {
    const canvasElement = this.getCanvasElement();
    if (canvasElement) {
      const listeners = [
        { type: "mousedown", listener: this.handleMouseDown },
        { type: "touchstart", listener: this.handleTouchStart },
        { type: "touchmove", listener: this.handleTouchMove },
      ];
      this.setupEventListeners("add", canvasElement, listeners);
    }

    document.addEventListener("visibilitychange", this.pausePlayAudios, false);
  }

  private pausePlayAudios = () => {
    if (document.visibilityState === "visible") {
      this.audioPlayer.playAudio("./assets/audios/intro.mp3");
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

    let xUp = evt.touches[0].clientX;
    let yUp = evt.touches[0].clientY;

    let xDiff = this.xDown - xUp;
    let yDiff = this.yDown - yUp;

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
    let rect = document.getElementById("canvas").getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // right button
    if (
      x >= this.canvas.width * 0.7 &&
      x < this.canvas.width * 0.7 + this.canvas.height / 10 &&
      y > this.canvas.height / 1.3 &&
      y < this.canvas.height / 1.3 + this.canvas.height / 10
    ) {
      this.audioPlayer.playButtonClickSound();
      if (this.levelSelectionPageIndex != this.levelsSectionCount * 10 - 10) {
        this.levelSelectionPageIndex = this.levelSelectionPageIndex + 10;
        this.downButton(this.levelSelectionPageIndex);
      }
    }

    // left button
    if (
      x >= this.canvas.width / 10 &&
      x < this.canvas.width / 10 + this.canvas.height / 10 &&
      y > this.canvas.height / 1.3 &&
      y < this.canvas.height / 1.3 + this.canvas.height / 10
    ) {
      this.audioPlayer.playButtonClickSound();
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
          this.audioPlayer.playButtonClickSound();
          this.levelNumber = s.index + this.levelSelectionPageIndex - 1;
          this.startGame(this.levelNumber);
        } else if (
          s.index + this.levelSelectionPageIndex - 1 <=
          this.unlockLevelIndex + 1
        ) {
          this.audioPlayer.playButtonClickSound();
          this.levelNumber = s.index + this.levelSelectionPageIndex - 1;
          this.startGame(this.levelNumber);
        }
      }
    }
  };

  private drawImage(
    imageKey: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    drawImageOnCanvas(
      this.context,
      this.loadedImages[imageKey],
      x,
      y,
      width,
      height
    );
  }

  private drawLevel(s: any, canvas: { height: number }) {
    let imageSize = canvas.height / 5;
    let textFontSize = imageSize / 6;
    const specialLevels = [5, 13, 20, 30, 42];
    const levelNumber = s.index + this.levelSelectionPageIndex;

    if (levelNumber <= this.data.levels.length) {
      const isSpecialLevel = specialLevels.includes(levelNumber);
      this.drawImage(
        isSpecialLevel ? "mapIconSpecial" : "mapIcon",
        s.x,
        s.y,
        isSpecialLevel ? imageSize * 0.9 : imageSize,
        isSpecialLevel ? imageSize * 0.9 : imageSize
      );

      this.context.fillStyle = "white";
      this.context.font = `${textFontSize}px ${font}, monospace`;
      this.context.textAlign = "center";
      this.context.fillText(
        levelNumber,
        s.x + imageSize / 3.5,
        s.y + imageSize / 3
      );
      this.context.font = `${
        textFontSize - imageSize / 30
      }px ${font}, monospace`;
      if (Debugger.DebugMode) {
        this.context.fillText(
          this.data.levels[levelNumber - 1].levelMeta.levelType,
          s.x + imageSize / 3.5,
          s.y + imageSize / 1.3
        );
      }
    }
  }

  private draw() {
    for (let s of this.levels) {
      this.drawLevel(s, this.canvas);
    }
  }

  private downButton(level: number) {
    let imageSize = this.canvas.height / 10;
    if (level !== this.levelsSectionCount * 10 - 10) {
      this.drawImage(
        "nextbtn",
        this.canvas.width * 0.7,
        this.canvas.height / 1.3,
        imageSize,
        imageSize
      );
    }
    if (level !== 0) {
      this.drawImage(
        "backbtn",
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
            s.index + this.levelSelectionPageIndex - 1 >
            this.unlockLevelIndex + 1
              ? drawImageOnCanvas(
                  this.context,
                  this.loadedImages.mapLock,
                  s.x,
                  s.y,
                  this.canvas.height / 13,
                  this.canvas.height / 13
                )
              : null;
          }
          for (let i = 0; i < gameLevelData.length; i++) {
            if (
              s.index - 1 + this.levelSelectionPageIndex ==
              parseInt(gameLevelData[i].levelNumber)
            ) {
              this.drawStar(
                s,
                this.canvas,
                gameLevelData[i].starCount,
                this.context
              );
              break;
            }
          }
        }
      }
    }
  }

  private drawStar(s: any, canvas: any, starCount: number, context?: CanvasRenderingContext2D) {
    let imageSize = canvas.height / 5;
    const positions = [
      [0, -imageSize * 0.01],
      [imageSize / 2.5, -imageSize * 0.01],
      [imageSize / 5, -imageSize * 0.1],
    ];

    for (let i = 0; i < starCount; i++) {
      const [dx, dy] = positions[i];
      this.drawImage("star", s.x + dx, s.y + dy, imageSize / 5, imageSize / 5);
    }
  }

  private startGame(level_number: string | number) {
    this.dispose();
    this.audioPlayer.stopAllAudios();
    const gamePlayData = {
      currentLevelData: {
        ...this.data.levels[level_number],
        levelNumber: level_number,
      },
      selectedLevelNumber: level_number,
    };
    this.logSelectedLevelEvent();
    this.callBack(gamePlayData, "LevelSelection");
  }
  public logSelectedLevelEvent() {
    const selectedLeveltData: SelectedLevel = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number:
        !!this.majVersion && !!this.minVersion
          ? this.majVersion.toString() + "." + this.minVersion.toString()
          : "",
      level_selected: this.levelNumber,
    };
    this.firebaseIntegration.sendSelectedLevelEvent(selectedLeveltData);
  }
  public drawLevelSelection() {
    if (this.imagesLoaded) {
      this.background?.draw();
      this.draw();
      this.downButton(this.levelSelectionPageIndex);
      this.drawStars(this.gameLevelData);
    }
  }

  public dispose() {
    this.audioPlayer.stopAllAudios();
    const canvasElement = this.getCanvasElement();
    if (canvasElement) {
      const listeners = [
        { type: "mousedown", listener: this.handleMouseDown },
        { type: "touchstart", listener: this.handleTouchStart },
        { type: "touchmove", listener: this.handleTouchMove },
      ];
      this.setupEventListeners("remove", canvasElement, listeners);
    }

    document.removeEventListener(
      "visibilitychange",
      this.pausePlayAudios,
      false
    );
  }
}
