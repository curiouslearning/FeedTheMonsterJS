import { CLICK } from "../common";
import { EventManager } from "../events/EventManager";

export class BaseComponent extends EventManager {
  public disposeHandler(): void {
    this.unregisterEventListener();
  }

  public removeCanvasEventListener(eventHandler: (event: Event) => void): void {
    const canvasElement = document.getElementById("canvas");

    if (canvasElement) {
      canvasElement.removeEventListener(CLICK, eventHandler, false);
    }
  }

  public stoneDropHandler(context: any, isStoneDropped: boolean = false) {
    context.isStoneDropped = isStoneDropped;
  }
}
