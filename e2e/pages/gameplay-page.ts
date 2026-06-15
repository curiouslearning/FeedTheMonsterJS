import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

export class GameplayPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get mainCanvas() {
    return this.page.locator(Selectors.mainCanvas);
  }

  get riveCanvas() {
    return this.page.locator(Selectors.riveCanvas);
  }

  get gameControl() {
    return this.page.locator(Selectors.gameControl);
  }

  get feedbackText() {
    return this.page.locator(Selectors.feedbackText);
  }

  get pauseButton() {
    return this.page.locator(Selectors.pauseButton);
  }

  get promptText() {
    return this.page.locator(Selectors.promptContainer);
  }

  get timer() {
    return this.page.locator(Selectors.timerComponent);
  }

  /** Waits for the gameplay scene to be active (canvas must be rendered). */
  async waitForGameplayScene() {
    await expect(this.mainCanvas).toBeVisible({ timeout: Timeouts.sceneTransition });
    await expect(this.pauseButton).toBeVisible({ timeout: Timeouts.sceneTransition });
  }

  async assertCanvasVisible() {
    await expect(this.mainCanvas).toBeVisible();
  }

  async assertPauseButtonVisible() {
    await expect(this.pauseButton).toBeVisible();
  }

  async clickPauseButton() {
    await expect(this.pauseButton).toBeEnabled({ timeout: Timeouts.domUpdate });
    await this.pauseButton.click();
  }

  async getFeedbackText(): Promise<string> {
    return (await this.feedbackText.textContent()) ?? '';
  }

  async getPromptText(): Promise<string> {
    return (await this.promptText.textContent()) ?? '';
  }

  /**
   * Drags a stone on the main canvas from one relative position to another.
   * Coordinates are 0–1 ratios of canvas width/height.
   */
  async dragStone(
    fromRatioX: number,
    fromRatioY: number,
    toRatioX: number,
    toRatioY: number,
  ) {
    const bbox = await this.mainCanvas.boundingBox();
    if (!bbox) throw new Error('Canvas bounding box not found');

    const startX = bbox.x + bbox.width * fromRatioX;
    const startY = bbox.y + bbox.height * fromRatioY;
    const endX = bbox.x + bbox.width * toRatioX;
    const endY = bbox.y + bbox.height * toRatioY;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY, { steps: 10 });
    await this.page.mouse.up();
    await this.page.waitForTimeout(Timeouts.stoneDrop);
  }

  /** Clicks a position on the main canvas (used for audio-puzzle stone taps). */
  async tapCanvas(ratioX: number, ratioY: number) {
    const bbox = await this.mainCanvas.boundingBox();
    if (!bbox) throw new Error('Canvas bounding box not found');

    await this.page.mouse.click(
      bbox.x + bbox.width * ratioX,
      bbox.y + bbox.height * ratioY,
    );
    await this.page.waitForTimeout(Timeouts.stoneDrop);
  }

  async assertFeedbackTextVisible() {
    await expect(this.feedbackText).toBeVisible();
  }

  async assertTimerVisible() {
    await expect(this.timer).toBeVisible();
  }

  /** Returns the canvas dimensions used to validate correct sizing. */
  async getCanvasDimensions() {
    return this.mainCanvas.boundingBox();
  }

  /** Waits for the feedback text element to contain any non-empty text. */
  async waitForFeedback() {
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && (el.textContent ?? '').trim().length > 0;
      },
      Selectors.feedbackText,
      { timeout: Timeouts.domUpdate },
    );
  }
}
