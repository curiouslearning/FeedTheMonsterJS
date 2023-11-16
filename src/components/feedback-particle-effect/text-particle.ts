import { FeedbackTextEffects } from "./feedback-text-effects";

export class TextParticle {
  private feedbackTextEffects: FeedbackTextEffects;
  private x: number;
  private y: number;
  private color: string;
  private originX: number;
  private originY: number;
  private size: number;
  private ease: number;

  constructor(feedbackTextEffects: FeedbackTextEffects, x: number, y: number, color: string) {
    this.feedbackTextEffects = feedbackTextEffects;
    this.x = Math.random() * this.feedbackTextEffects.canvasWidth;
    this.y = 0;
    this.color = color;
    this.originX = x;
    this.originY = y;
    this.size = this.feedbackTextEffects.gap;
    this.ease = Math.random() * 0.1 + 0.055;
  }

  public draw(): void {
    this.feedbackTextEffects.context.fillStyle = this.color;
    this.feedbackTextEffects.context.fillRect(this.x, this.y, this.size, this.size);
  }

  public update(): void {
    this.x += (this.originX - this.x) * this.ease;
    this.y += this.originY - this.y;
  }
}