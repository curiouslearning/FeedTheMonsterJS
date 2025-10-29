import { AudioPlayer } from '@components/audio-player';
import { STONE_BLUE, BURN_EFFECT_IMG, STONE_BURN } from '@constants';

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
  private burnFrames: HTMLImageElement[] = []; // Preloaded burn animation frames
  private ctx: CanvasRenderingContext2D; // Canvas rendering context
  private frameDuration: number; //Frame duration.
  private startTime: number = 0; // track when the minigame started
  private totalDuration: number = 12000; // default duration in ms (can be updated externally)
  private totalSpawned = 0;
  private exitedCount = 0;
  private hasEmittedThreshold = false;
  public onThresholdTimeReached ?: () => void;
  public onStoneCollected?: (collectedBeforeThreshold: boolean) => void;
  public onBlueBonusReady?: () => void;

  // tracking helpers
  public totalToSpawn: number = 0; // set this when you initialize spawn count
  public collectedCount: number = 0; // increment when player collects a stone
  private blueBonusEmitted: boolean = false;
  private blueBonusDeferred: boolean = false;
  private isBurnAudioPlaying = false;
  public audioPlayer: AudioPlayer = new AudioPlayer();
  /**
   * @param ctx - Canvas rendering context for drawing stones
   */
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.stones = [];
    this.stoneImg = new Image();
    this.stoneImg.src = STONE_BLUE; // Default blue stone sprite
    this.frameDuration = 75;
    // Preload burn animation frames (4-frame sprite)
    for (let i = 1; i <= 4; i++) {
      const burnImg = new Image();
      burnImg.src = BURN_EFFECT_IMG(i);
      this.burnFrames.push(burnImg);
    }
  }

  // Call whenever a stone exits the screen
  private handleStoneExited() {
    this.exitedCount++;
    this.logSpawnPercentAndMaybeTrigger();
  }

  // Call whenever player collects a stone
  private handleStoneCollected(collectedBeforeThreshold: boolean = false) {
    this.collectedCount++;
    // notify external listener about collection timing
    this.onStoneCollected?.(collectedBeforeThreshold);
    // If 60% already passed and player now reached 3+, decide here too
    this.logSpawnPercentAndMaybeTrigger();

    // helper to check if bonus can be shown
    if (this.shouldTriggerBonus()) {
      this.triggerBlueBonus();
    }
  }

  /**
 * Determines if the blue bonus can be triggered based on collection and threshold progress.
 */
  private shouldTriggerBonus(): boolean {
    if (this.blueBonusEmitted) return false;
    if (!this.blueBonusDeferred) return false;
    if (this.collectedCount < 3) return false;

    const percent = this.getElapsedPercent();
    const bonusCutoff = 90;

    // Bonus only valid before or at 90% exit
    return percent <= bonusCutoff;
  }

  /**
   * Centralized logic to trigger the blue bonus star and audio.
   */
  private triggerBlueBonus(): void {
    this.blueBonusEmitted = true;
    this.onBlueBonusReady?.();
  }

  /** Call this when minigame starts */
  public startTimer(totalDurationMs: number) {
    this.startTime = performance.now();
    this.totalDuration = totalDurationMs;
  }

  /** Returns elapsed time percent (0–100) */
  private getElapsedPercent(): number {
    if (!this.startTime) return 0;
    const elapsed = performance.now() - this.startTime;
    return Math.min((elapsed / this.totalDuration) * 100, 100);
  }

  private logSpawnPercentAndMaybeTrigger() {
    const percent = this.getElapsedPercent();
    
    // when >=60% exited, decide whether to show star now or defer
    const bonusThreshold = 60;
    const bonusCutoff = 90;

    if (this.blueBonusEmitted) return;

    // Trigger threshold event at 60%
    if (!this.hasEmittedThreshold && percent >= bonusThreshold) {
      this.hasEmittedThreshold = true;
      this.onThresholdTimeReached?.();
    }

    // Between 60–75%, decide whether to trigger or defer
    if (percent < bonusCutoff) {
      if (this.hasEmittedThreshold) {
        if (this.collectedCount >= 3) this.triggerBlueBonus();
        else this.blueBonusDeferred = true;
      }
    } else {
      // After 90%, no deferred bonus
      this.blueBonusDeferred = false;
    }
  }

  /**
   * Updates stone state and renders them on canvas.
   * Should be called each frame during animation loop.
   * @param width - Canvas width
   * @param height - Canvas height
   */
  public stoneBurstAnimation(width: number, height: number, deltaTime: number): void {
    this.updateStones(width, deltaTime);
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
    this.totalSpawned++;
    return stone;
  }

  /**
   * Removes inactive stones from the list.
   */
  private cleanupStones(): void {
    // collect removed stones so we can call handleStoneExited for each
    const removedStones = this.stones.filter(st => !st.active);
    this.stones = this.stones.filter(stone => stone.active);
    const removed = removedStones.length;
    if (removed > 0) {
      // Call exit handler for each removed stone so centralized logic runs
      for (let i = 0; i < removed; i++) {
        this.handleStoneExited();
      }
    }
  }

  /**
   * Updates movement and burning state for each stone.
   * Also renders stones to the canvas.
   * @param width - Canvas width
   */
  private updateStones(width: number, deltaTime: number): void {
    for (const stone of this.stones) {
      if (!stone.active) continue;
      stone.burning ? this.updateBurningStone(stone) : this.updateMovingStone(stone, width, deltaTime);
      this.drawStone(stone);
    }
  }

  private playBurnAudio() {
    if (this.isBurnAudioPlaying) return; // skips if one is already playing

    this.isBurnAudioPlaying = true;
    const audio = this.audioPlayer.playAudio(STONE_BURN, 1.0, () => {
      this.isBurnAudioPlaying = false; // reset after audio completes
    });
  }

  /**
   * Handles click interactions with stones.
   * If a stone is clicked, it enters burning state.
   * @param x - Mouse click X coordinate
   * @param y - Mouse click Y coordinate
   * @returns true if a stone was clicked and triggered
   */
  public onClickEvent(x: number, y: number): boolean {
    // iterate stones from top-most to bottom-most stone
    for (let i = this.stones.length - 1; i >= 0; i--) {
      const stone = this.stones[i];
      if (!stone.active) continue;
      // Check if click is inside stone bounds
      const dx = x - stone.x;
      const dy = y - stone.y;

      if (Math.sqrt(dx * dx + dy * dy) <= stone.size / 2) {
        // Freeze stone when clicked
        stone.dx = 0;
        stone.dy = 0;

        if (stone.burning) return false;
        // Trigger burn sequence
        stone.burning = true;
        stone.burnStartTime = performance.now();
        stone.burnFrameIndex = 0;

        // Play burn SFX
        this.playBurnAudio();

        // Track collection timing via centralized handler so bonus logic runs
        const collectedBeforeThreshold = !this.hasEmittedThreshold;
        this.handleStoneCollected(collectedBeforeThreshold);

        // move this stone to top of draw order
        this.stones.splice(i, 1);
        this.stones.push(stone);

        return true;
      }
    }
    return false;
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
  private updateMovingStone(stone: Stone, width: number, deltaTime: number): void {
    const fpsNormalizer: number = deltaTime / 16.67; // Normalize to ~60fps
    stone.x += stone.dx * fpsNormalizer;
    stone.y += stone.dy * fpsNormalizer;
    stone.lifetime -= fpsNormalizer;

    // Gradually fade out near the end of lifetime
    if (stone.lifetime < 60) stone.opacity -= 0.002 * fpsNormalizer;

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