import { TextParticle } from "./text-particle";
import { font } from "@common";

export class FeedbackTextEffects {
  public context: CanvasRenderingContext2D;
  public canvasWidth: number;
  public canvasHeight: number;
  public textX: number;
  public textY: number;
  public fontSize: number;
  public lineHeight: number;
  public maxTextWidth: number;
  public particleDuration: number;
  public startTime: number | null;
  public particles: TextParticle[];
  public gap: number;
  public mouse: { radius: number; x: number; y: number };
  public textWorker: Worker;

  constructor(
    context: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) {
    this.context = context;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.textX = this.canvasWidth / 1.8;
    this.textY = this.canvasHeight / 2;
    this.fontSize = this.canvasWidth / 7.5;
    this.lineHeight = this.fontSize * 0.8;
    this.maxTextWidth = this.canvasWidth * 5;
    this.particleDuration = 5000;
    this.startTime = null;
    this.particles = [];
    this.gap = 3;
    this.mouse = { radius: 2000, x: 0, y: 0 };
    this.textWorker = new Worker(window.feedbackTextWorkerPath);
    this.textWorker.addEventListener(
      "message",
      this.handleTextWorkerMessage.bind(this)
    );
  }

  public wrapText(text: string): void {
    const gradient = this.context.createLinearGradient(
      0,
      0,
      this.canvasWidth,
      this.canvasHeight
    );
    gradient.addColorStop(0.3, "#F8E218");
    gradient.addColorStop(0.5, "#F8E218");
    gradient.addColorStop(0.7, "#E39D37");
    this.context.fillStyle = gradient;
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    this.context.lineWidth = 3;
    this.context.strokeStyle = "#A46225";
    this.context.font = `${
      this.fontSize - text.length * 0.3
    }px ${font}, monospace`;
    // break multiline text
    let lineArray: string[] = [];
    let words = text.split(" ");
    let lineCounter = 0;
    let line = "";
    for (let i = 0; i < words.length; i++) {
      let testLine = line + words[i] + " ";
      if (this.context.measureText(testLine).width > this.maxTextWidth) {
        line = words[i] + "";
        lineCounter++;
      } else {
        line = testLine;
      }
      lineArray[lineCounter] = line;
    }
    let textHeight = this.lineHeight * lineCounter;
    this.textY = this.canvasHeight / 4.2 - textHeight / 2;
    const initialX = 50;
    // const spacing = 0.3;
    text = text.trim();
    lineArray.forEach((text, index) => {
      let lastSpaceIndex = text.lastIndexOf(" ", text.lastIndexOf(" ") - 1);
      if (
        this.fontSize * text.length > this.canvasWidth * 1.7 &&
        lastSpaceIndex != -1
      ) {
        let initialText = text.slice(0, lastSpaceIndex);
        let lastText = " " + text.slice(lastSpaceIndex + 1);
        this.context.fillText(
          initialText,
          this.textX,
          this.textY + index * this.lineHeight
        );
        this.context.fillText(
          lastText,
          this.textX,
          this.textY + index * this.lineHeight + this.canvasHeight / 12
        );
      } else {
        this.context.fillText(
          text,
          this.textX,
          this.textY + index * this.lineHeight
        );
      }
    });
    this.convertToParticle();
  }

  private handleTextWorkerMessage(event: MessageEvent): void {
    this.particles = event.data.map(
      ({ x, y, color }) => new TextParticle(this, x, y, color)
    );
  }

  private convertToParticle(): void {
    const imageData = this.context.getImageData(
      0,
      0,
      this.canvasWidth,
      this.canvasHeight
    );
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.textWorker.postMessage({
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      gap: this.gap,
      pixels: imageData.data,
    });
  }

  public render(): void {
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.particles.forEach((particle) => {
      particle.draw();
      particle.update();
    });
  }

  public updateParticles(): void {
    this.textWorker.postMessage({
      particles: this.particles,
      particleDuration: this.particleDuration,
      startTime: this.startTime,
    });
  }

  public clearParticle(): void {
    this.particles = [];
  }

  public unregisterEventListener(): void {
    this.textWorker.removeEventListener(
      "message",
      this.handleTextWorkerMessage
    );
    this.textWorker.terminate();
  }
}
