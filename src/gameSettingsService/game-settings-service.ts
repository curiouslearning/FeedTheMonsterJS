import { PubSub } from '../events/pub-sub-events';

export class GameSettingsService extends PubSub{
  public EVENTS: {
    SCENE_LOADING_EVENT: string;
    GAME_TRAIL_EFFECT_TOGGLE_EVENT: string;
  };
  public clickTrailToggle: boolean;
  public devicePixelRatio: number;

  constructor() {
    super();
    this.EVENTS = {
      SCENE_LOADING_EVENT: 'SCENE_LOADING_EVENT',
      GAME_TRAIL_EFFECT_TOGGLE_EVENT: 'GAME_TRAIL_EFFECT_TOGGLE_EVENT',
    }
    this.clickTrailToggle = false;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.initListeners();
  }

  private initListeners() {
    /* Listeners to update game settings values. */
    this.subscribe(this.EVENTS.GAME_TRAIL_EFFECT_TOGGLE_EVENT, (data) => { this.updateGameTrailToggle(data); });
  }

  private updateGameTrailToggle(isTrailEffectOn: boolean) {
    this.clickTrailToggle = isTrailEffectOn;
  }

  /*
   * getCanvasSizeValues: Returns Canvas element HTML element, it's width and height and Canvas context 2D.
  */
  public getCanvasSizeValues() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const loadingCanvas = document.getElementById("loading") as HTMLCanvasElement;
    loadingCanvas.width = canvas.width; //using the original "canvas" ID height.
    loadingCanvas.height = canvas.height; //using the original "canvas" ID height.
    const loadingContext = loadingCanvas.getContext("2d");

    return {
      canvasElem: canvas,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      context: canvas.getContext("2d"),
      gameCanvasContext: canvas.getContext("2d", { willReadFrequently: true }),
      loadingCanvas,
      loadingContext
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

