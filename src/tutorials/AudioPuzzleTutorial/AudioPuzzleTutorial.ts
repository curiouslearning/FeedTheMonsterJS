import TutorialComponent from '../base-tutorial/base-tutorial-component';

export default class AudioPuzzleTutorial extends TutorialComponent {
  private animationDuration: number = 1500; // 1.5 second animation
  public stonePosVal: number[];

  constructor(options: {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    stoneImg: any,
    stonePosVal: number[],
  }) {
    super(options.context);
    this.width = options.width;
    this.height = options.height;
    this.stoneImg = options.stoneImg;
    this.stonePosVal = options.stonePosVal;
    this.frame = 0;
    this.animationStartTime = 0;
    this.stonePosDetailsType = this.updateTargetStonePositions(this.stonePosVal);
    this.animateImagePosVal = this.stonePosDetailsType.animateImagePosVal;
    this.x = this.animateImagePosVal.x;
    this.y = this.animateImagePosVal.y;
    // Always inject hand pointer on creation
    this.injectHandPointer();
  }

  /**
   * Updates the animation frame specific to AudioPuzzleTutorial
   */
  private updateAudioPuzzleAnimationFrame(): void {
    // Use the base class method with our specific parameters
    this.updateAnimationFrame(100, this.animationDuration);
  }

  public drawTutorial(deltaTime: number) {
    // Update animation frame using our specific method
    this.updateAudioPuzzleAnimationFrame();

    if (this.stonePosDetailsType && this.frame >= 100) {
      // Use the base class method to update stone position
      const { startX, startY, endX, endY } = this.stonePosDetailsType;
      
      // Use the base class method for position updates and get the final percentage
      const finalPercentage = this.updateStonePosition(deltaTime);
      
      // Call the animation method with the calculated percentage
      this.animateStoneDrag({
        deltaTime: Math.min(deltaTime, this.maxDeltaTime),
        img: this.stoneImg,
        imageSize: this.height / 9.5,
        monsterStoneDifferenceInPercentage: finalPercentage,
        startX, startY, endX, endY
      });
    }
  }
}