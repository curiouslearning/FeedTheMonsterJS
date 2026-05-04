import TutorialComponent from '../base-tutorial/base-tutorial-component';
import gameStateService from '@gameStateService';
import { StoneConfig } from '@common';

export default class WordPuzzleTutorial extends TutorialComponent {
  // Animation timing properties
  private animationDuration = 1500; // 1.5 second animation same with match letter puzzle
  private stonePositions: Array<StoneConfig>;
  private nextLetterIndex = 0;
  // stoneImg is declared in the base class
  private imageSize: number;
  private pauseWordTutorialRendering: boolean = false; // Track if current stone animation is complete
  private targetText: string;
  private unsubscribeSubmittedLettersCountHandler: () => void;

  constructor({
    context,
    width,
    height,
    stoneImg,
    stonePositions,
    targetText
  }: {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    stoneImg: CanvasImageSource;
    stonePositions: Array<StoneConfig>;
    targetText: string;
  }) {
    super(context);

    this.width = width;
    this.height = height;
    this.stoneImg = stoneImg;
    this.imageSize = height / 9.5;
    this.targetText = targetText;
    this.stonePositions = stonePositions;
    this.nextLetterIndex = this.getNextLetterIndex(targetText, stonePositions, {});
    this.initializeStoneAnimation(this.stonePositions[this.nextLetterIndex]);
    
    // Always inject hand pointer on creation
    this.injectHandPointer();

    this.unsubscribeSubmittedLettersCountHandler = gameStateService.subscribe(
      gameStateService.EVENTS.WORD_PUZZLE_SUBMITTED_LETTERS_COUNT,
      (eventData) => {
        this.handleNextWordLetter(eventData);
      }
    )
  }

  private handleNextWordLetter({ droppedHistory } : {
    droppedHistory: { [key: number]: string }
  }): void {
    //Get the index of the next stone letter from stonePositions array.
    this.nextLetterIndex = this.getNextLetterIndex(this.targetText, this.stonePositions, droppedHistory);
    this.initializeStoneAnimation(this.stonePositions[this.nextLetterIndex]);
  }

  private getNextLetterIndex(
    word: string,
    stonePositions: Array<StoneConfig>,
    droppedHistory: {} | { [key:number]: string }
  ): number {
    // 1. Determine the next letter index based on droppedHistory
    const nextIndex = Object.keys(droppedHistory).length;
    const nextChar = word[nextIndex];

    // 2. Find the first unused stone that matches the next letter
    for (let stoneArrIndex = 0; stoneArrIndex < stonePositions.length; stoneArrIndex++) {
      if (stonePositions[stoneArrIndex].text === nextChar && !(stoneArrIndex in droppedHistory)) {
        // Returns the array index of the next letter
        return stoneArrIndex;
      }
    }

    /**
     * NOTE: This should almost never happen. If reached, it indicates:
     * - The wrong parameters were submitted, or
     * - The word and stonePositions list are misaligned.
     * 
     * To keep the tutorial running safely, we return a default stone index (0).
     * This prevents runtime crashes, but the underlying level configuration is likely invalid.
     */
    return 0; // safe default fallback
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
        // Reset position to redo the dragging tutorial
        this.initializeStoneAnimation(this.stonePositions[this.nextLetterIndex]);
      }
    }
  }

  public initializeStoneAnimation(foilStoneObj: StoneConfig): void {
    //Pause the tutorial guide animation.
    this.pauseWordTutorialRendering = true;

    // Reset animation state completely
    this.frame = 0;
    this.animationStartTime = 0;

    // Set up new animation positions
    const {x, y} = foilStoneObj;
    this.stonePosDetailsType = this.updateTargetStonePositions([x, y]);

    if (this.stonePosDetailsType) {
      this.animateImagePosVal = this.stonePosDetailsType.animateImagePosVal;
      this.x = this.animateImagePosVal.x;
      this.y = this.animateImagePosVal.y;
    }

    //Resume the tutorial guide animation.
    this.pauseWordTutorialRendering = false;
  }

  public dispose(): void {
    // Reset states
    this.frame = 0;
    this.animationStartTime = 0;
    this.nextLetterIndex = 0;
    this.pauseWordTutorialRendering = false;
    this.unsubscribeSubmittedLettersCountHandler();

    //Call the base class dispose to remove hand pointer.
    super.dispose();
  }
}
