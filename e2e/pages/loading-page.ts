import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { Timeouts } from '../constants/timeouts';

export class LoadingPage extends BasePage {
  static override SELECTOR = '#loading-screen';

  static SELECTORS = {
    gif: '#loading-gif',
    progressBar: '#progress-bar',
    progressBarContainer: '#progress-bar-container',
  } as const;

  constructor(page: Page) {
    super(page);
  }

  get loadingScreen() {
    return this.getElement(LoadingPage.SELECTOR);
  }

  get progressBar() {
    return this.getElement(LoadingPage.SELECTORS.progressBar);
  }

  get loadingGif() {
    return this.getElement(LoadingPage.SELECTORS.gif);
  }

  async assertLoadingVisible() {
    await expect(this.loadingScreen).toBeVisible({ timeout: Timeouts.appReady });
  }

  async waitForLoadingToComplete() {
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return true;
        return el.style.display === 'none' || el.style.zIndex === '-1';
      },
      LoadingPage.SELECTOR,
      { timeout: Timeouts.appReady },
    );
  }

  async assertProgressBarVisible() {
    await expect(this.progressBar).toBeVisible();
  }
}
