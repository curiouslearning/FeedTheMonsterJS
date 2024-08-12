import { Debugger, font, lang, pseudoId } from "../../global-variables";
import { PreviousPlayedLevel, loadImages } from "../common/common";
import { LevelConfig } from "../common/level-config";
import { Utils } from "../common/utils";
import { AudioPlayer } from "../components/audio-player";
import { getData } from "../data/api-data";
import { GameScore } from "../data/game-score";
import { SelectedLevel } from "../Firebase/firebase-event-interface";
import { FirebaseIntegration } from "../Firebase/firebase-integration";
import { LevelSelectionScreenInterface } from "../interfaces/levelSelectionScreenInterface";

export class LevelSelectionScreen implements LevelSelectionScreenInterface {
  public canvas: HTMLCanvasElement;
  public data: any;
  public levelButtonPos: [number, number][][];
  public canvasElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public levels: any;
  public gameLevelData: any;
  public callBack: Function;
  public audioPlayer: AudioPlayer;
  public images: object;
  public loadedImages: any;
  public imagesLoaded: boolean = false;
  public xDown: number;
  public yDown: number;
  public previousPlayedLevelNumber: number;
  public levelSelectionPageIndex: number = 0;
  public levelNumber: number;
  public levelsSectionCount: number;
  public unlockLevelIndex: number;
  public majVersion: string;
  public minVersion: string;
  public firebaseIntegration: FirebaseIntegration;

  constructor(canvas: HTMLCanvasElement, data: any, callBack: Function) {
    this.canvas = canvas;
    this.data = data;
    this.callBack = callBack;
    this.levelsSectionCount =
      this.data.levels.length / 10 > Math.floor(this.data.levels.length / 10)
        ? Math.floor(this.data.levels.length / 10) + 1
        : Math.floor(this.data.levels.length / 10);
    this.initialiseButtonPos();
    this.levels = [];
    this.firebaseIntegration = new FirebaseIntegration();
    this.init();
    this.canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvasElement.getContext("2d")!;
    this.createLevelButtons(this.levelButtonPos);
    this.gameLevelData = GameScore.getAllGameLevelInfo();
    this.callBack = callBack;
    this.audioPlayer = new AudioPlayer();
    this.unlockLevelIndex = -1;
    this.previousPlayedLevelNumber =
      parseInt(
        Debugger.DebugMode
          ? localStorage.getItem(PreviousPlayedLevel + lang + "Debug")
          : localStorage.getItem(PreviousPlayedLevel + lang)
      ) || 0;
    if (this.previousPlayedLevelNumber != null) {
      this.levelSelectionPageIndex =
        10 * Math.floor(this.previousPlayedLevelNumber / 10);
    }
    this.images = {
      mapIcon: "./assets/images/mapIcon.png",
      mapIconSpecial: "./assets/images/map_icon_monster_level_v01.png",
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
        this.audioPlayer.playAudio("./assets/audios/intro.mp3");
      }
    });
    this.addListeners();
  }

  public async init() {
    const data = await getData();
    this.majVersion = data.majversion;
    this.minVersion = data.minversion;
  }

  public initialiseButtonPos() {
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

  public createLevelButtons(levelButtonpos: any) {
    let poss = levelButtonpos[0];
    let i = 0;
    for (let s = 0; s < 10; s++) {
      let ns = new LevelConfig(poss[i][0], poss[i][1], i + 1);
      this.levels.push(ns);
      i += 1;
    }
  }

  public addListeners() {
    document
      .getElementById("canvas")!
      .addEventListener("mousedown", this.handleMouseDown, false);
    document.addEventListener("visibilitychange", this.pausePlayAudios, false);
    document
      .getElementById("canvas")!
      .addEventListener("touchstart", this.handleTouchStart, false);
    document
      .getElementById("canvas")!
      .addEventListener("touchmove", this.handleTouchMove, false);
  }

  public pausePlayAudios = () => {
    if (document.visibilityState === "visible") {
      this.audioPlayer.playAudio("./assets/audios/intro.mp3");
    } else {
      this.audioPlayer.stopAllAudios();
    }
  };

  public getTouches(evt: TouchEvent) {
    return evt.touches || evt.touches;
  }

  public handleTouchStart = (evt: TouchEvent) => {
    const firstTouch = this.getTouches(evt)[0];
    this.xDown = firstTouch.clientX;
    this.yDown = firstTouch.clientY;
  };

  public handleTouchMove = (evt: TouchEvent) => {
    if (!this.xDown || !this.yDown) {
      return;
    }

    let xUp = evt.touches[0].clientX;
    let yUp = evt.touches[0].clientY;

    let xDiff = this.xDown - xUp;
    let yDiff = this.yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (xDiff > 0) {
        if (this.levelSelectionPageIndex != this.levelsSectionCount * 10 - 10) {
          this.levelSelectionPageIndex = this.levelSelectionPageIndex + 10;
          this.downButton(this.levelSelectionPageIndex);
        }
      } else {
        if (this.levelSelectionPageIndex != 0) {
          this.levelSelectionPageIndex = this.levelSelectionPageIndex - 10;
        }
        this.downButton(this.levelSelectionPageIndex);
      }
    }
    this.xDown = null!;
    this.yDown = null!;
  };

  public handleMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    let rect = document.getElementById("canvas")!.getBoundingClientRect();
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
          this.audioPlayer.playButtonClickSound(
            "./assets/audios/ButtonClick.mp3"
          );
          this.levelNumber = s.index + this.levelSelectionPageIndex - 1;
          this.startGame(this.levelNumber);
        } else if (
          s.index + this.levelSelectionPageIndex - 1 <=
          this.unlockLevelIndex + 1
        ) {
          this.audioPlayer.playButtonClickSound(
            "./assets/audios/ButtonClick.mp3"
          );
          this.levelNumber = s.index + this.levelSelectionPageIndex - 1;
          this.startGame(this.levelNumber);
        }
      }
    }
  };

  public drawLevel(s: any, canvas: { height: number }) {
    let imageSize = canvas.height / 5;
    let textFontSize = imageSize / 6;
    const specialLevels = [5, 13, 20, 30, 42];

    if (s.index + this.levelSelectionPageIndex <= this.data.levels.length) {
      const levelNumber = s.index + this.levelSelectionPageIndex;
      const isSpecialLevel = specialLevels.includes(levelNumber);
      this.context.drawImage(
        isSpecialLevel
          ? this.loadedImages.mapIconSpecial
          : this.loadedImages.mapIcon,
        s.x,
        s.y,
        isSpecialLevel ? imageSize * 0.9 : imageSize,
        isSpecialLevel ? imageSize * 0.9 : imageSize
      );

      this.context.fillStyle = "white";
      this.context.font = textFontSize + `px ${font}, monospace`;
      this.context.textAlign = "center";
      this.context.fillText(
        s.index + this.levelSelectionPageIndex,
        s.x + imageSize / 3.5,
        s.y + imageSize / 3
      );
      this.context.font =
        textFontSize - imageSize / 30 + `px ${font}, monospace`;
      Debugger.DebugMode
        ? this.context.fillText(
            this.data.levels[s.index + this.levelSelectionPageIndex - 1]
              .levelMeta.levelType,
            s.x + imageSize / 3.5,
            s.y + imageSize / 1.3
          )
        : null;
    }
  }

  public draw() {
    for (let s of this.levels) {
      this.drawLevel(s, this.canvas);
    }
  }

  public downButton(level: number) {
    let imageSize = this.canvas.height / 10;
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

  public drawStars(gameLevelData: any) {
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

  public drawStar(
    s: any,
    canvas: any,
    starCount: number,
    context: CanvasRenderingContext2D
  ) {
    let imageSize = canvas.height / 5;
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

  public startGame(level_number: string | number) {
    this.dispose();
    this.audioPlayer.stopAllAudios();
    let gamePlayData = {
      currentLevelData: this.data.levels[level_number],
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
      version_number: document.getElementById("version-info-id")!.innerHTML,
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

  public dispose() {
    this.audioPlayer.stopAllAudios();
    document
      .getElementById("canvas")!
      .removeEventListener("mousedown", this.handleMouseDown, false);

    document.removeEventListener("visibilitychange", this.pausePlayAudios);

    document
      .getElementById("canvas")!
      .removeEventListener("touchstart", this.handleTouchStart, false);
    document
      .getElementById("canvas")!
      .removeEventListener("touchmove", this.handleTouchMove, false);
  }
}
