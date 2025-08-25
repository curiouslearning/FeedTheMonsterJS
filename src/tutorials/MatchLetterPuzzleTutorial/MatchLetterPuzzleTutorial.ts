import TutorialComponent from '../base-tutorial/base-tutorial-component';

export default class MatchLetterPuzzleTutorial extends TutorialComponent {
  private animationDuration: number = 1500; // 1.5 second animation

  constructor({ context, width, height, stoneImg, stonePosVal }: {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    stoneImg: any;
    stonePosVal: number[];
  }) {
    super(context);
    this.width = width;
    this.height = height;
    this.frame = 0;
    this.animationStartTime = 0;
    this.stonePosDetailsType = this.updateTargetStonePositions(stonePosVal);
    this.stoneImg = stoneImg
    this.animateImagePosVal = this.stonePosDetailsType.animateImagePosVal;
    this.x = this.animateImagePosVal.x;
    this.y = this.animateImagePosVal.y;
  }

  /**
   * Updates the animation frame specific to MatchLetterPuzzleTutorial
   */
  private updateMatchLetterAnimationFrame(): void {
    // Use the base class method with our specific parameters
    this.updateAnimationFrame(100, this.animationDuration);
  }

  /**
   * Main tutorial drawing method
   */
  public drawTutorial(deltaTime: number): void {
    // Update animation frame using our specific method
    this.updateMatchLetterAnimationFrame();

    if (!this.stonePosDetailsType || this.frame < 100) return;
    
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