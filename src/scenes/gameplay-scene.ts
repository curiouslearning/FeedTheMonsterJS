import {
  Monster,
  TimerTicking,
  PromptText,
  PauseButton,
  LevelIndicators,
  StoneHandler,
  Tutorial,
  Background,
  FeedbackTextEffects,
  AudioPlayer,
  TrailEffect,
} from "@components";
import PausePopUp from "@popups/pause-popup";
import {
  loadImages,
  StoneConfig,
  CLICK,
  LOADPUZZLE,
  MOUSEDOWN,
  MOUSEMOVE,
  MOUSEUP,
  STONEDROP,
  TOUCHEND,
  TOUCHMOVE,
  TOUCHSTART,
  VISIBILITY_CHANGE,
  Debugger,
  lang,
  pseudoId,
} from "@common";
import { GameScore } from "@data";
import {
  LevelCompletedEvent,
  PuzzleCompletedEvent,
} from "../Firebase/firebase-event-interface";
import { FirebaseIntegration } from "../Firebase/firebase-integration";
import {
  AUDIO_PATH_ON_DRAG,
  ASSETS_PATH_MONSTER_IDLE,
  PreviousPlayedLevel,
} from "@constants";
import {
  BACKGROUND_ASSET_LIST,
  createBackground,
  loadDynamicBgAssets,
} from "@compositions";
import { WordPuzzleLogic } from '@gamepuzzles';

export class GameplayScene {
  public width: number;
  public height: number;
  public monster: Monster;
  public jsonVersionNumber: string;
  public canvas: HTMLCanvasElement;
  public levelData: any;
  public timerTicking: TimerTicking;
  public promptText: PromptText;
  public pauseButton: PauseButton;
  public tutorial: Tutorial;
  public puzzleData: any;
  public id: string;
  public context: CanvasRenderingContext2D;
  public levelIndicators: LevelIndicators;
  public stonesCount: number = 1;
  public monsterPhaseNumber: number;
  public pickedStone: StoneConfig;
  public puzzleStartTime: number;
  public showTutorial: boolean;
  public feedBackTexts: any;
  public isPuzzleCompleted: boolean;
  public rightToLeft: boolean;
  public imagesLoaded: boolean = false;
  public switchSceneToEnd: Function;
  public levelNumber: Function;
  loadedImages: any;
  stoneHandler: StoneHandler;
  public counter: number = 0;
  images: {
    profileMonster: string;
  };
  handler: HTMLElement;
  pickedStoneObject: StoneConfig;
  pausePopup: PausePopUp;
  isPauseButtonClicked: boolean = false;
  public background: Background;
  feedBackTextCanavsElement: HTMLCanvasElement;
  feedbackTextEffects: FeedbackTextEffects;
  public isGameStarted: boolean = false;
  public time: number = 0;
  public score: number = 0;
  public switchToLevelSelection: Function;
  public reloadScene: Function;
  audioPlayer: AudioPlayer;
  firebaseIntegration: FirebaseIntegration;
  startTime: number;
  puzzleTime: number;
  isDisposing: boolean;
  resetAnimationID: number | NodeJS.Timeout;
  trailParticles: any;
  clickTrailToggle: boolean;
  hasFed: boolean;
  wordPuzzleLogic:any;

  constructor(
    canvas,
    levelData,
    monsterPhaseNumber,
    feedBackTexts,
    rightToLeft,
    switchSceneToEnd,
    levelNumber,
    switchToLevelSelection,
    reloadScene,
    jsonVersionNumber,
    feedbackAudios
  ) {
    console.log("gameplay loaded");
    this.width = canvas.width;
    this.height = canvas.height;
    this.rightToLeft = rightToLeft;
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
    this.trailParticles = new TrailEffect(canvas);
    this.monsterPhaseNumber = monsterPhaseNumber || 1;
    this.levelData = levelData;
    this.switchSceneToEnd = switchSceneToEnd;
    this.levelNumber = levelNumber;
    this.switchToLevelSelection = switchToLevelSelection;
    this.reloadScene = reloadScene;
    this.jsonVersionNumber = jsonVersionNumber;
    this.startGameTime();
    this.startPuzzleTime();
    this.isDisposing = false;
    this.pauseButton = new PauseButton(this.context, this.canvas);
    this.timerTicking = new TimerTicking(
      this.width,
      this.height,
      this.loadPuzzle
    );
    this.stoneHandler = new StoneHandler(
      this.context,
      this.canvas,
      this.counter,
      this.levelData,
      feedbackAudios,
      this.timerTicking
    );
    this.tutorial = new Tutorial(this.context, canvas.width, canvas.height);

    this.promptText = new PromptText(
      this.width,
      this.height,
      this.levelData.puzzles[this.counter],
      this.levelData,
      this.rightToLeft
    );

    this.levelIndicators = new LevelIndicators(this.context, this.canvas, 0);

    this.levelIndicators.setIndicators(this.counter);
    this.monster = new Monster(this.canvas, this.monsterPhaseNumber);

    this.pausePopup = new PausePopUp(
      this.canvas,
      this.resumeGame,
      this.switchToLevelSelection,
      this.reloadScene,
      {
        currentLevelData: levelData,
        selectedLevelNumber: levelNumber,
      }
    );
    this.firebaseIntegration = new FirebaseIntegration();

    this.feedbackTextEffects = new FeedbackTextEffects();

    this.audioPlayer = new AudioPlayer();
    this.handler = document.getElementById("canvas");
    this.puzzleData = levelData.puzzles;
    this.feedBackTexts = feedBackTexts;

    this.images = {
      profileMonster: ASSETS_PATH_MONSTER_IDLE,
    };

    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
    });
    var previousPlayedLevel: string = this.levelData.levelMeta.levelNumber;
    Debugger.DebugMode
      ? localStorage.setItem(
          PreviousPlayedLevel + lang + "Debug",
          previousPlayedLevel
        )
      : localStorage.setItem(PreviousPlayedLevel + lang, previousPlayedLevel);
    this.addEventListeners();
    this.resetAnimationID = 0;
    this.setupBg();
    this.trailParticles?.init();
    this.clickTrailToggle = false;
    this.hasFed = false;

    this.wordPuzzleLogic = new WordPuzzleLogic(levelData, this.counter);
  }

  private setupBg = async () => {
    const { BG_GROUP_IMGS, draw } = loadDynamicBgAssets(
      this.levelData.levelNumber,
      BACKGROUND_ASSET_LIST
    );
    this.background = await createBackground(
      this.context,
      this.width,
      this.height,
      BG_GROUP_IMGS,
      draw
    );
  };

  resumeGame = () => {
    this.addEventListeners();
    this.isPauseButtonClicked = false;
    this.stoneHandler.setGamePause(false);
    this.pausePopup.dispose();
  };

  getRandomFeedBackText(randomIndex: number): string {
    const keys = Object.keys(this.feedBackTexts);
    const selectedKey = keys[randomIndex];
    return this.feedBackTexts[selectedKey] as string;
  }

  getRandomInt(min: number, max: number): number {
    const feedbackValues = Object.values(this.feedBackTexts);
    const definedValuesMaxCount =
      feedbackValues.filter((value) => value != undefined).length - 1;
    return Math.floor(Math.random() * (definedValuesMaxCount - min + 1)) + min;
  }

  handleMouseUp = (event) => {
    // Remove unnecessary logging
    let rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if the click is within range of the monster
    const distance = Math.sqrt(
      (x - this.monster.x - this.canvas.width / 4) ** 2 +
        (y - this.monster.y - this.canvas.height / 2.2) ** 2
    );

    if (distance <= 100 && this.pickedStone) {
      const { text } = this.pickedStone; // Use destructuring for clarity

      switch (this.levelData.levelMeta.levelType) {
        case "LetterOnly":
        case "LetterInWord":
          this.letterPuzzle(text);
          break;
        case "Word":
        case "SoundWord":
          this.wordPuzzle(this.pickedStone);
          break;
      }
    } else {
      /*
        Note: TO DO: Should use stone-handler.ts method resetStonePosition.
      */
      if (
        this.pickedStone &&
        this.pickedStoneObject &&
        this.pickedStone.text &&
        typeof this.pickedStoneObject.origx === "number" &&
        typeof this.pickedStoneObject.origy === "number"
      ) {
        const xLimit = 50;
        const halfWidth = this.width / 2;
        this.pickedStone.x =
          this.pickedStone.text.length <= 3 &&
          this.pickedStoneObject.origx < xLimit &&
          this.pickedStoneObject.origx < halfWidth
            ? this.pickedStoneObject.origx + 25
            : this.pickedStoneObject.origx;
        this.pickedStone.y = this.pickedStoneObject.origy;
      }
    }
    this.pickedStone = null;
    this.wordPuzzleLogic.clearPickedUp();
    this.clickTrailToggle = false;
  };

  // Event to identify mouse moved down on the canvas
  handleMouseDown = (event) => {
    let rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (!this.wordPuzzleLogic.checkIsWordPuzzle()) {
      /*To Do: Move all logic relating to stone handling including updating its coordnates to stone-handler.ts
        Note: Will have to eventually remove this and use the handlePickStoneUp in stone-handler.ts
        Will leave this for now to avoid affecting Letter Only puzzles with Word play puzzles implementation of multi-letter feature.
      */
      for (let sc of this.stoneHandler.foilStones) {
        const distance = Math.sqrt((x - sc.x) ** 2 + (y - sc.y) ** 2);
        if (distance <= 40) {
          this.pickedStoneObject = sc;
          this.pickedStone = sc;
          this.audioPlayer.playAudio(AUDIO_PATH_ON_DRAG);
          break;
        }
      }
    } else {
      this.setPickedUp(x,y);
    }

    this.clickTrailToggle = true;
  };

  setPickedUp(x,y) {
    const stoneLetter = this.stoneHandler.handlePickStoneUp(x,y);

    if (stoneLetter) {
      this.pickedStoneObject = stoneLetter;
      this.pickedStone = stoneLetter;
      this.audioPlayer.playAudio(AUDIO_PATH_ON_DRAG);

      if (this.levelData?.levelMeta?.levelType === 'Word') {
        this.wordPuzzleLogic.setPickUpLetter(
          stoneLetter?.text,
          stoneLetter?.foilStoneIndex
        );
      }
    }
  }

  handleMouseMove = (event) => {
    let trailX = event.clientX;
    let trailY = event.clientY

    if (this.pickedStone) {
      if (!this.wordPuzzleLogic.checkIsWordPuzzle()) {
         /*To Do: Move all logic relating to stone handling including updating its coordnates to stone-handler.ts
          Note: Will have to eventually remove this and use the handleMovingStoneLetter in stone-handler.ts
          Will leave this for now to avoid affecting Letter Only puzzles with Word play puzzles implementation of multi-letter feature.
        */
        let rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.monster.changeToDragAnimation();
        this.pickedStone.x = x;
        this.pickedStone.y = y;
        trailX = x;
        trailY = y;
      } else {
        const newStoneCoordinates = this.stoneHandler.handleMovingStoneLetter(
          this.pickedStone,
          event.clientX,
          event.clientY
        );
        this.pickedStone = newStoneCoordinates;
        trailX = newStoneCoordinates.x;
        trailY = newStoneCoordinates.y;

        if (this.wordPuzzleLogic.checkIsWordPuzzle()) {
          const newStoneLetter = this.stoneHandler.handleHoveringToAnotherStone(
            trailX,
            trailY,
            (foilStoneText, foilStoneIndex) => {
              return this.wordPuzzleLogic.handleCheckHoveredStone(foilStoneText, foilStoneIndex);
            }
          );

          if (newStoneLetter) {
            this.wordPuzzleLogic.setPickUpLetter(
              newStoneLetter?.text,
              newStoneLetter?.foilStoneIndex
            );

            this.pickedStone = this.stoneHandler.resetStonePosition(
              this.width,
              this.pickedStone,
              this.pickedStoneObject
            );
            //After resetting its original position replace it with the new letter.
            this.pickedStoneObject = newStoneLetter;
            this.pickedStone = newStoneLetter;
          }
        }
      }

      this.monster.changeToDragAnimation();
    }

    this.clickTrailToggle &&
    this.trailParticles?.addTrailParticlesOnMove(
      trailX,
      trailY
    );
  };

  handleMouseClick = (event) => {
    let rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.monster.onClick(x, y)) {
      this.isGameStarted = true;
      this.time = 0;
      this.tutorial.setPlayMonsterClickAnimation(false);
    }

    if (this.pauseButton.onClick(x, y)) {
      this.audioPlayer.playButtonClickSound();
      this.pauseGamePlay();
    }

    if (this.promptText.onClick(x, y)) {
      this.promptText.playSound();
    }
  };

  // Event to identify touch on the canvas
  handleTouchStart = (event) => {
    const touch = event.touches[0];
    this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    this.trailParticles?.resetParticles();
  };

  handleTouchMove = (event) => {
    const touch = event.touches[0];
    this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    this.trailParticles?.addTrailParticlesOnMove(touch.clientX, touch.clientY);
  };

  handleTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
    if(!this.hasFed) {
      this.monster.changeToIdleAnimation();
    }
    this.trailParticles?.resetParticles();
  };

  draw(deltaTime: number) {
    if (!this.isGameStarted && !this.isPauseButtonClicked) {
      this.time = this.time + deltaTime;
      if (this.time >= 5000) {
        this.isGameStarted = true;
        this.time = 0;
        this.tutorial.setPlayMonsterClickAnimation(false);
      }
    }
    if (this.imagesLoaded) {
      this.background?.draw();
    }
    this.pauseButton.draw();
    this.levelIndicators.draw();
    this.promptText.draw(deltaTime);
    this.monster.update(deltaTime);
    this.timerTicking.draw();
    this.trailParticles?.draw();
    if (this.isPauseButtonClicked && this.isGameStarted) {
      this.handleStoneLetterDrawing(deltaTime);

      this.pausePopup.draw();
    }
    if (!this.isPauseButtonClicked && !this.isGameStarted) {
      this.counter == 0
        ? this.tutorial.clickOnMonsterTutorial(deltaTime)
        : undefined;
    }
    if (this.isPauseButtonClicked && !this.isGameStarted) {
      this.pausePopup.draw();
    }
    if (!this.isPauseButtonClicked && this.isGameStarted) {
      this.handleStoneLetterDrawing(deltaTime);
    }
  }

  private handleStoneLetterDrawing(deltaTime) {
    if (this.wordPuzzleLogic.checkIsWordPuzzle()) {
      const { groupedObj } = this.wordPuzzleLogic.getValues();
      this.stoneHandler.drawWordPuzzleLetters(
        deltaTime,
        (foilStoneIndex) => {
          return this.wordPuzzleLogic.validateShouldHideLetter(foilStoneIndex);
        },
        groupedObj
      );
    } else {
      this.stoneHandler.draw(deltaTime);
    }
  }

  addEventListeners() {
    this.handler.addEventListener(MOUSEUP, this.handleMouseUp, false);
    this.handler.addEventListener(MOUSEMOVE, this.handleMouseMove, false);
    this.handler.addEventListener(MOUSEDOWN, this.handleMouseDown, false);

    this.handler.addEventListener(TOUCHSTART, this.handleTouchStart, false);
    this.handler.addEventListener(TOUCHMOVE, this.handleTouchMove, false);
    this.handler.addEventListener(TOUCHEND, this.handleTouchEnd, false);
    this.handler.addEventListener(CLICK, this.handleMouseClick, false);
    document.addEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
  }

  removeEventListeners() {
    // Remove event listeners using the defined functions
    this.handler.removeEventListener(CLICK, this.handleMouseClick, false);
    this.handler.removeEventListener("mouseup", this.handleMouseUp, false);
    this.handler.removeEventListener("mousemove", this.handleMouseMove, false);
    this.handler.removeEventListener("mousedown", this.handleMouseDown, false);
    this.handler.removeEventListener(
      "touchstart",
      this.handleTouchStart,
      false
    );
    this.handler.removeEventListener("touchmove", this.handleTouchMove, false);
    this.handler.removeEventListener("touchend", this.handleTouchEnd, false);
  }

  loadPuzzle = (isTimerEnded?) => {
    this.removeEventListeners();

    this.stonesCount = 1;
    const timerEnded = Boolean(isTimerEnded);
    if (timerEnded) {
      this.logPuzzleEndFirebaseEvent(false);
    }
    this.counter += 1; //increment Puzzle
    this.isGameStarted = false;

    if (this.counter === this.levelData.puzzles.length) {
      this.levelIndicators.setIndicators(this.counter);
      this.logLevelEndFirebaseEvent();
      GameScore.setGameLevelScore(this.levelData, this.score);
      this.switchSceneToEnd(
        GameScore.calculateStarCount(this.score),
        this.monsterPhaseNumber,
        this.levelNumber,
        timerEnded
      );
    } else {
      const loadPuzzleEvent = new CustomEvent(LOADPUZZLE, {
        detail: {
          counter: this.counter,
        },
      });
      setTimeout(
        () => {
          if (!this.isDisposing) {
            this.initNewPuzzle(loadPuzzleEvent);
          }
        },
        timerEnded ? 0 : 4500
      );
    }
  };

  public dispose = () => {
    this.isDisposing = true;
    this.audioPlayer.stopAllAudios();
    this.monster.dispose();
    this.timerTicking.dispose();
    this.levelIndicators.dispose();
    this.stoneHandler.dispose();
    this.promptText.dispose();
    document.removeEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
    this.removeEventListeners();
  };

  private checkStoneDropped(stone, feedBackIndex, isWord = false) {
    this.hasFed = true; //To prevent idle animation from firing when stone is dropped.
    return this.stoneHandler.isStoneLetterDropCorrect(
      stone,
      feedBackIndex,
      isWord
    );
  }

  public letterPuzzle(droppedStone: string) {
    const feedBackIndex = this.getRandomInt(0, 1);
    const isCorrect = this.checkStoneDropped(
      droppedStone,
      feedBackIndex
    );
    if (isCorrect) {
      this.handleCorrectStoneDrop(feedBackIndex);
    }
    this.handleStoneDropEnd(isCorrect);
  }

  public wordPuzzle(droppedStoneInstance: StoneConfig) {
    this.audioPlayer.stopFeedbackAudio();
    droppedStoneInstance.x = -999;
    droppedStoneInstance.y = -999;
    const feedBackIndex = this.getRandomInt(0, 1);
    this.hasFed = true;
    this.wordPuzzleLogic.setGroupToDropped();
    const { droppedLetters } = this.wordPuzzleLogic.getValues();
    const isCorrect = this.wordPuzzleLogic.validateFedLetters();

    this.stoneHandler.processLetterDropFeedbackAudio(
      feedBackIndex,
      isCorrect,
      true,
      droppedLetters
    );

    if (isCorrect) {
      if (this.wordPuzzleLogic.validateWordPuzzle()) {
        this.handleCorrectStoneDrop(feedBackIndex);
        this.handleStoneDropEnd(isCorrect, "Word");
        this.stonesCount = 1;
        return;
      }

      this.timerTicking.startTimer();
      this.monster.changeToEatAnimation();
      this.promptText.droppedStoneIndex(
        lang == "arabic"
        ? this.stonesCount
        : droppedLetters.length
      );
      this.stonesCount++;
      this.resetToIdleAnimation(() => {
        this.monster.changeToIdleAnimation();
        this.hasFed = false; //re-enables idle reset when stones are not fed.
      }, 2000);
    } else {
      this.handleStoneDropEnd(isCorrect, "Word");
      this.stonesCount = 1;
    }
  }

  resetToIdleAnimation(callback: () => void, delay: number) {
    if (this.resetAnimationID !== undefined) {
      clearTimeout(this.resetAnimationID);
    }

    this.resetAnimationID = setTimeout(callback, delay);
  }

  private handleStoneDropEnd(isCorrect, puzzleType: string | null = null) {
    this.logPuzzleEndFirebaseEvent(isCorrect, puzzleType);
    this.dispatchStoneDropEvent(isCorrect);
    this.loadPuzzle();
  }

  private handleCorrectStoneDrop = (feedbackIndex: number): void => {
    this.score += 100;
    this.feedbackTextEffects.wrapText(this.getRandomFeedBackText(feedbackIndex));
  };

  private dispatchStoneDropEvent(isCorrect: boolean): void {
    const dropStoneEvent = new CustomEvent(STONEDROP, {
      detail: { isCorrect: isCorrect },
    });

    document.dispatchEvent(dropStoneEvent);
  }

  private initNewPuzzle(loadPuzzleEvent) {
    this.removeEventListeners();
    this.isGameStarted = false;
    this.time = 0;
    this.wordPuzzleLogic.updatePuzzleLevel(loadPuzzleEvent?.detail?.counter);
    this.pickedStone = null;
    document.dispatchEvent(loadPuzzleEvent);
    this.addEventListeners();
    this.audioPlayer.stopAllAudios();
    this.startPuzzleTime();
    this.hasFed = false;
  }

  public logPuzzleEndFirebaseEvent(isCorrect: boolean, puzzleType?: string) {
    let endTime = Date.now();
    const { droppedLetters } = this.wordPuzzleLogic.getValues();
    const puzzleCompletedData: PuzzleCompletedEvent = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number: this.jsonVersionNumber,
      success_or_failure: isCorrect ? "success" : "failure",
      level_number: this.levelData.levelMeta.levelNumber,
      puzzle_number: this.counter,
      item_selected:
        puzzleType == "Word"
          ? droppedLetters == null ||
            droppedLetters == undefined
            ? "TIMEOUT"
            : droppedLetters
          : this.pickedStone == null || this.pickedStone == undefined
          ? "TIMEOUT"
          : this.pickedStone?.text,
      target: this.stoneHandler.getCorrectTargetStone(),
      foils: this.stoneHandler.getFoilStones(),
      response_time: (endTime - this.puzzleTime) / 1000,
    };
    this.firebaseIntegration.sendPuzzleCompletedEvent(puzzleCompletedData);
  }

  public logLevelEndFirebaseEvent() {
    let endTime = Date.now();
    const levelCompletedData: LevelCompletedEvent = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number: this.jsonVersionNumber,
      success_or_failure:
        GameScore.calculateStarCount(this.score) >= 3 ? "success" : "failure",
      number_of_successful_puzzles: this.score / 100,
      level_number: this.levelData.levelMeta.levelNumber,
      duration: (endTime - this.startTime) / 1000,
    };
    this.firebaseIntegration.sendLevelCompletedEvent(levelCompletedData);
  }

  public startGameTime() {
    this.startTime = Date.now();
  }
  public startPuzzleTime() {
    this.puzzleTime = Date.now();
  }

  public pauseGamePlay = () => {
    this.removeEventListeners();
    this.isPauseButtonClicked = true;
    this.stoneHandler.setGamePause(true);
    this.pausePopup.addListner();
    this.audioPlayer.stopAllAudios();
  };

  handleVisibilityChange = () => {
    this.audioPlayer.stopAllAudios();
    this.pauseGamePlay();
  };
}