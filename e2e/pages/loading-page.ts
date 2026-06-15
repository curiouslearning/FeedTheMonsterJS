import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

export class LoadingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get loadingScreen() {
    return this.page.locator(Selectors.loadingScreen);
  }

  get progressBar() {
    return this.page.locator(Selectors.progressBar);
  }

  get loadingGif() {
    return this.page.locator(Selectors.loadingGif);
  }

  /** Asserts the loading screen is initially present. */
  async assertLoadingVisible() {
    await expect(this.loadingScreen).toBeVisible({ timeout: Timeouts.appReady });
  }

  /** Waits for the loading screen to hide (app sets display:none or zIndex:-1). */
  async waitForLoadingToComplete() {
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return true;
        return el.style.display === 'none' || el.style.zIndex === '-1';
      },
      Selectors.loadingScreen,
      { timeout: Timeouts.appReady },
    );
  }

  async assertProgressBarVisible() {
    await expect(this.progressBar).toBeVisible();
  }
}
