import { STONE_BLUE, BURN_EFFECT_IMG } from '@constants';

/**
 * Type definition for a stone object that can be spawned,
 * animated, clicked, and destroyed.
 */
type Stone = {
  x: number; // Current X position
  y: number; // Current Y position
  radius: number; // Collision radius
  dx: number; // Horizontal velocity
  dy: number; // Vertical velocity
  opacity: number; // Transparency for fade-out effect
  active: boolean; // Whether the stone is still active/visible
  lifetime: number; // Remaining lifetime in frames/ticks
  img: HTMLImageElement; // Sprite image for the stone
  size: number; // Rendered size
  burning?: boolean; // Whether the stone is in burning state
  burnStartTime?: number; // Timestamp when burning started
  burnFrameIndex?: number; // Current burn frame index
};

/**
 * TreasureStones manages the spawning, animation, interaction,
 * and burning effect of collectible stones that burst out of the chest.
 */
export default class TreasureStones {
  private stoneImg: HTMLImageElement; // Base stone image (blue stone)
  private stones: Stone[] = []; // Collection of active stones
  private burnImg: HTMLImageElement; // Placeholder for burn effect image
  private burnFrames: HTMLImageElement[] = []; // Preloaded burn animation frames
  private ctx: CanvasRenderingContext2D; // Canvas rendering context
  private frameDuration: number; //Frame duration.
  /**
   * @param ctx - Canvas rendering context for drawing stones
   */
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.stones = [];
    this.stoneImg = new Image();
    this.stoneImg.src = STONE_BLUE; // Default blue stone sprite
    this.burnImg = new Image();
    this.frameDuration = 75;
    // Preload burn animation frames (4-frame sprite)
    for (let i = 1; i <= 4; i++) {
      const burnImg = new Image();
      burnImg.src = BURN_EFFECT_IMG(i);
      this.burnFrames.push(burnImg);
    }
  }

  /**
   * Updates stone state and renders them on canvas.
   * Should be called each frame during animation loop.
   * @param width - Canvas width
   * @param height - Canvas height
   */
  public stoneBurstAnimation(width: number, height: number): void {
    this.updateStones(width);
    this.cleanupStones();
    this.maintainStones(width, height);
  }

  /**
   * Ensures a minimum number of stones are present on screen.
   * Randomly chooses a target between 6 and 12 stones.
   */
  private maintainStones(width: number, height: number) {
    const maxStones = Math.floor(Math.random() * (12 - 6 + 1)) + 6;
    while (this.stones.length < maxStones) {
      console.log('maintainStones treasure')
      this.stones.push(this.spawnStone(width, height));
    }
  }

  /**
   * Spawns a new stone near the chest and gives it randomized velocity/size.
   * @param width - Canvas width
   * @param height - Canvas height
   */
  private spawnStone(width: number, height: number): Stone {
    const chestX = width / 2 - 40;
    const chestY = height - 200;

    const radius = 8 + Math.random() * 6;
    const baseAngle = Math.PI / 2;
    const spread = (Math.random() - 0.5) * (Math.PI / 3);
    let angle = baseAngle + spread;

    // Clamp angle to shoot upward
    if (angle < Math.PI / 2) {
      angle = baseAngle - Math.abs(spread);
    } else {
      angle = baseAngle + Math.abs(spread);
    }

    const speed = 2 + Math.random() * 2;  // Randomized speed

    const stone: Stone = {
      x: chestX + 50,
      y: chestY + 50,
      radius,
      dx: Math.cos(angle) * speed,
      dy: -Math.sin(angle) * speed,
      opacity: 1,
      active: true,
      lifetime: 300, // ~5s lifetime if 60fps
      img: this.stoneImg,
      size: 100,
    };

    return stone;
  }

  /**
   * Removes inactive stones from the list.
   */
  private cleanupStones(): void {
    this.stones = this.stones.filter(stone => stone.active);
  }

  /**
   * Updates movement and burning state for each stone.
   * Also renders stones to the canvas.
   * @param width - Canvas width
   */
  private updateStones(width: number): void {
    for (const stone of this.stones) {
      if (!stone.active) continue;
      stone.burning ? this.updateBurningStone(stone) : this.updateMovingStone(stone, width);
      this.drawStone(stone);
    }
  }

  /**
   * Handles click interactions with stones.
   * If a stone is clicked, it enters burning state.
   * @param x - Mouse click X coordinate
   * @param y - Mouse click Y coordinate
   * @returns true if a stone was clicked and triggered
   */
  public onClickEvent(x: number, y: number): boolean {
    for (const stone of this.stones) {
      if (!stone.active) continue;

      // Check if click is inside stone bounds
      const dx = x - stone.x;
      const dy = y - stone.y;
      if (Math.sqrt(dx * dx + dy * dy) <= stone.size / 2) {
        // Freeze stone when clicked
        stone.dx = 0;
        stone.dy = 0;
        if (stone.burning || !stone.active) {
          continue;
        }
        // Trigger burn sequence
        stone.burning = true;
        stone.burnStartTime = performance.now();
        stone.burnFrameIndex = 0;

        return true;
      }
    }
  }

  /**
   * Updates a burning stone by cycling through burn animation frames.
   * Marks the stone inactive once the animation finishes.
   */
  private updateBurningStone(stone: Stone): void {
    const elapsed = performance.now() - (stone.burnStartTime || 0);
    stone.burnFrameIndex = Math.floor(elapsed / this.frameDuration);
    if (stone.burnFrameIndex >= this.burnFrames.length) stone.active = false;
  }

  /**
   * Updates position, lifetime, and opacity of a moving stone.
   * Marks stone inactive when it goes out of bounds or expires.
   */
  private updateMovingStone(stone: Stone, width: number): void {
    stone.x += stone.dx;
    stone.y += stone.dy;
    stone.lifetime--;

    // Gradually fade out near the end of lifetime
    if (stone.lifetime < 60) stone.opacity -= 0.002;

    // Deactivate if out of bounds or expired
    if (
        stone.lifetime <= 0 ||
        stone.y < 0 ||
        stone.x < -stone.size ||
        stone.x > width + stone.size
      ) {
      stone.active = false;
    }
  }

  /**
   * Draws a stone and its burn animation (if burning).
   */
  private drawStone(stone: Stone): void {
    if (!stone.active) return;
    this.ctx.globalAlpha = stone.opacity;
    this.ctx.drawImage(stone.img, stone.x - stone.size / 2, stone.y - stone.size / 2, stone.size, stone.size);
    this.ctx.globalAlpha = 1.0;

    // Draw burn effect overlay if in burning state
    if (stone.burning && stone.burnFrameIndex! < this.burnFrames.length) {
      this.ctx.drawImage(
        this.burnFrames[stone.burnFrameIndex!],
        stone.x - stone.size / 2,
        stone.y - stone.size / 2,
        stone.size,
        stone.size
      );
    }
  }
}