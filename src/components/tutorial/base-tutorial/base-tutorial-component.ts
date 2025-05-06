import { TUTORIAL_HAND } from "@constants";

export interface AnimStoneImageTypes {
  x: number,
  y: number,
  dx: number,
  dy: number,
  absdx: number,
  absdy: number,
}

export interface stonePosDetails {
  animateImagePosVal: AnimStoneImageTypes,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  monsterStoneDifference: number
}

export default class TutorialComponent {
  public width: number;
  public height: number;
  public context: CanvasRenderingContext2D;
  public tutorialImg: any;
  public imagesLoaded: boolean = false;

  public totalTime: number = 0;
  private centerX: number = 0;
  private centerY: number = 0;
  private initialOuterRadius: number = 10
  private initialInnerRadius: number = 10
  private maxRadius: number = 60;
  private increment: number = 0.5
  private outerRadius: number;
  private innerRadius: number;

  constructor(context) {
    this.context = context;
    this.tutorialImg = new Image();
    this.tutorialImg.src = TUTORIAL_HAND;
    this.tutorialImg.onload = () => {
      this.imagesLoaded = true;
    };

    this.initializedRippleValues();

  }

  private initializedRippleValues() {
    this.centerX = 0;
    this.centerY = 0;
    this.initialOuterRadius = 10;
    this.initialInnerRadius = 10;
    this.maxRadius = 60;
    this.increment = 0.5;
    this.outerRadius = this.initialOuterRadius;
    this.innerRadius = this.initialInnerRadius;
  }

  private udpdateDrawPosition(deltaTime: number, height: number) {
    const transitionDuration = 2000;
    const bottomPosition = height / 1.9 + (this.tutorialImg.height / 0.8);
    const topPosition = height / 1.9 + (this.tutorialImg.height / 0.8) - this.tutorialImg.height;
    const shouldResetOrRevertPosition = this.totalTime < transitionDuration / 2;
    const currentOffsetY = shouldResetOrRevertPosition ?
      topPosition + (this.totalTime / (transitionDuration / 2)) * (bottomPosition - topPosition) :
      bottomPosition - ((this.totalTime - transitionDuration / 2) / (transitionDuration / 2)) * (bottomPosition - topPosition);

    if (currentOffsetY <= topPosition) {
      this.totalTime = 0;
    }

    this.totalTime += deltaTime;

    return { currentOffsetY, shouldResetOrRevertPosition };
  }

  private isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  public drawPointer(offsetX: number, currentOffsetY: number) {
    this.context.drawImage(
      this.tutorialImg,
      offsetX,
      currentOffsetY,
      this.tutorialImg.width,
      this.tutorialImg.height
    );
  }

  public clickOnMonsterTutorial(deltaTime: number, width: number, height: number) {
    if (this.imagesLoaded) {
      const { currentOffsetY, shouldResetOrRevertPosition } = this.udpdateDrawPosition(deltaTime, height)
      const offsetX = width / 2;
      this.drawPointer(offsetX,currentOffsetY);

      const rippleOffSetVal = shouldResetOrRevertPosition ? (this.tutorialImg.height / 1.5) : (this.tutorialImg.height / 1.2) + this.tutorialImg.height;
      this.drawRipple(offsetX, height / 1.9 + rippleOffSetVal, shouldResetOrRevertPosition);
    }
  }

  public drawRipple(x: number, y: number, restart?: boolean): void {
    if (restart) {
      this.outerRadius = 0;
      this.innerRadius = 0;
    }
    this.centerX = x;
    this.centerY = y;
    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, this.outerRadius, 0, 2 * Math.PI);
    this.context.strokeStyle = "white";
    this.context.lineWidth = 2;
    this.context.stroke();
    this.context.closePath();

    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, this.innerRadius, 0, 2 * Math.PI);
    this.context.strokeStyle = "white";
    this.context.lineWidth = 2;
    this.context.stroke();
    this.context.closePath();

    this.outerRadius += this.increment;
    this.innerRadius += this.increment;

    if (this.outerRadius >= this.maxRadius || this.innerRadius >= this.maxRadius) {
      this.outerRadius = this.initialOuterRadius;
      this.innerRadius = this.initialInnerRadius;
    }
  }

  public setPlayMonsterClickAnimation(test:boolean) {
    //Will be needed and updated on actual integration.
  }

  private animateImage({ startX, startY, endX, endY }): AnimStoneImageTypes {
    const x = startX;
    const y = startY;
    const dx = (endX - startX) / 5000;
    const dy = (endY - startY) / 5000;
    const absdx = this.isMobile() ? Math.abs(dx) * 3 : Math.abs(dx);
    const absdy = this.isMobile() ? Math.abs(dy) * 3 : Math.abs(dy);

    return { x, y, dx, dy, absdx, absdy };
  }

  /**
   * Method name is same similar to original from tutorial.ts
   * @param targetStonePosition array [x and y ] position of the stone we want to animate in tutorial.
   * @param width width of screen
   * @param height height of screen
   */
  public updateTargetStonePositions(targetStonePosition: number[], width: number, height: number): stonePosDetails {
    //To Do - This will be the original for now and will need to be updated once we have a clear goal on the rest of the tutorial flow.
    const startX = targetStonePosition[0] - 22;
    const startY = targetStonePosition[1] - 50;
    const endX = width / 2;
    const endY = height / 2;
    const monsterStoneDifference = Math.sqrt((startX - endX) * (startX - endX) + (startY - endY) * (startY - endY));
    const animateImagePosVal = this.animateImage({
      startX,
      startY,
      endX,
      endY
    });

    return {
      animateImagePosVal,
      startX,
      startY,
      endX,
      endY,
      monsterStoneDifference
    };
  }

  /**
   * animateStoneDrag - Will be used to animate the stone drops indicating where it should be drag
   */
  public animateStoneDrag(deltaTime: number, img: CanvasImageSource, imageSize: number, stonePosDetails: stonePosDetails) {
    /*
     NOTE: Drag animation logic is temporarily disabled.
     This will be properly implemented once the new puzzle tutorial system is finalized,
     since we currently lack full context on how this animation is expected to behave
     in the actual tutorial flow. Revisit and refactor this into a reusable form accordingly.
    */

    // this.x =
    //   this.dx >= 0
    //     ? this.x + this.absdx * deltaTime
    //     : this.x - this.absdx * deltaTime;
    // this.y =
    //   this.dy >= 0
    //     ? this.y + this.absdy * deltaTime
    //     : this.y - this.absdy * deltaTime;
    // const disx = this.x - this.endx + this.absdx;
    // const disy = this.y - this.endy + this.absdy;
    // const distance = Math.sqrt(disx * disx + disy * disy);
    // let monsterStoneDifferenceInPercentage = (100 * distance / this.monsterStoneDifference);
    // if (monsterStoneDifferenceInPercentage < 15) {
    //   if (monsterStoneDifferenceInPercentage > 1) {
    //     this.createHandScaleAnimation(deltaTime, this.endx, this.endy + 30, true)
    //   } else {
    //     this.x = this.startx;
    //     this.y = this.starty;
    //   }
    // } else if (monsterStoneDifferenceInPercentage > 80) {
    //   this.createHandScaleAnimation(deltaTime, this.startx + 15, this.starty + 10, false);
    // } else {
    //   let previousAlpha = this.context.globalAlpha;
    //   this.context.globalAlpha = 0.4;
    //   this.context.drawImage(img, this.x, this.y + 20, imageSize, imageSize);
    //   this.context.globalAlpha = previousAlpha;
    //   // console.log('x ', this.x)
    //   // console.log('y ', this.y)
    //   this.context.drawImage(this.tutorialImg, this.x + 15, this.y + 10);//draws the hand stone drag animation!
  }

  createHandScaleAnimation(deltaTime: number, offsetX: number, offsetY: number, shouldCreateRipple: boolean) {
    this.totalTime += Math.floor(deltaTime);
    const transitionDuration = 500;
    const scaleFactor = this.sinusoidalInterpolation(this.totalTime, 1, 1.5, transitionDuration);
    const scaledWidth = this.tutorialImg.width * scaleFactor;
    const scaledHeight = this.tutorialImg.height * scaleFactor;
    this.context.drawImage(this.tutorialImg, offsetX, offsetY, scaledWidth, scaledHeight);
    shouldCreateRipple ? (null) : (this.drawRipple(offsetX + this.width * 0.02, offsetY + this.tutorialImg.height / 2, false))
  }

  sinusoidalInterpolation(time: number, minScale: number, maxScale: number, duration: number) {
    const amplitude = (maxScale - minScale) / 2;
    const frequency = Math.PI / duration;
    return minScale + amplitude * Math.sin(frequency * time);
  }

}