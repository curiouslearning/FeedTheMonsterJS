import { Monster } from "../components/monster";
import { TimerTicking } from "../components/timer-ticking";
import { CanvasStack } from "../utility/canvas-stack";
import StonesLayer from "../components/stones-layer";
import { PromptText } from "../components/prompt-text";
import PauseButton from "../components/buttons/pause_button";
import { LevelIndicators } from "../components/level-indicators";
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
} from "../common/common";
import { LevelStartLayer } from "../common/common";
import { GameEndScene } from "./game-end-scene";
import Sound from "../common/sound";
import { LevelEndScene } from "./level-end-scene";
import { Game } from "./game";
import { getDatafromStorage, getTotalStarCount } from "../data/profile-data";
import { Debugger, lang, pseudoId } from "../../global-variables";
import { FirebaseIntegration } from "../firebase/firebase_integration";

var images = {
  bgImg: "./assets/images/bg_v01.jpg",
  hillImg: "./assets/images/hill_v01.png",
  timer_empty: "./assets/images/timer_empty.png",
  pillerImg: "./assets/images/Totem_v02_v01.png",
  grassImg: "./assets/images/FG_a_v01.png",
  rotating_clock: "./assets/images/timer.png",
  fenchImg: "./assets/images/fence_v01.png",
  promptImg: "./assets/images/promptTextBg.png",
  // fantastic: "./lang/" + lang + "/images/fantastic_01.png",
  // great: "./lang/" + lang + "/images/great_01.png",
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
export class LevelStartScene {
  public game: any;
  public width: number;
  public height: number;
  public monster: Monster;

  public audio: Sound;
  public canvasStack: any;
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
  public puzzleStartTime: number;
  public showTutorial: boolean;
  public feedBackTexts: any;
  public isPuzzleCompleted: boolean;
  public rightToLeft: boolean;
  public allImagesLoaded: boolean = false;
  loadedImages:any;

  constructor({
    game,
    levelData,
    levelStartCallBack,
    monsterPhaseNumber,
    feedBackTexts,
    rightToLeft,
  }: {
    game: Game;
    levelData: { puzzles: any[] };
    levelStartCallBack: any;
    monsterPhaseNumber: any;
    feedBackTexts: any;
    rightToLeft: boolean;
  }) {
    this.game = game;
    this.width = game.width;
    this.height = game.height;
    self = this;
    this.monster = new Monster(game);
    this.rightToLeft = rightToLeft;
    this.audio = new Sound();
    this.canvasStack = new CanvasStack("canvas");
    this.monsterPhaseNumber = monsterPhaseNumber || 1;
    this.levelData = levelData;
    this.levelStartCallBack = levelStartCallBack;
    this.timerTicking = new TimerTicking(game, this);
    this.promptText = new PromptText(
      game,
      levelData.puzzles[current_puzzle_index],
      levelData,
      rightToLeft
    );
    this.createCanvas();

    this.stones = new StonesLayer(
      game,
      levelData.puzzles[current_puzzle_index],
      this.pauseButton,
      this.redrawOfStones,
      this,
      current_puzzle_index
    );
    this.puzzleData = levelData.puzzles;
    this.feedBackTexts = feedBackTexts;
    this.isPuzzleCompleted = false;
    this.createBackgroud();
  }

  levelEndCallBack(button_name?: string) {
    if (!isGamePause) {
      isGamePause = true;
      if (isLevelEnded) {
        isLevelEnded = false;
        isGamePause = false;
      }
    } else {
      if (current_puzzle_index == self.puzzleData.length) {
        if (noMoreTarget) {
          self.levelEnded();
          current_puzzle_index = 0;
        }
      } else {
        isGamePause = false;

        if (self.isPuzzleCompleted && button_name == "cancel_button") {
          self.timerTicking.stopTimer();
          setTimeout(() => {
            self.stones.setNewPuzzle(self.puzzleData[current_puzzle_index]);
            self.promptText.setCurrrentPuzzleData(
              self.puzzleData[current_puzzle_index]
            );
            self.timerTicking.draw();
            self.promptText.draw();
            self.isPuzzleCompleted = false;
          }, 1000);
        } else if (button_name == "cancel_button") {
          self.timerTicking.resumeTimer();
        }
      }
    }
    self.audio.playSound(audioUrl.buttonClick, ButtonClick);
    switch (button_name) {
      case "next_button": {
        self.exitAllScreens();
        self.levelStartCallBack(button_name);
        break;
      }
      case "retry_button": {
        self.exitAllScreens();
        self.levelStartCallBack(button_name);
        break;
      }
      case "close_button": {
        isGamePause = false;
        self.exitAllScreens();
        self.levelStartCallBack(button_name);
        break;
      }
    }
  }

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

  redrawOfStones(
    dragAnimation: string,
    status: boolean,
    emptyTarget: boolean,
    picked_stone: string,
    picked_stones: Array<string>
  ) {
    if (dragAnimation != undefined) {
      switch (dragAnimation) {
        case "dragMonsterAnimation": {
          self.monster.changeToDragAnimation();
          break;
        }
        case "stopDragMonsterAnimation": {
          self.monster.changeToIdleAnimation();
          break;
        }
        default: {
          self.monster.changeToIdleAnimation();
        }
      }
    } else {
      noMoreTarget = emptyTarget;
      var fntsticOrGrtIndex = self.getRandomInt(0, 1);
      if (status) {
        self.isPuzzleCompleted = true;
        self.monster.changeToEatAnimation();
        self.audio.playSound(audioUrl.monsterEat, PhraseAudio);
        setTimeout(() => {
          self.audio.playSound(audioUrl.monsterHappy, PhraseAudio);
        }, 300);
        if (emptyTarget) {
          if (navigator.onLine) {
            self.puzzleEndFirebaseEvents(
              "success",
              current_puzzle_index,
              picked_stones,
              self.levelData.puzzles[current_puzzle_index].targetStones,
              self.levelData.puzzles[current_puzzle_index].foilStones,
              self.puzzleStartTime
            );
          }
          setTimeout(() => {
            self.audio.playSound(
              audioUrl.phraseAudios[fntsticOrGrtIndex],
              FeedbackAudio
            );
            self.promptText.showFantasticOrGreat(
              self.getRandomFeedBackText(fntsticOrGrtIndex)
            );
          }, 1000);
          self.promptText.draw(
            (word_dropped_stones += self.rightToLeft ? 1 : picked_stone.length)
          );
          self.timerTicking.stopTimer();
          score += 100;
          word_dropped_stones = 0;
          current_puzzle_index += 1;
        } else {
          self.promptText.draw(
            (word_dropped_stones += self.rightToLeft ? 1 : picked_stone.length)
          );
        }
      } else {
        self.isPuzzleCompleted = true;
        self.timerTicking.stopTimer();
        self.monster.changeToSpitAnimation();
        self.audio.playSound(audioUrl.monsterSad, PhraseAudio);
        if (navigator.onLine) {
          self.puzzleEndFirebaseEvents(
            "failure",
            current_puzzle_index,
            picked_stones,
            self.levelData.puzzles[current_puzzle_index].targetStones,
            self.levelData.puzzles[current_puzzle_index].foilStones,
            self.puzzleStartTime
          );
        }
        setTimeout(() => {
          self.audio.playSound(audioUrl.monsterSplit, PhraseAudio);
        }, 1000);

        current_puzzle_index += 1;
      }
      if (current_puzzle_index == self.puzzleData.length) {
        self.levelIndicators.setIndicators(current_puzzle_index);
        self.stones.setTimeoutRunning(false);
        self.stones.makeStoneArrayEmpty();
        for (let i = 0; i <= 3; i++) {
          setTimeout(() => {
            if (i == 3 && !isGamePause) {
              self.levelEnded();
              self.stones.setTimeoutRunning(true);
            }
          }, i * 1300.66);
        }
      } else {
        if (emptyTarget) {
          self.levelIndicators.setIndicators(current_puzzle_index);
          for (let i = 0; i <= 3; i++) {
            self.stones.setTimeoutRunning(false);
            self.stones.makeStoneArrayEmpty();
            setTimeout(() => {
              if (i == 3 && !isGamePause) {
                self.stones.setNewPuzzle(self.puzzleData[current_puzzle_index]);
                self.puzzleStartTime = new Date().getTime();
                self.promptText.setCurrrentPuzzleData(
                  self.puzzleData[current_puzzle_index]
                );
                self.timerTicking.draw();
                self.promptText.draw();
                self.stones.setTimeoutRunning(true);
              }
            }, i * 1300.66);
          }
        }
      }
    }
  }
  levelEnded() {
    let totalStarsCount = getTotalStarCount();
    let monsterPhaseNumber = self.monsterPhaseNumber || 1;
    var gameLevelData = getDatafromStorage();
    this.showTutorial = gameLevelData.length == undefined ? true : false;
    if (gameLevelData != null) {
      // for (let i = 0; i < gameLevelData.length; i++) {
      //   totalStarsCount = totalStarsCount + gameLevelData[i].levelStar;
      // }
      monsterPhaseNumber = Math.floor(totalStarsCount / 12) + 1 || 1;
      if (self.monsterPhaseNumber < monsterPhaseNumber) {
        if (monsterPhaseNumber <= 4) {
          self.monsterPhaseNumber = monsterPhaseNumber;
          Debugger.DebugMode
            ? localStorage.setItem(
              StoreMonsterPhaseNumber + lang + "Debug",
              monsterPhaseNumber
            )
            : localStorage.setItem(
              StoreMonsterPhaseNumber + lang,
              monsterPhaseNumber
            );
          self.monster.changePhaseNumber(monsterPhaseNumber);
          // self.monster.changeImage(
          //   "./assets/images/idle1" + self.monsterPhaseNumber + ".png"
          // );
        } else {
          self.monsterPhaseNumber = 4;
        }
      }
    }
    self.levelStartCallBack();
    if (self.levelData.levelNumber == 149) {
      self.exitAllScreens();
      new GameEndScene(self.game);
    } else {
      setTimeout(() => {
        new LevelEndScene(
          self.game,
          score,
          self.monster,
          self.levelEndCallBack,
          self.levelData,
          isGamePause,
          self.monsterPhaseNumber,
          this.levelStartTime
        );
      }, 1000);
    }
    isLevelEnded = true;
  }
  createCanvas() {
    this.levelStartTime = new Date().getTime();
    this.puzzleStartTime = new Date().getTime();
    var monsterPhaseNumber = this.monsterPhaseNumber || 1;
    this.monster.changeImage(
      "./assets/images/idle1" + monsterPhaseNumber + ".png"
    );
    window.addEventListener("resize", async () => {
      self.deleteObjects();
    });

    this.id = this.canvasStack.createLayer(
      this.height,
      this.width,
      "canvas"
    );
    this.canavsElement = document.getElementById(this.id);
    this.context = this.canavsElement.getContext(
      "2d"
    ) as CanvasRenderingContext2D;
    // this.canavsElement.style.zIndex = 3;
    this.pauseButton = new PauseButton(this.context, this.canavsElement);
    this.levelIndicators = new LevelIndicators(
      this.context,
      this.canavsElement,
      0
    );
    var self = this;
    const selfElement = <HTMLElement>document.getElementById(self.id);
    document.addEventListener("selectstart", function (e) {
      e.preventDefault();
    });
    this.canavsElement.addEventListener("click", function (event) {
      var rect = selfElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
    });
    var previousPlayedLevel: string = this.levelData.levelMeta.levelNumber;
    Debugger.DebugMode
      ? localStorage.setItem(
        PreviousPlayedLevel + lang + "Debug",
        previousPlayedLevel
      )
      : localStorage.setItem(PreviousPlayedLevel + lang, previousPlayedLevel);
  }

  deleteCanvas() {
    this.canvasStack.deleteLayer(this.id);
  }
  exitAllScreens() {
    self.canvasStack.deleteLayer(LevelEndLayer);
    self.canvasStack.deleteLayer(LevelEndButtonsLayer);
    self.canvasStack.deleteLayer(LevelStartLayer);
    self.canvasStack.deleteLayer(StoneLayer);
    self.canvasStack.deleteLayer(TimetickerLayer);
    self.canvasStack.deleteLayer(PromptTextLayer);
    self.canvasStack.deleteLayer(TutorialLayer);
    // self.monster.changeImage("./assets/images/idle4.png");
    self.monster.changeImage(
      "./assets/images/idle1" + self.monsterPhaseNumber + ".png"
    );
    self.monster.deleteCanvas();
    self.deleteObjects();
    word_dropped_stones = 0;
  }
  deleteObjects() {
    delete self.monster;
    delete self.audio;
    delete self.levelIndicators;
    delete self.pauseButton;
    delete self.stones;
    delete self.timerTicking;
    delete self.canvasStack;
    delete self.monster;
    delete self.promptText;
    current_puzzle_index = 0;

    score = 0;
  }
  draw() {
    // console.log(this.allImagesLoaded, "its drawing", this.context);
    // this.context.clearRect(0, 0, this.width, this.height);
    // this.context.drawImage(this.bgImg, 0, 0, this.width, this.height);
    if (this.allImagesLoaded) {
      this.context.fillText("lol", 100, 150);
      this.context.drawImage(
        this.loadedImages.pillerImg,
        this.width * 0.6,
        this.height / 6,
        this.width,
        this.height / 2
      );
      this.context.drawImage(
        this.loadedImages.fenchImg,
        -this.width * 0.4,
        this.height / 3,
        this.width,
        this.height / 3
      );
      this.context.drawImage(
        // dummyImage,
        this.loadedImages.hillImg,
        -this.width * 0.25,
        this.height / 2,
        this.width * 1.5,
        this.height / 2
      );
      this.context.drawImage(
        this.loadedImages.grassImg,
        -this.width * 0.25,
        this.height / 2 + (this.height / 2) * 0.1,
        this.width * 1.5,
        this.height / 2
      );
      this.context.drawImage(
        this.loadedImages.timer_empty,
        0,
        this.height * 0.1,
        this.width,
        this.height * 0.05
      );
      this.context.drawImage(
        this.loadedImages.rotating_clock,
        5,
        this.height * 0.09,
        this.width * 0.12,
        this.height * 0.06
      );
    }
    this.timerTicking.createBackgroud();

    this.pauseButton.draw();
    this.levelIndicators.draw();
    this.promptText.draw();
  }
  update(deltaTime: number) {
    self.timerTicking ? self.timerTicking.update(deltaTime) : null;
    lastFrameTime = 0;
  }

  changePuzzle() {
    lastFrameTime = performance.now();
    if (self.timerTicking.isTimerEnded) {
      self.stones.isTimerEnded();
      word_dropped_stones = 0;
      current_puzzle_index += 1;
      self.stones.makeStoneArrayEmpty();
      self.stones.setTimeoutRunning(true);
      // self.stones.clearCanvas();
      self.stones.canvas.scene.levelIndicators.setIndicators(
        current_puzzle_index
      );
      if (current_puzzle_index == self.puzzleData.length) {
        setTimeout(() => {
          isLevelEnded = true;
          self.levelStartCallBack();
          delete self.timerTicking;
          new LevelEndScene(
            self.game,
            score,
            self.monster,
            self.levelEndCallBack,
            self.levelData,
            isGamePause,
            this.monsterPhaseNumber,
            this.levelStartTime
          );
        }, 1000);
      } else {
        self.stones.makeStoneArrayEmpty();
        // for (let i = 0; i <= 3; i++) {
        // setTimeout(() => {

        // if (i == 3 && !isGamePause) {
        if (!isGamePause) {
          self.stones.setNewPuzzle(self.puzzleData[current_puzzle_index]);
          self.puzzleStartTime = new Date().getTime();
          self.promptText.setCurrrentPuzzleData(
            self.puzzleData[current_puzzle_index]
          );
          self.timerTicking.draw();
          self.promptText.draw();
          self.stones.setNewPuzzle(self.puzzleData[current_puzzle_index]);
          self.stones.setTimeoutRunning(true);
        }
        // }, i * 1300.66);
        // }
      }

      self.timerTicking ? (self.timerTicking.isTimerEnded = false) : null;
    }
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

    console.log(" Background1 ", availableBackgroundTypes[backgroundType]);

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
      self.timerTicking.createBackgroud();
      // self.stones.draw(deltaTime);
      self.pauseButton.draw();
      self.levelIndicators.draw();
      self.promptText.createBackground();
      loadingScreen(false);
      self.loadedImages = Object.assign({}, image)
      console.log(self.loadedImages," imagesareher ",image);
      self.allImagesLoaded = true;
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
    console.log("User_id", pseudoId);
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
}
