import TutorialComponent from '../base-tutorial/base-tutorial-component';

export default class QuickStartTutorial extends TutorialComponent {
  private elapsedTime: number = 0; // track total time tutorial has played
  private readonly tutorialDuration: number = 6000; // 6 seconds in millisecond
  public isFinished: boolean = false;
  constructor({ context }) {
    super(context);
  }

  public quickStartTutorial(deltaTime: number, width: number, height: number) {
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= this.tutorialDuration) {
      this.isFinished = true;
      return;
    }

    if (this.imagesLoaded) {
      const { currentOffsetY, shouldResetOrRevertPosition } = this.udpdateDrawPosition(deltaTime, height)
      const offsetX = width / 2;
      this.drawPointer(offsetX, currentOffsetY);

      const rippleOffSetVal = shouldResetOrRevertPosition
        ? (this.tutorialImg.height / 1.5)
        : (this.tutorialImg.height / 1.2) + this.tutorialImg.height;
      this.drawRipple(offsetX, height / 1.9 + rippleOffSetVal, shouldResetOrRevertPosition);
    }
  }
}