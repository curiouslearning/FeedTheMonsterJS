import {
  Debugger,
  lang,
  pseudoId,
  loadImages,
} from "@common";
import { AudioPlayer } from "@components";
import { getData, GameScore } from "@data";
import { AnalyticsIntegration, AnalyticsEventType } from "../analytics/analytics-integration";
import {
  createBackground,
  levelSelectBgDrawing,
  createLevelObject,
  getdefaultCloudBtnsPos,
  loadLevelImages
} from "@compositions"; // to be removed once background component has been fully used
import {
  PreviousPlayedLevel,
  LEVEL_SELECTION_BACKGROUND,
  NEXT_BTN_IMG,
  BACK_BTN_IMG,
  AUDIO_INTRO,
  SCENE_NAME_GAME_PLAY,
  MIN_STARS_TO_COMPLETE_LEVEL,
} from "@constants";
import { LevelBloonButton } from '@buttons';
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';

export class LevelSelectionScreen {
  private canvas: HTMLCanvasElement;
  private data: any;
  public width: number;
  public height: number;
  private context: CanvasRenderingContext2D;
  private levels: any;
  private gameLevelData: any;
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
  private analyticsIntegration: AnalyticsIntegration;
  public background: any;
  private rightBtnSize: any;
  private rightBtnX: number;
  private rightBtnY: any;
  private leftBtnSize: number;
  private leftBtnX: number;
  private leftBtnY: number;
  private levelButtons: any
  public riveMonsterElement: HTMLCanvasElement;

  constructor() {
    const {
      canvasElem,
      canvasWidth,
      canvasHeight,
      context
    } = gameSettingsService.getCanvasSizeValues();
    this.canvas = canvasElem;
    this.width = canvasWidth > 1024 ? 500 : canvasWidth;
    this.height = canvasHeight;
    this.context = context;

    this.data = gameStateService.getFTMData();
    let self = this;
    this.levelsSectionCount =
      self.data.levels.length / 10 > Math.floor(self.data.levels.length / 10)
        ? Math.floor(self.data.levels.length / 10) + 1
        : Math.floor(self.data.levels.length / 10);
    this.levels = [];
    this.analyticsIntegration = AnalyticsIntegration.getInstance();
    this.init();
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
    // console.log('Level Selection Assets: ', { images })
    const poss = getdefaultCloudBtnsPos(this.canvas);
    const totalLevels = this.data.levels.length;
    const buttonsPerPage = 10;
    const remainingButtons = Math.max(0, totalLevels - this.levelSelectionPageIndex);
    const buttonsToCreate = Math.min(buttonsPerPage, remainingButtons);

    // Only take the positions we need for this page
    const positions = poss[0].slice(0, buttonsToCreate);

    const levelsArr = positions.map((coordinates, index) => {
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
        { ...btnCoordinates }
      );
    });
  }

  private async updatePage(newPageIndex: number) {
    this.levelSelectionPageIndex = newPageIndex;
    await this.createLevelButtons(); // Recreate buttons for new page
    this.downButton(this.levelSelectionPageIndex);
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
          this.updatePage(this.levelSelectionPageIndex + 10);
        }
        /* right swipe */
      } else {
        if (this.levelSelectionPageIndex != 0) {
          this.updatePage(this.levelSelectionPageIndex - 10);
        }
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
        this.updatePage(pageIndex + 10);
        this.rightBtnSize = 10.5;
        this.rightBtnY = 1.299;
      } else if (isLeft && pageIndex != 0) {
        this.audioPlayer.playButtonClickSound();
        this.updatePage(pageIndex - 10);
        this.leftBtnSize = 10.3;
        this.leftBtnY = 1.299;
      }
    }

    for (let btn of this.levelButtons) {
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

  /**
   * Checks if a level is considered completed based on star count.
   * A level is completed when the player has earned 3 or more stars.
   * Used to determine if the level button should show the pulse effect,
   * as incomplete levels need to draw player's attention.
   * @param levelNumber - The level to check completion status for
   * @param gameLevelData - Array of level data containing star counts
   * @returns true if level has 3+ stars, false otherwise
   */
  private isLevelCompleted(levelNumber: number, gameLevelData: any[]): boolean {  
    const levelInfo = gameLevelData.find(level => level.levelNumber === levelNumber);
    return (levelInfo?.starCount || 0) >= MIN_STARS_TO_COMPLETE_LEVEL;
  }

  private drawLevel(levelBtn: any, gameLevelData: []) {
    const currentLevelIndex = levelBtn.levelData.index + this.levelSelectionPageIndex;
    const currentLevel = currentLevelIndex - 1;
    const nextLevelPlay = this.unlockLevelIndex + 1;

    if (nextLevelPlay === currentLevel && !this.isLevelCompleted(currentLevel, gameLevelData)) {
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
  private drawLevelSelection() {
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
          game.starCount >= MIN_STARS_TO_COMPLETE_LEVEL
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
    gameStateService.publish(gameStateService.EVENTS.GAMEPLAY_DATA_EVENT, gamePlayData);
    this.logSelectedLevelEvent();
    gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_GAME_PLAY);
  }
  public logSelectedLevelEvent() {
    this.analyticsIntegration.track(
      AnalyticsEventType.SELECTED_LEVEL,
      {
        json_version_number: !!this.majVersion && !!this.minVersion
          ? `${this.majVersion}.${this.minVersion}`
          : "",
        level_selected: this.levelNumber,
      }
    );
  }
  public draw() {
    if (this.imagesLoaded) {
      this.background?.draw();
      this.drawLevelSelection();
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