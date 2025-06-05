import { StoneConfig, VISIBILITY_CHANGE } from '@common'
import { EventManager } from "@events";
import { AudioPlayer } from "@components";
import {
  ASSETS_PATH_STONE_PINK_BG,
  AUDIO_PATH_ON_DRAG
} from '@constants';
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';

/**
 * StoneHandler is responsible for creating, drawing, and positioning stones.
 * It handles the UI aspects of stones but not their game logic.
 */
export default class StoneHandler extends EventManager {
  private offsetCoordinateValue: number;
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
  correctTargetStone: string;
  stonebg: HTMLImageElement;
  public audioPlayer: AudioPlayer;
  public originalWidth: any;
  public originalHeight:any;
  public stonesHasLoaded: boolean = false;
  public activeStones: Array<StoneConfig> = new Array<StoneConfig>();

  constructor(
    context: CanvasRenderingContext2D,
    canvas,
    puzzleNumber: number,
    levelData,
  ) {
    super({
      stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
      loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event),
    });
    this.cleanup();
    this.offsetCoordinateValue = 32; //Default value used to offset stone coordinates.
    this.context = context;
    this.canvas = canvas;
    this.originalWidth = this.canvas.width;
    this.originalHeight = this.canvas.height;
    this.puzzleNumber = puzzleNumber;
    this.levelData = levelData;
    this.setTargetStone(this.puzzleNumber);
    this.stonePos = this.getRandomizedStonePositions(canvas.width, canvas.height)
    this.puzzleStartTime = new Date();
    this.stonebg = new Image();
    this.stonebg.src = ASSETS_PATH_STONE_PINK_BG;
    this.stonebg.onload = (e) => {
      this.createStones(this.stonebg);
    };
    this.audioPlayer = new AudioPlayer();
    document.addEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
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

    const foilStones = this.getFoilStones();
    // Randomize stone positions
    const positions = this.shuffleArray(this.stonePos);
    const scale = gameSettingsService.getDevicePixelRatioValue();
    this.canvas.width = this.canvas.clientWidth * scale;
    this.canvas.height = this.canvas.clientHeight * scale;
    this.context.scale(scale, scale);

    for (let i = 0; i < foilStones.length; i++) {
      // Create new stone with all required parameters
      const stone = new StoneConfig(
        this.context,
        this.canvas.width,
        this.canvas.height,
        foilStones[i],
        positions[i][0],
        positions[i][1],
        img
      );

      // Initialize stone
      stone.initialize();

      //Publish stone details, image and level data for stone tutorial only at the first puzzle segment.
      if (this.currentPuzzleData.segmentNumber === 0) {
        const isWordPuzzle = this.levelData?.levelMeta?.levelType === 'Word';
        // For letter puzzles, publish the single stone position
        if (foilStones[i] == this.correctTargetStone) {
          gameStateService.publish(gameStateService.EVENTS.CORRECT_STONE_POSITION, {
            stonePosVal: positions[i],
            img,
            levelData: this.levelData
          });
        }

        // For word puzzles, publish all stone information at the end of stone creation
        console.log('positions', positions)
        console.log('[...this.targetStones]', [...this.targetStones])
        console.log('[...foilStones]', [...foilStones])
        if (isWordPuzzle) {
          gameStateService.publish(
            gameStateService.EVENTS.CORRECT_STONE_POSITION, 
            {
              stonePosVal: positions,         // All stone positions
              img,                           // Stone image
              levelData: this.levelData,      // Level data
              targetStones: [...this.targetStones], // Target letter stones in order
              foilStones: [...foilStones]    // All foil letter stones (including target letters)
            }
          );
        } 
      }

      this.foilStones.push(stone);
    }
    this.activeStones = this.foilStones.filter(stone => stone && !stone.isDisposed);
  }

  /**
   * Performance optimized draw loop
   * Only processes active stones and updates timer efficiently
   */
  draw() {
    if (this.foilStones.length === 0) return;

    for (const stone of this.foilStones) {
      stone.draw();
    }

    !this.stonesHasLoaded && this.areStonesReadyForPlay();
  }

  drawWordPuzzleLetters(
    shouldHideStoneChecker: (index: number) => boolean,
    groupedLetters: {} | { [key: number]: string }
  ): void {
    for (let i = 0; i < this.foilStones.length; i++) {
      if (shouldHideStoneChecker(i)) {
        this.foilStones[i].draw(
          Object.keys(groupedLetters).length > 1 && groupedLetters[i] !== undefined
        );
      }
    }
  }

  private areStonesReadyForPlay() {
    /* if stone frames are above 100, it means it has properly loaded in its default position
        and ready to be move by the user.
    */
    if (this.foilStones[this.foilStones.length - 1].frame >= 100) {
      this.stonesHasLoaded = true;
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
    this.puzzleNumber = event.detail.counter;
    this.setTargetStone(this.puzzleNumber);
    this.createStones(this.stonebg);
  }

  public dispose() {
    this.canvas.width = this.originalWidth;
    this.canvas.height = this.originalHeight;
    document.removeEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
    this.unregisterEventListener();
  }

  public cleanup() {
    // Clean up audio resources
    this.disposeStones();

    // Remove event listeners
    document.removeEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange);
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
  };

  /**
   * Performance optimization: Parallel audio playback
   * Disposes stones immediately while playing audio in parallel
   */
  async playCorrectAnswerFeedbackSound(feedBackIndex: number) {
    try {
      // Dispose stones immediately - don't wait for audio
      this.disposeStones();
    } catch (error) {
      console.warn('Audio playback failed:', error);
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

  /**
   * Hides a stone by moving it off-screen
   * @param stone The stone to hide
   */
  hideStone(stone: StoneConfig) {
    if (stone) {
      stone.x = -999;
      stone.y = -999;
    }
  }

  private getRandomizedStonePositions(widthVal, heightVal) {

    /**
     * Breakpoint width for stone positioning (in pixels).
     * Standard layout > 540px, compact layout ≤ 540px.
     * 
     * @type {number}
     * @default 540
     */
    const deviceWidth = 540;

    /**
     * Calculates coordinate factors for stone positioning based on screen width.
     * Temporary solution until Rive animation integration.
     * 
     * @param {number} defaultVal - Factor for screens > 540px (2.0-5.0)
     * @param {number} smallerVal - Factor for screens ≤ 540px (1.2-1.5x larger)
     * @returns {number} Calculated coordinate factor
     * 
     * @todo Replace with Rive-based dynamic positioning
     */
    const setCoordinateFactor = (defaultVal, smallerVal) => {
      return deviceWidth > widthVal ? smallerVal : defaultVal;
    }

    /*
    *  If rive width and height are not properly set,
    *  use the original canvas width and height instead.
    *  this is the default coordinates
    */

    // Separate coordinate factors for egg monster due to different dimensionse
    const eggMonsterCoordinateFactors = [
      [6.2, 1.8], //Left stone 2nd - upper
      [7.5, 1.5], //Left stone in 3rd
      [setCoordinateFactor(5.8, 6.2), 2.5], //Left stone 1 (first stone on the top left )
      [6.4, 1.1], //Left stone 4 - very bottom
      [setCoordinateFactor(1.2, 1.5), 1], //Middle stone that is located right below the monster.
      [[2.3, 1.9], 1.5], //Right stone 1 - upper
      [[setCoordinateFactor(2.8, 2.2), 2.1], 2.4], //Right stone 2 - increased horizontal spacing
      [[setCoordinateFactor(4.5, 3.2), 1.5], 1.8],  //Right stone 3 - moved further right and down
    ];

    // Choose coordinate factors based on monster type
    const coordinateFactors = eggMonsterCoordinateFactors;

    const randomizedStonePositions = coordinateFactors.map(
      (coordinatesFactors: [number[] | number, number], index) => {
        const factorX = coordinatesFactors[0];
        const factorY = coordinatesFactors[1];
        let coordinateX = Array.isArray(factorX)
          ? ((widthVal / factorX[0]) + (widthVal / factorX[1]))
          : (widthVal / factorX);
        let coordinateY = heightVal / factorY;
        const offsetXAdjustment = index < 4 ? 25 : 0; //Only use +25 on stones on the left side.
        const posX = coordinateX - this.offsetCoordinateValue;
        const posY = coordinateY - this.offsetCoordinateValue;

        return [
          posX + offsetXAdjustment,
          posY,
        ]
      }
    ).sort(() => Math.random() - 0.5);

    return randomizedStonePositions;
  }
}