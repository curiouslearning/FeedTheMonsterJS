import { loadImages } from "@common";
import {
  BACKGROUND_ASSET_LIST,
  createBackground,
  levelSelectBgDrawing,
  loadDynamicBgAssets,
} from "@compositions/background";
import { LEVEL_SELECTION_BACKGROUND } from "@constants";

export class Background {
  public width: number;
  public height: number;
  public context: CanvasRenderingContext2D;
  public levelNumber: number;
  public background: any;

  constructor(context, width, height, levelNumber) {
    this.width = width;
    this.height = height;
    this.context = context;
    this.levelNumber = levelNumber;

    this.setupBg();
  }

  setupBg = async () => {
    const { BG_GROUP_IMGS, draw } = loadDynamicBgAssets(
      this.levelNumber,
      BACKGROUND_ASSET_LIST
    );
    const background = await createBackground(
      this.context,
      this.width,
      this.height,
      BG_GROUP_IMGS,
      draw
    );

    return { ...background };
  };
}
