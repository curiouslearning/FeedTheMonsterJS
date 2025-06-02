import TutorialComponent from '../base-tutorial/base-tutorial-component';
import gameStateService from '@gameStateService';

export default class WordPuzzleTutorial extends TutorialComponent {
  // Animation timing properties
  private animationStartTime = 0;
  private animationStartDelay = 0; // Track when animation frame reaches 100%
  public frame = 0;
  private animationDuration = 1000; // 1 second animation (reduced from 1.2s)
  private initialDelay = 200; // 0.2 second initial delay (reduced from 0.5s)
  private stoneAnimationDelay = 100; // 0.1 second delay between stone animations (reduced from 0.3s)
  private isAnimatingNextStone = false;
  private stonePositions: number[][] = [];
  private currentStoneIndex = 0;
  // stoneImg is declared in the base class
  private imageSize: number;
  private isInitialized = false;
  private initializationTimer: number | null = null;
  private animationCompleted = false; // Track if current stone animation is complete
  private stonesReady = false; // Track if stones are in their final positions

  constructor({
    context,
    width,
    height,
    stoneImg,
    stonePositions,
    targetStones = []
  }: {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    stoneImg: CanvasImageSource;
    stonePositions: number[][];
    targetStones?: string[];
  }) {
    super(context);

    this.width = width;
    this.height = height;
    this.stoneImg = stoneImg;
    this.imageSize = height / 9.5;

    // Store stone positions and set up a simple delay
    if (stonePositions?.length > 0) {
      this.stonePositions = [...stonePositions];
      console.log('[WordPuzzleTutorial] Constructor called, using simple timer approach');

      // Use a simple timer approach like MatchLetterPuzzleTutorial
      // This gives stones time to be positioned before starting the tutorial
      const initialDelay = 4500; // 4.5 second delay to ensure stones are positioned

      console.log('[WordPuzzleTutorial] Setting up timer for', initialDelay, 'ms');

      this.stonesReady = true;
      this.isInitialized = true;
      this.initializeStoneAnimation(0);

    } else {
      this.stonePositions = [];
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
        console.log('[WordPuzzleTutorial] Starting delay before animation');
      }
      
      // Add a 500ms delay before actually starting the drag animation
      const delayElapsed = performance.now() - this.animationStartDelay;
      if (delayElapsed < 500) {
        return; // Wait until delay is complete before starting animation
      }

      const { dx, absdx, dy, absdy } = this.animateImagePosVal;
      const { startX, startY, endX, endY, monsterStoneDifference } = this.stonePosDetailsType;

      // Use similar position update logic as MatchLetterPuzzleTutorial but with speed boost
      const speedMultiplier = 1.2; // Make animation 1.2x faster
      
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
      
      // Draw the stone drag animation with word puzzle specific enhancements
      this.animateStoneDrag({
        deltaTime,
        img: this.stoneImg,
        imageSize: this.imageSize,
        monsterStoneDifferenceInPercentage,
        startX,
        startY,
        endX,
        endY,
        isWordPuzzle: true // Enable word puzzle specific animation
      });
      
      // Check if stone has reached the monster (near the end position)
      if (monsterStoneDifferenceInPercentage < 15 && !this.animationCompleted) {
        this.animationCompleted = true;
        console.log('[WordPuzzleTutorial] Stone reached destination, animation complete');
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
      }, 100); // Minimal delay to make the tutorial extremely responsive
    }
  }


  private initializeStoneAnimation(stoneIndex: number): void {
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

        // Log for debugging
        console.log(`[WordPuzzleTutorial] Initializing stone ${stoneIndex} animation from (${this.x}, ${this.y}) to (${this.stonePosDetailsType.endX}, ${this.stonePosDetailsType.endY})`);
      } else {
        console.error('[WordPuzzleTutorial] Failed to update stone position details');
      }
    } catch (error) {
      console.error('[WordPuzzleTutorial] Error initializing stone animation:', error);
    }
  }

  /**
   * Clean up resources when the tutorial is no longer needed
   */
  public dispose(): void {
    // Clear any pending timers
    if (this.initializationTimer !== null) {
      window.clearTimeout(this.initializationTimer);
      this.initializationTimer = null;
    }

    // Clear any other setTimeout timers that might be active
    // This is important to prevent any delayed animations from starting after disposal

    // Log disposal for debugging
    console.log('[WordPuzzleTutorial] Tutorial disposed, all resources cleaned up');

    // Reset state
    this.isInitialized = false;
    this.stonesReady = false; // Reset to initial state
    this.animationCompleted = false;
    this.isAnimatingNextStone = false;
    this.frame = 0;
    this.animationStartTime = 0;
    this.currentStoneIndex = 0;
  }
}
