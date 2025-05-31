import TutorialComponent from '../base-tutorial/base-tutorial-component';

export default class WordPuzzleTutorial extends TutorialComponent {
  private animationDuration: number = 1500; // 1.5 second animation
  private animationStartTime: number = 0;
  public frame: number = 0;
  private stonePositions: number[][];
  private currentStoneIndex: number = 0;
  private isAnimatingNextStone: boolean = false;
  private stoneAnimationDelay: number = 500; // 0.5 second delay between stone animations

  constructor({ context, width, height, stoneImg, stonePositions }: {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    stoneImg: any,
    stonePositions: number[][],
  }) {
    console.log('[WordPuzzleTutorial] Constructor called', { stonePositions });
    super(context);
    this.width = width;
    this.height = height;
    this.frame = 0;
    this.animationStartTime = 0;
    this.stonePositions = stonePositions;
    this.stoneImg = stoneImg;
    
    // Initialize with the first stone position
    if (stonePositions.length > 0) {
      this.stonePosDetailsType = this.updateTargetStonePositions(stonePositions[0]);
      this.animateImagePosVal = this.stonePosDetailsType.animateImagePosVal;
      this.x = this.animateImagePosVal.x;
      this.y = this.animateImagePosVal.y;
    }
  }

  public drawTutorial(deltaTime: number) {
    console.log('[WordPuzzleTutorial] drawTutorial called, frame:', this.frame, 'currentStoneIndex:', this.currentStoneIndex);
    // Update animation based on actual time elapsed
    if (this.frame < 100) {
      if (this.animationStartTime === 0) {
        this.animationStartTime = performance.now();
      }
      const elapsed = performance.now() - this.animationStartTime;
      this.frame = Math.min(100, (elapsed / this.animationDuration) * 100);
    }

    if (this.stonePosDetailsType && this.frame >= 100) {
      const { dx, absdx, dy, absdy } = this.animateImagePosVal;
      const { startX, startY, endX, endY, monsterStoneDifference } = this.stonePosDetailsType;

      this.x = dx >= 0
        ? this.x + absdx * deltaTime
        : this.x - absdx * deltaTime;
      this.y = dy >= 0
        ? this.y + absdy * deltaTime
        : this.y - absdy * deltaTime;

      const disx = this.x - endX + absdx;
      const disy = this.y - endY + absdy;
      const distance = Math.sqrt(disx * disx + disy * disy);
      const monsterStoneDifferenceInPercentage = (100 * distance / monsterStoneDifference);

      this.animateStoneDrag({
        deltaTime,
        img: this.stoneImg,
        imageSize: this.height / 9.5,
        monsterStoneDifferenceInPercentage,
        startX, startY, endX, endY
      });

      // Check if current stone animation is complete and we should move to the next stone
      if (monsterStoneDifferenceInPercentage < 1 && !this.isAnimatingNextStone) {
        this.isAnimatingNextStone = true;
        
        // Set a timeout to move to the next stone
        setTimeout(() => {
          this.currentStoneIndex++;
          
          // If we've animated all stones, reset to the first one
          if (this.currentStoneIndex >= this.stonePositions.length) {
            this.currentStoneIndex = 0;
          }
          
          // Update position for the next stone
          this.stonePosDetailsType = this.updateTargetStonePositions(this.stonePositions[this.currentStoneIndex]);
          this.animateImagePosVal = this.stonePosDetailsType.animateImagePosVal;
          this.x = this.animateImagePosVal.x;
          this.y = this.animateImagePosVal.y;
          this.frame = 0;
          this.animationStartTime = 0;
          this.isAnimatingNextStone = false;
        }, this.stoneAnimationDelay);
      }
    }
  }
}
