import TutorialComponent from '../base-tutorial/base-tutorial-component';
import gameStateService from '@gameStateService';

export default class LetterPuzzleTutorial extends TutorialComponent {
  private unsubscribeEvent: () => void;
  private animationDuration: number = 1500; // 1.5 second animation
  private animationStartTime: number = 0;
  public frame: number = 0;

  constructor(context, width, height){
    super(context);
    this.width = width;
    this.height = height;
    this.frame = 0;
    this.animationStartTime = 0;
    this.unsubscribeEvent = gameStateService.subscribe(
      gameStateService.EVENTS.CORRECT_STONE_POSITION,
      (stoneDataImgAndPos: { stonePosVal: number[], img: any, levelData: any }) => {
        const { stonePosVal, img, levelData } = stoneDataImgAndPos;
        this.gameLevel = typeof levelData?.levelNumber === 'string' ? parseInt(levelData?.levelNumber) : levelData?.levelNumber;

        if (this.gameLevel === 0) {
          this.stonePosDetailsType = this.updateTargetStonePositions(stonePosVal, this.width, this.height);
          this.stoneImg = img;
          this.animateImagePosVal = this.stonePosDetailsType.animateImagePosVal;
          this.x = this.animateImagePosVal.x;
          this.y = this.animateImagePosVal.y;
        }
    });
  }

  public drawLetterPuzzleTutorial(deltaTime: number) {
    if (this.gameLevel === 0) {
      !this.hideQuickStartTutorial
        ? this.quickStartTutorial(deltaTime, this.width, this.height)
        : !this.hasGameEnded && this.dragStoneLetterGuide(deltaTime)
    }
  }

  private dragStoneLetterGuide(deltaTime: number) {
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
    }
  }

  public dispose() {
    // Clear event listeners
    this.unsubscribeEvent();
    this.unsubscribeEvent = null;
  }
}