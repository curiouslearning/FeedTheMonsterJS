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
  ASSETS_PATH_STONE_PINK_BG,
  AUDIO_PATH_ON_DRAG
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
    this.cleanup();
    this.context = context;
    this.canvas = canvas;
    this.puzzleNumber = puzzleNumber;
    this.levelData = levelData;
    this.setTargetStone(this.puzzleNumber);
    this.stonePos = gameStateService.getStonePositions();
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

  /**
   * Shuffles an array randomly
   * @param array Array to shuffle
   * @returns Shuffled array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Performance optimized stone creation
   * Properly initializes stones and prevents memory leaks
   */
  createStones(img) {
    // Clear existing stones first to prevent memory leaks
    this.disposeStones();
    
    // Create stone pool for reuse
    const stonePool = new Map();
    
    const foilStones = this.getFoilStones();
    // Randomize stone positions
    const positions = this.shuffleArray(this.stonePos);
    
    for (let i = 0; i < foilStones.length; i++) {
      // Create new stone with all required parameters
      const stone = new StoneConfig(
        this.context,
        this.canvas.width,
        this.canvas.height,
        foilStones[i],
        positions[i][0],
        positions[i][1],
        img,
        this.timerTickingInstance,
        null // tutorial instance is optional
      );
      
      // Initialize stone
      stone.initialize();
      
      // Store in pool for potential reuse
      stonePool.set(foilStones[i], stone);
      this.foilStones.push(stone);
    }
  }

  /**
   * Performance optimized draw loop
   * Only processes active stones and updates timer efficiently
   */
  draw(deltaTime: number) {
    if (this.foilStones.length === 0) return;

    // Only check animation completion once per frame
    let isAnimationComplete = true;
    const activeStones = this.foilStones.filter(stone => stone && !stone.isDisposed);
    
    // Draw only active stones
    for (const stone of activeStones) {
      if (stone.frame < 100) {
        isAnimationComplete = false;
      }
      stone.draw(deltaTime);
    }

    // Update timer only once animation is complete and game is not paused
    if (isAnimationComplete && !this.isGamePaused) {
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

  public setTargetStone(puzzleNumber) {
    this.currentPuzzleData = this.levelData.puzzles[puzzleNumber];
    this.targetStones = [...this.currentPuzzleData.targetStones];
    this.correctTargetStone = this.targetStones.join("");
  }

  public handleStoneDrop(event) {
    this.disposeStones();
  }
  public handleLoadPuzzle(event) {
    this.disposeStones();
    this.tutorial.setPuzzleNumber(event.detail.counter);
    this.puzzleNumber = event.detail.counter;
    this.setTargetStone(this.puzzleNumber);
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
    /*
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

  /**
   * Performance optimization: Proper resource cleanup
   * Ensures stones are properly disposed to prevent memory leaks
   */
  private disposeStones() {
    // Properly dispose each stone
    for (const stone of this.foilStones) {
      if (stone && !stone.isDisposed) {
        stone.dispose();
      }
    }
    this.foilStones = [];
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

  /**
   * Performance optimization: Parallel audio playback
   * Disposes stones immediately while playing audio in parallel
   */
  async playCorrectAnswerFeedbackSound(feedBackIndex: number) {
    try {
      // Dispose stones immediately - don't wait for audio
      this.disposeStones();
      
      // Play feedback audio in parallel for better performance
      const randomNumber = Utils.getRandomNumber(1, 3).toString();
      await Promise.allSettled([
        this.correctStoneAudio.play(),
        this.audioPlayer.playFeedbackAudios(
          false,
          AUDIO_PATH_EATS,
          AUDIO_PATH_CHEERING_FUNC(randomNumber),
          AUDIO_PATH_POINTS_ADD,
          Utils.getConvertedDevProdURL(this.feedbackAudios[feedBackIndex])
        )
      ]);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  cleanup() {
    // Clean up audio resources
    if (this.correctStoneAudio) {
      this.correctStoneAudio.pause();
      this.correctStoneAudio.src = '';
    }
    
    this.disposeStones();
    
    // Remove event listeners
    document.removeEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange);
    if (this.unsubscribeEvent) {
      this.unsubscribeEvent();
    }
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

  playDragAudioIfNecessary(stone: StoneConfig) {
    if (stone.frame > 99) {
      this.audioPlayer.playAudio(AUDIO_PATH_ON_DRAG);
    }
  }
}
