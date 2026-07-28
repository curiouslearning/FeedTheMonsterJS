import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

export class StartPage extends BasePage {
  static override SELECTOR = '#title-and-play-button';

  static SELECTORS = {
    playButton: '#play-button',
    gameTitle: '#title',
    clickArea: '#start-scene-click-area',
    toggleDevBtn: '#toggle-btn',
    devAssessmentBtn: '#dev-assessment-btn',
    versionInfo: '#version-info-id',
  } as const;

  constructor(page: Page) {
    super(page);
  }

  get playButton() {
    return this.getElement(StartPage.SELECTORS.playButton);
  }

  get gameTitle() {
    return this.getElement(StartPage.SELECTORS.gameTitle);
  }

  get clickArea() {
    return this.getElement(StartPage.SELECTORS.clickArea);
  }

  get riveCanvas() {
    return this.getElement(Selectors.riveCanvas);
  }

  get versionInfo() {
    return this.getElement(StartPage.SELECTORS.versionInfo);
  }

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

  async clickStartSceneArea() {
    await this.clickArea.click({ force: true });
  }

  async clickStartArea() {
    await this.clickArea.click({ force: true });
  }

  async assertVersionInfoVisible() {
    await expect(this.versionInfo).toBeVisible();
  }

  async assertPlayButtonClass(expectedClass: string) {
    await expect(this.playButton).toHaveClass(new RegExp(expectedClass));
  }
}
