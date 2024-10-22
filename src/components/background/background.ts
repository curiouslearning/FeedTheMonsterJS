import { BaseBackgroundComponent } from "@background/base-background/base-background-component";

//for SummerBackground
class SummerBackground extends BaseBackgroundComponent {
  constructor() {
    super();
  }

  public draw(): void {
    this.setBackgroundClass("summer-bg");
  }
}

// for AutumnBackground
class AutumnBackground extends BaseBackgroundComponent {
  constructor() {
    super();
  }

  public draw(): void {
    this.setBackgroundClass("autumn-bg");
  }
}

// for WinterBackground
class WinterBackground extends BaseBackgroundComponent {
  constructor() {
    super();
  }

  public draw(): void {
    this.setBackgroundClass("winter-bg");
  }
}

class LevelSelectBackground extends BaseBackgroundComponent {
  private context: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private bgImages: Record<string, HTMLImageElement>;

  constructor(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    bgImages: Record<string, HTMLImageElement>
  ) {
    super();
    this.context = context;
    this.width = width;
    this.height = height;
    this.bgImages = bgImages;
  }

  public draw(): void {
    this.context.drawImage(this.bgImages?.LEVEL_SELECTION_BACKGROUND, 0, 0, this.width, this.height);
  }
}

export function createBackgroundComponent(levelNumber: number): BaseBackgroundComponent {
  const backgroundTypes = [SummerBackground, AutumnBackground, WinterBackground];
  const index = Math.floor(levelNumber / 10) % backgroundTypes.length;

  // Wrap around first three types if the levelNumber exceeds 30
  const selectedBackground = levelNumber >= 30 ? index % 3 : index;

  return new backgroundTypes[selectedBackground]();
}

export class BackgroundComponent {
  private background: BaseBackgroundComponent | null;
  private levelNumber: number;

  constructor(levelNumber: number) {
    this.levelNumber = levelNumber;
    this.background = null;
  }

  public loadBackground(): void {
    this.background = createBackgroundComponent(this.levelNumber);
    this.background.draw();
  }
}
