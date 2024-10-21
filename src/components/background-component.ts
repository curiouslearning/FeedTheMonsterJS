interface BackgroundDraw {
  draw: () => void;
}

import { BACKGROUND_HTML_LIST, loadBackground } from "@compositions";

export class BackgroundComponent {
  private levelNumber: number;
  private background: BackgroundDraw | null;

  constructor(levelNumber: number) {
    this.levelNumber = levelNumber;
    this.background = null;
  }

  public loadBackground(): void {
    const { draw } = loadBackground(this.levelNumber, BACKGROUND_HTML_LIST);
    draw(); // Execute the draw method to render the background
  }
}
