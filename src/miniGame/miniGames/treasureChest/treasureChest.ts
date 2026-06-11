import { CLOSED_CHEST, OPEN_CHEST } from '@constants';

/**
 * TreasureChest class handles rendering of the closed and open chest
 * images along with basic animations such as shaking and pulsing.
 */
export default class TreasureChest {
  private closedChestImg: HTMLImageElement; // Image for closed chest state
  private openChestImg: HTMLImageElement; // Image for open chest state
  private ctx: CanvasRenderingContext2D; // Canvas context used for drawing
  public shakeDuration: number = 1000; // 1s; Default seconds of shaking animation.

  /**
   * @param ctx - Canvas rendering context to draw the chest
   */
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    // Load chest images
    this.closedChestImg = new Image();
    this.closedChestImg.src = CLOSED_CHEST; // Path to closed chest asset

    this.openChestImg = new Image();
    this.openChestImg.src = OPEN_CHEST; // Path to open chest asset
  }

  /**
  * Draws the closed chest with animations (scale, rotation, shaking)
  * @param time - Current timestamp
  * @param stateStartTime - Timestamp when chest entered "closed" state
  * @param width - Canvas width
  * @param height - Canvas height
  */
  public drawClosedChest(
    time: number,
    stateStartTime: number,
    width: number,
    height: number,
  ): void {
    const chestW = 250, chestH = 230;
    const chestX = width / 2 - chestW / 2;
    const chestY = height - chestH - 20;
    
    let scale = 1;
    let rotation = 0;
    
    this.ctx.save();
    this.ctx.translate(chestX + chestW / 2, chestY + chestH / 2);
    this.ctx.rotate(rotation);
    this.ctx.scale(scale, scale);

    // Apply shake offset for chest-hit animation
    const offset = this.getShakeOffset(time, stateStartTime);
    this.ctx.drawImage(this.closedChestImg, -chestW / 2 + offset, -chestH / 2, chestW, chestH);
    this.ctx.restore();
  }

  /**
   * Draws the open chest without animation.
   * @param width - Canvas width
   * @param height - Canvas height
   */
  public drawOpenChest(width: number, height: number): void {
    const chestW = 250, chestH = 230;
    const chestX = width / 2 - chestW / 2;
    const chestY = height - chestH - 20;
    this.ctx.drawImage(this.openChestImg, chestX, chestY, chestW, chestH);
  }

  /**
   * Calculates horizontal shake offset based on elapsed animation time.
   * Produces a left-right jitter effect for a limited duration.
   * @param now - Current timestamp (stateTimer)
   * @param stateStartTime - Timestamp when chest entered shaking state (0 in relative mode)
   * @returns number - Offset in pixels to apply
   */
  private getShakeOffset(now: number, stateStartTime: number): number {
    const elapsed = now - stateStartTime;
    if (elapsed > this.shakeDuration) return 0; // Stop shaking after duration

    const progress = elapsed / this.shakeDuration;
    const cycle = Math.floor(progress * 6);  // Divide into 6 "half-shakes"
    const amplitude = [20, -20, 15, -15, 8, -8][cycle] || 0; // Amplitude sequence
    return amplitude;
  }

}