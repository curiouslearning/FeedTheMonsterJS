import { StoneConfig } from "../common/stone-config";
import { EventManager } from "../events/EventManager";
import { Tutorial } from "./tutorial";
import { AudioPlayer } from "./audio-player";
import { VISIBILITY_CHANGE } from "../common/event-names";
import { Utils } from "../common/utils";
import { TimerTicking } from "./timer-ticking";
import { GameScore } from "../data/game-score";

export default class StoneHandler extends EventManager {
  public context: CanvasRenderingContext2D;
  public canvas: { width: number; height?: number };
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

  public tutorial: Tutorial;
  correctTargetStone: string;
  stonebg: HTMLImageElement;
  public audioPlayer: AudioPlayer;
  public feedbackAudios: string[];
  public timerTickingInstance: TimerTicking;
  isGamePaused: boolean = false;
  constructor(
    context: CanvasRenderingContext2D,
    canvas: { width: number; height?: number },
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

    this.feedbackAudios = this.convertFeedBackAudiosToList(feedbackAudios);
    this.puzzleStartTime = new Date();
    this.tutorial = new Tutorial(
      context,
      canvas.width,
      canvas.height,
      puzzleNumber
    );
    this.stonebg = new Image();
    this.stonebg.src = "./assets/images/stone_pink_v02.png";
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
  }

  createStones(img) {
    const foilStones = this.getFoilStones();
    for (var i = 0; i < foilStones.length; i++) {
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
    for (var i = 0; i < this.foilStones.length; i++) {
      this.foilStones[i].draw(deltaTime);
    }

    if (
      this.foilStones[this.foilStones.length - 1].frame >= 100 &&
      !this.isGamePaused
    ) {
      this.timerTickingInstance.update(deltaTime);
    }
  }

  initializeStonePos() {
    var offsetCoordinateValue = 32;
    
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
  public isDroppedStoneCorrect(droppedStone: string) {
    if (droppedStone == this.correctTargetStone) {
      return true;
    } else {
      return false;
    }
  }

  public handleStoneDrop(event) {
    // this.isStoneDropped = true;
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
    document.removeEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
    this.unregisterEventListener();
  }

  public isStoneDroppedCorrectForLetterOnly(
    droppedStone: string,
    feedBackIndex: number
  ): boolean {
    if (droppedStone == this.correctTargetStone) {
      this.playCorrectAnswerFeedbackSound(feedBackIndex);
      return true;
    } else {
      this.audioPlayer.playFeedbackAudios(false,"./assets/audios/Eat.mp3", "./assets/audios/Disapointed-05.mp3","./assets/audios/MonsterSpit.mp3");
      return false;
    }
  }

  public isStoneDroppedCorrectForLetterInWord(
    droppedStone: string,
    feedBackIndex: number
  ): boolean {
    
    if (droppedStone == this.correctTargetStone) {
      this.playCorrectAnswerFeedbackSound(feedBackIndex);
      return true;
    } else {
      this.audioPlayer.playFeedbackAudios(false, "./assets/audios/Eat.mp3","./assets/audios/Disapointed-05.mp3","./assets/audios/MonsterSpit.mp3");
      return false;
    }
  }

  public isStonDroppedCorrectForWord(
    droppedStone: string,
    feedBackIndex: number
  ): boolean {
    if (
      droppedStone == this.correctTargetStone.substring(0, droppedStone.length)
    ) {
      if (droppedStone == this.getCorrectTargetStone()) {
        this.playCorrectAnswerFeedbackSound(feedBackIndex);
      } else {
        this.audioPlayer.playFeedbackAudios(
          false,
          "./assets/audios/Eat.mp3",
          "./assets/audios/Cheering-02.mp3"
        );
      }
      return true;
    } else {
      return false;
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
  };

  convertFeedBackAudiosToList(feedbackAudios): string[] {
    let feedBackAudioArray = [];
    feedBackAudioArray.push(
      feedbackAudios["fantastic"],
      feedbackAudios["great"]
    );
    return feedBackAudioArray;
  }

  setGamePause(isGamePaused:boolean){
    this.isGamePaused  = isGamePaused; 
  }

  playCorrectAnswerFeedbackSound(feedBackIndex: number) {
    const randomNumber = Utils.getRandomNumber(1, 3).toString();
    // Play both "Eat.mp3" and the "CorrectStoneFinal.mp3" sound simultaneously
    this.audioPlayer.playFeedbackAudios(false, "assets/audios/CorrectStoneFinal.mp3");
    this.audioPlayer.playFeedbackAudios(
      false,
      "./assets/audios/Eat.mp3",
      `./assets/audios/Cheering-0${randomNumber}.mp3`,
      Utils.getConvertedDevProdURL(this.feedbackAudios[feedBackIndex]),
      "assets/audios/PointsAdd.wav"

    );
  }
}
