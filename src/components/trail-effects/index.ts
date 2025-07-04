import { CursorComponent } from '@components';
import TrailEffect from './trail-particles';

export default class TrailEffectsHandler extends CursorComponent {
  trailParticles: TrailEffect;
  public canvas: HTMLCanvasElement;
  public clickTrailToggle: boolean;
  private hasGameStarted = false;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.canvas = canvas;
    this.clickTrailToggle = false;
    this.hasGameStarted = false;
    this.addEventListeners();
    this.trailParticles = new TrailEffect(canvas);
  }

  setGameHasStarted(isGameStarted: boolean) {
    this.hasGameStarted = isGameStarted;
  }

  public draw() {
    if (this.hasGameStarted && this.clickTrailToggle) {
      this.trailParticles?.draw();
    }
  }

  public handleCursorMouseUp(event) {
    this.clickTrailToggle = false;
  }

  public handleCursorMouseMove(event) {
    if (this.hasGameStarted && this.clickTrailToggle) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.trailParticles?.addTrailParticlesOnMove(x, y);
    }
  }

  public handleCursorMouseDown(event) {
    this.clickTrailToggle = true;
  }

  public handleCursorTouchStart(event) {
    this.handleCursorMouseDown(event); //Same logic with gameplay-scene on calling this event method.
    this.trailParticles?.resetParticles();
  }

  public handleCursorTouchMove(event) {
    if (this.hasGameStarted && this.clickTrailToggle) {
      const touch = event.touches[0];
      this.handleCursorMouseMove(event);  //Same logic with gameplay-scene on calling this event method.
      this.trailParticles?.addTrailParticlesOnMove(touch.clientX, touch.clientY);
    }
  }

  public handleCursorTouchEnd(event) {
    this.handleCursorMouseUp(event); //Same logic with gameplay-scene on calling this event method.
    this.trailParticles?.resetParticles();
  }

  public handleCursorMouseClick(event) {
    //Add logic for mouse click in case we need a logic for trail effect during click event.
  }

  public dispose() {
    this.removeEventListeners();
    this.hasGameStarted = false;
  }

}