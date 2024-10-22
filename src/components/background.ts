// Import the BaseBackground class
import { BaseBackground } from "./background/base-background/base-background-component";

interface BackgroundDraw {
  draw: () => void;
}

// Derived class for SummerBackground
class SummerBackground extends BaseBackground {
  constructor() {
    super();
  }

  public draw(): void {
    this.setBackgroundClass("summer-bg");
  }
}

// Derived class for AutumnBackground
class AutumnBackground extends BaseBackground {
  constructor() {
    super();
  }

  public draw(): void {
    this.setBackgroundClass("autumn-bg");
  }
}

// Derived class for WinterBackground
class WinterBackground extends BaseBackground {
  constructor() {
    super();
  }

  public draw(): void {
    this.setBackgroundClass("winter-bg");
  }
}

// Derived class for LevelSelectBackground
class LevelSelectBackground extends BaseBackground {
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

// Factory function to create background components based on level number
export function createBackgroundComponent(levelNumber: number): BaseBackground {
  const backgroundTypes = [SummerBackground, AutumnBackground, WinterBackground];
  const index = Math.floor(levelNumber / 10) % backgroundTypes.length;

  // Wrap around first three types if the levelNumber exceeds 30
  const selectedBackground = levelNumber >= 30 ? index % 3 : index;

  return new backgroundTypes[selectedBackground]();
}

// BackgroundComponent class that manages the selected background
export class BackgroundComponent {
  private background: BaseBackground | null;
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
