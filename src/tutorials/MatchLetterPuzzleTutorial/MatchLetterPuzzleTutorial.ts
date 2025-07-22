import TutorialComponent from '../base-tutorial/base-tutorial-component';

export default class MatchLetterPuzzleTutorial extends TutorialComponent {
  private animationDuration: number = 1500; // 1.5 second animation
  private animationStartTime: number = 0;
  public frame: number = 0;
  private maxDeltaTime: number = 33; // Cap deltaTime to 33ms (approx 30fps) for consistent animation

  constructor({ context, width, height, stoneImg, stonePosVal }: {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    stoneImg: any,
    stonePosVal: number[],
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
   * Updates the animation frame based on elapsed time
   */
  private updateAnimationFrame(): void {
    if (this.frame < 100) {
      if (this.animationStartTime === 0) {
        this.animationStartTime = performance.now();
      }
      const elapsed = performance.now() - this.animationStartTime;
      this.frame = Math.min(100, (elapsed / this.animationDuration) * 100);
    }
  }

  /**
   * Calculates the next position of the stone based on delta time
   */
  private calculateNextPosition(cappedDeltaTime: number): { nextX: number, nextY: number } {
    const { dx, absdx, dy, absdy } = this.animateImagePosVal;
    
    const nextX = dx >= 0
      ? this.x + absdx * cappedDeltaTime
      : this.x - absdx * cappedDeltaTime;
    const nextY = dy >= 0
      ? this.y + absdy * cappedDeltaTime
      : this.y - absdy * cappedDeltaTime;
      
    return { nextX, nextY };
  }

  /**
   * Calculates the distance percentage from the current position to the target
   */
  private calculateDistancePercentage(x: number, y: number): { 
    disX: number, 
    disY: number, 
    distance: number, 
    percentage: number 
  } {
    if (!this.stonePosDetailsType) {
      throw new Error('stonePosDetailsType is not initialized');
    }
    
    const { endX, endY, monsterStoneDifference } = this.stonePosDetailsType;
    const { absdx, absdy } = this.animateImagePosVal;
    
    const disX = x - endX + absdx;
    const disY = y - endY + absdy;
    const distance = Math.sqrt(disX * disX + disY * disY);
    const percentage = (100 * distance / monsterStoneDifference);
    
    return { disX, disY, distance, percentage };
  }

  /**
   * Adjusts position to hit a specific percentage mark
   */
  private adjustPositionToPercentage(currentPercentage: number, targetPercentage: number, currentDisX: number, currentDisY: number): void {
    if (!this.stonePosDetailsType) return;
    
    const { endX, endY, monsterStoneDifference } = this.stonePosDetailsType;
    const { absdx, absdy } = this.animateImagePosVal;
    
    const targetDistance = (targetPercentage * monsterStoneDifference) / 100;
    const currentDistance = (currentPercentage * monsterStoneDifference) / 100;
    const ratio = targetDistance / currentDistance;
    
    this.x = endX - absdx + (currentDisX * ratio);
    this.y = endY - absdy + (currentDisY * ratio);
  }

  /**
   * Main tutorial drawing method
   */
  public drawTutorial(deltaTime: number): void {
    // Update animation frame
    this.updateAnimationFrame();

    if (!this.stonePosDetailsType || this.frame < 100) return;
    
    // Cap deltaTime to prevent large jumps on low-end devices
    const cappedDeltaTime = Math.min(deltaTime, this.maxDeltaTime);
    const { startX, startY, endX, endY } = this.stonePosDetailsType;
    
    // Calculate next position
    const { nextX, nextY } = this.calculateNextPosition(cappedDeltaTime);
    
    // Calculate current and next distance percentages
    const current = this.calculateDistancePercentage(this.x, this.y);
    const next = this.calculateDistancePercentage(nextX, nextY);
    
    // Check if we would skip the 1-15 range
    if (current.percentage > 15 && next.percentage < 15) {
      // Adjust position to ensure we hit the 14% mark
      this.adjustPositionToPercentage(current.percentage, 14, current.disX, current.disY);
    } else {
      // Normal update
      this.x = nextX;
      this.y = nextY;
    }

    // Calculate final percentage for this frame
    const final = this.calculateDistancePercentage(this.x, this.y);
    
    this.animateStoneDrag({
      deltaTime: cappedDeltaTime,
      img: this.stoneImg,
      imageSize: this.height / 9.5,
      monsterStoneDifferenceInPercentage: final.percentage,
      startX, startY, endX, endY
    });
  }

}