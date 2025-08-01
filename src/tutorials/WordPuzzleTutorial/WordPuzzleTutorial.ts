import TutorialComponent from '../base-tutorial/base-tutorial-component';
import gameStateService from '@gameStateService';

export default class WordPuzzleTutorial extends TutorialComponent {
  // Animation timing properties
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

  /**
   * Updates the animation frame specific to WordPuzzleTutorial
   */
  private updateWordPuzzleAnimationFrame(): void {
    // Use the base class method with our specific parameters
    this.updateAnimationFrame(250, this.animationDuration);
  }

  /**
   * Main tutorial drawing method
   */
  public drawTutorial(deltaTime: number): void {
    // Update animation frame using our specific method
    this.updateWordPuzzleAnimationFrame();

    if (!this.pauseWordTutorialRendering && this.stonePosDetailsType && this.frame >= 250 && this.stonePositions?.length) {
      // Use the base class method to update stone position
      const { startX, startY, endX, endY } = this.stonePosDetailsType;
      
      // Use the base class method for position updates with a speed multiplier and get the final percentage
      const speedMultiplier = 1.5; // Make animation 1.5x faster
      const finalPercentage = this.updateStonePosition(deltaTime, speedMultiplier);
      
      // Directly call the specialized word puzzle animation method
      this.animateWordPuzzleStoneDrag({
        deltaTime: Math.min(deltaTime, this.maxDeltaTime),
        img: this.stoneImg,
        imageSize: this.imageSize,
        monsterStoneDifferenceInPercentage: finalPercentage,
        startX, startY, endX, endY
      });

      // Check if stone has reached the monster (near the end position)
      if (finalPercentage < 15) {
        this.pauseWordTutorialRendering = true;
        // Reset position to redo the dragging tutorial
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
