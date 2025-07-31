import { TUTORIAL_HAND } from "@constants";
import gameStateService from '@gameStateService';
import './tutorial.scss';
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
  protected tutorialImg: any;
  protected imagesLoaded: boolean = false;
  public animateImagePosVal: undefined | AnimStoneImagePosValTypes;
  public stonePosDetailsType: undefined | StonePosDetailsType;
  public stoneImg: undefined | any;
  public x: number = 0;
  public y: number = 0;
  public totalTime: number = 0;
  public frame: number = 0;
  protected animationStartTime: number = 0;
  protected maxDeltaTime: number = 33; // Cap deltaTime to 33ms (approx 30fps) for consistent animation
  private centerX: number = 0;
  private centerY: number = 0;
  private initialOuterRadius: number = 10
  private initialInnerRadius: number = 10
  private maxRadius: number = 60;
  private increment: number = 0.5
  private outerRadius: number;
  private innerRadius: number;

  constructor(context: CanvasRenderingContext2D) {
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

  public updateDrawPosition(deltaTime: number, height: number) {
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
    let STONE_ANIMATION_DURATION_MS = 5000;
    const x = startX;
    const y = startY;
    const dx = (endX - startX) / STONE_ANIMATION_DURATION_MS;
    const dy = (endY - startY) / STONE_ANIMATION_DURATION_MS;
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
   * animateStoneDrag - Will be used to animate the stone drops indicating where it should be drag.
   * Note: Currently only supports Letter to Hitbox drop only.
   * This cannot be used for word letter spelling guide and will require an update to handle that.
   */
  public animateStoneDrag({
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

    if (monsterStoneDifferenceInPercentage < 15) {
      if (monsterStoneDifferenceInPercentage > 1) {
        this.context.drawImage(img, endX - 20, endY - 20, imageSize, imageSize);
        this.createHandScaleAnimation(deltaTime, endX, endY, true)
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
      this.context.drawImage(this.tutorialImg, this.x + 15, this.y + 10);//draws the hand stone drag animation!
    }
  }

  /**
   * Specialized animation for word puzzle tutorials
   * Provides a more guided animation path with visual cues for multi-letter words
   * Note: This animation is designed specifically for sequential word spelling tutorials,
   * not for letter grouping
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

  /**
   * Updates the animation frame based on elapsed time
   * @param maxFrame The maximum frame value to reach
   * @param animationDuration The duration of the animation in milliseconds
   */
  protected updateAnimationFrame(maxFrame: number, animationDuration: number): void {
    if (this.frame < maxFrame) {
      // Set animation start time once — acts as a one-time initializer
      if (this.animationStartTime === 0) {
        this.animationStartTime = performance.now();
      }
      const elapsed = performance.now() - this.animationStartTime;
      this.frame = Math.min(maxFrame, (elapsed / animationDuration) * maxFrame);
    }
  }

  /**
   * Calculates the next position of the stone based on delta time
   * @param cappedDeltaTime The capped delta time value
   * @param speedMultiplier Optional speed multiplier (default: 1)
   */
  protected calculateNextPosition(cappedDeltaTime: number, speedMultiplier: number = 1): { nextX: number, nextY: number } {
    if (!this.animateImagePosVal) return { nextX: this.x, nextY: this.y };

    const { dx, absdx, dy, absdy } = this.animateImagePosVal;
    const multiplier = cappedDeltaTime * speedMultiplier;

    // Simplified calculation using the sign of dx/dy
    const nextX = this.x + (dx >= 0 ? 1 : -1) * absdx * multiplier;
    const nextY = this.y + (dy >= 0 ? 1 : -1) * absdy * multiplier;

    return { nextX, nextY };
  }

  /**
   * Calculates the distance percentage from the current position to the target
   * @param x Current x position
   * @param y Current y position
   * @returns Object containing distance metrics and percentage
   */
  protected calculateDistancePercentage(x: number, y: number): {
    disX: number,
    disY: number,
    distance: number,
    percentage: number
  } {
    if (!this.stonePosDetailsType || !this.animateImagePosVal) {
      // Return safe default values instead of throwing
      return { disX: 0, disY: 0, distance: 0, percentage: 0 };
    }

    const { endX, endY, monsterStoneDifference } = this.stonePosDetailsType;
    const { absdx, absdy } = this.animateImagePosVal;

    const disX = x - endX + absdx;
    const disY = y - endY + absdy;
    const distance = Math.sqrt(disX * disX + disY * disY);
    const percentage = monsterStoneDifference > 0 ? 
      (100 * distance / monsterStoneDifference) : 0;

    return { disX, disY, distance, percentage };
  }

  /**
   * Adjusts position to hit a specific percentage mark
   * @param currentPercentage Current distance percentage
   * @param targetPercentage Target distance percentage to achieve
   * @param currentDisX Current x distance
   * @param currentDisY Current y distance
   */
  protected adjustPositionToPercentage(currentPercentage: number, targetPercentage: number, currentDisX: number, currentDisY: number): void {
    if (!this.stonePosDetailsType || !this.animateImagePosVal) return;

    const { endX, endY, monsterStoneDifference } = this.stonePosDetailsType;
    const { absdx, absdy } = this.animateImagePosVal;

    const targetDistance = (targetPercentage * monsterStoneDifference) / 100;
    const currentDistance = (currentPercentage * monsterStoneDifference) / 100;

    if (currentDistance <= 0.0001) return; // Prevent divide-by-zero
    const ratio = targetDistance / currentDistance;

    this.x = endX - absdx + (currentDisX * ratio);
    this.y = endY - absdy + (currentDisY * ratio);
  }

  /**
   * Core animation update logic that can be used by child classes
   * @param deltaTime Time elapsed since last frame
   * @param speedMultiplier Speed multiplier for the animation (default: 1)
   * @returns The final percentage for this frame
   */
  protected updateStonePosition(deltaTime: number, speedMultiplier: number = 1): number {
    if (!this.stonePosDetailsType) return 0;

    // Cap deltaTime to prevent large jumps on low-end devices
    const cappedDeltaTime = Math.min(deltaTime, this.maxDeltaTime);

    // Calculate next position
    const { nextX, nextY } = this.calculateNextPosition(cappedDeltaTime, speedMultiplier);

    // Calculate current and next distance percentages
    const current = this.calculateDistancePercentage(this.x, this.y);
    const next = this.calculateDistancePercentage(nextX, nextY);

    // Critical animation range (1-15%): ensure we don't skip it
    const CRITICAL_PERCENTAGE = 14;
    if (current.percentage > 15 && next.percentage < 15) {
      // Adjust position to ensure we hit the critical percentage mark
      this.adjustPositionToPercentage(current.percentage, CRITICAL_PERCENTAGE, current.disX, current.disY);
    } else {
      // Normal update
      this.x = nextX;
      this.y = nextY;
    }

    // Calculate and return final percentage for this frame
    return this.calculateDistancePercentage(this.x, this.y).percentage;
  }

  /**
   * Injects the hand-pointer image into the DOM for tutorial guidance.
   * By default, injects into the element with id 'prompt-container'.
   * @param targetSelector Optional CSS selector for the container to inject into. Defaults to '#prompt-container'.
   */
  public injectHandPointer(targetSelector?: string) {
    // Remove any existing hand-pointer first to avoid duplicates
    this.removeHandPointer();
    const pointer = document.createElement('img');
    pointer.src = TUTORIAL_HAND;
    pointer.id = 'hand-pointer';
    pointer.className = 'hand-pointer';
    pointer.alt = 'Tutorial hand pointer';
    // Optionally, you can add ARIA attributes or tabIndex for accessibility
    const target = document.querySelector(targetSelector || '#prompt-background');
    if (target) {
      target.appendChild(pointer);
    }
  }

  /**
   * Removes the hand-pointer image from the DOM if present.
   */
  public removeHandPointer() {
    const pointer = document.getElementById('hand-pointer');
    if (pointer && pointer.parentNode) {
      pointer.parentNode.removeChild(pointer);
    }
  }

  /**
   * Default dispose method for all tutorials. Subclasses can override for custom cleanup.
   */
  public dispose() {
    this.removeHandPointer();

    // add more if needed
  }
}