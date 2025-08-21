// TreasureChestAnimation.ts
type Stone = {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  opacity: number;
  active: boolean;
  lifetime: 240, // new property
};

export class TreasureChestAnimation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private chestImg: HTMLImageElement;
  private stones: Stone[] = [];
  private animationFrameId: number | null = null;
  private isVisible: boolean = false;
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 300; // ms between spawns

  constructor(private width: number, private height: number) {
    this.canvas = document.getElementById("treasurecanvas") as HTMLCanvasElement;
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.display = "none"; // hide initially
    this.canvas.style.zIndex = "9";
    this.canvas.style.pointerEvents = "none"; // don't block clicks

    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Canvas not supported");
    this.ctx = context;

    this.chestImg = new Image();
    this.chestImg.src = "./assets/images/chest.png"; // update path to chest image
  }

  /** Call when gameplay starts */
  public show() {
    this.canvas.style.display = "block";
    this.isVisible = true;
    this.spawnStones();
    this.loop();
  }

  /** Call when gameplay ends */
  public hide() {
    this.canvas.style.display = "none";
    this.isVisible = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private spawnStones() {
    this.stones = [];
    const chestX = this.width / 2;
    const chestY = this.height - 120;

    for (let i = 0; i < 5; i++) {
      const radius = 10 + Math.random() * 5;

      // prevent overlap on spawn
      let x = chestX;
      let y = chestY;
      let safe = false;
      let tries = 0;
      while (!safe && tries < 50) {
        // move the stone upward each try
        y = chestY - tries * (radius * 3 + 8);

        safe = this.stones.every(
          s => Math.hypot(s.x - x, s.y - y) > s.radius + radius + 16
        );

        tries++;
      }

      const angle = Math.random() * Math.PI - Math.PI / 2; // upward directions
      const speed = 0.2 + Math.random() * 0.3; // slower speed

      this.stones.push({
        x,
        y,
        radius,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 2, // stronger upward push
        opacity: 1,
        active: true,
        lifetime: 240, // ~2s at 60fps
      });
    }

    console.log("Stones spawned:", this.stones.length);
  }

  private loop = (time: number = 0) => {
    if (!this.isVisible) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw chest
    const chestW = 220;
    const chestH = 200;
    const chestX = this.width / 2 - chestW / 2;
    const chestY = this.height - chestH - 20;
    this.ctx.drawImage(this.chestImg, chestX, chestY, chestW, chestH);

    // Spawn new stones every interval
    if (time - this.lastSpawnTime > this.spawnInterval) {
      this.spawnStones();
      this.lastSpawnTime = time;
    }

    // Update & draw stones
    for (const stone of this.stones) {
      if (!stone.active) continue;

      stone.x += stone.dx;
      stone.y += stone.dy;
      stone.dy += 0.015; // softer gravity for slower fall
      stone.lifetime--;

      // Fade only in the last second
      if (stone.lifetime < 60) {
        stone.opacity = stone.lifetime / 60;
      }

      if (stone.lifetime <= 0 || stone.y > this.height + stone.radius) {
        stone.active = false;
        continue;
      }

      this.ctx.globalAlpha = stone.opacity;
      this.ctx.beginPath();
      this.ctx.fillStyle = "orange";
      this.ctx.arc(stone.x, stone.y, stone.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    }

    // Remove inactive stones
    this.stones = this.stones.filter(stone => stone.active);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

}
