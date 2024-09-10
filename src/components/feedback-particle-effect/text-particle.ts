import { FeedbackTextEffects } from "@feedbackParticleEffect/feedback-text-effects";

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
    this.y = 0;
    this.color = color;
    this.originX = x;
    this.originY = y;
    // this.size = this.feedbackTextEffects.gap;
    this.ease = Math.random() * 0.1 + 0.055;
  }

  public draw(): void {
  }

  public update(): void {
    this.x += (this.originX - this.x) * this.ease;
    this.y += this.originY - this.y;
  }
}