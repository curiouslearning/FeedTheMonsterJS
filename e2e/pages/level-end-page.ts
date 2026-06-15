import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

export class LevelEndPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get container() {
    return this.page.locator(Selectors.levelEndContainer);
  }

  get starsContainer() {
    return this.page.locator(Selectors.starsContainer);
  }

  get starItems() {
    return this.page.locator(Selectors.starItem);
  }

  get buttonsContainer() {
    return this.page.locator(Selectors.levelEndButtons);
  }

  get nextButton() {
    return this.page.locator(Selectors.levelEndNextBtn);
  }

  get retryButton() {
    return this.page.locator(Selectors.levelEndRetryBtn);
  }

  get mapButton() {
    return this.page.locator(Selectors.levelEndMapBtn);
  }

  /** Waits for the level-end scene to appear (display: block, zIndex: 11). */
  async waitForLevelEndScene() {
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        return el
          ? el.style.display === 'block' || el.style.zIndex === '11'
          : false;
      },
      Selectors.levelEndContainer,
      { timeout: Timeouts.sceneTransition },
    );
  }

  async assertLevelEndVisible() {
    await expect(this.container).toBeVisible({ timeout: Timeouts.sceneTransition });
  }

  /** Waits for all star elements to have the 'show' class (animation complete). */
  async waitForStarsAnimated(expectedCount: number) {
    await this.page.waitForFunction(
      ({ sel, count }) => {
        const stars = document.querySelectorAll(`${sel}.show`);
        return stars.length >= count;
      },
      { sel: Selectors.starItem, count: expectedCount },
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

  /** Waits for buttons to appear after the optional evolution animation. */
  async waitForButtonsVisible() {
    await expect(this.buttonsContainer).toBeVisible({ timeout: Timeouts.evolutionDelay });
    await expect(this.mapButton).toBeVisible({ timeout: Timeouts.evolutionDelay });
  }
}
