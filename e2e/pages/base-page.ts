import { Page, Locator } from '@playwright/test';
import { Routes } from '../constants/urls';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

export class BasePage {
  static SELECTOR = '';

  constructor(readonly page: Page) {}

  getElement(selector: string): Locator {
    return this.page.locator(selector);
  }

  get container(): Locator {
    return this.getElement((this.constructor as typeof BasePage).SELECTOR);
  }

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
    return this.getElement(selector).isVisible();
  }

  /** Waits until the element becomes visible. */
  async waitForVisible(selector: string, timeout = Timeouts.domUpdate) {
    await this.getElement(selector).waitFor({ state: 'visible', timeout });
  }

  /** Waits until the element is hidden / detached. */
  async waitForHidden(selector: string, timeout = Timeouts.domUpdate) {
    await this.getElement(selector).waitFor({ state: 'hidden', timeout });
  }

  /** Scrolls the element into view then clicks it. */
  async safeClick(selector: string) {
    const locator = this.getElement(selector);
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  }

  async getTextContent(selector: string): Promise<string | null> {
    return this.getElement(selector).textContent();
  }

  async getAttribute(selector: string, attr: string): Promise<string | null> {
    return this.getElement(selector).getAttribute(attr);
  }
}
