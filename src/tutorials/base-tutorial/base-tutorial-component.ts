import { TUTORIAL_HAND } from "@constants";
import gameStateService from '@gameStateService';
export interface AnimStoneImagePosValTypes {
  x: number,
  y: number,
  dx: number,
  dy: number,
  absdx: number,
  absdy: number,
}

export interface StonePosDetailsType {
  animateImagePosVal: AnimStoneImagePosValTypes,
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
  public animateImagePosVal: undefined | AnimStoneImagePosValTypes;
  public stonePosDetailsType: undefined | StonePosDetailsType;
  public stoneImg: undefined | any;
  public x: number = 0;
  public y: number = 0;
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

  public udpdateDrawPosition(deltaTime: number, height: number) {
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

  private animateImage({ startX, startY, endX, endY }): AnimStoneImagePosValTypes {
    const x = startX;
    const y = startY;
    const dx = (endX - startX) / 5000;
    const dy = (endY - startY) / 5000;
    const absdx = this.isMobile() ? Math.abs(dx) * 3 : Math.abs(dx);
    const absdy = this.isMobile() ? Math.abs(dy) * 3 : Math.abs(dy);

    return { x, y, dx, dy, absdx, absdy };
  }

  private getHitboxPosition() {
    const hitboxRanges: {
      hitboxRangeX: {
        from: number,
        to: number
      },
      hitboxRangeY: {
        from: number,
        to: number
      }
  } = gameStateService.getHitBoxRanges();
    const getRangeCenter = (hitBoxFromPos: number, hitBoxToPos: number) => {
      return (hitBoxFromPos + hitBoxToPos) / 2;
    }

    return {
      endX: getRangeCenter(
        hitboxRanges.hitboxRangeX.from,
        hitboxRanges.hitboxRangeX.to
      ),
      endY: getRangeCenter(
        hitboxRanges.hitboxRangeY.from,
        hitboxRanges.hitboxRangeY.to
      )
    }
  }

  /**
   * Method name is same similar to original from tutorial.ts
   * @param targetStonePosition array [x and y ] position of the stone we want to animate in tutorial.
   */
  public updateTargetStonePositions(targetStonePosition: number[]): StonePosDetailsType {
    //To Do - This will be the original for now and will need to be updated once we have a clear goal on the rest of the tutorial flow.
    const startX = targetStonePosition[0] - 22;
    const startY = targetStonePosition[1] - 50;
    const { endX, endY } = this.getHitboxPosition();

    //Monster Stone Difference is the target where the stone will be dropped for the tutorial.
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
   * animateStoneDrag - Will be used to animate the stone drops indicating where it should be dragged.
   * Supports both Letter to Hitbox and Word Puzzle animations.
   * For Word Puzzles, it animates each stone in sequence to demonstrate spelling words.
   */
  public animateStoneDrag({
    deltaTime,
    img,
    imageSize,
    monsterStoneDifferenceInPercentage,
    startX,
    startY,
    endX,
    endY,
    isWordPuzzle = false
  }: {
    deltaTime: number,
    img: CanvasImageSource,
    imageSize: number,
    monsterStoneDifferenceInPercentage: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    isWordPuzzle?: boolean
  }) {
    // For word puzzles, we want a smoother, more guided animation
    if (isWordPuzzle) {
      this.animateWordPuzzleStoneDrag({
        deltaTime,
        img,
        imageSize,
        monsterStoneDifferenceInPercentage,
        startX,
        startY,
        endX,
        endY
      });
      return;
    }
    
    // Standard letter-to-hitbox animation
    if (monsterStoneDifferenceInPercentage < 15) {
      if (monsterStoneDifferenceInPercentage > 1) {
        this.context.drawImage(img, endX - 20, endY - 20, imageSize, imageSize);
        this.createHandScaleAnimation(deltaTime, endX, endY, true);
      } else {
        this.x = startX;
        this.y = startY;
      }
    } else if (monsterStoneDifferenceInPercentage > 80) {
      this.createHandScaleAnimation(deltaTime, startX + 15, startY + 10, false);
    } else {
      const previousAlpha = this.context.globalAlpha;
      this.context.globalAlpha = 0.4;
      this.context.drawImage(img, this.x, this.y + 20, imageSize, imageSize);
      this.context.globalAlpha = previousAlpha;
      this.context.drawImage(this.tutorialImg, this.x + 15, this.y + 10); // Draws the hand stone drag animation
    }
  }
  
  /**
   * Specialized animation for word puzzle tutorials
   * Provides a more guided animation path with visual cues for multi-letter words
   */
  protected animateWordPuzzleStoneDrag({
    deltaTime,
    img,
    imageSize,
    monsterStoneDifferenceInPercentage,
    startX,
    startY,
    endX,
    endY
  }: {
    deltaTime: number,
    img: CanvasImageSource,
    imageSize: number,
    monsterStoneDifferenceInPercentage: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  }) {
    // Draw the stone at current position with slightly higher opacity for word puzzles
    const previousAlpha = this.context.globalAlpha;
    
    // Near the start position
    if (monsterStoneDifferenceInPercentage > 80) {
      this.context.globalAlpha = 0.8;
      this.context.drawImage(img, this.x, this.y, imageSize, imageSize);
      this.createHandScaleAnimation(deltaTime, startX + 15, startY + 10, false);
    }
    // Near the end position
    else if (monsterStoneDifferenceInPercentage < 15) {
      if (monsterStoneDifferenceInPercentage > 1) {
        this.context.globalAlpha = 0.9;
        // Draw at the CURRENT position instead of a fixed position
        // This ensures continuous movement all the way to the end
        this.context.drawImage(img, this.x, this.y, imageSize, imageSize);
        
        // Move the hand with the stone
        this.createHandScaleAnimation(deltaTime, this.x + 15, this.y + 10, true);
        
        // Add a subtle highlight effect at the destination
        this.context.beginPath();
        this.context.arc(endX, endY, imageSize/2, 0, Math.PI * 2);
        this.context.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.context.fill();
      } else {
        this.x = startX;
        this.y = startY;
      }
    }
    // In transit
    else {
      this.context.globalAlpha = 0.7;
      this.context.drawImage(img, this.x, this.y, imageSize, imageSize);
      this.context.globalAlpha = previousAlpha;
      this.context.drawImage(this.tutorialImg, this.x + 15, this.y + 10);
    }
    
    this.context.globalAlpha = previousAlpha;
  }

  protected createHandScaleAnimation(deltaTime: number, offsetX: number, offsetY: number, shouldCreateRipple: boolean) {
    this.totalTime += Math.floor(deltaTime);
    const transitionDuration = 500;
    const scaleFactor = this.sinusoidalInterpolation(this.totalTime, 1, 1.5, transitionDuration);
    const scaledWidth = this.tutorialImg.width * scaleFactor;
    const scaledHeight = this.tutorialImg.height * scaleFactor;
    this.context.drawImage(this.tutorialImg, offsetX, offsetY, scaledWidth, scaledHeight);
    shouldCreateRipple ? (null) : (this.drawRipple(offsetX + this.width * 0.02, offsetY + this.tutorialImg.height / 2, false))
  }

  private sinusoidalInterpolation(time: number, minScale: number, maxScale: number, duration: number) {
    const amplitude = (maxScale - minScale) / 2;
    const frequency = Math.PI / duration;
    return minScale + amplitude * Math.sin(frequency * time);
  }

}