import { TUTORIAL_HAND } from '@constants';
import TutorialComponent from '../base-tutorial/base-tutorial-component';

export default class WordPuzzleTutorial extends TutorialComponent {
  private animationDuration: number = 1500; // 1.5 second animation
  private animationStartTime: number = 0;
  public frame: number = 0;
  private stonePositions: number[][];
  private currentStoneIndex: number = 0;
  private targetStones: string[] = [];
  private isAnimatingNextStone: boolean = false;
  private stoneAnimationDelay: number = 500; // 0.5 second delay between stone animations

  constructor({ context, width, height, stoneImg, stonePositions, targetStones = [] }: {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    stoneImg: any,
    stonePositions: number[][],
    targetStones?: string[]
  }) {
    console.log('[WordPuzzleTutorial] Creating tutorial with stone positions:', stonePositions);
    super(context);
    
    this.width = width;
    this.height = height;
    this.frame = 0;
    this.animationStartTime = 0;
    this.stoneImg = stoneImg;
    
    // Wait for the tutorial hand image to load
    this.tutorialImg.onload = () => {
      console.log('[WordPuzzleTutorial] Tutorial hand image loaded');
      this.imagesLoaded = true;
      
      // Store the target stones order
      this.targetStones = targetStones;
      
      if (stonePositions && stonePositions.length > 0) {
        // Use the original order of positions as provided (matching targetStones order)
        this.stonePositions = [...stonePositions];
        console.log('[WordPuzzleTutorial] Using stone positions in target order:', {
          targetStones: this.targetStones,
          stonePositions: this.stonePositions
        });
        
        // Initialize with the first stone position
        this.initializeStoneAnimation(0);
      } else {
        console.error('[WordPuzzleTutorial] No stone positions provided');
      }
    };
    
    // Set image source after setting up the onload handler
    this.tutorialImg.src = TUTORIAL_HAND;
  }

  public drawTutorial(deltaTime: number) {
    // Make sure the tutorial image is loaded
    if (!this.imagesLoaded) {
      console.log('[WordPuzzleTutorial] Waiting for tutorial image to load...');
      return;
    }

    // Make sure we have valid stone positions and details
    if (!this.stonePosDetailsType || !this.stonePositions || this.stonePositions.length === 0) {
      console.error('[WordPuzzleTutorial] Missing required animation data:', {
        hasStonePosDetails: !!this.stonePosDetailsType,
        hasStonePositions: !!this.stonePositions,
        stonePositionsLength: this.stonePositions?.length
      });
      return;
    }
    
    console.log('[WordPuzzleTutorial] Drawing tutorial for stone', {
      currentIndex: this.currentStoneIndex,
      totalStones: this.stonePositions.length,
      frame: this.frame,
      isAnimatingNextStone: this.isAnimatingNextStone,
      stonePos: this.stonePositions[this.currentStoneIndex]
    });
    
    // Update animation based on actual time elapsed
    if (this.frame < 100) {
      if (this.animationStartTime === 0) {
        this.animationStartTime = performance.now();
      }
      const elapsed = performance.now() - this.animationStartTime;
      this.frame = Math.min(100, (elapsed / this.animationDuration) * 100);
    }

    const { dx, absdx, dy, absdy } = this.animateImagePosVal;
    const { startX, startY, endX, endY, monsterStoneDifference } = this.stonePosDetailsType;

    // Update position based on animation progress
    this.x = dx >= 0
      ? startX + (endX - startX) * (this.frame / 100)
      : startX - (startX - endX) * (this.frame / 100);
    this.y = dy >= 0
      ? startY + (endY - startY) * (this.frame / 100)
      : startY - (startY - endY) * (this.frame / 100);

    // Calculate animation progress
    const disx = this.x - endX + absdx;
    const disy = this.y - endY + absdy;
    const distance = Math.sqrt(disx * disx + disy * disy);
    const monsterStoneDifferenceInPercentage = (100 * distance / monsterStoneDifference);

    // Draw the stone drag animation
    this.animateStoneDrag({
      deltaTime,
      img: this.stoneImg,
      imageSize: this.height / 9.5,
      monsterStoneDifferenceInPercentage,
      startX, startY, endX, endY
    });

    // Check if current stone animation is complete and we should move to the next stone
    if (this.frame >= 100 && !this.isAnimatingNextStone) {
      this.isAnimatingNextStone = true;
      
      // Set a timeout to move to the next stone
      setTimeout(() => {
        let nextIndex = this.currentStoneIndex + 1;
        
        // If we've animated all stones, reset to the first one
        if (nextIndex >= this.stonePositions.length) {
          nextIndex = 0;
        }
        
        // Update position for the next stone
        this.initializeStoneAnimation(nextIndex);
        this.isAnimatingNextStone = false;
      }, this.stoneAnimationDelay);
    }
  }

  private initializeStoneAnimation(stoneIndex: number) {
    console.log('[WordPuzzleTutorial] initializeStoneAnimation called', {
      stoneIndex,
      stonePositions: this.stonePositions,
      hasStonePositions: !!this.stonePositions,
      stonePositionsLength: this.stonePositions?.length
    });

    if (!this.stonePositions || stoneIndex < 0 || stoneIndex >= this.stonePositions.length) {
      console.error(`[WordPuzzleTutorial] Invalid stone index or positions:`, {
        stoneIndex,
        hasStonePositions: !!this.stonePositions,
        length: this.stonePositions?.length
      });
      return;
    }
    
    // Make sure we're using the sorted positions
    const position = this.stonePositions[stoneIndex];
    console.log(`[WordPuzzleTutorial] Initializing animation for stone ${stoneIndex} at position:`, position);
    
    // Reset animation state
    this.frame = 0;
    this.animationStartTime = 0;
    
    // Update the current stone index before starting animation
    this.currentStoneIndex = stoneIndex;
    
    try {
      // Update the position and animation details
      this.stonePosDetailsType = this.updateTargetStonePositions(position);
      console.log('[WordPuzzleTutorial] Updated stone position details:', this.stonePosDetailsType);
      
      if (this.stonePosDetailsType) {
        this.animateImagePosVal = this.stonePosDetailsType.animateImagePosVal;
        this.x = this.animateImagePosVal.x;
        this.y = this.animateImagePosVal.y;
        console.log('[WordPuzzleTutorial] Updated animation values:', {
          x: this.x,
          y: this.y,
          animateImagePosVal: this.animateImagePosVal
        });
      } else {
        console.error('[WordPuzzleTutorial] Failed to update stone position details');
      }
    } catch (error) {
      console.error('[WordPuzzleTutorial] Error initializing stone animation:', error);
    }
  }
}
