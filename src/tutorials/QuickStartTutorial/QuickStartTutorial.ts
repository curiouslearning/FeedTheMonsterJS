import TutorialComponent from '../base-tutorial/base-tutorial-component';

export default class QuickStartTutorial extends TutorialComponent {

  constructor({ context }) {
    super(context);
  }

  public quickStartTutorial(deltaTime: number, width: number, height: number) {
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