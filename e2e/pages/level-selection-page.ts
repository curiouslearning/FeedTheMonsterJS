import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

export class LevelSelectionPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get container() {
    return this.page.locator(Selectors.levelSelectionContainer);
  }

  get grid() {
    return this.page.locator(Selectors.levelSelectionGrid);
  }

  get prevNavButton() {
    return this.page.locator(Selectors.prevNavButton);
  }

  get nextNavButton() {
    return this.page.locator(Selectors.nextNavButton);
  }

  /** Returns the button at the given grid index (0-based, 0–8 are game levels). */
  levelButtonAt(index: number): Locator {
    return this.page.locator(Selectors.levelButton(index));
  }

  /**
   * Level buttons use 0-based grid index.
   * Grid index 0 = game level 1, index 1 = game level 2, …, index 8 = game level 9.
   * Index 4 is the special treasure-chest level.
   */
  levelButtonForLevel(gameLevel: number): Locator {
    // grid index = gameLevel - 1 (but level 10 maps to index 9 which is prev-nav,
    // so levels 1–9 → indices 0–8, level 10 → index 10)
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

  /** Returns whether the lock overlay is present on a level button. */
  async isLevelLocked(gameLevel: number): Promise<boolean> {
    const btn = this.levelButtonForLevel(gameLevel);
    const lockOverlay = btn.locator('.lock-overlay, [class*="lock"]');
    return lockOverlay.count().then((n) => n > 0);
  }

  /** Navigates to the next page of levels by clicking the next nav button. */
  async goToNextPage() {
    await expect(this.nextNavButton).toBeVisible({ timeout: Timeouts.domUpdate });
    await this.nextNavButton.click();
  }

  async goToPrevPage() {
    await expect(this.prevNavButton).toBeVisible({ timeout: Timeouts.domUpdate });
    await this.prevNavButton.click();
  }

  async getLevelCount(): Promise<number> {
    // 12 total buttons, minus 2 nav buttons = 10 max game-level buttons
    return this.page.locator('.level-buttons:not(.nav-btn)').count();
  }

  async assertNavPrevHidden() {
    // On page 1 the prev button has display:none
    const display = await this.prevNavButton.evaluate(
      (el) => (el as HTMLElement).style.display,
    );
    expect(display).toBe('none');
  }
}
