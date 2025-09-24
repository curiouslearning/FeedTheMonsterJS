import gameSettingsServiceInstance from '@gameSettingsService/index';
import TreasureStones from './treasure-stones';
import TreasureChest from './treasureChest';

/**
 * Represents the different phases of the chest animation sequence.
 */
enum TreasureChestState {
  FadeIn, // Chest fading into view
  ClosedChest, // Chest visible, shaking before opening
  OpenedChest, // Chest open, stones burst out
  FadeOut // Chest fading out of view
}

/**
 * Manages the entire treasure chest animation sequence:
 * - Handles fade in/out transitions
 * - Draws closed and open chest states
 * - Spawns & animates stones
 * - Handles click/tap interactions on stones
 */
export class TreasureChestAnimation {
  private canvas: HTMLCanvasElement; // Canvas element used for drawing
  private ctx: CanvasRenderingContext2D; // 2D rendering context
  private animationFrameId: number | null = null; // requestAnimationFrame id for cancelling loop
  private isVisible: boolean = false; // Whether the animation is currently active
  private shakeDuration: number = 1000; // Chest shaking duration (ms)
  private callback: () => void; // Callback triggered when a stone is clicked
  private lastTapTime = 0; // Used to prevent duplicate clicks on mobile
  private fadeInStart: number | null = null; // Fade-in start timestamp
  private fadeOutStart: number | null = null; // Fade-out start timestamp
  private fadeInDuration = 300; // Fade-in time (ms)
  private fadeOutDuration = 400; // Fade-out time (ms)
  private onFadeComplete?: () => void; // Callback after fade-out completes
  private state: TreasureChestState = TreasureChestState.FadeIn; // Current chest animation state
  private stateStartTime: number = 0; // Timestamp when current state started
  public dpr: number; // Device pixel ratio scaling

  private treasureChest: TreasureChest; // Handles chest drawing
  private treasureStone: TreasureStones;  // Handles stone drawing & animations

  /**
   * @param width - Canvas width in CSS pixels
   * @param height - Canvas height in CSS pixels
   * @param callback - Called when a stone is clicked
   */
  constructor(
    private width: number,
    private height: number,
    callback: () => void,
  ) {
    // Scale canvas to device pixel ratio for crisp rendering
    this.canvas = document.getElementById("treasurecanvas") as HTMLCanvasElement;
    this.dpr = gameSettingsServiceInstance.getDevicePixelRatioValue();
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Position overlay on top of game screen
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.display = "none";
    this.canvas.style.zIndex = "11";
    this.canvas.style.pointerEvents = "auto";

    // Input handlers for both mouse & touch
    this.canvas.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("touchstart", this.handleClick);
    this.callback = callback;

    // Setup rendering context
    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Canvas not supported");
    this.ctx = context;
    this.ctx.scale(this.dpr, this.dpr); // scale at init

    // Initialize chest and stone managers
    this.treasureChest = new TreasureChest(this.ctx, performance.now());
    this.treasureStone = new TreasureStones(this.ctx);
  }

  /**
   * Handles user input clicks/taps and checks if a stone was tapped.
   * Prevents duplicate events from touch devices (touchstart + synthetic click).
   */
  private handleClick = (e: MouseEvent | TouchEvent) => {
    // Prevent double trigger on touch devices
    if (e.type === "touchstart") {
      this.lastTapTime = Date.now();
    } else if (e.type === "click") {
      if (Date.now() - this.lastTapTime < 500) {
        return; // Skip duplicate synthetic click
      }
    }

    // Normalize input coordinates to canvas space
    let clientX: number, clientY: number;
    if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const isStoneClicked = this.treasureStone.onClickEvent(x, y);

    if (isStoneClicked) {
      this.callback(); // Notify parent/minigame logic
    }
  };


  /** Starts the animation and displays the canvas overlay. */
  public show(onComplete?: () => void) {
    this.canvas.style.display = "block";
    this.isVisible = true;
    this.onFadeComplete = onComplete;
    this.state = TreasureChestState.FadeIn;
    this.stateStartTime = performance.now();
    this.loop();
  }

  /** Stops animation, hides canvas, and cleans up listeners. */
  public hide() {
    this.canvas.style.display = "none";
    this.canvas.removeEventListener("click", this.handleClick);
    this.canvas.removeEventListener("touchstart", this.handleClick);
    this.isVisible = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main animation loop.
   * Runs via requestAnimationFrame while visible.
   */
  private loop = (time: number = 0) => {
    if (!this.isVisible) return;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.save();
    this.drawOverlay();

    switch (this.state) {
      case TreasureChestState.FadeIn: {
        const elapsed = performance.now() - this.stateStartTime;
        const alpha = Math.min(1, elapsed / this.fadeInDuration);
        this.ctx.globalAlpha = alpha;
        this.treasureChest.drawClosedChest(
          time,
          this.stateStartTime,
          this.width,
          this.height
        );
        if (alpha >= 1) {
          this.state = TreasureChestState.ClosedChest;
          this.stateStartTime = performance.now();
        }
        break;
      }
      case TreasureChestState.ClosedChest: {
        this.ctx.globalAlpha = 1;
        this.treasureChest.drawClosedChest(
          time,
          this.stateStartTime,
          this.width,
          this.height
        );
        const elapsed = performance.now() - this.stateStartTime;
        if (elapsed >= this.shakeDuration) {
          this.state = TreasureChestState.OpenedChest;
          this.stateStartTime = performance.now();
        }
        break;
      }
      case TreasureChestState.OpenedChest: {
        this.ctx.globalAlpha = 1;
        this.treasureChest.drawOpenChest(this.width, this.height);
        this.treasureStone.stoneBurstAnimation(this.width, this.height);
        const elapsed = performance.now() - this.stateStartTime;
        if (elapsed >= 12000) { // Keep chest open for 12 seconds
          this.state = TreasureChestState.FadeOut;
          this.stateStartTime = performance.now();
        }
        break;
      }
      case TreasureChestState.FadeOut: {
        const elapsed = performance.now() - this.stateStartTime;
        const alpha = Math.max(0, 1 - elapsed / this.fadeOutDuration);
        this.ctx.globalAlpha = alpha;
        this.treasureChest.drawOpenChest(this.width, this.height);
        this.treasureStone.stoneBurstAnimation(this.width, this.height);
        if (alpha === 0) {
          this.hide();
          this.onFadeComplete?.();
          this.onFadeComplete = undefined;
          return; // Stop loop after fade-out
        }
        break;
      }
    }

    this.ctx.restore();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /** Handles fade-in alpha calculation (unused alternative). */
  private handleFadeIn(): boolean {
    if (!this.fadeInStart) return false;

    const elapsed = performance.now() - this.fadeInStart;
    const alpha = Math.min(1, elapsed / this.fadeInDuration);

    this.ctx.globalAlpha = alpha;

    if (alpha >= 1) {
      this.fadeInStart = null; // fade-in complete
    }
    return true;
  }

  /** Handles fade-out alpha calculation (unused alternative). */
  private handleFadeOut(): boolean {
    if (!this.fadeOutStart) return false;
    const elapsed = performance.now() - this.fadeOutStart;
    const alpha = Math.max(0, 1 - elapsed / this.fadeOutDuration);

    this.ctx.globalAlpha = alpha;

    if (alpha === 0) {
      this.hide();
      this.onFadeComplete?.();
      this.onFadeComplete = undefined;
      return true; // stop loop early
    }
    return true;
  }

  /** Draws a semi-transparent black overlay behind chest/stones. */
  private drawOverlay() {
    this.ctx.fillStyle = "rgba(0,0,0,0.7)";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

}
