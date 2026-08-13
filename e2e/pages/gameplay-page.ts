import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { Timeouts } from '../constants/timeouts';

export class GameplayPage extends BasePage {
  static override SELECTOR = '#canvas';

  static SELECTORS = {
    mainCanvas: '#canvas',
    riveCanvas: '#rivecanvas',
    gameControl: '#game-control',
    feedbackText: '#feedback-text',
    pauseButton: '#pause-button',
    promptContainer: '#prompt-container',
    promptBubble: '#prompt-bubble',
    promptText: '#prompt-text',
    promptPlayButton: '#prompt-play-button',
    promptSlots: '#prompt-slots',
    timerComponent: '#timer-ticking',
    timerEmpty: '#timer-empty',
    rotatingClock: '#rotating-clock',
  } as const;

  constructor(page: Page) {
    super(page);
  }

  get mainCanvas() {
    return this.getElement(GameplayPage.SELECTORS.mainCanvas);
  }

  get riveCanvas() {
    return this.getElement(GameplayPage.SELECTORS.riveCanvas);
  }

  get gameControl() {
    return this.getElement(GameplayPage.SELECTORS.gameControl);
  }

  get feedbackText() {
    return this.getElement(GameplayPage.SELECTORS.feedbackText);
  }

  get pauseButton() {
    return this.getElement(GameplayPage.SELECTORS.pauseButton);
  }

  get promptText() {
    return this.getElement(GameplayPage.SELECTORS.promptContainer);
  }

  get timer() {
    return this.getElement(GameplayPage.SELECTORS.timerComponent);
  }

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

  async getCanvasDimensions() {
    return this.mainCanvas.boundingBox();
  }

  async waitForFeedback() {
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && (el.textContent ?? '').trim().length > 0;
      },
      GameplayPage.SELECTORS.feedbackText,
      { timeout: Timeouts.domUpdate },
    );
  }
}
