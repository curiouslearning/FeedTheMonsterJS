// TreasureChestAnimation.ts
type Stone = {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  opacity: number;
  active: boolean;
  lifetime: number, // new property
  img: HTMLImageElement;
  size: number; // dynamic size for stone
};

export class TreasureChestAnimation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private chestImg: HTMLImageElement;
  private stoneImg: HTMLImageElement;
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
    this.chestImg.src = "./assets/images/chest.png"; // treasure chest image

    this.stoneImg = new Image();
    this.stoneImg.src = "./assets/images/stone_blue.png"; // blue stone image
  }

  /** Call when gameplay starts */
  public show() {
    this.canvas.style.display = "block";
    this.isVisible = true;
    this.spawnStone();
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

  private spawnStone() {
    const chestX = this.width / 2 - 40;
    const chestY = this.height - 200;

    const radius = 8 + Math.random() * 6;
    const baseAngle = Math.PI / 2;
    const spread = (Math.random() - 0.5) * (Math.PI / 3); // –30° to +30°
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

  private loop = (time: number = 0) => {
    if (!this.isVisible) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw chest
    const chestW = 250;
    const chestH = 230;
    const chestX = this.width / 2 - chestW / 2;
    const chestY = this.height - chestH - 20;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.drawImage(this.chestImg, chestX, chestY, chestW, chestH);

    // Update & draw stones
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

    // Remove inactive stones
    this.stones = this.stones.filter(stone => stone.active);
    let maxStones = Math.floor(Math.random() * (12 - 6 + 1)) + 6; // between 6 and 12
    // Keep topping up until we have 8 stones max
    while (this.stones.length < maxStones) {
      this.stones.push(this.spawnStone());
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

}
