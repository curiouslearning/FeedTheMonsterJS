import { Monster } from "../components/monster";
import { TimerTicking } from "../components/timer-ticking";
import { PromptText } from "../components/prompt-text";
import PauseButton from "../components/buttons/pause-button";
import { LevelIndicators } from "../components/level-indicator";
import {
  loadImages,
  loadingScreen,
  PreviousPlayedLevel
} from "../common/common";
import Sound from "../common/sound";
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
import { LevelCompletedEvent, PuzzleCompletedEvent } from "../Firebase/firebase-event-interface";
import { FirebaseIntegration } from "../Firebase/firebase-integration";

var images = {
  bgImg: "./assets/images/bg_v01.jpg",
  hillImg: "./assets/images/hill_v01.png",
  timer_empty: "./assets/images/timer_empty.png",
  pillerImg: "./assets/images/Totem_v02_v01.png",
  grassImg: "./assets/images/FG_a_v01.png",
  rotating_clock: "./assets/images/timer.png",
  fenchImg: "./assets/images/fence_v01.png",
  promptImg: "./assets/images/promptTextBg.png",
  autumnBgImg: "./assets/images/Autumn_bg_v01.jpg",
  autumnHillImg: "./assets/images/Autumn_hill_v01.png",
  autumnSignImg: "./assets/images/Autumn_sign_v01.png",
  autumnGrassImg: "./assets/images/Autumn_FG_v01.png",
  autumnFenceImg: "./assets/images/Autumn_fence_v01.png",
  autumnPillerImg: "./assets/images/Autumn_sign_v01.png",
  winterBgImg: "./assets/images/Winter_bg_01.jpg",
  winterHillImg: "./assets/images/Winter_hill_v01.png",
  winterSignImg: "./assets/images/Winter_sign_v01.png",
  winterGrassImg: "./assets/images/Winter_FG_v01.png",
  winterFenceImg: "./assets/images/Winter_fence_v01.png",
  winterPillerImg: "./assets/images/Winter_sign_v01.png",
};


var stonesCount=1;

export class GameplayScene {
  public game: any;
  public width: number;
  public height: number;
  public monster: Monster;
  public jsonVersionNumber: string;
  public audio: Sound;
  public canvas: any;
  public levelData: any;
  public levelStartCallBack: any;
  public timerTicking: TimerTicking;
  public promptText: PromptText;
  public pauseButton: PauseButton;
  public puzzleData: any;
  public id: string;
  public canavsElement: any;
  public context: CanvasRenderingContext2D;
  public levelIndicators: LevelIndicators;
  public bgImg: any;
  public pillerImg: any;
  public fenchImg: any;
  public hillImg: any;
  public grassImg: any;
  public timer_empty: any;
  public rotating_clock: any;
  public monsterPhaseNumber: any;
  public levelStartTime: number;
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
  tutorial: Tutorial;
  images: {
    pillerImg: string;
    bgImg: string;
    hillImg: string;
    grassImg: string;
    fenchImg: string;
    profileMonster: string;
  };
  handler: HTMLElement;
  pickedStoneObject: any;
  pausePopup: PausePopUp;
  isPauseButtonClicked: boolean = false;
  public background1: Background;
  feedBackTextCanavsElement: HTMLCanvasElement;
  feedbackTextEffects: FeedbackTextEffects;
  public isGameStarted: boolean = false;
  public time: number = 0;
  public score: number = 0;
  tempWordforWordPuzzle: string = "";
  
  public switchToLevelSelection: any;
  public reloadScene: any;
  audioPlayer: AudioPlayer;
  firebaseIntegration: FirebaseIntegration;
  startTime: number;
  puzzleTime: number;

  constructor(
    canvas,
    // game,
    levelData,
    // levelStartCallBack,
    monsterPhaseNumber,
    feedBackTexts,
    rightToLeft,
    switchSceneToEnd,
    levelNumber,
    switchToLevelSelection,
    reloadScene,
    jsonVersionNumber,
    feedbackAudios,
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.rightToLeft = rightToLeft;
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.monsterPhaseNumber = monsterPhaseNumber || 1;
    this.levelData = levelData;
    this.switchSceneToEnd = switchSceneToEnd;
    this.levelNumber = levelNumber;
    this.switchToLevelSelection = switchToLevelSelection;
    this.reloadScene = reloadScene;
    this.jsonVersionNumber= jsonVersionNumber;
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
    this.feedBackTextCanavsElement = document.getElementById("feedback-text") as HTMLCanvasElement;
    this.feedBackTextCanavsElement.height = this.height;
    this.feedBackTextCanavsElement.width = this.width;

    this.feedbackTextEffects = new FeedbackTextEffects(
      this.feedBackTextCanavsElement.getContext("2d"),
      this.width,
      this.height
    );

    this.audioPlayer = new AudioPlayer();
    this.audioPlayer.stopAudio();
    this.handler = document.getElementById("canvas");
    this.puzzleData = levelData.puzzles;
    this.feedBackTexts = feedBackTexts;

    this.images = {
      pillerImg: "./assets/images/Totem_v02_v01.png",
      bgImg: "./assets/images/bg_v01.jpg",
      hillImg: "./assets/images/hill_v01.png",
      grassImg: "./assets/images/FG_a_v01.png",
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
    this.pausePopup.dispose();
  };

  getRandomFeedBackText(randomIndex) {
    const keys = Object.keys(this.feedBackTexts);
    const selectedKey = keys[randomIndex];
    return this.feedBackTexts[selectedKey];
  }
  getRandomInt(min: number, max: number) {
    if(Object.keys(this.feedBackTexts).length==1){
      return min;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  handleMouseUp = (event) => {
    console.log(" upping mouse like a pro ");
    let self = this;
    const selfElement = <HTMLElement>document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // event.preventDefault();
    if (
      Math.sqrt(
        (x - self.monster.x - self.canvas.width / 4) *
          (x - self.monster.x - self.canvas.width / 4) +
          (y - self.monster.y - self.canvas.height / 2.7) *
            (y - self.monster.y - self.canvas.height / 2.7)
      ) <= 60
    ) {
      if (this.pickedStone != null || this.pickedStone != null) {
        if (this.levelData.levelMeta.levelType == "LetterOnly") {
          this.letterOnlyPuzzle(this.pickedStone.text);
        }

        if (this.levelData.levelMeta.levelType == "LetterInWord") {
          this.letterInWordPuzzle(this.pickedStone.text);
        }

        if (this.levelData.levelMeta.levelType == "Word" || this.levelData.levelMeta.levelType == "SoundWord") {
          this.wordPuzzle(this.pickedStone.text, this.pickedStone);
        }
      }
    } else {
      if (this.pickedStoneObject != null) {
        this.pickedStone.x = this.pickedStoneObject.origx;
        this.pickedStone.y = this.pickedStoneObject.origy;
        this.monster.changeToIdleAnimation();
      }
    }
    this.pickedStone = null;
  };

  handleMouseDown = (event) => {
    let self = this;
    const selfElement = <HTMLElement>document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    for (let sc of self.stoneHandler.foilStones) {
      if (Math.sqrt((x - sc.x) * (x - sc.x) + (y - sc.y) * (y - sc.y)) <= 40) {
        console.log(" clickkedon stone", sc);
        this.pickedStoneObject = sc;
        this.pickedStone = sc;
        this.audioPlayer.playAudio(false, "./assets/audios/onDrag.mp3");
      }
    }
  };

  handleMouseMove = (event) => {
    let self = this;
    const selfElement = <HTMLElement>document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (self.pickedStone) {
      self.monster.changeToDragAnimation();
      self.pickedStone.x = x;
      self.pickedStone.y = y;
    }
  };

  handleMouseClick = (event) => {
    const selfElement = <HTMLElement>document.getElementById("canvas");
    event.preventDefault();
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.monster.onClick(x, y)) {
      this.isGameStarted = true;
      this.time = 0;
    }

    if (this.pauseButton.onClick(x, y)) {
      console.log(" pause button getting click from gameplay");
      this.audioPlayer.playAudio(false, "./assets/audios/ButtonClick.mp3");
      this.pauseGamePlay();
    }

    // send click to play prompt
    if (this.promptText.onClick(x, y)) {
      this.promptText.playSound();
      // this.audioPlayer.playAudio(false, this.promptText.getPromptAudioUrl());
    }
  };

  handleTouchStart = (event) => {
    var touch = event.touches[0];
    var mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    document.getElementById("canvas").dispatchEvent(mouseEvent);
  };

  handleTouchMove = (event) => {
    console.log("itstouchmove");
    var touch = event.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    document.getElementById("canvas").dispatchEvent(mouseEvent);
  };

  handleTouchEnd = (event) => {
    var touch = event.changedTouches[0];
    var mouseEvent = new MouseEvent("mouseup", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    document.getElementById("canvas").dispatchEvent(mouseEvent);
  };


  draw(deltaTime) {
    if (!this.isGameStarted && !this.isPauseButtonClicked) {
      this.time = this.time + deltaTime;
      if (this.time >= 5000) {
        this.isGameStarted = true;
        this.time = 0;
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
    document.addEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
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

  createBackgroud() {
    var self = this;
    const availableBackgroundTypes = ["Summer", "Autumn", "Winter"];
    var backgroundType =
      Math.floor(self.levelData.levelNumber / 10) %
      availableBackgroundTypes.length;
    if (self.levelData.levelNumber >= 30) {
      backgroundType = backgroundType % 3;
    }
    loadingScreen(true);
    var context = this.context;
    var width = this.width;
    var height = this.height;

    loadImages(images, function (image) {
      switch (availableBackgroundTypes[backgroundType]) {
        case "Winter":
          {
            context.drawImage(image.winterBgImg, 0, 0, width, height);
            context.drawImage(
              image.winterPillerImg,
              width * 0.38,
              height / 6,
              width / 1.2,
              height / 2
            );
            context.drawImage(
              image.winterFenceImg,
              -width * 0.4,
              height / 4,
              width,
              height / 2
            );
            context.drawImage(
              image.winterHillImg,
              -width * 0.25,
              height / 2,
              width * 1.5,
              height / 2
            );
            context.drawImage(
              image.winterGrassImg,
              -width * 0.25,
              height / 2 + (height / 2) * 0.1,
              width * 1.5,
              height / 2
            );
          }

          break;
        case "Autumn":
          {
            context.drawImage(image.autumnBgImg, 0, 0, width, height);
            context.drawImage(
              image.autumnPillerImg,
              width * 0.38,
              height / 6,
              width / 1.2,
              height / 2
            );
            context.drawImage(
              image.autumnFenceImg,
              -width * 0.4,
              height / 4,
              width,
              height / 2
            );
            context.drawImage(
              image.autumnHillImg,
              -width * 0.25,
              height / 2,
              width * 1.5,
              height / 2
            );
            context.drawImage(
              image.autumnGrassImg,
              -width * 0.25,
              height / 2 + (height / 2) * 0.1,
              width * 1.5,
              height / 2
            );
          }
          break;
        default:
          {
            context.drawImage(image.bgImg, 0, 0, width, height);
            context.drawImage(
              image.pillerImg,
              width * 0.6,
              height / 6,
              width,
              height / 2
            );
            context.drawImage(
              image.fenchImg,
              -width * 0.4,
              height / 3,
              width,
              height / 3
            );
            context.drawImage(
              image.hillImg,
              -width * 0.25,
              height / 2,
              width * 1.5,
              height / 2
            );
            context.drawImage(
              image.grassImg,
              -width * 0.25,
              height / 2 + (height / 2) * 0.1,
              width * 1.5,
              height / 2
            );
          }
          break;
      }
      context.drawImage(
        image.timer_empty,
        0,
        height * 0.1,
        width,
        height * 0.05
      );
      context.drawImage(
        image.rotating_clock,
        5,
        height * 0.09,
        width * 0.12,
        height * 0.06
      );
      // self.timerTicking.createBackgroud();
      // self.stones.draw(deltaTime);
      self.pauseButton.draw();
      self.levelIndicators.draw();
      // self.promptText.createBackground();
      loadingScreen(false);
      self.loadedImages = Object.assign({}, image);
      // self.allImagesLoaded = true;
    });
  }

  loadPuzzle = (isTimerEnded?:boolean) => {
    stonesCount=1;
    let timerEnded = (isTimerEnded == undefined)?false:true;
    if(timerEnded)
    {
      this.logPuzzleEndFirebaseEvent(false);
    }
    this.removeEventListeners();
    this.incrementPuzzle();
    this.isGameStarted = false;
    
    if (this.counter == this.levelData.puzzles.length ) {
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
    } 
    else {
      const loadPuzzleData = {
        counter: this.counter,
      };
      const loadPuzzleEvent = new CustomEvent(LOADPUZZLE, {
        detail: loadPuzzleData,
      });
     
      if(timerEnded)
      {
        // this.monster.changeToIdleAnimation();
        this.initNewPuzzle(loadPuzzleEvent);
       
      }
      else{
        setTimeout(() => {
            // this.changeToNextPuzzle();  
            this.initNewPuzzle(loadPuzzleEvent);
           
          }, 4000);
      }
    }
  };

  public dispose = () => {
    this.audioPlayer.stopAudio();
    this.removeEventListeners();
      this.feedbackTextEffects.unregisterEventListener();
      this.monster.unregisterEventListener();
      this.timerTicking.unregisterEventListener();
      this.levelIndicators.unregisterEventListener();
      this.stoneHandler.unregisterEventListener();
      this.promptText.unregisterEventListener();
      document.removeEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
      // this.deleteComponentInstances();
  }

  public letterInWordPuzzle(droppedStone: string) {
    const feedBackIndex = this.getRandomInt(0, 1);
    const isCorrect =
      this.stoneHandler.isStoneDroppedCorrectForLetterInWord(droppedStone,feedBackIndex);
    if (isCorrect) {
      this.handleCorrectStoneDrop(feedBackIndex);
    }
    this.logPuzzleEndFirebaseEvent(isCorrect);
    this.dispatchStoneDropEvent(isCorrect);
    this.loadPuzzle();
  }

  public letterOnlyPuzzle(droppedStone: string) {
    const feedBackIndex = this.getRandomInt(0, 1);
    const isCorrect =
      this.stoneHandler.isStoneDroppedCorrectForLetterOnly(droppedStone,feedBackIndex);
    if (isCorrect) {
     this.handleCorrectStoneDrop(feedBackIndex);
    }
    this.logPuzzleEndFirebaseEvent(isCorrect);
    this.dispatchStoneDropEvent(isCorrect);
    this.loadPuzzle();
  }
  
  public wordPuzzle(droppedStone: string, droppedStoneInstance: StoneConfig) {
    this.audioPlayer.stopAudio();
    droppedStoneInstance.x = -999;
    droppedStoneInstance.y = -999;
    const feedBackIndex = this.getRandomInt(0, 1);
    this.tempWordforWordPuzzle = this.tempWordforWordPuzzle + droppedStone;

    const isCorrect = this.stoneHandler.isStonDroppedCorrectForWord(
      this.tempWordforWordPuzzle,feedBackIndex
    );
    if (
      this.stoneHandler.getCorrectTargetStone() == this.tempWordforWordPuzzle &&
      isCorrect
    ) {
      this.handleCorrectStoneDrop(feedBackIndex);
      this.logPuzzleEndFirebaseEvent(isCorrect,'Word');
      this.dispatchStoneDropEvent(isCorrect);
      this.loadPuzzle();
      stonesCount=1;
      return;
    }
    
    if (isCorrect) {
    
      this.timerTicking.startTimer();
      
      this.monster.changeToEatAnimation();
      lang=="arabic" ? this.promptText.droppedStoneIndex(stonesCount) : this.promptText.droppedStoneIndex(this.tempWordforWordPuzzle.length);
       stonesCount++;
      setTimeout(() => {
        this.monster.changeToIdleAnimation();
      }, 1500);
    } else {
      
      this.audioPlayer.playAudio(false,'./assets/audios/MonsterSpit.mp3')
      this.logPuzzleEndFirebaseEvent(isCorrect,'Word');
      this.dispatchStoneDropEvent(isCorrect);
      this.loadPuzzle();
      stonesCount=1;
    }
  }

  private handleCorrectStoneDrop = (feedbackIndex: number): void => {
    this.score += 100;
    console.log('handleCorrectStone->');
    // this.audioPlayer.playAudio(false, "./assets/audios/Eat.mp3","./assets/audios/Cheering-02.mp3", "./assets/audios/fantastic.WAV");
    this.feedbackTextEffects.wrapText(this.getRandomFeedBackText(feedbackIndex));
    this.feedBackTextCanavsElement.style.zIndex = "2";
  }

  private dispatchStoneDropEvent(isCorrect: boolean): void {
    const loadPuzzleData = { isCorrect: isCorrect };
    const dropStoneEvent = new CustomEvent(STONEDROP, {
      detail: loadPuzzleData,
    });
    document.dispatchEvent(dropStoneEvent);
  }

  private initNewPuzzle(loadPuzzleEvent){
        this.isGameStarted = false;
        this.time = 0;
        this.tempWordforWordPuzzle = "";
        this.pickedStone = null;
        this.feedbackTextEffects.clearParticle();
        this.feedBackTextCanavsElement.style.zIndex = "0";
        document.dispatchEvent(loadPuzzleEvent);
        this.addEventListeners();
        this.audioPlayer.stopAudio();
        this.startPuzzleTime()
  }

  private incrementPuzzle(){
    this.counter += 1;
  }

  public logPuzzleEndFirebaseEvent(isCorrect:boolean,puzzleType?:string){
    let endTime = Date.now();
    const puzzleCompletedData: PuzzleCompletedEvent = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number:this.jsonVersionNumber,
      success_or_failure: isCorrect?'success':'failure',
      level_number: this.levelData.levelNumber,
      puzzle_number: this.counter,
      item_selected: (puzzleType == 'Word')?this.tempWordforWordPuzzle:this.pickedStone?.text,
      target: this.stoneHandler.getCorrectTargetStone(),
      foils: this.stoneHandler.getFoilStones(),
      response_time: (endTime - this.puzzleTime) / 1000,
    };
    this.firebaseIntegration.sendPuzzleCompletedEvent(puzzleCompletedData);
  }

  public logLevelEndFirebaseEvent(){
    let endTime = Date.now();
    const levelCompletedData: LevelCompletedEvent = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number:this.jsonVersionNumber,
      success_or_failure: GameScore.calculateStarCount(this.score)>=3?'success':'failure',
      number_of_successful_puzzles: this.score/100,
      level_number: this.levelData.levelNumber,
      duration: (endTime - this.startTime) / 1000,
     
    };
    this.firebaseIntegration.sendLevelCompletedEvent(levelCompletedData);
  }

  public startGameTime(){
     this.startTime = Date.now();
  
  }
  public startPuzzleTime(){
    this.puzzleTime = Date.now();
  }

  public pauseGamePlay = () => {
    this.isPauseButtonClicked = true;
    this.removeEventListeners();
    this.pausePopup.addListner();
    this.audioPlayer.stopAudio();
  }

  handleVisibilityChange = () => {
    this.audioPlayer.stopAudio();
    this.pauseGamePlay();
  }

  
}
