import { TextParticle } from "../components/feedback-particle-effect/text-particle";

export interface FeedbackTextEffectsInterface {
  context: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  textX: number;
  textY: number;
  fontSize: number;
  lineHeight: number;
  maxTextWidth: number;
  particleDuration: number;
  startTime: number | null;
  particles: TextParticle[];
  gap: number;
  mouse: { radius: number; x: number; y: number };
  textWorker: Worker;

  wrapText(text: string): void;
  render(): void;
  updateParticles(): void;
  clearParticle(): void;
  unregisterEventListener(): void;
}
