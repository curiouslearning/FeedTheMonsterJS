import { PubSub } from '../events/pub-sub-events';

export class GameSettingsService extends PubSub{
  public devicePixelRatio: number;

  constructor() {
    super();
    this.devicePixelRatio = window.devicePixelRatio || 1;
  }

  /*
   * getCanvasSizeValues: Returns Canvas element HTML element, it's width and height and Canvas context 2D.
  */
  public getCanvasSizeValues() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const loadingCanvas = document.getElementById("loading") as HTMLCanvasElement;
    loadingCanvas.width = canvas.width; //using the original "canvas" ID height.
    loadingCanvas.height = canvas.height; //using the original "canvas" ID height.

    return {
      canvasElem: canvas,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      context: canvas.getContext("2d"),
      gameCanvasContext: canvas.getContext("2d", { willReadFrequently: true }),
      loadingCanvas,
      loadingContext: loadingCanvas.getContext("2d"),
      gameControlElem: document.getElementById("game-control") as HTMLCanvasElement
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
