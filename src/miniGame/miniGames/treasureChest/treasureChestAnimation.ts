import { AudioPlayer } from '@components/audio-player';
import { AUDIO_MINIGAME, BLUE_STAR, SURPRISE_BONUS_STAR } from '@constants';
import gameSettingsServiceInstance from '@gameSettingsService/index';
import TreasureStones from './treasureStones';
import TreasureChest from './treasureChest';
import { Utils } from '@common';

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
  private isVisible: boolean = false; // Whether the animation is currently active
  private callback: () => void; // Callback triggered when a stone is clicked
  private lastTapTime = 0; // Used to prevent duplicate clicks on mobile
  private fadeInDuration = 300; // Fade-in time (ms)
  private fadeOutDuration = 400; // Fade-out time (ms)
  private onFadeComplete?: () => void; // Callback after fade-out completes
  private state: TreasureChestState = TreasureChestState.FadeIn; // Current chest animation state
  private stateTimer: number = 0; // Accumulated time in current state
  public dpr: number; // Device pixel ratio scaling
  public audioPlayer: AudioPlayer;
  private sfxPlayer: AudioPlayer;
  private chestAudioPlayed: boolean = false;

  private showBonusStar: boolean = false; //  flag for showing Blue Bonus Star
  private blueStarTimer: number = 0;
  private blueStarDuration: number = 2000; // total visible time (ms)
  private blueStarFadeIn: number = 400;
  private blueStarFadeOut: number = 400;
  private blueStarSoundPlayed: boolean = false;

  private treasureChest: TreasureChest; // Handles chest drawing
  private treasureStone: TreasureStones;  // Handles stone drawing & animations
  private blueStarImg: HTMLImageElement = new Image();
  private blueStarVisible: boolean = false;

  /**
   * @param width - Canvas width
   * @param height - Canvas height
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
    this.blueStarImg.src = BLUE_STAR;

    //Get responsive width from utility
    this.width = Utils.getResponsiveCanvasWidth();

    // Applying DPR scaling
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;

    // Seting CSS size (logical resolution)
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Positioning overlay on top of game screen
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
    this.audioPlayer = new AudioPlayer();
    this.sfxPlayer = new AudioPlayer();
    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Canvas not supported");
    this.ctx = context;
    this.ctx.scale(this.dpr, this.dpr); // scale at init

    // Initialize chest and stone managers
    this.treasureChest = new TreasureChest(this.ctx);
    this.treasureStone = new TreasureStones(this.ctx);

    // after initializing this.treasureStone
    this.treasureStone.onBlueBonusReady = () => {
      this.showBonusStar = true;
      this.blueStarTimer = 0;
      this.blueStarSoundPlayed = false;
    };

  }

  /**
 * Allows external code to inject an existing TreasureStones instance.
 * Useful to avoid duplicate instances or to share the same manager.
 */
  public setTreasureStones(stones: TreasureStones) {
    if (!stones) return;
    this.treasureStone = stones;
    // re-hook the callback on the injected instance
    this.treasureStone.onBlueBonusReady = () => {
      this.showBonusStar = true;
      this.blueStarTimer = 0;
      this.blueStarSoundPlayed = false;
    };
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

  /**
  * Expose internal canvas context so caller can create TreasureStones with correct ctx.
  */
  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /** Draws the Blue Bonus Star with smooth fade-in/out while game continues */
  private drawBlueBonusStar(deltaTime: number) {
    if (!this.showBonusStar || !this.blueStarImg.complete) return;

    this.blueStarTimer += deltaTime;
    const elapsed = this.blueStarTimer;

    // Ensure duration resets properly when star first visible
    if (elapsed < 50 && !this.blueStarSoundPlayed) {
      // Play sound once when star becomes visible
      this.sfxPlayer.playAudio(SURPRISE_BONUS_STAR, 1.0);
      this.blueStarSoundPlayed = true;
    }

    if (elapsed > this.blueStarDuration) {
      this.showBonusStar = false;
      return;
    }
    // Alpha fade in/out
    let alpha = 1;
    if (elapsed < this.blueStarFadeIn) {
      alpha = elapsed / this.blueStarFadeIn;
    } else if (elapsed > this.blueStarDuration - this.blueStarFadeOut) {
      alpha = (this.blueStarDuration - elapsed) / this.blueStarFadeOut;
    }

    // Gentle pulse while visible
    const pulse = 1 + 0.15 * Math.sin(elapsed / 150);
    const size = 100 * pulse;
    const x = this.width / 2 - size / 2;
    const y = this.height / 2 - 150 - size / 2;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(this.blueStarImg, x, y, size, size);
    this.ctx.restore();
  }

  /** Starts the animation and displays the canvas overlay. */
  public show(onComplete?: () => void) {
    this.canvas.style.display = "block";
    this.isVisible = true;
    this.onFadeComplete = onComplete;
    this.state = TreasureChestState.FadeIn;
    this.stateTimer = 0;
  }

  /** Blue Bonus Star Animation */
  public showBlueBonusStar() {
     this.showBonusStar = true;
     this.blueStarTimer = 0;
     this.blueStarSoundPlayed = false;
  };

  /** Stops animation, hides canvas, and cleans up listeners. */
  public hide() {
    this.audioPlayer.stopAudio();
    this.canvas.style.display = "none";
    this.canvas.removeEventListener("click", this.handleClick);
    this.canvas.removeEventListener("touchstart", this.handleClick);
    this.isVisible = false;
  }

  /**
   * Main animation loop.
   * Runs via requestAnimationFrame while visible.
   */
  public draw(deltaTime: number) {
    if (!this.isVisible) return;

    this.stateTimer += deltaTime;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.save();
    this.drawOverlay();

    switch (this.state) {
      case TreasureChestState.FadeIn: {
        const elapsed = this.stateTimer;
        const alpha = Math.min(1, elapsed / this.fadeInDuration);
        this.ctx.globalAlpha = alpha;
        this.treasureChest.drawClosedChest(
          this.stateTimer,
          0,
          this.width,
          this.height
        );
        if (alpha >= 1) {
          this.state = TreasureChestState.ClosedChest;
          this.stateTimer = 0;
        }
        break;
      }
      case TreasureChestState.ClosedChest: {
        this.ctx.globalAlpha = 1;
        this.treasureChest.drawClosedChest(
          this.stateTimer,
          0,
          this.width,
          this.height
        );
        const elapsed = this.stateTimer;
        if (elapsed >= this.treasureChest.shakeDuration) {
          this.state = TreasureChestState.OpenedChest;
          this.stateTimer = 0;
        }
        break;
      }
      case TreasureChestState.OpenedChest: {
        this.ctx.globalAlpha = 1;
        this.treasureChest.drawOpenChest(this.width, this.height);
        this.treasureStone.stoneBurstAnimation(this.width, this.height, deltaTime);

        if (!this.chestAudioPlayed) {
          // Start timer once minigame actually starts
          this.treasureStone.startTimer(12000); // 12 seconds total duration
          this.audioPlayer.playAudio(AUDIO_MINIGAME, 0.6);
          this.chestAudioPlayed = true;
        }

        // Draw Blue Star (animated)
        this.drawBlueBonusStar(deltaTime);

        const elapsed = this.stateTimer;
        if (elapsed >= 12000) {
          this.state = TreasureChestState.FadeOut;
          this.stateTimer = 0;
        }
        break;
      }
      case TreasureChestState.FadeOut: {
        const elapsed = this.stateTimer;
        const alpha = Math.max(0, 1 - elapsed / this.fadeOutDuration);
        this.ctx.globalAlpha = alpha;
        this.treasureChest.drawOpenChest(this.width, this.height);
        this.treasureStone.stoneBurstAnimation(this.width, this.height, deltaTime);

        //Keep showing Blue Star if still active
        this.drawBlueBonusStar(deltaTime);

        if (alpha === 0) {
          this.hide();
          this.onFadeComplete?.();
          this.onFadeComplete = undefined;
          return;
        }
        break;
      }
    }

    this.ctx.restore();
  };

  /** Draws a semi-transparent black overlay behind chest/stones. */
  private drawOverlay() {
    this.ctx.fillStyle = "rgba(0,0,0,0.7)";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}