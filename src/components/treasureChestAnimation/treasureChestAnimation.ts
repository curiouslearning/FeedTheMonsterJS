// TreasureChestAnimation.ts
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
  private chestOpen: boolean = false;
  private lastSpawnTime: number;
  private startTime: number = 0;
  private shakeDuration: number = 1000; // 1s
  private chestStayedOpenMs: number = 1200; // how long chest remains open before cleanup

  constructor(private width: number, private height: number) {
    this.canvas = document.getElementById("treasurecanvas") as HTMLCanvasElement;
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.display = "none";
    this.canvas.style.zIndex = "9";
    this.canvas.style.pointerEvents = "none";
    this.lastSpawnTime = performance.now();

    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Canvas not supported");
    this.ctx = context;

    // load chest images
    this.closedChestImg = new Image();
    this.closedChestImg.src = "./assets/images/closedchest.svg"; // closed chest

    this.openChestImg = new Image();
    this.openChestImg.src = "./assets/images/chest.svg"; // open chest

    this.stoneImg = new Image();
    this.stoneImg.src = "./assets/images/stone_blue.png";
  }

  /** Starts the mini chest animation */
  public show(onComplete?: () => void) {
    this.canvas.style.display = "block";
    this.isVisible = true;
    this.chestOpen = false;
    this.startTime = performance.now();
    this.stones = [];

    this.loop();

    // after 1s, chest opens
    setTimeout(() => {
      this.chestOpen = true;
    }, this.shakeDuration);

    // play for 15s total, then cleanup
    setTimeout(() => {
      this.hide();
      if (onComplete) onComplete();
    }, 15000);
  }

  /** Stops & hides */
  public hide() {
    this.canvas.style.display = "none";
    this.isVisible = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Shake offset calc */
  private getShakeOffset(now: number): number {
    const elapsed = now - this.startTime;
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
      x: chestX,
      y: chestY,
      radius,
      dx: Math.cos(angle) * speed,
      dy: -Math.sin(angle) * speed,
      opacity: 1,
      active: true,
      lifetime: 300,
      img: this.stoneImg,
      size: 120,
    };

    console.log("Spawned stone:", stone, "Total stones on screen:", this.stones.length + 1);

    return stone;  
  }

  /** Main loop */
  private loop = (time: number = 0) => {
    if (!this.isVisible) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // shadow overlay
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // chest
    const chestW = 250;
    const chestH = 230;
    let chestX = this.width / 2 - chestW / 2;
    const chestY = this.height - chestH - 20;
    // Animate chest before shooting
    const elapsed = time - this.lastSpawnTime;
    let scale = 1;
    let rotation = 0;

    if (elapsed < 1000) {
      // 1 second pre-shoot animation
      scale = 1 + Math.sin(elapsed / 1000 * Math.PI * 4) * 0.05; // squash & stretch
      rotation = Math.sin(elapsed / 1000 * Math.PI * 6) * 0.1;   // wiggle (in radians)
    }

    if (!this.chestOpen) {
      // Closed chest with pre-open wiggle/shake
      this.ctx.save();
      this.ctx.translate(chestX + chestW / 2, chestY + chestH / 2);
      this.ctx.rotate(rotation);
      this.ctx.scale(scale, scale);

      const offset = this.getShakeOffset(time);
      this.ctx.drawImage(
        this.closedChestImg,
        -chestW / 2 + offset,
        -chestH / 2,
        chestW,
        chestH
      );

      this.ctx.restore();
    } else {
      // Open chest only
      this.ctx.drawImage(this.openChestImg, chestX, chestY, chestW, chestH);

      // update stones
      for (const stone of this.stones) {
        if (!stone.active) continue;

        stone.x += stone.dx;
        stone.y += stone.dy;
        stone.lifetime--;

        if (stone.lifetime < 60) {
          stone.opacity -= 0.002;
        }

        if (
          stone.lifetime <= 0 ||
          stone.y + stone.radius < 0 ||
          stone.x < -stone.radius ||
          stone.x > this.width + stone.radius
        ) {
          stone.active = false;
          continue;
        }

        this.ctx.globalAlpha = stone.opacity;
        this.ctx.drawImage(
          stone.img,
          stone.x - stone.radius,
          stone.y - stone.radius,
          stone.size,
          stone.size
        );
        this.ctx.globalAlpha = 1.0;
      }

      // cleanup
      this.stones = this.stones.filter(stone => stone.active);

      // maintain between 6–12 stones
      const maxStones = Math.floor(Math.random() * (12 - 6 + 1)) + 6;
      while (this.stones.length < maxStones) {
        this.stones.push(this.spawnStone());
      }
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
