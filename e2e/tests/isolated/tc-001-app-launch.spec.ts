/**
 * FTM_TC_001 | App Launch
 * Step: Open the test env app in Chrome
 * Expected: App loaded successfully and start screen is displayed
 *
 * Run via the orchestrator: e2e/tests/ftm-assessment-survey-flow.spec.ts
 */

import { test, expect } from '../../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Selectors } from '../../constants/selectors';
import { Timeouts } from '../../constants/timeouts';
import { StartPage } from '../../pages/start-page';
import { LoadingPage } from '../../pages/loading-page';

async function waitForLoadingDone(page: Page) {
  await page.waitForFunction(
    (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return true;
      return el.style.display === 'none' || el.style.zIndex === '-1';
    },
    Selectors.loadingScreen,
    { timeout: Timeouts.appReady },
  );
}

export function registerTests(getPage: () => Page): void {
  test('FTM_TC_001 | App loads in Chrome and start screen is displayed', async () => {
    const page = getPage();

    await test.step('Loading screen is attached to DOM on first paint', async () => {
      await expect(page.locator(LoadingPage.SELECTOR)).toBeAttached();
    });

    await test.step('Loading screen hides after all assets have loaded', async () => {
      await waitForLoadingDone(page);
    });

    await test.step('Start screen is displayed after loading completes', async () => {
      await expect(page.locator(Selectors.background)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
      await expect(page.locator(StartPage.SELECTORS.playButton)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
    });
  });
}
