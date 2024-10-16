import {
  Debugger,
  lang,
  pseudoId,
  loadImages,
} from "@common";
import { AudioPlayer } from "@components";
import { getData, GameScore } from "@data";
import { SelectedLevel } from "../Firebase/firebase-event-interface";
import { FirebaseIntegration } from "../Firebase/firebase-integration";
import {
  createBackground,
  levelSelectBgDrawing,
  createLevelObject,
  getdefaultCloudBtnsPos,
  loadLevelImages
} from "@compositions";
import {
  PreviousPlayedLevel,
  LEVEL_SELECTION_BACKGROUND,
  NEXT_BTN_IMG,
  BACK_BTN_IMG,
  AUDIO_INTRO,
} from "@constants";
import { LevelBloonButton } from '@buttons';

export class LevelSelectionScreen {
  private canvas: HTMLCanvasElement;
  private data: any;
  public width: number;
  public height: number;
  private canvasElement: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private levels: any;
  private gameLevelData: any;
  public callBack: Function;
  private audioPlayer: AudioPlayer;
  private images: object;
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
  private rightBtnSize: any;
  private rightBtnX: number;
  private rightBtnY: any;
  private leftBtnSize: number;
  private leftBtnX: number;
  private leftBtnY: number;
  private levelButtons: any

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
    this.levels = [];
    this.firebaseIntegration = new FirebaseIntegration();
    this.init();
    this.canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvasElement.getContext("2d");
    this.createLevelButtons();
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
    this.images = {
      nextbtn: NEXT_BTN_IMG,
      backbtn: BACK_BTN_IMG,
    };

    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
      if (document.visibilityState === "visible") {
        this.audioPlayer.playAudio(AUDIO_INTRO);
      }
    });

    this.addListeners();
    this.rightBtnSize = 10;
    this.rightBtnX = 0.73;
    this.rightBtnY = 1.3;
    this.leftBtnSize = 10;
    this.leftBtnX = 10;
    this.leftBtnY = 1.3;
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

  private async createLevelButtons() {
    const images = await loadLevelImages();
    const poss = getdefaultCloudBtnsPos(this.canvas);
    const levelsArr = poss[0].map((coordinates, index) => {
      return createLevelObject(
        coordinates[0],
        coordinates[1],
        index + 1,
        images
      );
    });
    this.levels = await Promise.all(levelsArr);
    this.levelButtons = this.levels.map(btnCoordinates => {
      return new LevelBloonButton(
        this.canvas,
        this.context,
        {...btnCoordinates},
      )
    });
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
      this.audioPlayer.playAudio(AUDIO_INTRO);
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
    event.preventDefault();
    let rect = document.getElementById("canvas").getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const isWithinButtonArea = (btnX, btnY = 1.3) => {
      return (
        x >= btnX &&
        x < btnX + this.canvas.height / 10 &&
        y > this.canvas.height / btnY &&
        y < this.canvas.height / btnY + this.canvas.height / 10
      );
    };
    const isRight = isWithinButtonArea(this.canvas.width * 0.7);
    const isLeft = isWithinButtonArea(this.canvas.width / 10);

    if (isLeft || isRight) {
      const pageIndex = this.levelSelectionPageIndex;
      if (isRight && pageIndex != this.levelsSectionCount * 10 - 10) {
        this.audioPlayer.playButtonClickSound();
        this.levelSelectionPageIndex = pageIndex + 10;
        this.rightBtnSize = 10.5;
        this.rightBtnY = 1.299;
      } else if (isLeft && pageIndex != 0) {
        this.audioPlayer.playButtonClickSound();
        this.levelSelectionPageIndex = pageIndex - 10;
        this.leftBtnSize = 10.3;
        this.leftBtnY = 1.299;
      }
      this.downButton(this.levelSelectionPageIndex);
    }

    for(let btn of this.levelButtons) {
      btn.onClick(
        x,
        y,
        this.levelSelectionPageIndex - 1,
        this.unlockLevelIndex + 1,
        (index) => {
          this.audioPlayer.playButtonClickSound();
          this.levelNumber = index + this.levelSelectionPageIndex - 1;
          this.startGame(this.levelNumber);
        }
      )
    }
  };

  private drawLevel(levelBtn: any, gameLevelData: []) {
    const currentLevelIndex = levelBtn.levelData.index + this.levelSelectionPageIndex;
    const currentLevel = currentLevelIndex - 1;

    const nextLevelPlay = this.unlockLevelIndex + 1;

    if (nextLevelPlay === currentLevel) {
      levelBtn.applyPulseEffect();
    }

    if (currentLevelIndex <= this.data.levels.length) {
      this.checkUnlockedLevel(gameLevelData);
      levelBtn.draw(
        this.levelSelectionPageIndex,
        this.unlockLevelIndex,
        gameLevelData,
        this.data.levels.length
      );

      Debugger.DebugMode
        ? this.context.fillText(
            this.data.levels[currentLevelIndex - 1]
              .levelMeta.levelType,
            levelBtn.levelData.x + levelBtn.btnSize / 3.5,
            levelBtn.levelData.y + levelBtn.btnSize / 1.3
          )
        : null;
    }
  }
  private draw() {
    for (let levelBtn of this.levelButtons) {
      this.drawLevel(
        levelBtn,
        this.gameLevelData
      );
    }
  }

  private downButton(level: number) {
    if (level != this.levelsSectionCount * 10 - 10) {
      this.context.drawImage(
        this.loadedImages.nextbtn,
        this.canvas.width * this.rightBtnX,
        this.canvas.height / this.rightBtnY,
        this.canvas.height / this.rightBtnSize,
        this.canvas.height / this.rightBtnSize
      );
      if (this.rightBtnSize > 10) {
        this.rightBtnSize = this.rightBtnSize - 0.025;
      }
      this.rightBtnY = this.rightBtnSize > 10 ? 1.299 : 1.3;
    } else {
      this.rightBtnSize = 10;
      this.rightBtnX = 0.7;
      this.rightBtnY = 1.3;
    }

    if (level != 0) {
      this.context.drawImage(
        this.loadedImages.backbtn,
        this.canvas.width / this.leftBtnX,
        this.canvas.height / this.leftBtnY,
        this.canvas.height / this.leftBtnSize,
        this.canvas.height / this.leftBtnSize
      );
      if (this.leftBtnSize > 10) {
        this.leftBtnSize = this.leftBtnSize - 0.025;
      }
      this.leftBtnY = this.leftBtnSize > 10 ? 1.299 : 1.3;
    } else {
      this.leftBtnSize = 10;
      this.leftBtnX = 10;
      this.leftBtnY = 1.3;
    }
  }

  checkUnlockedLevel(gameLevelData) {
    if (gameLevelData.length != undefined) {
        for (let game of gameLevelData) {
          if (this.unlockLevelIndex < parseInt(game.levelNumber)) {
            game.starCount >= 2
              ? (this.unlockLevelIndex = parseInt(game.levelNumber))
              : null;
          }
        }
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
    }
  }
  public dispose() {
    this.audioPlayer.stopAllAudios();
    document
      .getElementById("canvas")
      .removeEventListener("mousedown", this.handleMouseDown, false);

    // when app goes background #2
    document.removeEventListener(
      "visibilitychange",
      this.pausePlayAudios,
      false
    );

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
