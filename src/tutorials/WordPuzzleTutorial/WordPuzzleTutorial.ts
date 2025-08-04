import TutorialComponent from '../base-tutorial/base-tutorial-component';
import gameStateService from '@gameStateService';

export default class WordPuzzleTutorial extends TutorialComponent {
  // Animation timing properties
  private animationStartTime = 0;
  public frame = 0;
  private animationDuration = 700; // 700ms animation (faster than original 1000ms)
  private stonePositions: number[][] = [];
  private currentStoneIndex = 0;
  // stoneImg is declared in the base class
  private imageSize: number;
  private pauseWordTutorialRendering: boolean = false; // Track if current stone animation is complete

  private unsubscribeSubmittedLettersCountHandler: () => void;

  constructor({
    context,
    width,
    height,
    stoneImg,
    stonePositions,
    levelData = null
  }: {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    stoneImg: CanvasImageSource;
    stonePositions: number[][];
    levelData?: any;
  }) {
    super(context);

    this.width = width;
    this.height = height;
    this.stoneImg = stoneImg;
    this.imageSize = height / 9.5;
    this.getFoilAndStonesFromData(stonePositions, levelData);
    this.initializeStoneAnimation(0);
    this.currentStoneIndex = 0;
    // Always inject hand pointer on creation
    this.injectHandPointer();

    this.unsubscribeSubmittedLettersCountHandler = gameStateService.subscribe(
      gameStateService.EVENTS.WORD_PUZZLE_SUBMITTED_LETTERS_COUNT,
      (droppedLettersCount: number) => {
        this.pauseWordTutorialRendering = true;
        this.currentStoneIndex = droppedLettersCount % this.stonePositions.length;
        this.initializeStoneAnimation(this.currentStoneIndex);
      }
    )
  }

  private getFoilAndStonesFromData(stonePositions, levelData) {
    // Get target stones and foil stones from level data
    if (levelData && stonePositions?.length > 0) {
      const currentPuzzleData = levelData.puzzles[0]; // Tutorial is always for first puzzle
      const targetStones = currentPuzzleData.targetStones || [];

      // Get foil stones from the puzzle data
      // Clone the foil stones array to avoid modifying the original
      const foilStones = [...currentPuzzleData.foilStones];

      // If we have both foil stones and target stones, calculate the correct positions
      this.stonePositions = foilStones.length > 0 && targetStones.length > 0
        // Find the correct positions for target stones, handling duplicates
        ? this.findTargetStonePositions(targetStones, foilStones, stonePositions)
        // Otherwise use the provided positions directly
        : [ ...stonePositions ];
    } else {
      this.stonePositions = stonePositions?.length > 0 ? [...stonePositions] : [];
    }
  }

  public drawTutorial(deltaTime: number): void {
    // Update animation based on actual time elapsed
    if (this.frame < 250) {
      if (this.animationStartTime === 0) {
        this.animationStartTime = performance.now();
      }
      const elapsed = performance.now() - this.animationStartTime;
      // Use a frame-based delay system instead of relying on time-based checks like performance.now().
      // The frame progresses based on elapsed time, scaled by animationDuration,
      // and is clamped at a max of 250 to act as a hard delay cap.
      // Once frame reaches 250, we treat the delay as completed and allow the next logic to run.
      this.frame = Math.min(250, (elapsed / this.animationDuration) * 100);
    }

    // Only start stone drag animation after initial animation frame reaches 250
    // This matches the approach used in MatchLetterPuzzleTutorial
    if (!this.pauseWordTutorialRendering && this.stonePosDetailsType && this.frame >= 250) {
      const { dx, absdx, dy, absdy } = this.animateImagePosVal;
      const { startX, startY, endX, endY, monsterStoneDifference } = this.stonePosDetailsType;

      // Use similar position update logic as MatchLetterPuzzleTutorial but with speed boost
      const speedMultiplier = 1.5; // Make animation 1.5x faster (increased from 1.2x)

      this.x = dx >= 0
        ? this.x + absdx * deltaTime * speedMultiplier
        : this.x - absdx * deltaTime * speedMultiplier;
      this.y = dy >= 0
        ? this.y + absdy * deltaTime * speedMultiplier
        : this.y - absdy * deltaTime * speedMultiplier;

      // Use EXACTLY the same distance calculation as MatchLetterPuzzleTutorial
      const disx = this.x - endX + absdx;
      const disy = this.y - endY + absdy;
      const distance = Math.sqrt(disx * disx + disy * disy);
      const monsterStoneDifferenceInPercentage = (100 * distance / monsterStoneDifference);
      // Directly call the specialized word puzzle animation method
      // This reduces conditional complexity in the base class
      this.animateWordPuzzleStoneDrag({
        deltaTime,
        img: this.stoneImg,
        imageSize: this.imageSize,
        monsterStoneDifferenceInPercentage,
        startX,
        startY,
        endX,
        endY
      });

      //Check if stone has reached the monster (near the end position)
      if (monsterStoneDifferenceInPercentage < 15) {
        this.pauseWordTutorialRendering = true;
        //Reset position to redo the dragging tutorial.
        this.initializeStoneAnimation(this.currentStoneIndex);
      }
    }
  }


  public initializeStoneAnimation(stoneIndex: number): void {
    if (!this.stonePositions?.length || stoneIndex < 0 || stoneIndex >= this.stonePositions.length) {
      return;
    }

    const position = this.stonePositions[stoneIndex];
    // Reset animation state completely
    this.frame = 0;
    this.animationStartTime = 0;
    this.currentStoneIndex = stoneIndex;

    // Set up new animation positions
    this.stonePosDetailsType = this.updateTargetStonePositions(position);

    if (this.stonePosDetailsType) {
      this.animateImagePosVal = this.stonePosDetailsType.animateImagePosVal;
      this.x = this.animateImagePosVal.x;
      this.y = this.animateImagePosVal.y;
    }

    this.pauseWordTutorialRendering = false;
  }

  /**
   * Clean up resources when the tutorial is no longer needed
   */
  /**
   * Find the correct positions for target stones, handling duplicate letters
   * @param targetStones Array of target stone characters
   * @param foilStones Array of all stone characters including targets
   * @param positions Array of positions for all stones
   * @returns Array of positions for target stones in order
   */
  private findTargetStonePositions(targetStones: string[], foilStones: string[], positions: number[][]): number[][] {
    const usedIndices = new Set<number>();
    return targetStones.map(targetChar => {
      // Find the index of the first unused occurrence of this character
      const targetIndex = foilStones.findIndex((stone, index) => 
        stone === targetChar && !usedIndices.has(index)
      );
      if (targetIndex !== -1) {
        usedIndices.add(targetIndex); // Mark this index as used
        return positions[targetIndex];
      }
      return null; // Handle case where character isn't found (shouldn't happen)
    }).filter(position => position !== null); // Filter out any nulls
  }

  public dispose(): void {
    // Reset states
    this.frame = 0;
    this.animationStartTime = 0;
    this.currentStoneIndex = 0;
    this.pauseWordTutorialRendering = false;
    this.unsubscribeSubmittedLettersCountHandler();
  }
}
