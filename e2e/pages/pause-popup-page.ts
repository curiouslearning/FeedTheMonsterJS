import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { Timeouts } from '../constants/timeouts';

export class PausePopupPage extends BasePage {
  static override SELECTOR = '#pause-popup';

  static SELECTORS = {
    closeButton: '[data-click="close"]',
    mapButton: '#pause-popup #map-button',
    retryButton: '#pause-popup #retry-button',
    confirmPopup: '#confirm-popup',
    yesButton: '#yes-button',
    cancelButton: '#cancel-button',
  } as const;

  constructor(page: Page) {
    super(page);
  }

  // container() inherited → getElement('#pause-popup')

  get popup() {
    return this.getElement(PausePopupPage.SELECTOR);
  }

  get closeButton() {
    return this.popup.locator(PausePopupPage.SELECTORS.closeButton);
  }

  get mapButton() {
    return this.getElement(PausePopupPage.SELECTORS.mapButton);
  }

  get retryButton() {
    return this.getElement(PausePopupPage.SELECTORS.retryButton);
  }

  get confirmPopup() {
    return this.getElement(PausePopupPage.SELECTORS.confirmPopup);
  }

  get yesButton() {
    return this.getElement(PausePopupPage.SELECTORS.yesButton);
  }

  get cancelButton() {
    return this.getElement(PausePopupPage.SELECTORS.cancelButton);
  }

  async waitForPausePopup() {
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && el.classList.contains('show');
      },
      PausePopupPage.SELECTOR,
      { timeout: Timeouts.domUpdate },
    );
  }

  async assertPausePopupVisible() {
    await expect(this.popup).toHaveClass(/show/, { timeout: Timeouts.domUpdate });
  }

  async assertPausePopupHidden() {
    await expect(this.popup).not.toHaveClass(/show/);
  }

  async clickClose() {
    await expect(this.closeButton).toBeVisible({ timeout: Timeouts.domUpdate });
    await this.closeButton.click();
  }

  async clickMapButton() {
    await expect(this.mapButton).toBeVisible({ timeout: Timeouts.domUpdate });
    await this.mapButton.click();
  }

  async clickRetryButton() {
    await expect(this.retryButton).toBeVisible({ timeout: Timeouts.domUpdate });
    await this.retryButton.click();
  }

  async waitForConfirmDialog() {
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && el.classList.contains('show');
      },
      PausePopupPage.SELECTORS.confirmPopup,
      { timeout: Timeouts.domUpdate },
    );
  }

  async confirmAction() {
    await this.waitForConfirmDialog();
    await expect(this.yesButton).toBeVisible();
    await this.yesButton.click();
  }

  async cancelAction() {
    await this.waitForConfirmDialog();
    await expect(this.cancelButton).toBeVisible();
    await this.cancelButton.click();
  }
}
