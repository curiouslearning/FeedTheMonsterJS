import TutorialComponent from '../base-tutorial/base-tutorial-component';

export default class WordPuzzleTutorial extends TutorialComponent {
  // Animation timing properties
  private animationStartTime = 0;
  private animationStartDelay = 0; // Track when animation frame reaches 100%
  public frame = 0;
  private animationDuration = 700; // 700ms animation (faster than original 1000ms)
  private isAnimatingNextStone = false;
  private stonePositions: number[][] = [];
  private currentStoneIndex = 0;
  // stoneImg is declared in the base class
  private imageSize: number;
  private isInitialized = false;
  private animationCompleted = false; // Track if current stone animation is complete
  private levelData: any; // Store level data for accessing prompt text

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
    this.levelData = levelData;

    // Get target stones and foil stones from level data
    if (this.levelData && stonePositions?.length > 0) {
      const currentPuzzleData = this.levelData.puzzles[0]; // Tutorial is always for first puzzle
      const targetStones = currentPuzzleData.targetStones || [];
      
      // Get foil stones from the puzzle data
      let foilStones = [];
      if (currentPuzzleData.foilStones) {
        // Clone the foil stones array to avoid modifying the original
        foilStones = [...currentPuzzleData.foilStones];
        
        // Add target stones to foil stones (as done in StoneHandler.getFoilStones)
        targetStones.forEach(stone => {
          foilStones.push(stone);
        });
      }
      
      // If we have both foil stones and target stones, calculate the correct positions
      if (foilStones.length > 0 && targetStones.length > 0) {
        // Find the correct positions for target stones, handling duplicates
        const targetStonePositions = this.findTargetStonePositions(targetStones, foilStones, stonePositions);
        this.stonePositions = targetStonePositions;
      }
      // Otherwise use the provided positions directly
      else {
        this.stonePositions = [...stonePositions];
      }
    } else {
      this.stonePositions = stonePositions?.length > 0 ? [...stonePositions] : [];
    }
    
    // Initialize the tutorial if we have positions
    if (this.stonePositions.length > 0) {
      this.isInitialized = true;
      this.initializeStoneAnimation(0);
    } else {
      this.isInitialized = true;
    }
  }

  public drawTutorial(deltaTime: number): void {
    if (!this.isInitialized) {
      return; // Don't draw anything until initialization is complete
    }

    // Update animation based on actual time elapsed
    if (this.frame < 100) {
      if (this.animationStartTime === 0) {
        this.animationStartTime = performance.now();
      }
      const elapsed = performance.now() - this.animationStartTime;
      this.frame = Math.min(100, (elapsed / this.animationDuration) * 100);
    }

    // Only start stone drag animation after initial animation frame reaches 100
    // This matches the approach used in MatchLetterPuzzleTutorial
    if (this.stonePosDetailsType && this.frame >= 100) {
      // Track time since animation frame reached 100%
      if (!this.animationStartDelay) {
        this.animationStartDelay = performance.now();
      }
      
      // Add a 500 delay before actually starting the drag animation (reduced from 500ms)
      const delayElapsed = performance.now() - this.animationStartDelay;
      if (delayElapsed < 500) {
        return; // Wait until delay is complete before starting animation
      }

      const { dx, absdx, dy, absdy } = this.animateImagePosVal;
      const { startX, startY, endX, endY, monsterStoneDifference } = this.stonePosDetailsType;

      // Use similar position update logic as MatchLetterPuzzleTutorial but with speed boost
      const speedMultiplier = 1.8; // Make animation 1.8x faster (increased from 1.2x)
      
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
      
      // Check if stone has reached the monster (near the end position)
      if (monsterStoneDifferenceInPercentage < 15 && !this.animationCompleted) {
        this.animationCompleted = true;
      }
    }

    // Check if current stone animation is complete and we should move to the next stone
    // Only trigger once when animation completes
    if (this.animationCompleted && !this.isAnimatingNextStone) {
      this.isAnimatingNextStone = true;

      // Make the transition to the next stone immediate
      setTimeout(() => {
        const nextIndex = (this.currentStoneIndex + 1) % this.stonePositions.length;
        this.initializeStoneAnimation(nextIndex);
        this.isAnimatingNextStone = false;
        this.animationCompleted = false; // Reset for next stone
      }, 50); // Minimal delay to make the tutorial extremely responsive (reduced from 100ms)
    }
  }


  public initializeStoneAnimation(stoneIndex: number): void {
    if (!this.isInitialized || !this.stonePositions?.length || stoneIndex < 0 || stoneIndex >= this.stonePositions.length) {
      return;
    }

    const position = this.stonePositions[stoneIndex];

    // Reset animation state completely
    this.frame = 0;
    this.animationStartTime = 0;
    this.animationStartDelay = 0; // Reset the animation start delay
    this.currentStoneIndex = stoneIndex;
    this.animationCompleted = false;

    try {
      // Clear any previous drawing artifacts
      if (this.context && this.width && this.height) {
        // We don't actually clear the canvas here as that would affect other game elements
        // Instead, we ensure our state is properly reset
      }

      // Set up new animation positions
      this.stonePosDetailsType = this.updateTargetStonePositions(position);

      if (this.stonePosDetailsType) {
        this.animateImagePosVal = this.stonePosDetailsType.animateImagePosVal;
        this.x = this.animateImagePosVal.x;
        this.y = this.animateImagePosVal.y;

      } else {
        // Position details failed to update
      }
    } catch (error) {
      // Handle animation initialization error
    }
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
    // Reset state
    this.isInitialized = false;
    this.animationCompleted = false;
    this.isAnimatingNextStone = false;
    this.frame = 0;
    this.animationStartTime = 0;
    this.animationStartDelay = 0;
    this.currentStoneIndex = 0;
  }
}
