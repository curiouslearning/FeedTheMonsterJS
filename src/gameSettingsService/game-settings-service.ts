import { PubSub } from '../events/pub-sub-events';

export class GameSettingsService extends PubSub{
  public EVENTS: {
    GAME_TRAIL_EFFECT_TOGGLE_EVENT: string;
  };
  public clickTrailToggle: boolean;

  constructor() {
    super();
    this.EVENTS = {
      GAME_TRAIL_EFFECT_TOGGLE_EVENT: 'GAME_TRAIL_EFFECT_TOGGLE_EVENT',
    }
    this.clickTrailToggle = false;
    this.initListeners();
  }

  private initListeners() {
    /* Listeners to update game settings values. */
    this.subscribe(this.EVENTS.GAME_TRAIL_EFFECT_TOGGLE_EVENT, (data) => { this.updateGameTrailToggle(data); }); // To move this event on DOM Event once created.
  }

  private updateGameTrailToggle(isTrailEffectOn: boolean) {
    this.clickTrailToggle = isTrailEffectOn;
  }

  public getCanvasSizeValues() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    return {
      canvasElem: canvas,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      context: canvas.getContext("2d"),
    }
  }
}

