import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { Timeouts } from '../constants/timeouts';

export class LevelEndPage extends BasePage {
  static override SELECTOR = '#levelEnd';

  static SELECTORS = {
    starsContainer: '.stars-container',
    starItem: '.stars',
    buttonsContainer: '#levelEndButtons',
    nextButton: '#levelend-next-btn',
    retryButton: '#levelend-retry-btn',
    mapButton: '#levelend-map-btn',
  } as const;

  constructor(page: Page) {
    super(page);
  }

  // container() inherited → getElement('#levelEnd')

  get starsContainer() {
    return this.getElement(LevelEndPage.SELECTORS.starsContainer);
  }

  get starItems() {
    return this.getElement(LevelEndPage.SELECTORS.starItem);
  }

  get buttonsContainer() {
    return this.getElement(LevelEndPage.SELECTORS.buttonsContainer);
  }

  get nextButton() {
    return this.getElement(LevelEndPage.SELECTORS.nextButton);
  }

  get retryButton() {
    return this.getElement(LevelEndPage.SELECTORS.retryButton);
  }

  get mapButton() {
    return this.getElement(LevelEndPage.SELECTORS.mapButton);
  }

  async waitForLevelEndScene() {
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        return el
          ? el.style.display === 'block' || el.style.zIndex === '11'
          : false;
      },
      LevelEndPage.SELECTOR,
      { timeout: Timeouts.sceneTransition },
    );
  }

  async assertLevelEndVisible() {
    await expect(this.container).toBeVisible({ timeout: Timeouts.sceneTransition });
  }

  async waitForStarsAnimated(expectedCount: number) {
    await this.page.waitForFunction(
      ({ sel, count }) => {
        const stars = document.querySelectorAll(`${sel}.show`);
        return stars.length >= count;
      },
      { sel: LevelEndPage.SELECTORS.starItem, count: expectedCount },
      { timeout: Timeouts.starAnimation },
    );
  }

  async getStarCount(): Promise<number> {
    return this.starItems.count();
  }

  async assertStarCount(expected: number) {
    await this.waitForStarsAnimated(expected);
    await expect(this.starItems).toHaveCount(expected);
  }

  async assertNextButtonVisible() {
    await expect(this.nextButton).toBeVisible({ timeout: Timeouts.domUpdate });
  }

  async assertRetryButtonVisible() {
    await expect(this.retryButton).toBeVisible({ timeout: Timeouts.domUpdate });
  }

  async assertMapButtonVisible() {
    await expect(this.mapButton).toBeVisible({ timeout: Timeouts.domUpdate });
  }

  async clickNextButton() {
    await expect(this.nextButton).toBeVisible({ timeout: Timeouts.evolutionDelay });
    await this.nextButton.click();
  }

  async clickRetryButton() {
    await expect(this.retryButton).toBeVisible({ timeout: Timeouts.evolutionDelay });
    await this.retryButton.click();
  }

  async clickMapButton() {
    await expect(this.mapButton).toBeVisible({ timeout: Timeouts.evolutionDelay });
    await this.mapButton.click();
  }

  async waitForButtonsVisible() {
    await expect(this.buttonsContainer).toBeVisible({ timeout: Timeouts.evolutionDelay });
    await expect(this.mapButton).toBeVisible({ timeout: Timeouts.evolutionDelay });
  }
}
