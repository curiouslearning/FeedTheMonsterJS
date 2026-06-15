import { Page } from '@playwright/test';
import { Routes } from '../constants/urls';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

export class BasePage {
  constructor(readonly page: Page) {}

  async goto(lang = 'english') {
    await this.page.goto(Routes.game({ lang }));
  }

  /** Waits for the loading screen to be hidden by the app after assets load. */
  async waitForLoadingComplete() {
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        return el ? (el.style.display === 'none' || el.style.zIndex === '-1') : false;
      },
      Selectors.loadingScreen,
      { timeout: Timeouts.loadingHide },
    );
  }

  /** Blocks until the network is idle (no ongoing fetches). */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle', { timeout: Timeouts.dataFetch });
  }

  /** Returns true when an element with the given selector is visible in the DOM. */
  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible();
  }

  /** Waits until the element becomes visible. */
  async waitForVisible(selector: string, timeout = Timeouts.domUpdate) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  /** Waits until the element is hidden / detached. */
  async waitForHidden(selector: string, timeout = Timeouts.domUpdate) {
    await this.page.locator(selector).waitFor({ state: 'hidden', timeout });
  }

  /** Scrolls the element into view then clicks it. */
  async safeClick(selector: string) {
    const locator = this.page.locator(selector);
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  }

  async getTextContent(selector: string): Promise<string | null> {
    return this.page.locator(selector).textContent();
  }

  async getAttribute(selector: string, attr: string): Promise<string | null> {
    return this.page.locator(selector).getAttribute(attr);
  }
}
