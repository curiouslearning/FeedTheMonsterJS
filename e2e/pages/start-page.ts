import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

export class StartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get playButton() {
    return this.page.locator(Selectors.playButton);
  }

  get gameTitle() {
    return this.page.locator(Selectors.gameTitle);
  }

  get clickArea() {
    return this.page.locator(Selectors.startSceneClickArea);
  }

  get riveCanvas() {
    return this.page.locator(Selectors.riveCanvas);
  }

  get versionInfo() {
    return this.page.locator(Selectors.versionInfo);
  }

  /**
   * Waits for the start scene to be fully rendered.
   * The play button and game title must exist in the DOM;
   * the loading screen must have been dismissed.
   */
  async waitForStartScene() {
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        return el ? el.style.display === 'none' || el.style.zIndex === '-1' : false;
      },
      Selectors.loadingScreen,
      { timeout: Timeouts.appReady },
    );
    await expect(this.playButton).toBeVisible({ timeout: Timeouts.sceneTransition });
  }

  async assertPlayButtonVisible() {
    await expect(this.playButton).toBeVisible();
  }

  async assertGameTitleVisible() {
    await expect(this.gameTitle).toBeVisible();
  }

  async getGameTitleText(): Promise<string> {
    return (await this.gameTitle.textContent()) ?? '';
  }

  async clickPlayButton() {
    await expect(this.playButton).toBeEnabled({ timeout: Timeouts.domUpdate });
    await this.playButton.click();
  }

  /** Clicks anywhere on the start scene background to proceed. */
  async clickStartSceneArea() {
    await this.clickArea.click({ force: true });
  }

  /** Clicks the start area to navigate to level selection (always works, even with FEATURE_QUICK_START). */
  async clickStartArea() {
    await this.clickArea.click({ force: true });
  }

  async assertVersionInfoVisible() {
    await expect(this.versionInfo).toBeVisible();
  }

  /** Checks that the play button has the expected CSS class structure. */
  async assertPlayButtonClass(expectedClass: string) {
    await expect(this.playButton).toHaveClass(new RegExp(expectedClass));
  }
}
