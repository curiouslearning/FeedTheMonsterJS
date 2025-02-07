import { PubSub } from '../events/pub-sub-events';

export class GameSettingsService extends PubSub{
  public EVENTS: {
    GAME_TRAIL_EFFECT_TOGGLE_EVENT: string;
  };
  public clickTrailToggle: boolean;
  public devicePixelRatio: number;

  constructor() {
    super();
    this.EVENTS = {
      GAME_TRAIL_EFFECT_TOGGLE_EVENT: 'GAME_TRAIL_EFFECT_TOGGLE_EVENT',
    }
    this.clickTrailToggle = false;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.initListeners();
  }

  private initListeners() {
    /* Listeners to update game settings values. */
    this.subscribe(this.EVENTS.GAME_TRAIL_EFFECT_TOGGLE_EVENT, (data) => { this.updateGameTrailToggle(data); }); // To move this event on DOM Event once created.
  }

  private updateGameTrailToggle(isTrailEffectOn: boolean) {
    this.clickTrailToggle = isTrailEffectOn;
  }

  /*
   * getCanvasSizeValues: Returns Canvas element HTML element, it's width and height and Canvas context 2D.
  */
  public getCanvasSizeValues() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    return {
      canvasElem: canvas,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      context: canvas.getContext("2d"),
    }
  }

  /*
   * getRiveCanvasValue: Returns Rive Canvas HTML element with devicePixelRatio scale applied to its width and height..
  */
  public getRiveCanvasValue() {
    const riveMonsterElement = document.getElementById("rivecanvas") as HTMLCanvasElement

    // Adjust canvas dimensions according to the device's pixel ratio.
    riveMonsterElement.width = riveMonsterElement.clientWidth * this.devicePixelRatio;
    riveMonsterElement.height = riveMonsterElement.clientHeight * this.devicePixelRatio;

    return riveMonsterElement;
  }

  public getDevicePixelRatioValue() {
    return this.devicePixelRatio;
  }
}

