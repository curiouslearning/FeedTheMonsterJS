import { Monster } from "../components/monster";
import { TimerTicking } from "../components/timer-ticking";
import { PromptText } from "../components/prompt-text";
import PauseButton from "../components/buttons/pause-button";
import { LevelIndicators } from "../components/level-indicator";
import {
  loadImages,
  PreviousPlayedLevel,
} from "../common/common";
import { Debugger, lang, pseudoId } from "../../global-variables";
import StoneHandler from "../components/stone-handler";
import { Tutorial } from "../components/tutorial";
import { StoneConfig } from "../common/stone-config";
import PausePopUp from "../components/pause-popup";
import {
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
} from "../common/event-names";
import { Background } from "../components/background";
import { FeedbackTextEffects } from "../components/feedback-particle-effect/feedback-text-effects";
import { GameScore } from "../data/game-score";
import { AudioPlayer } from "../components/audio-player";
import {
  LevelCompletedEvent,
  PuzzleCompletedEvent,

} from "../Firebase/firebase-event-interface";
import { FirebaseIntegration } from "../Firebase/firebase-integration";


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
    pillerImg: string;
    bgImg: string;
    hillImg: string;
    fenchImg: string;
    profileMonster: string;
  };
  handler: HTMLElement;
  pickedStoneObject: StoneConfig;
  pausePopup: PausePopUp;
  isPauseButtonClicked: boolean = false;
  public background1: Background;
  feedBackTextCanavsElement: HTMLCanvasElement;
  feedbackTextEffects: FeedbackTextEffects;
  public isGameStarted: boolean = false;
  public time: number = 0;
  public score: number = 0;
  tempWordforWordPuzzle: string = "";

  public switchToLevelSelection: Function;
  public reloadScene: Function;
  audioPlayer: AudioPlayer;
  firebaseIntegration: FirebaseIntegration;
  startTime: number;
  puzzleTime: number;

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
    this.width = canvas.width;
    this.height = canvas.height;
    this.rightToLeft = rightToLeft;
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
    this.monsterPhaseNumber = monsterPhaseNumber || 1;
    this.levelData = levelData;
    this.switchSceneToEnd = switchSceneToEnd;
    this.levelNumber = levelNumber;
    this.switchToLevelSelection = switchToLevelSelection;
    this.reloadScene = reloadScene;
    this.jsonVersionNumber = jsonVersionNumber;
    this.startGameTime();
    this.startPuzzleTime();

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
    this.tutorial = new Tutorial(
      this.context,
      canvas.width,
      canvas.height
    );

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
    let gamePlayData = {
      currentLevelData: levelData,
      selectedLevelNumber: levelNumber,
    };
    this.pausePopup = new PausePopUp(
      this.canvas,
      this.resumeGame,
      this.switchToLevelSelection,
      this.reloadScene,
      gamePlayData
    );

    this.background1 = new Background(
      this.context,
      this.width,
      this.height,
      this.levelData.levelNumber
    );
    this.firebaseIntegration = new FirebaseIntegration();
    this.feedBackTextCanavsElement = document.getElementById(
      "feedback-text"
    ) as HTMLCanvasElement;
    this.feedBackTextCanavsElement.height = this.height;
    this.feedBackTextCanavsElement.width = this.width;

    this.feedbackTextEffects = new FeedbackTextEffects(
      this.feedBackTextCanavsElement.getContext("2d", { willReadFrequently: true }),
      this.width,
      this.height
    );

    this.audioPlayer = new AudioPlayer();
    this.handler = document.getElementById("canvas");
    this.puzzleData = levelData.puzzles;
    this.feedBackTexts = feedBackTexts;

    this.images = {
      pillerImg: "./assets/images/Totem_v02_v01.png",
      bgImg: "./assets/images/bg_v01.jpg",
      hillImg: "./assets/images/hill_v01.png",
      fenchImg: "./assets/images/fence_v01.png",
      profileMonster: "./assets/images/idle4.png",
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
  }

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
    const definedValuesMaxCount = (feedbackValues.filter(value => value != undefined).length) - 1;
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

    if (distance <= 100) {
      if (this.pickedStone) {
        console.log("Picked Stone:", this.pickedStone); // Debugging statement
        const { text } = this.pickedStone; // Use destructuring for clarity
        switch (this.levelData.levelMeta.levelType) {
          case "LetterOnly":
            this.letterOnlyPuzzle(text);
            break;
          case "LetterInWord":
            this.letterInWordPuzzle(text);
            break;
          case "Word":
          case "SoundWord":
            this.wordPuzzle(text, this.pickedStone);
            break;
        }
      }
    } else {
      if (this.pickedStone && this.pickedStoneObject) {
        if (this.pickedStone.text && typeof this.pickedStoneObject.origx === 'number' && typeof this.pickedStoneObject.origy === 'number') {
          const xLimit = 50;
          const halfWidth = this.width / 2;
          this.pickedStone.x = (this.pickedStone.text.length <= 3 && this.pickedStoneObject.origx < xLimit && this.pickedStoneObject.origx < halfWidth)
            ? this.pickedStoneObject.origx + 25
            : this.pickedStoneObject.origx;
          this.pickedStone.y = this.pickedStoneObject.origy;
        }
      }
    }
    this.pickedStone = null;
  };

  // Event to identify mouse moved down on the canvas
  handleMouseDown = (event) => {
    let rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let sc of this.stoneHandler.foilStones) {
      const distance = Math.sqrt((x - sc.x) ** 2 + (y - sc.y) ** 2);
      if (distance <= 40) {
        this.pickedStoneObject = sc;
        this.pickedStone = sc;
        this.audioPlayer.playAudio("./assets/audios/onDrag.mp3");
        break;
      }
    }
  };

  handleMouseMove = (event) => {
    if (this.pickedStone) {
      let rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.monster.changeToDragAnimation();
      this.pickedStone.x = x;
      this.pickedStone.y = y;
    }
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
      this.audioPlayer.playButtonClickSound("./assets/audios/ButtonClick.mp3");
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
  };

  handleTouchMove = (event) => {
    const touch = event.touches[0];
    this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  };

  handleTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
  };


  draw(deltaTime: number) {
    // console.log("draw");

    if (!this.isGameStarted && !this.isPauseButtonClicked) {
      this.time = this.time + deltaTime;
      if (this.time >= 5000) {
        this.isGameStarted = true;
        this.time = 0;
        this.tutorial.setPlayMonsterClickAnimation(false);
      }
    }

    if (this.imagesLoaded) {
      this.background1.draw();
    }

    if (this.isPauseButtonClicked && this.isGameStarted) {
      this.pauseButton.draw();
      this.levelIndicators.draw();
      this.promptText.draw(deltaTime);
      this.monster.update(deltaTime);
      this.timerTicking.draw();
      this.stoneHandler.draw(deltaTime);
      this.pausePopup.draw();
    }
    if (!this.isPauseButtonClicked && !this.isGameStarted) {
      this.pauseButton.draw();
      this.levelIndicators.draw();
      this.promptText.draw(deltaTime);
      this.monster.update(deltaTime);
      this.timerTicking.draw();
      this.feedbackTextEffects.render();
      (this.counter == 0) ? this.tutorial.clickOnMonsterTutorial(deltaTime) : undefined;
    }
    if (this.isPauseButtonClicked && !this.isGameStarted) {
      this.pauseButton.draw();
      this.levelIndicators.draw();
      this.promptText.draw(deltaTime);
      this.monster.update(deltaTime);
      this.timerTicking.draw();
      this.pausePopup.draw();
    }
    if (!this.isPauseButtonClicked && this.isGameStarted) {
      this.pauseButton.draw();
      this.levelIndicators.draw();
      this.promptText.draw(deltaTime);
      this.monster.update(deltaTime);
      // this.timerTicking.update(deltaTime);
      this.timerTicking.draw();
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

  loadPuzzle = (isTimerEnded?: boolean) => {
    this.stonesCount = 1;
    let timerEnded = isTimerEnded == undefined ? false : true;
    if (timerEnded) {
      this.logPuzzleEndFirebaseEvent(false);
    }
    this.removeEventListeners();
    this.incrementPuzzle();
    this.isGameStarted = false;

    if (this.counter == this.levelData.puzzles.length) {
      this.levelIndicators.setIndicators(this.counter);
      this.logLevelEndFirebaseEvent();
      GameScore.setGameLevelScore(this.levelData, this.score);
      this.switchSceneToEnd(
        this.levelData,
        GameScore.calculateStarCount(this.score),
        this.monsterPhaseNumber,
        this.levelNumber,
        timerEnded
      );
    } else {
      const loadPuzzleData = {
        counter: this.counter,
      };
      const loadPuzzleEvent = new CustomEvent(LOADPUZZLE, {
        detail: loadPuzzleData,
      });

      if (timerEnded) {
        // this.monster.changeToIdleAnimation();
        this.initNewPuzzle(loadPuzzleEvent);
      } else {
        setTimeout(() => {
          // this.changeToNextPuzzle();
          this.initNewPuzzle(loadPuzzleEvent);
        }, 4500);
      }
    }
  };

  public dispose = () => {
    this.audioPlayer.stopAllAudios();
    this.removeEventListeners();
    this.feedbackTextEffects.unregisterEventListener();
    this.monster.unregisterEventListener();
    this.timerTicking.unregisterEventListener();
    this.levelIndicators.unregisterEventListener();
    this.stoneHandler.unregisterEventListener();
    this.promptText.unregisterEventListener();
    document.removeEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
    // this.deleteComponentInstances();
  };

  public letterInWordPuzzle(droppedStone: string) {
    const feedBackIndex = this.getRandomInt(0, 1);
    const isCorrect = this.stoneHandler.isStoneDroppedCorrectForLetterInWord(
      droppedStone,
      feedBackIndex
    );
    if (isCorrect) {
      this.handleCorrectStoneDrop(feedBackIndex);
    }
    this.logPuzzleEndFirebaseEvent(isCorrect);
    this.dispatchStoneDropEvent(isCorrect);
    this.loadPuzzle();
  }

  public letterOnlyPuzzle(droppedStone: string) {
    const feedBackIndex = this.getRandomInt(0, 1);
    const isCorrect = this.stoneHandler.isStoneDroppedCorrectForLetterOnly(
      droppedStone,
      feedBackIndex
    );
    if (isCorrect) {
      this.handleCorrectStoneDrop(feedBackIndex);
    }
    this.logPuzzleEndFirebaseEvent(isCorrect);
    this.dispatchStoneDropEvent(isCorrect);
    this.loadPuzzle();
  }

  public wordPuzzle(droppedStone: string, droppedStoneInstance: StoneConfig) {
    this.audioPlayer.stopFeedbackAudio();
    droppedStoneInstance.x = -999;
    droppedStoneInstance.y = -999;
    const feedBackIndex = this.getRandomInt(0, 1);
    this.tempWordforWordPuzzle = this.tempWordforWordPuzzle + droppedStone;

    const isCorrect = this.stoneHandler.isStonDroppedCorrectForWord(
      this.tempWordforWordPuzzle,
      feedBackIndex
    );
    if (
      this.stoneHandler.getCorrectTargetStone() == this.tempWordforWordPuzzle &&
      isCorrect
    ) {
      this.handleCorrectStoneDrop(feedBackIndex);
      this.logPuzzleEndFirebaseEvent(isCorrect, "Word");
      this.dispatchStoneDropEvent(isCorrect);
      this.loadPuzzle();
      this.stonesCount = 1;
      return;
    }

    if (isCorrect) {
      this.timerTicking.startTimer();

      this.monster.changeToEatAnimation();
      lang == "arabic"
        ? this.promptText.droppedStoneIndex(this.stonesCount)
        : this.promptText.droppedStoneIndex(this.tempWordforWordPuzzle.length);
      this.stonesCount++;
      setTimeout(() => {
        this.monster.changeToIdleAnimation();
      }, 1500);
    } else {
      if (Math.round(Math.random()) > 0) {
        this.audioPlayer.playFeedbackAudios(false, "./assets/audios/Eat.mp3", "./assets/audios/Disapointed-05.mp3", "./assets/audios/MonsterSpit.mp3");
      } else {
        this.audioPlayer.playFeedbackAudios(false, "./assets/audios/Eat.mp3", "./assets/audios/MonsterSpit.mp3");
      }
      this.logPuzzleEndFirebaseEvent(isCorrect, "Word");
      this.dispatchStoneDropEvent(isCorrect);
      this.loadPuzzle();
      this.stonesCount = 1;
    }
  }

  private handleCorrectStoneDrop = (feedbackIndex: number): void => {
    this.score += 100;
    // console.log("handleCorrectStone->");
    // this.audioPlayer.playAudio(false, "./assets/audios/Eat.mp3","./assets/audios/Cheering-02.mp3", "./assets/audios/fantastic.WAV");
    // console.log(this.getRandomFeedBackText(feedbackIndex));
    this.feedbackTextEffects.wrapText(
      this.getRandomFeedBackText(feedbackIndex)
    );
    this.feedBackTextCanavsElement.style.zIndex = "2";
  };

  private dispatchStoneDropEvent(isCorrect: boolean): void {
    const loadPuzzleData = { isCorrect: isCorrect };
    const dropStoneEvent = new CustomEvent(STONEDROP, {
      detail: loadPuzzleData,
    });
    document.dispatchEvent(dropStoneEvent);
  }

  private initNewPuzzle(loadPuzzleEvent) {
    this.isGameStarted = false;
    this.time = 0;
    this.tempWordforWordPuzzle = "";
    this.pickedStone = null;
    this.feedbackTextEffects.clearParticle();
    this.feedBackTextCanavsElement.style.zIndex = "0";
    document.dispatchEvent(loadPuzzleEvent);
    this.addEventListeners();
    this.audioPlayer.stopAllAudios();
    this.startPuzzleTime();
  }

  private incrementPuzzle() {
    this.counter += 1;
  }

  public logPuzzleEndFirebaseEvent(isCorrect: boolean, puzzleType?: string) {
    let endTime = Date.now();
    const puzzleCompletedData: PuzzleCompletedEvent = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number: this.jsonVersionNumber,
      success_or_failure: isCorrect ? "success" : "failure",
      level_number: this.levelData.levelMeta.levelNumber,
      puzzle_number: this.counter,
      item_selected: puzzleType == "Word"
        ? (this.tempWordforWordPuzzle == null || this.tempWordforWordPuzzle == undefined) ? "TIMEOUT" : this.tempWordforWordPuzzle
        : (this.pickedStone == null || this.pickedStone == undefined) ? "TIMEOUT" : this.pickedStone?.text,
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
    this.isPauseButtonClicked = true;
    this.stoneHandler.setGamePause(true);
    this.removeEventListeners();
    this.pausePopup.addListner();
    this.audioPlayer.stopAllAudios();
  };

  handleVisibilityChange = () => {
    this.audioPlayer.stopAllAudios();
    this.pauseGamePlay();
  };
}