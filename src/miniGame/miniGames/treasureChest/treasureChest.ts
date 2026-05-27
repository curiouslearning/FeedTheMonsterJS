import { CLOSED_CHEST, OPEN_CHEST } from '@constants';
import miniGameStateService from '@miniGameStateService';

/**
 * TreasureChest class handles rendering of the closed and open chest
 * images along with basic animations such as shaking and pulsing.
 */
export default class TreasureChest {
  private closedChestImg: HTMLImageElement; // Image for closed chest state
  private openChestImg: HTMLImageElement; // Image for open chest state
  private ctx: CanvasRenderingContext2D; // Canvas context used for drawing
  public shakeDuration: number = 1000; // 1s; Default seconds of shaking animation.
  private chestWidth: number;
  private chestHeight: number;
  private unsubscribe: any;
  private assessmentChestX: number = 0;
  private assessmentChestY: number = 0;
  private shouldUseAssessmentChestLayout: boolean = false;

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

    this.chestWidth = 200; //Default size
    this.chestHeight = 184; //Default size

    this.unsubscribe = miniGameStateService.subscribe(
      miniGameStateService.EVENTS.USE_ASSESSMENT_TREASURE_CHEST_LAYOUT,
      (data: any) => {
        this.chestWidth = data?.assessmentTreasureChestLayout?.width ?? this.chestWidth;
        this.chestHeight = data?.assessmentTreasureChestLayout?.height ?? this.chestHeight;
        this.assessmentChestX = data?.assessmentTreasureChestLayout?.x ?? this.assessmentChestX;
        this.assessmentChestY = data?.assessmentTreasureChestLayout?.y ?? this.assessmentChestY;
        this.shouldUseAssessmentChestLayout = Boolean(data?.assessmentTreasureChestLayout);

        if (data?.assessmentTreasureChestLayout?.height) {
          //Hard minus 50px to properly adjust the height to look as same as assessment treasure chest.
          this.chestHeight = this.chestHeight - 50; 
        }
      }
    );
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
    const chestX = width / 2 - this.chestWidth / 2;
    const chestY = height - this.chestHeight - 20;

    this.ctx.save();

    this.ctx.translate(
      chestX + this.chestWidth / 2,
      chestY + this.chestHeight / 2
    );
    this.ctx.rotate(0);
    this.ctx.scale(1, 1);

    // Apply shake offset for chest-hit animation
    const offset = this.getShakeOffset(time, stateStartTime);

    this.ctx.drawImage(
      this.closedChestImg,
      -this.chestWidth / 2 + offset, 
      -this.chestHeight / 2,
      this.chestWidth, 
      this.chestHeight
    );
    this.ctx.restore();
  }

  /**
   * Draws the closed chest at an arbitrary position and size (used for fly-in animation).
   */
  public drawClosedChestAt(x: number, y: number, w: number, h: number): void {

    if (this.shouldUseAssessmentChestLayout) {
      this.ctx.drawImage(
        this.closedChestImg,
        this.assessmentChestX,
        this.assessmentChestY,
        this.chestWidth,
        this.chestHeight
      );
    } else {
      this.ctx.drawImage(this.closedChestImg, x, y, w, h);
    }
  }

  /**
   * Draws the open chest without animation.
   * @param width - Canvas width
   * @param height - Canvas height
   */
  public drawOpenChest(
    width: number,
    height: number,

  ): void {
    const chestX = width / 2 - this.chestWidth / 2;
    const chestY = height - this.chestHeight - 20;

    this.ctx.drawImage(
      this.openChestImg,
      chestX,
      chestY,
      this.chestWidth,
      this.chestHeight
    );
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
