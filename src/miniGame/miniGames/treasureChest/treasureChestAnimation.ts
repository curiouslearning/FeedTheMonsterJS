import { AudioPlayer } from '@components/audio-player';
import { AUDIO_MINIGAME, CLOSED_CHEST, OPEN_CHEST, STONE_BLUE } from '@constants';
import gameSettingsServiceInstance from '@gameSettingsService/index';

enum TreasureChestState {
  FadeIn,
  ClosedChest,
  OpenedChest,
  FadeOut
}

type Stone = {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  opacity: number;
  active: boolean;
  lifetime: number;
  img: HTMLImageElement;
  size: number;
  burning?: boolean;
  burnStartTime?: number;
  burnFrameIndex?: number;
};

export class TreasureChestAnimation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private closedChestImg: HTMLImageElement;
  private openChestImg: HTMLImageElement;
  private stoneImg: HTMLImageElement;
  private stones: Stone[] = [];
  private animationFrameId: number | null = null;
  private isVisible: boolean = false;
  private lastSpawnTime: number;
  private shakeDuration: number = 1000; // 1s
  private callback: () => void; //Callback method to parent to trigger scoring / tapping of stones.
  private burnFrames: HTMLImageElement[] = [];
  private lastTapTime = 0;
  private fadeInStart: number | null = null;
  private fadeOutStart: number | null = null;
  private fadeInDuration = 300;
  private fadeOutDuration = 400;
  private onFadeComplete?: () => void;
  private state: TreasureChestState = TreasureChestState.FadeIn;
  private stateStartTime: number = 0;
  public dpr: number;
  public audioPlayer: AudioPlayer;
  private chestAudioPlayed: boolean = false;
  constructor(
    private width: number,
    private height: number,
    callback: () => void,
  ) {
    this.canvas = document.getElementById("treasurecanvas") as HTMLCanvasElement;
    this.dpr = gameSettingsServiceInstance.getDevicePixelRatioValue();
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.display = "none";
    this.canvas.style.zIndex = "11";
    this.canvas.style.pointerEvents = "auto";
    this.canvas.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("touchstart", this.handleClick);
    this.lastSpawnTime = performance.now();
    this.callback = callback;
    this.audioPlayer = new AudioPlayer();
    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Canvas not supported");
    this.ctx = context;
    this.ctx.scale(this.dpr, this.dpr); // scale at init
    // load chest and stone images
    this.closedChestImg = new Image();
    this.closedChestImg.src = CLOSED_CHEST; // closed chest

    this.openChestImg = new Image();
    this.openChestImg.src = OPEN_CHEST; // open chest

    this.stoneImg = new Image();
    this.stoneImg.src = STONE_BLUE; // blue stone
    // load burn frames
    for (let i = 1; i <= 4; i++) {
      const burnImg = new Image();
      burnImg.src = `./assets/images/stone_burn_export_${i}.png`;
      this.burnFrames.push(burnImg);
    }
  }

  private handleClick = (e: MouseEvent | TouchEvent) => {
    // Prevent double trigger on touch devices
    if (e.type === "touchstart") {
      this.lastTapTime = Date.now();
    } else if (e.type === "click") {
      if (Date.now() - this.lastTapTime < 500) {
        return; // skip synthetic click
      }
    }
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

    for (const stone of this.stones) {
      if (!stone.active) continue;

      // Check if click is inside stone bounds
      const dx = x - stone.x;
      const dy = y - stone.y;
      if (Math.sqrt(dx * dx + dy * dy) <= stone.size / 2) {
        // Freeze stone
        stone.dx = 0;
        stone.dy = 0;
        if (stone.burning || !stone.active) {
          continue;
        }
        // Trigger burn sequence
        stone.burning = true;
        stone.burnStartTime = performance.now();
        stone.burnFrameIndex = 0;

        this.callback(); // notify MiniGame
        break;
      }
    }
  };


  /** Starts the mini chest animation */
  public show(onComplete?: () => void) {
    this.canvas.style.display = "block";
    this.isVisible = true;
    this.stones = [];
    this.onFadeComplete = onComplete;
    this.state = TreasureChestState.FadeIn;
    this.stateStartTime = performance.now();
    this.loop();
  }

  /** Stops & hides */
  public hide() {
    this.audioPlayer.stopAudio();
    this.canvas.style.display = "none";
    this.canvas.removeEventListener("click", this.handleClick);
    this.canvas.removeEventListener("touchstart", this.handleClick);
    this.isVisible = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Shake offset calc */
  private getShakeOffset(now: number): number {
    const elapsed = now - this.stateStartTime;
    if (elapsed > this.shakeDuration) return 0;

    const progress = elapsed / this.shakeDuration;
    const cycle = Math.floor(progress * 6); // 6 half-shakes
    const amplitude = [20, -20, 15, -15, 8, -8][cycle] || 0;
    return amplitude;
  }

  /** Spawn stone from chest */
  private spawnStone(): Stone {
    const chestX = this.width / 2 - 40;
    const chestY = this.height - 200;

    const radius = 8 + Math.random() * 6;
    const baseAngle = Math.PI / 2;
    const spread = (Math.random() - 0.5) * (Math.PI / 3);
    let angle = baseAngle + spread;

    if (angle < Math.PI / 2) {
      angle = baseAngle - Math.abs(spread);
    } else {
      angle = baseAngle + Math.abs(spread);
    }

    const speed = 2 + Math.random() * 2;

    const stone: Stone = {
      x: chestX + 50,
      y: chestY + 50,
      radius,
      dx: Math.cos(angle) * speed,
      dy: -Math.sin(angle) * speed,
      opacity: 1,
      active: true,
      lifetime: 300,
      img: this.stoneImg,
      size: 100,
    };

    return stone;
  }

  /** Main loop */
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
        this.drawClosedChest(time);
        if (alpha >= 1) {
          this.state = TreasureChestState.ClosedChest;
          this.stateStartTime = performance.now();
        }
        break;
      }
      case TreasureChestState.ClosedChest: {
        this.ctx.globalAlpha = 1;
        this.drawClosedChest(time);
        const elapsed = performance.now() - this.stateStartTime;
        if (elapsed >= this.shakeDuration) {
          this.state = TreasureChestState.OpenedChest;
          this.stateStartTime = performance.now();
        }
        break;
      }
      case TreasureChestState.OpenedChest: {
        this.ctx.globalAlpha = 1;
        this.drawOpenChest(time);
        this.updateStones();
        this.cleanupStones();
        this.maintainStones();
        if (!this.chestAudioPlayed) {       // add a boolean flag to the class
          this.audioPlayer.playAudio(AUDIO_MINIGAME);
          this.chestAudioPlayed = true;
        }

        const elapsed = performance.now() - this.stateStartTime;
        if (elapsed >= 12000) { // 12s for chest open
          this.state = TreasureChestState.FadeOut;
          this.stateStartTime = performance.now();
        }
        break;
      }
      case TreasureChestState.FadeOut: {
        const elapsed = performance.now() - this.stateStartTime;
        const alpha = Math.max(0, 1 - elapsed / this.fadeOutDuration);
        this.ctx.globalAlpha = alpha;
        this.drawOpenChest(time);
        this.updateStones();
        this.cleanupStones();
        this.maintainStones();
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
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

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

  private drawOverlay() {
    this.ctx.fillStyle = "rgba(0,0,0,0.7)";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawClosedChest(time: number) {
    const chestW = 250, chestH = 230;
    const chestX = this.width / 2 - chestW / 2;
    const chestY = this.height - chestH - 20;

    const elapsed = time - this.lastSpawnTime;
    let scale = 1;
    let rotation = 0;
    if (elapsed < 1000) {
      scale = 1 + Math.sin((elapsed / 1000) * Math.PI * 4) * 0.05;
      rotation = Math.sin((elapsed / 1000) * Math.PI * 6) * 0.1;
    }

    this.ctx.save();
    this.ctx.translate(chestX + chestW / 2, chestY + chestH / 2);
    this.ctx.rotate(rotation);
    this.ctx.scale(scale, scale);
    const offset = this.getShakeOffset(time);
    this.ctx.drawImage(this.closedChestImg, -chestW / 2 + offset, -chestH / 2, chestW, chestH);
    this.ctx.restore();
  }

  private drawOpenChest(time: number) {
    const chestW = 250, chestH = 230;
    const chestX = this.width / 2 - chestW / 2;
    const chestY = this.height - chestH - 20;
    this.ctx.drawImage(this.openChestImg, chestX, chestY, chestW, chestH);
  }

  private updateStones() {
    for (const stone of this.stones) {
      if (!stone.active) continue;
      stone.burning ? this.updateBurningStone(stone) : this.updateMovingStone(stone);
      this.drawStone(stone);
    }
  }

  private updateMovingStone(stone: Stone) {
    stone.x += stone.dx;
    stone.y += stone.dy;
    stone.lifetime--;
    if (stone.lifetime < 60) stone.opacity -= 0.002;
    if (stone.lifetime <= 0 || stone.y < 0 || stone.x < -stone.size || stone.x > this.width + stone.size) {
      stone.active = false;
    }
  }

  private updateBurningStone(stone: Stone) {
    const elapsed = performance.now() - (stone.burnStartTime || 0);
    stone.burnFrameIndex = Math.floor(elapsed / 75);
    if (stone.burnFrameIndex >= this.burnFrames.length) stone.active = false;
  }

  private drawStone(stone: Stone) {
    if (!stone.active) return;
    this.ctx.globalAlpha = stone.opacity;
    this.ctx.drawImage(stone.img, stone.x - stone.size / 2, stone.y - stone.size / 2, stone.size, stone.size);
    this.ctx.globalAlpha = 1.0;
    if (stone.burning && stone.burnFrameIndex! < this.burnFrames.length) {
      this.ctx.drawImage(this.burnFrames[stone.burnFrameIndex!], stone.x - stone.size / 2, stone.y - stone.size / 2, stone.size, stone.size);
    }
  }

  private cleanupStones() {
    this.stones = this.stones.filter(stone => stone.active);
  }

  private maintainStones() {
    const maxStones = Math.floor(Math.random() * (12 - 6 + 1)) + 6;
    while (this.stones.length < maxStones) {
      this.stones.push(this.spawnStone());
    }
  }


}
