import { StoneConfig, VISIBILITY_CHANGE, Utils } from '@common'
import { EventManager } from "@events";
import { Tutorial, AudioPlayer, TimerTicking } from "@components"
import { GameScore } from "@data";
import {
  AUDIO_PATH_EATS,
  AUDIO_PATH_MONSTER_SPIT,
  AUDIO_PATH_MONSTER_DISSAPOINTED,
  AUDIO_PATH_POINTS_ADD,
  AUDIO_PATH_CORRECT_STONE,
  AUDIO_PATH_CHEERING_FUNC,
  ASSETS_PATH_STONE_PINK_BG
} from '@constants';
import gameStateService from '@gameStateService';

export default class StoneHandler extends EventManager {
  public context: CanvasRenderingContext2D;
  public canvas: HTMLCanvasElement;
  public currentPuzzleData: any;
  public targetStones: string[];
  public stonePos: number[][];
  public pickedStone: StoneConfig;
  public foilStones: Array<StoneConfig> = new Array<StoneConfig>();
  public answer: string = "";
  public puzzleNumber: number;
  public levelData: any;
  public correctAnswer: string;
  public puzzleStartTime: Date;
  public showTutorial: boolean =
    GameScore.getDatafromStorage().length == undefined ? true : false;
  public correctStoneAudio: HTMLAudioElement;
  public tutorial: Tutorial;
  correctTargetStone: string;
  stonebg: HTMLImageElement;
  public audioPlayer: AudioPlayer;
  public feedbackAudios: string[];
  public timerTickingInstance: TimerTicking;
  isGamePaused: boolean = false;
  private unsubscribeEvent: () => void;

  constructor(
    context: CanvasRenderingContext2D,
    canvas,
    puzzleNumber: number,
    levelData,
    feedbackAudios,
    timerTickingInstance: TimerTicking
  ) {
    super({
      stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
      loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event),
    });
    this.context = context;
    this.canvas = canvas;
    this.puzzleNumber = puzzleNumber;
    this.levelData = levelData;
    this.setTargetStone(this.puzzleNumber);
    this.initializeStonePos();
    this.correctStoneAudio = new Audio(AUDIO_PATH_CORRECT_STONE);
    this.correctStoneAudio.loop = false;
    this.feedbackAudios = this.convertFeedBackAudiosToList(feedbackAudios);
    this.puzzleStartTime = new Date();
    this.tutorial = new Tutorial(
      context,
      canvas.width,
      canvas.height,
      puzzleNumber
    );
    this.stonebg = new Image();
    this.stonebg.src = ASSETS_PATH_STONE_PINK_BG;
    this.audioPlayer = new AudioPlayer();
    this.stonebg.onload = (e) => {
      this.createStones(this.stonebg);
    };
    this.audioPlayer = new AudioPlayer();
    this.timerTickingInstance = timerTickingInstance;
    document.addEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
    this.unsubscribeEvent = gameStateService.subscribe(
      gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
      (isGamePaused:boolean) => {
        this.isGamePaused  = isGamePaused;
      }
    );
  }

  createStones(img) {
    const foilStones = this.getFoilStones();
    for (let i = 0; i < foilStones.length; i++) {
      if (foilStones[i] == this.correctTargetStone) {
        this.tutorial.updateTargetStonePositions(this.stonePos[i]);
      }

      this.foilStones.push(
        new StoneConfig(
          this.context,
          this.canvas.width,
          this.canvas.height,
          foilStones[i],
          this.stonePos[i][0],
          this.stonePos[i][1],
          img,
          this.timerTickingInstance,
          i == foilStones.length - 1 ? this.tutorial : null
        )
      );
    }
  }

  draw(deltaTime: number) {
    for (let i = 0; i < this.foilStones.length; i++) {
      this.foilStones[i].draw(deltaTime);
    }

    if (
      this.foilStones[this.foilStones.length - 1].frame >= 100 &&
      !this.isGamePaused
    ) {
      this.timerTickingInstance.update(deltaTime);
    }
  }

  drawWordPuzzleLetters(
    deltaTime: number,
    shouldHideStoneChecker: (index: number) => boolean,
    groupedLetters: {} | { [key: number]: string }
  ): void {
    for (let i = 0; i < this.foilStones.length; i++) {

      if (shouldHideStoneChecker(i)) {
        this.foilStones[i].draw(
          deltaTime,
          Object.keys(groupedLetters).length > 1 && groupedLetters[i] !== undefined
        );
      }
    }

    if (this.foilStones.length > 0 && this.foilStones[this.foilStones.length - 1].frame >= 100 && !this.isGamePaused) {
      this.timerTickingInstance.update(deltaTime);
    }
  }

  initializeStonePos() {
    let offsetCoordinateValue = 32;

    this.stonePos = [
      [
        this.canvas.width / 5 - offsetCoordinateValue,
        this.canvas.height / 1.9 - offsetCoordinateValue,
      ],
      [
        this.canvas.width / 2 - offsetCoordinateValue,
        this.canvas.height / 1.15 - offsetCoordinateValue,
      ],
      [
        this.canvas.width / 3.5 + this.canvas.width / 2 - offsetCoordinateValue,
        this.canvas.height / 1.2 - offsetCoordinateValue,
      ],
      [
        this.canvas.width / 4 - offsetCoordinateValue,
        this.canvas.height / 1.28 - offsetCoordinateValue,
      ],
      [
        this.canvas.width / 7 - offsetCoordinateValue,
        this.canvas.height / 1.5 - offsetCoordinateValue,
      ],
      [
        this.canvas.width / 2.3 +
        this.canvas.width / 2.1 -
        offsetCoordinateValue,
        this.canvas.height / 1.9 - offsetCoordinateValue,
      ],
      [
        this.canvas.width / 2.3 +
        this.canvas.width / 2.1 -
        offsetCoordinateValue,
        this.canvas.height / 1.42 - offsetCoordinateValue,
      ],
      [
        this.canvas.width / 6 - offsetCoordinateValue,
        this.canvas.height / 1.1 - offsetCoordinateValue,
      ],
    ];
    this.stonePos = this.stonePos.sort(() => Math.random() - 0.5);
  }

  public setTargetStone(puzzleNumber) {
    this.currentPuzzleData = this.levelData.puzzles[puzzleNumber];
    this.targetStones = [...this.currentPuzzleData.targetStones];
    this.correctTargetStone = this.targetStones.join("");
  }

  public handleStoneDrop(event) {
    this.foilStones = [];
  }
  public handleLoadPuzzle(event) {
    this.foilStones = [];
    this.tutorial.setPuzzleNumber(event.detail.counter);
    this.puzzleNumber = event.detail.counter;
    this.setTargetStone(this.puzzleNumber);
    this.initializeStonePos();
    this.createStones(this.stonebg);
  }

  public dispose() {
    this.unsubscribeEvent();
    document.removeEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
    this.unregisterEventListener();
  }

  public isStoneLetterDropCorrect(
    droppedStone: string,
    feedBackIndex: number,
    isWord: boolean = false
  ): boolean {
    /**
     * To Do: Need to refactor or revome this completely and place something
     * that is tailored to single letter puzzle since word puzzle no longer uses this.
     * Will leave this for now to avoid messing witht the single letter puzzle.
     */
    const isLetterDropCorrect = isWord
      ? droppedStone == this.correctTargetStone.substring(0, droppedStone.length)
      : droppedStone == this.correctTargetStone;

    this.processLetterDropFeedbackAudio(
      feedBackIndex,
      isLetterDropCorrect,
      isWord,
      droppedStone
    );

    return isLetterDropCorrect
  }

  public processLetterDropFeedbackAudio(
    feedBackIndex: number,
    isLetterDropCorrect: boolean,
    isWord: boolean,
    droppedStone: string,
  ) {
    if (isLetterDropCorrect) {
      const condition = isWord
        ? droppedStone === this.getCorrectTargetStone() // condition for word puzzle
        : isLetterDropCorrect // for letter and letter for word puzzle

      if (condition) {
        this.playCorrectAnswerFeedbackSound(feedBackIndex);
      } else {
        this.audioPlayer.playFeedbackAudios(
          false,
          AUDIO_PATH_EATS,
          AUDIO_PATH_CHEERING_FUNC(2),
        );
      }
    } else {
      this.audioPlayer.playFeedbackAudios(
        false,
        AUDIO_PATH_EATS,
        AUDIO_PATH_MONSTER_SPIT,
        Math.round(Math.random()) > 0 ? AUDIO_PATH_MONSTER_DISSAPOINTED : null
      );
    }
  }

  public getCorrectTargetStone(): string {
    return this.correctTargetStone;
  }

  public getFoilStones() {
    this.currentPuzzleData.targetStones.forEach((e) => {
      const index = this.currentPuzzleData.foilStones.indexOf(e);
      if (index !== -1) {
        this.currentPuzzleData.foilStones.splice(index, 1);
      }
    });

    const totalStonesCount =
      this.currentPuzzleData.targetStones.length +
      this.currentPuzzleData.foilStones.length;

    if (totalStonesCount > 8) {
      const extraStonesCount = totalStonesCount - 8;

      this.currentPuzzleData.foilStones.splice(0, extraStonesCount);
    }

    this.currentPuzzleData.targetStones.forEach((e) => {
      this.currentPuzzleData.foilStones.push(e);
    });
    return this.currentPuzzleData.foilStones.sort(() => Math.random() - 0.5);
  }

  handleVisibilityChange = () => {
    this.audioPlayer.stopAllAudios();
    this.correctStoneAudio.pause();
  };

  convertFeedBackAudiosToList(feedbackAudios): string[] {
    return [
      feedbackAudios["fantastic"],
      feedbackAudios["great"],
      feedbackAudios["amazing"]
    ];
  }

  playCorrectAnswerFeedbackSound(feedBackIndex: number) {
    const randomNumber = Utils.getRandomNumber(1, 3).toString();
    this.audioPlayer.playFeedbackAudios(
      false,
      AUDIO_PATH_EATS,
      AUDIO_PATH_CHEERING_FUNC(randomNumber),
      AUDIO_PATH_POINTS_ADD,
      Utils.getConvertedDevProdURL(this.feedbackAudios[feedBackIndex]),
    );
    // to play the audio parrallely.
    this.correctStoneAudio.play();
  }

  resetStonePosition(
    width: number,
    pickedStone: StoneConfig,
    pickedStoneObject: StoneConfig
  ) {
    const stone = pickedStone;
    const stoneObj = pickedStoneObject;
    //Resets the previous stone letter to its original position.
    if (
      stone &&
      stoneObj &&
      stone.text &&
      typeof stoneObj.origx === "number" &&
      typeof stoneObj.origy === "number"
    ) {
      const xLimit = 50;
      const halfWidth = width / 2;

      stone.x = stone.text.length <= 3 &&
        stoneObj.origx < xLimit &&
        stoneObj.origx < halfWidth
        ? stoneObj.origx + 25
        : stoneObj.origx;
      stone.y = stoneObj.origy;
    }

    return stone;
  }

  private computeCursorDistance(posX, posY, sc): number {
    return Math.sqrt((posX - sc.x) ** 2 + (posY - sc.y) ** 2);
  }

  handlePickStoneUp(posX, posY) {
    let stoneLetter = null;
    let ctr = 0;
    for (let sc of this.foilStones) {
      const distance = this.computeCursorDistance(posX, posY, sc);
      if (distance <= 40) {
        stoneLetter = sc;
        /* Adds a unique identifier to tell which letter is which in case there are two or more of the same letter.*/
        stoneLetter['foilStoneIndex'] = ctr;
        break;
      }
      ctr++;
    };

    return stoneLetter;
  }

  handleHoveringToAnotherStone(
    posX,
    posY,
    shouldGroupLetter
  ) {
    /* Handle hovering of stones for word puzzle multi-letter select.*/
    let stoneLetter = null;
    let ctr = 0;
    for (let sc of this.foilStones) {
      const distance = this.computeCursorDistance(posX, posY, sc);

      if (distance <= 40 && shouldGroupLetter(sc.text, ctr)) {
        stoneLetter = sc;
        /* Adds a unique identifier to tell which letter is which in case there are two or more of the same letter.*/
        stoneLetter['foilStoneIndex'] = ctr;
        break;
      }
      ctr++;
    };

    return stoneLetter;
  }

  handleMovingStoneLetter(draggingStone, posX, posY) {
    const updatedStoneCoordinates = draggingStone;
    const rect = this.canvas.getBoundingClientRect();
    updatedStoneCoordinates.x = posX - rect.left;
    updatedStoneCoordinates.y = posY - rect.top;

    return updatedStoneCoordinates;
  }
}
