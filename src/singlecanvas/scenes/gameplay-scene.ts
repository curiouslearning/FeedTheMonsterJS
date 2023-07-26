import { Monster } from "../components/monster";
import { TimerTicking } from "../components/timer-ticking";
import { CanvasStack } from "../../utility/canvas-stack";
import StonesLayer from "../../components/stones-layer";
import { PromptText } from "../components/prompt-text";
import PauseButton from "../components/buttons/pause-button";
import { LevelIndicators } from "../components/level-indicator";
import {
  LevelEndButtonsLayer,
  LevelEndLayer,
  loadImages,
  loadingScreen,
  StoneLayer,
  TimetickerLayer,
  PromptTextLayer,
  PreviousPlayedLevel,
  StoreMonsterPhaseNumber,
  ButtonClick,
  FeedbackAudio,
  PhraseAudio,
  TutorialLayer,
} from "../../common/common";
import { LevelStartLayer } from "../../common/common";
import { GameEndScene } from "../../scenes/game-end-scene";
import Sound from "../../common/sound";
import { LevelEndScene } from "../../scenes/level-end-scene";
import { Game } from "../../scenes/game";
import { getDatafromStorage, getTotalStarCount } from "../../data/profile-data";
import { Debugger, lang, pseudoId } from "../../../global-variables";
import { FirebaseIntegration } from "../../firebase/firebase_integration";
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
} from "../common/event-names";
import { Background } from "../components/background";
import { FeedbackTextEffects } from "../components/feedback-particle-effect/feedback-text-effects";
import { GameScore } from "../data/game-score";
import { AudioPlayer } from "../components/audio-player";

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

var audioUrl = {
  phraseAudios: [
    "./lang/" + lang + "/audios/fantastic.mp3",
    // "./assets/audios/good job.WAV",
    "./lang/" + lang + "/audios/great.mp3",
  ],
  monsterSplit: "./assets/audios/Monster Spits wrong stones-01.mp3",
  monsterEat: "./assets/audios/Eat.mp3",
  monsterHappy: "./assets/audios/Cheering-02.mp3",
  monsterSad: "./assets/audios/Disapointed-05.mp3",
  buttonClick: "./assets/audios/ButtonClick.mp3",
};
var self: any;
var word_dropped_stones = 0;
var current_puzzle_index = 0;
var score = 0;
var word_dropped_stones = 0;
var isGamePause = false;
var noMoreTarget = false;
var isLevelEnded = false;
let lastFrameTime: number = 0;
export class GameplayScene {
  public game: any;
  public width: number;
  public height: number;
  public monster: Monster;

  public audio: Sound;
  public canvas: any;
  public levelData: any;
  public levelStartCallBack: any;
  public timerTicking: TimerTicking;
  public promptText: PromptText;
  public stones: StonesLayer;
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
    reloadScene
  ) {
    // this.game = game;
    this.width = canvas.width;
    this.height = canvas.height;
    self = this;
    // this.monster = new Monster(game);
    this.rightToLeft = rightToLeft;
    // this.audio = new Sound();
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    // this.canvasStack = new CanvasStack("canvas");
    this.monsterPhaseNumber = monsterPhaseNumber || 1;
    this.levelData = levelData;
    this.switchSceneToEnd = switchSceneToEnd;
    this.levelNumber = levelNumber;
    this.switchToLevelSelection = switchToLevelSelection;
    this.reloadScene = reloadScene;
    // this.levelStartCallBack = levelStartCallBack;
    // this.timerTicking = new TimerTicking(game, this);
    // this.promptText = new PromptText(
    //     game,
    //     levelData.puzzles[current_puzzle_index],
    //     levelData,
    //     rightToLeft
    // );
    // this.createCanvas();

    this.pauseButton = new PauseButton(this.context, this.canvas);

    this.stoneHandler = new StoneHandler(
      this.context,
      this.canvas,
      this.counter,
      this.levelData
    );
    this.promptText = new PromptText(
      this.width,
      this.height,
      this.levelData.puzzles[this.counter],
      this.levelData,
      false
    );
    this.timerTicking = new TimerTicking(
      this.width,
      this.height,
      this.loadPuzzle
    );
    this.levelIndicators = new LevelIndicators(this.context, this.canvas, 0);
    this.tutorial = new Tutorial(this.context, this.width, this.height);
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
    // this.switchToLevelSelection = switchToLevelSelection
    this.background1 = new Background(
      this.context,
      this.width,
      this.height,
      this.levelData.levelNumber
    );
    this.feedBackTextCanavsElement = document.getElementById("feedback-text") as HTMLCanvasElement;
    this.feedBackTextCanavsElement.height = this.height;
    this.feedBackTextCanavsElement.width = this.width;

    this.feedbackTextEffects = new FeedbackTextEffects(
      this.feedBackTextCanavsElement.getContext("2d"),
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

  // levelEndCallBack(button_name?: string) {
  //     if (!isGamePause) {
  //         isGamePause = true;
  //         if (isLevelEnded) {
  //             isLevelEnded = false;
  //             isGamePause = false;
  //         }
  //     } else {
  //         if (current_puzzle_index == self.puzzleData.length) {
  //             if (noMoreTarget) {
  //                 self.levelEnded();
  //                 current_puzzle_index = 0;
  //             }
  //         } else {
  //             isGamePause = false;

  //             if (self.isPuzzleCompleted && button_name == "cancel_button") {
  //                 self.timerTicking.stopTimer();
  //                 setTimeout(() => {
  //                     self.stones.setNewPuzzle(self.puzzleData[current_puzzle_index]);
  //                     self.promptText.setCurrrentPuzzleData(
  //                         self.puzzleData[current_puzzle_index]
  //                     );
  //                     self.timerTicking.draw();
  //                     self.promptText.draw();
  //                     self.isPuzzleCompleted = false;
  //                 }, 1000);
  //             } else if (button_name == "cancel_button") {
  //                 self.timerTicking.resumeTimer();
  //             }
  //         }
  //     }
  //     self.audio.playSound(audioUrl.buttonClick, ButtonClick);
  //     switch (button_name) {
  //         case "next_button": {
  //             self.exitAllScreens();
  //             self.levelStartCallBack(button_name);
  //             break;
  //         }
  //         case "retry_button": {
  //             self.exitAllScreens();
  //             self.levelStartCallBack(button_name);
  //             break;
  //         }
  //         case "close_button": {
  //             isGamePause = false;
  //             self.exitAllScreens();
  //             self.levelStartCallBack(button_name);
  //             break;
  //         }
  //     }
  // }

  getRandomFeedBackText(randomIndex) {
    const keys = Object.keys(this.feedBackTexts);
    const selectedKey = keys[randomIndex];
    return this.feedBackTexts[selectedKey];
  }
  getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // timeOverCallback = () => {
  //     // time to load new puzzle
  //     console.log("timeOver");
  //     this.timerTicking.readyTimer();
  //     this.timerTicking.startTimer();
  //     this.timerTicking.isMyTimerOver = false;
  //     if (this.counter == 5)
  //         this.counter = 0;
  //     // this.counter += 1;
  //     this.levelIndicators.setIndicators(this.counter++);
  // }

  // redrawOfStones(
  //     dragAnimation: string,
  //     status: boolean,
  //     emptyTarget: boolean,
  //     picked_stone: string,
  //     picked_stones: Array<string>
  // ) {
  //     if (dragAnimation != undefined) {
  //         switch (dragAnimation) {
  //             case "dragMonsterAnimation": {
  //                 self.monster.changeToDragAnimation();
  //                 break;
  //             }
  //             case "stopDragMonsterAnimation": {
  //                 self.monster.changeToIdleAnimation();
  //                 break;
  //             }
  //             default: {
  //                 self.monster.changeToIdleAnimation();
  //             }
  //         }
  //     } else {
  //         noMoreTarget = emptyTarget;
  //         var fntsticOrGrtIndex = self.getRandomInt(0, 1);
  //         if (status) {
  //             self.isPuzzleCompleted = true;
  //             self.monster.changeToEatAnimation();
  //             self.audio.playSound(audioUrl.monsterEat, PhraseAudio);
  //             setTimeout(() => {
  //                 self.audio.playSound(audioUrl.monsterHappy, PhraseAudio);
  //             }, 300);
  //             if (emptyTarget) {
  //                 if (navigator.onLine) {
  //                     self.puzzleEndFirebaseEvents(
  //                         "success",
  //                         current_puzzle_index,
  //                         picked_stones,
  //                         self.levelData.puzzles[current_puzzle_index].targetStones,
  //                         self.levelData.puzzles[current_puzzle_index].foilStones,
  //                         self.puzzleStartTime
  //                     );
  //                 }
  //                 setTimeout(() => {
  //                     self.audio.playSound(
  //                         audioUrl.phraseAudios[fntsticOrGrtIndex],
  //                         FeedbackAudio
  //                     );
  //                     self.promptText.showFantasticOrGreat(
  //                         self.getRandomFeedBackText(fntsticOrGrtIndex)
  //                     );
  //                 }, 1000);
  //                 self.promptText.draw(
  //                     (word_dropped_stones += self.rightToLeft ? 1 : picked_stone.length)
  //                 );
  //                 self.timerTicking.stopTimer();
  //                 score += 100;
  //                 word_dropped_stones = 0;
  //                 current_puzzle_index += 1;
  //             } else {
  //                 self.promptText.draw(
  //                     (word_dropped_stones += self.rightToLeft ? 1 : picked_stone.length)
  //                 );
  //             }
  //         } else {
  //             self.isPuzzleCompleted = true;
  //             self.timerTicking.stopTimer();
  //             self.monster.changeToSpitAnimation();
  //             self.audio.playSound(audioUrl.monsterSad, PhraseAudio);
  //             if (navigator.onLine) {
  //                 self.puzzleEndFirebaseEvents(
  //                     "failure",
  //                     current_puzzle_index,
  //                     picked_stones,
  //                     self.levelData.puzzles[current_puzzle_index].targetStones,
  //                     self.levelData.puzzles[current_puzzle_index].foilStones,
  //                     self.puzzleStartTime
  //                 );
  //             }
  //             setTimeout(() => {
  //                 self.audio.playSound(audioUrl.monsterSplit, PhraseAudio);
  //             }, 1000);

  //             current_puzzle_index += 1;
  //         }
  //         if (current_puzzle_index == self.puzzleData.length) {
  //             self.levelIndicators.setIndicators(current_puzzle_index);
  //             self.stones.setTimeoutRunning(false);
  //             self.stones.makeStoneArrayEmpty();
  //             for (let i = 0; i <= 3; i++) {
  //                 setTimeout(() => {
  //                     if (i == 3 && !isGamePause) {
  //                         self.levelEnded();
  //                         self.stones.setTimeoutRunning(true);
  //                     }
  //                 }, i * 1300.66);
  //             }
  //         } else {
  //             if (emptyTarget) {
  //                 self.levelIndicators.setIndicators(current_puzzle_index);
  //                 for (let i = 0; i <= 3; i++) {
  //                     self.stones.setTimeoutRunning(false);
  //                     self.stones.makeStoneArrayEmpty();
  //                     setTimeout(() => {
  //                         if (i == 3 && !isGamePause) {
  //                             self.stones.setNewPuzzle(self.puzzleData[current_puzzle_index]);
  //                             self.puzzleStartTime = new Date().getTime();
  //                             self.promptText.setCurrrentPuzzleData(
  //                                 self.puzzleData[current_puzzle_index]
  //                             );
  //                             self.timerTicking.draw();
  //                             self.promptText.draw();
  //                             self.stones.setTimeoutRunning(true);
  //                         }
  //                     }, i * 1300.66);
  //                 }
  //             }
  //         }
  //     }
  // }
  // levelEnded() {
  //     let totalStarsCount = getTotalStarCount();
  //     let monsterPhaseNumber = self.monsterPhaseNumber || 1;
  //     var gameLevelData = getDatafromStorage();
  //     this.showTutorial = gameLevelData.length == undefined ? true : false;
  //     if (gameLevelData != null) {
  //         // for (let i = 0; i < gameLevelData.length; i++) {
  //         //   totalStarsCount = totalStarsCount + gameLevelData[i].levelStar;
  //         // }
  //         monsterPhaseNumber = Math.floor(totalStarsCount / 12) + 1 || 1;
  //         if (self.monsterPhaseNumber < monsterPhaseNumber) {
  //             if (monsterPhaseNumber <= 4) {
  //                 self.monsterPhaseNumber = monsterPhaseNumber;
  //                 Debugger.DebugMode
  //                     ? localStorage.setItem(
  //                         StoreMonsterPhaseNumber + lang + "Debug",
  //                         monsterPhaseNumber
  //                     )
  //                     : localStorage.setItem(
  //                         StoreMonsterPhaseNumber + lang,
  //                         monsterPhaseNumber
  //                     );
  //                 self.monster.changePhaseNumber(monsterPhaseNumber);
  //                 // self.monster.changeImage(
  //                 //   "./assets/images/idle1" + self.monsterPhaseNumber + ".png"
  //                 // );
  //             } else {
  //                 self.monsterPhaseNumber = 4;
  //             }
  //         }
  //     }
  //     self.levelStartCallBack();
  //     if (self.levelData.levelNumber == 149) {
  //         self.exitAllScreens();
  //         new GameEndScene(self.game);
  //     } else {
  //         setTimeout(() => {
  //             new LevelEndScene(
  //                 self.game,
  //                 score,
  //                 self.monster,
  //                 self.levelEndCallBack,
  //                 self.levelData,
  //                 isGamePause,
  //                 self.monsterPhaseNumber,
  //                 this.levelStartTime
  //             );
  //         }, 1000);
  //     }
  //     isLevelEnded = true;
  // }

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

        if (this.levelData.levelMeta.levelType == "Word") {
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
      this.isPauseButtonClicked = true;
      this.removeEventListeners();
      this.pausePopup.addListner();
    }

    // send click to play prompt
    if (this.promptText.onClick(x, y)) {
      this.promptText.playSound();
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

  // createCanvas() {
  //     this.levelStartTime = new Date().getTime();
  //     this.puzzleStartTime = new Date().getTime();
  //     var monsterPhaseNumber = this.monsterPhaseNumber || 1;
  //     this.monster.changeImage(
  //         "./assets/images/idle1" + monsterPhaseNumber + ".png"
  //     );
  //     window.addEventListener("resize", async () => {
  //         self.deleteObjects();
  //     });

  //     // this.id = this.canvasStack.createLayer(
  //     //     this.height,
  //     //     this.width,
  //     //     "canvas"
  //     // );
  //     this.canavsElement = document.getElementById(this.id);
  //     this.context = this.canavsElement.getContext(
  //         "2d"
  //     ) as CanvasRenderingContext2D;
  //     // this.canavsElement.style.zIndex = 3;
  //     this.pauseButton = new PauseButton(this.context, this.canavsElement);
  //     this.levelIndicators = new LevelIndicators(
  //         this.context,
  //         this.canavsElement,
  //         0
  //     );
  //     var self = this;
  //     const selfElement = <HTMLElement>document.getElementById(self.id);
  //     document.addEventListener("selectstart", function (e) {
  //         e.preventDefault();
  //     });
  //     this.canavsElement.addEventListener("click", function (event) {
  //         var rect = selfElement.getBoundingClientRect();
  //         const x = event.clientX - rect.left;
  //         const y = event.clientY - rect.top;
  //     });
  //     var previousPlayedLevel: string = this.levelData.levelMeta.levelNumber;
  //     Debugger.DebugMode
  //         ? localStorage.setItem(
  //             PreviousPlayedLevel + lang + "Debug",
  //             previousPlayedLevel
  //         )
  //         : localStorage.setItem(PreviousPlayedLevel + lang, previousPlayedLevel);
  // }

  // deleteCanvas() {
  //     // this.canvasStack.deleteLayer(this.id);
  // }
  // exitAllScreens() {
  //     self.canvasStack.deleteLayer(LevelEndLayer);
  //     self.canvasStack.deleteLayer(LevelEndButtonsLayer);
  //     self.canvasStack.deleteLayer(LevelStartLayer);
  //     self.canvasStack.deleteLayer(StoneLayer);
  //     self.canvasStack.deleteLayer(TimetickerLayer);
  //     self.canvasStack.deleteLayer(PromptTextLayer);
  //     self.canvasStack.deleteLayer(TutorialLayer);
  //     // self.monster.changeImage("./assets/images/idle4.png");
  //     self.monster.changeImage(
  //         "./assets/images/idle1" + self.monsterPhaseNumber + ".png"
  //     );
  //     self.monster.deleteCanvas();
  //     self.deleteObjects();
  //     word_dropped_stones = 0;
  // }
  // deleteObjects() {
  //     delete self.monster;
  //     delete self.audio;
  //     delete self.levelIndicators;
  //     delete self.pauseButton;
  //     delete self.stones;
  //     delete self.timerTicking;
  //     delete self.canvasStack;
  //     delete self.monster;
  //     delete self.promptText;
  //     current_puzzle_index = 0;

  //     score = 0;
  // }
  draw(deltaTime) {
    if (!this.isGameStarted && !this.isPauseButtonClicked) {
      this.time = this.time + deltaTime;
      if (this.time >= 5000) {
        this.isGameStarted = true;
        this.time = 0;
      }
    }
    // this.context.clearRect(0, 0, this.width, this.height);
    // this.context.drawImage(this.bgImg, 0, 0, this.width, this.height);
    if (this.imagesLoaded) {
      // this.context.drawImage(this.loadedImages.bgImg, 0, 0, this.width, this.height);
      // this.context.drawImage(
      //     this.loadedImages.pillerImg,
      //     this.width * 0.6,
      //     this.height / 6,
      //     this.width,
      //     this.height / 2
      // );
      // this.context.drawImage(
      //     this.loadedImages.fenchImg,
      //     -this.width * 0.4,
      //     this.height / 3,
      //     this.width,
      //     this.height / 3
      // );
      // this.context.drawImage(
      //     // dummyImage,
      //     this.loadedImages.hillImg,
      //     -this.width * 0.25,
      //     this.height / 2,
      //     this.width * 1.5,
      //     this.height / 2
      // );
      // this.context.drawImage(
      //     this.loadedImages.grassImg,
      //     -this.width * 0.25,
      //     this.height / 2 + (this.height / 2) * 0.1,
      //     this.width * 1.5,
      //     this.height / 2
      // );
      this.background1.draw();
    }

    if (this.isPauseButtonClicked && this.isGameStarted) {
      this.pauseButton.draw();
      this.levelIndicators.draw();
      this.promptText.draw();
      this.monster.animation(deltaTime);
      this.timerTicking.draw();
      this.stoneHandler.draw(deltaTime);
      this.pausePopup.draw();
    }
    if (!this.isPauseButtonClicked && !this.isGameStarted) {
      this.pauseButton.draw();
      this.levelIndicators.draw();
      this.promptText.draw();
      this.monster.animation(deltaTime);
      this.timerTicking.draw();
      this.feedbackTextEffects.render();
    }
    if (this.isPauseButtonClicked && !this.isGameStarted) {
      this.pauseButton.draw();
      this.levelIndicators.draw();
      this.promptText.draw();
      this.monster.animation(deltaTime);
      this.timerTicking.draw();
      this.pausePopup.draw();
    }
    if (!this.isPauseButtonClicked && this.isGameStarted) {
      this.pauseButton.draw();
      this.levelIndicators.draw();
      this.promptText.draw();
      this.monster.animation(deltaTime);
      this.timerTicking.update(deltaTime);
      this.timerTicking.draw();
      this.stoneHandler.draw(deltaTime);
    }
  }
  // update(deltaTime: number) {
  //     self.timerTicking ? self.timerTicking.update(deltaTime) : null;
  //     lastFrameTime = 0;
  // }

  // changePuzzle() {
  //     lastFrameTime = performance.now();
  //     if (self.timerTicking.isTimerEnded) {
  //         self.stones.isTimerEnded();
  //         word_dropped_stones = 0;
  //         current_puzzle_index += 1;
  //         self.stones.makeStoneArrayEmpty();
  //         self.stones.setTimeoutRunning(true);
  //         // self.stones.clearCanvas();
  //         self.stones.canvas.scene.levelIndicators.setIndicators(
  //             current_puzzle_index
  //         );
  //         if (current_puzzle_index == self.puzzleData.length) {
  //             setTimeout(() => {
  //                 isLevelEnded = true;
  //                 self.levelStartCallBack();
  //                 delete self.timerTicking;
  //                 new LevelEndScene(
  //                     self.game,
  //                     score,
  //                     self.monster,
  //                     self.levelEndCallBack,
  //                     self.levelData,
  //                     isGamePause,
  //                     this.monsterPhaseNumber,
  //                     this.levelStartTime
  //                 );
  //             }, 1000);
  //         } else {
  //             self.stones.makeStoneArrayEmpty();
  //             // for (let i = 0; i <= 3; i++) {
  //             // setTimeout(() => {

  //             // if (i == 3 && !isGamePause) {
  //             if (!isGamePause) {
  //                 self.stones.setNewPuzzle(self.puzzleData[current_puzzle_index]);
  //                 self.puzzleStartTime = new Date().getTime();
  //                 self.promptText.setCurrrentPuzzleData(
  //                     self.puzzleData[current_puzzle_index]
  //                 );
  //                 self.timerTicking.draw();
  //                 self.promptText.draw();
  //                 self.stones.setNewPuzzle(self.puzzleData[current_puzzle_index]);
  //                 self.stones.setTimeoutRunning(true);
  //             }
  //             // }, i * 1300.66);
  //             // }
  //         }

  //         self.timerTicking ? (self.timerTicking.isTimerEnded = false) : null;
  //     }
  // }

  addEventListeners() {
    this.handler.addEventListener(MOUSEUP, this.handleMouseUp, false);
    this.handler.addEventListener(MOUSEMOVE, this.handleMouseMove, false);
    this.handler.addEventListener(MOUSEDOWN, this.handleMouseDown, false);

    this.handler.addEventListener(TOUCHSTART, this.handleTouchStart, false);
    this.handler.addEventListener(TOUCHMOVE, this.handleTouchMove, false);
    this.handler.addEventListener(TOUCHEND, this.handleTouchEnd, false);
    this.handler.addEventListener(CLICK, this.handleMouseClick, false);
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

  puzzleEndFirebaseEvents(
    success_or_failure,
    puzzle_number,
    item_selected,
    target,
    foils,
    response_time
  ) {
    var puzzleEndTime = new Date();
    FirebaseIntegration.customEvents("puzzle_completed", {
      cr_user_id: pseudoId,
      success_or_failure: success_or_failure,
      level_number: this.levelData.levelNumber,
      puzzle_number: puzzle_number,
      item_selected: item_selected,
      target: target,
      foils: foils,
      profile_number: 0,
      ftm_language: lang,
      version_number: document.getElementById("version-info-id").innerHTML,
      response_time: (puzzleEndTime.getTime() - response_time) / 1000,
    });
  }

  loadPuzzle = (isTimerEnded?:boolean) => {
    let timerEnded = (isTimerEnded == undefined)?false:true;
    this.removeEventListeners();
    this.counter++;
    this.isGameStarted = false;
    this.time = -4000;
    this.tempWordforWordPuzzle = "";
    if (this.counter == this.levelData.puzzles.length) {
      this.levelIndicators.setIndicators(this.counter);
      GameScore.setGameLevelScore(this.levelData, this.score);
      this.switchSceneToEnd(
        this.levelData,
        GameScore.calculateStarCount(this.score),
        this.monsterPhaseNumber
      );
    } else {
      const loadPuzzleData = {
        counter: this.counter,
      };
      const loadPuzzleEvent = new CustomEvent(LOADPUZZLE, {
        detail: loadPuzzleData,
      });
      if(timerEnded)
      {
        // this.monster.changeToIdleAnimation();
        this.pickedStone = null;
        this.feedbackTextEffects.clearParticle();
        this.feedBackTextCanavsElement.style.zIndex = "0";
        document.dispatchEvent(loadPuzzleEvent);
        this.addEventListeners();

      }
      else{
        setTimeout(() => {
            // this.changeToNextPuzzle();  
            this.pickedStone = null;
            this.feedbackTextEffects.clearParticle();
            this.feedBackTextCanavsElement.style.zIndex = "0";
            document.dispatchEvent(loadPuzzleEvent);
            this.addEventListeners();
            this.audioPlayer.stopAudio();
          }, 4000);

      }
      
    }
  };


  public dispose() {
    this.removeEventListeners();
    this.feedbackTextEffects.unregisterEventListener();
    this.monster.unregisterEventListener();
    this.timerTicking.unregisterEventListener();
    this.levelIndicators.unregisterEventListener();
    this.stoneHandler.unregisterEventListener();
    this.promptText.unregisterEventListener();
  }

  public letterInWordPuzzle(droppedStone: string) {
    const isCorrect =
      this.stoneHandler.isStoneDroppedCorrectForLetterInWord(droppedStone);
    if (isCorrect) {
      this.score = this.score + 100;
      const feedBackIndex = this.getRandomInt(0, 1);
      // this.audioPlayer.playAudio(false, "./assets/audios/Eat.mp3","./assets/audios/Cheering-02.mp3", "./assets/audios/fantastic.WAV");
      this.feedbackTextEffects.wrapText(
        this.getRandomFeedBackText(feedBackIndex)
      );
      this.feedBackTextCanavsElement.style.zIndex = "2";
    }
    let loadPuzzleData = { isCorrect: isCorrect };
    const dropStoneEvent = new CustomEvent(STONEDROP, {
      detail: loadPuzzleData,
    });
    document.dispatchEvent(dropStoneEvent);
    // this.removeEventListeners();
    this.loadPuzzle();
  }

  public letterOnlyPuzzle(droppedStone: string) {
    const isCorrect =
      this.stoneHandler.isStoneDroppedCorrectForLetterOnly(droppedStone);
    if (isCorrect) {
      this.score = this.score + 100;
      const feedBackIndex = this.getRandomInt(0, 1);
      // this.audioPlayer.playAudio(false, "./assets/audios/Eat.mp3","./assets/audios/Cheering-02.mp3", "./assets/audios/fantastic.WAV");
      this.feedbackTextEffects.wrapText(
        this.getRandomFeedBackText(feedBackIndex)
      );
      this.feedBackTextCanavsElement.style.zIndex = "2";
    }
    let loadPuzzleData = { isCorrect: isCorrect };
    const dropStoneEvent = new CustomEvent(STONEDROP, {
      detail: loadPuzzleData,
    });
    document.dispatchEvent(dropStoneEvent);
    // this.removeEventListeners();
    this.loadPuzzle();
  }

  public wordPuzzle(droppedStone: string, droppedStoneInstance: StoneConfig) {
    droppedStoneInstance.x = -999;
    droppedStoneInstance.y = -999;
    this.tempWordforWordPuzzle = this.tempWordforWordPuzzle + droppedStone;
    const isCorrect = this.stoneHandler.isStonDroppedCorrectForWord(
      this.tempWordforWordPuzzle
    );
    if (
      this.stoneHandler.getCorrectTargetStone() == this.tempWordforWordPuzzle &&
      isCorrect
    ) {
      this.score = this.score + 100;
      const feedBackIndex = this.getRandomInt(0, 1);
      // this.audioPlayer.playAudio(false, "./assets/audios/Eat.mp3","./assets/audios/Cheering-02.mp3", "./assets/audios/fantastic.WAV");
      this.feedbackTextEffects.wrapText(
        this.getRandomFeedBackText(feedBackIndex)
      );
      this.feedBackTextCanavsElement.style.zIndex = "2";
      let loadPuzzleData = { isCorrect: isCorrect };
      const dropStoneEvent = new CustomEvent(STONEDROP, {
        detail: loadPuzzleData,
      });
      this.tempWordforWordPuzzle = "";
      document.dispatchEvent(dropStoneEvent);
      // this.removeEventListeners();
      this.loadPuzzle();
      return;
    }

    if (isCorrect) {
      this.monster.changeToEatAnimation();
      setTimeout(() => {
        this.monster.changeToIdleAnimation();
      }, 1500);
    } else {
      let loadPuzzleData = { isCorrect: isCorrect };
      const dropStoneEvent = new CustomEvent(STONEDROP, {
        detail: loadPuzzleData,
      });
      this.tempWordforWordPuzzle = "";
      document.dispatchEvent(dropStoneEvent);
      // this.removeEventListeners();
      this.loadPuzzle();
    }
  }
}
