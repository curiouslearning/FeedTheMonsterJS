import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

export class PausePopupPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get popup() {
    return this.page.locator(Selectors.pausePopup);
  }

  get closeButton() {
    return this.popup.locator(Selectors.pausePopupClose);
  }

  get mapButton() {
    return this.page.locator(Selectors.pausePopupMapBtn);
  }

  get retryButton() {
    return this.page.locator(Selectors.pausePopupRetryBtn);
  }

  get confirmPopup() {
    return this.page.locator(Selectors.confirmPopup);
  }

  get yesButton() {
    return this.page.locator(Selectors.yesButton);
  }

  get cancelButton() {
    return this.page.locator(Selectors.cancelButton);
  }

  async waitForPausePopup() {
    // The popup has a 'show' CSS class when visible
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && el.classList.contains('show');
      },
      Selectors.pausePopup,
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
      Selectors.confirmPopup,
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
