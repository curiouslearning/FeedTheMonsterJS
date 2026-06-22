import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { Timeouts } from '../constants/timeouts';

export class LevelSelectionPage extends BasePage {
  static override SELECTOR = '#level-selection-container';

  static SELECTORS = {
    grid: '#level-selection-grid',
    levelButton: (index: number) => `[id="${index}-level-button"]`,
    prevNavButton: '[id="9-level-button"]',
    nextNavButton: '[id="11-level-button"]',
  } as const;

  constructor(page: Page) {
    super(page);
  }

  // container() inherited from BasePage → getElement(LevelSelectionPage.SELECTOR)

  get grid() {
    return this.getElement(LevelSelectionPage.SELECTORS.grid);
  }

  get prevNavButton() {
    return this.getElement(LevelSelectionPage.SELECTORS.prevNavButton);
  }

  get nextNavButton() {
    return this.getElement(LevelSelectionPage.SELECTORS.nextNavButton);
  }

  levelButtonAt(index: number): Locator {
    return this.getElement(LevelSelectionPage.SELECTORS.levelButton(index));
  }

  /**
   * Grid index = gameLevel - 1 for levels 1–9; level 10 → index 10.
   * Index 9 = Prev nav, index 11 = Next nav.
   */
  levelButtonForLevel(gameLevel: number): Locator {
    const index = gameLevel <= 9 ? gameLevel - 1 : gameLevel;
    return this.levelButtonAt(index);
  }

  async waitForLevelSelection() {
    await expect(this.container).toBeVisible({ timeout: Timeouts.sceneTransition });
    await expect(this.grid).toBeVisible({ timeout: Timeouts.domUpdate });
  }

  async assertLevelButtonVisible(gameLevel: number) {
    await expect(this.levelButtonForLevel(gameLevel)).toBeVisible();
  }

  async clickLevel(gameLevel: number) {
    const btn = this.levelButtonForLevel(gameLevel);
    await expect(btn).toBeVisible({ timeout: Timeouts.domUpdate });
    await btn.click();
  }

  async isLevelLocked(gameLevel: number): Promise<boolean> {
    const btn = this.levelButtonForLevel(gameLevel);
    const lockOverlay = btn.locator('.lock-overlay, [class*="lock"]');
    return lockOverlay.count().then((n) => n > 0);
  }

  async goToNextPage() {
    await expect(this.nextNavButton).toBeVisible({ timeout: Timeouts.domUpdate });
    await this.nextNavButton.click();
  }

  async goToPrevPage() {
    await expect(this.prevNavButton).toBeVisible({ timeout: Timeouts.domUpdate });
    await this.prevNavButton.click();
  }

  async getLevelCount(): Promise<number> {
    return this.getElement('.level-buttons:not(.nav-btn)').count();
  }

  async assertNavPrevHidden() {
    const display = await this.prevNavButton.evaluate(
      (el) => (el as HTMLElement).style.display,
    );
    expect(display).toBe('none');
  }
}
