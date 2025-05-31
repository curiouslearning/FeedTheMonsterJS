import { StoneConfig, VISIBILITY_CHANGE, Utils } from '@common'
import { EventManager } from "@events";
import { AudioPlayer, TimerTicking } from "@components"
import { GameScore } from "@data";
import {
  ASSETS_PATH_STONE_PINK_BG,
  AUDIO_PATH_ON_DRAG
} from '@constants';
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import { FeedbackType } from '@gamepuzzles';

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
  public showTutorial: boolean =
    GameScore.getDatafromStorage().length == undefined ? true : false;
  correctTargetStone: string;
  stonebg: HTMLImageElement;
  public audioPlayer: AudioPlayer;
  public timerTickingInstance: TimerTicking;
  isGamePaused: boolean = false;
  public originalWidth: any;
  public originalHeight:any;
  private unsubscribeEvent: () => void;

  constructor(
    context: CanvasRenderingContext2D,
    canvas,
    puzzleNumber: number,
    levelData,
    timerTickingInstance: TimerTicking
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
      (isGamePaused: boolean) => {
        this.isGamePaused = isGamePaused;
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
        img,
        this.timerTickingInstance
      );

      // Initialize stone
      stone.initialize();

      // Debug logs for word puzzle tutorial trigger investigation
      console.log('[StoneHandler][Debug] segmentNumber:', this.currentPuzzleData.segmentNumber);
      const isWordPuzzle = this.levelData?.levelMeta?.levelType === 'Word';
      console.log('[StoneHandler][Debug] isWordPuzzle:', isWordPuzzle);
      console.log('[StoneHandler][Debug] targetStones:', this.targetStones, 'foilStones:', foilStones);

      //Publish stone details, image and level data for stone tutorial only at the first puzzle segment.
      if (this.currentPuzzleData.segmentNumber === 0) {
        // For word puzzles, we need to collect all target stone positions
        const isWordPuzzle = this.levelData?.levelMeta?.levelType === 'Word';
        
        if (isWordPuzzle) {
          // For word puzzles, collect all target stone positions in the correct order
          console.log('[StoneHandler][Debug] i:', i, 'foilStones[i]:', foilStones[i], 'in targetStones:', this.targetStones.includes(foilStones[i]));
          
          // Only process this once after all stones are created
          if (i === foilStones.length - 1) {
            const targetStonePositions = [];
            
            // Find positions for all target stones in the order they appear in targetStones
            for (let targetChar of this.targetStones) {
              const targetIndex = foilStones.indexOf(targetChar);
              if (targetIndex !== -1) {
                targetStonePositions.push(positions[targetIndex]);
              }
            }
            
            console.log('[StoneHandler] Collected target stone positions in order:', {
              targetStones: this.targetStones,
              foilStones: foilStones,
              positions: positions,
              targetStonePositions: targetStonePositions
            });
            
            // Publish all target stone positions for word puzzles (delayed to ensure tutorial subscription)
            setTimeout(() => {
              console.log('[StoneHandler] Publishing CORRECT_STONE_POSITION (delayed)', {
                stonePosVal: targetStonePositions,
                img,
                levelData: this.levelData
              });
              // Publish the event with both positions and target stones in order
              const eventData = {
                stonePosVal: targetStonePositions,
                img,
                levelData: this.levelData,
                targetStones: [...this.targetStones] // Make a copy to ensure we don't modify the original
              };
              
              console.log('[StoneHandler] Publishing CORRECT_STONE_POSITION with target order:', {
                targetStones: this.targetStones,
                stonePosVal: targetStonePositions
              });
              
              gameStateService.publish(
                gameStateService.EVENTS.CORRECT_STONE_POSITION, 
                eventData
              );
            }, 200);
          }
        } else if (foilStones[i] == this.correctTargetStone) {
          // For letter puzzles, just publish the single stone position
          gameStateService.publish(gameStateService.EVENTS.CORRECT_STONE_POSITION, {
            stonePosVal: positions[i],
            img,
            levelData: this.levelData
          });
        }
      }

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
      stone.draw();
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
    this.puzzleNumber = event.detail.counter;
    this.setTargetStone(this.puzzleNumber);
    this.createStones(this.stonebg);
  }

  public dispose() {
    this.canvas.width = this.originalWidth;
    this.canvas.height = this.originalHeight;
    this.unsubscribeEvent();
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
    if (this.unsubscribeEvent) {
      this.unsubscribeEvent();
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
    const baseCoordinateFactors = [
      [5, 1.9], //Left stone 1 - upper
      [7, 1.5], //Left stone 2
      [setCoordinateFactor(4.3, 4.5), 1.28], //Left stone 3
      [6.4, 1.1], //Left stone 4 - very bottom
      [setCoordinateFactor(2, 1.3), 1.07], //Middle stone that is located right below the monster.
      [[2.3, 2.1], 1.9], //Right stone 1 - upper
      [[setCoordinateFactor(2.8, 2.5), 2], 1.2], //Right stone 2
      [[setCoordinateFactor(3, 2.4), 2.1], 1.42],  //Right stone 3
    ];

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
