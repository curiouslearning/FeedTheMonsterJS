import { BAR_EMPTY, BAR_FULL, LEVEL_INDICATOR } from "../constants";
import { loadImages } from "../common/common";
import { EventManager } from "../events/EventManager";
import {
  LevelIndicatorsInterface,
  LevelIndicatorsProps,
  LoadedImages,
} from "src/interfaces/levelIndicatorsInterface";

export class LevelIndicators
  extends EventManager
  implements LevelIndicatorsInterface
{
  public context: CanvasRenderingContext2D;
  public canvas: HTMLCanvasElement;
  public activeIndicators: number;
  public images: Object;
  public loadedImages: LoadedImages;
  public imagesLoaded: boolean = false;

  constructor({ context, canvas, activeIndicators }: LevelIndicatorsProps) {
    super({
      stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
      loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event),
    });
    this.context = context;
    this.canvas = canvas;
    this.activeIndicators = activeIndicators;
    this.images = {
      level_indicator: LEVEL_INDICATOR,
      bar_empty: BAR_EMPTY,
      bar_full: BAR_FULL,
    };

    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images) as LoadedImages;
      this.imagesLoaded = true;
    });
  }

  setIndicators(indicatorCount: number): void {
    this.activeIndicators = indicatorCount;
  }

  addDropStoneEvent(): void {
    document.addEventListener("dropstone", (event) => {
      this.setIndicators(2);
    });
  }

  draw(): void {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.loadedImages.level_indicator,
        this.canvas.width * 0.15,
        0,
        this.canvas.width * 0.35,
        this.canvas.height * 0.09
      );
      for (let i = 0; i < 5; i++) {
        this.context.drawImage(
          this.loadedImages.bar_empty,
          ((this.canvas.width * 0.35) / 7) * (i + 1) + this.canvas.width * 0.15,
          (this.canvas.height * 0.09) / 2 - (this.canvas.height * 0.09) / 6,
          (this.canvas.width * 0.35) / 10,
          (this.canvas.height * 0.09) / 3
        );
      }
      for (let i = 0; i < this.activeIndicators; i++) {
        this.context.drawImage(
          this.loadedImages.bar_full,
          ((this.canvas.width * 0.35) / 7) * (i + 1) + this.canvas.width * 0.15,
          (this.canvas.height * 0.09) / 2 - (this.canvas.height * 0.09) / 6,
          (this.canvas.width * 0.35) / 10,
          (this.canvas.height * 0.09) / 3
        );
      }
    }
  }

  public dispose(): void {
    this.unregisterEventListener();
  }

  public handleStoneDrop(event: Event): void {
    // this.isStoneDropped = true;
  }

  public handleLoadPuzzle(event: CustomEvent): void {
    this.setIndicators(event.detail.counter);
  }
}
