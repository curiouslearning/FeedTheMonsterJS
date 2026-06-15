import { test as base, Page } from '@playwright/test';
import { LoadingPage } from '../pages/loading-page';
import { StartPage } from '../pages/start-page';
import { LevelSelectionPage } from '../pages/level-selection-page';
import { GameplayPage } from '../pages/gameplay-page';
import { PausePopupPage } from '../pages/pause-popup-page';
import { LevelEndPage } from '../pages/level-end-page';
import { applyStandardMocks, clearGameProgress } from '../helpers';
import { Routes } from '../constants/urls';

interface GameFixtures {
  loadingPage: LoadingPage;
  startPage: StartPage;
  levelSelectionPage: LevelSelectionPage;
  gameplayPage: GameplayPage;
  pausePopupPage: PausePopupPage;
  levelEndPage: LevelEndPage;
  /** Page already at the start scene, loading complete. */
  atStartScene: StartPage;
  /** Page already at level selection, ready for level pick. */
  atLevelSelection: LevelSelectionPage;
  /** Page already in gameplay for level 1. */
  atGameplay: GameplayPage;
}

export const test = base.extend<GameFixtures>({
  loadingPage: async ({ page }, use) => {
    await use(new LoadingPage(page));
  },

  startPage: async ({ page }, use) => {
    await use(new StartPage(page));
  },

  levelSelectionPage: async ({ page }, use) => {
    await use(new LevelSelectionPage(page));
  },

  gameplayPage: async ({ page }, use) => {
    await use(new GameplayPage(page));
  },

  pausePopupPage: async ({ page }, use) => {
    await use(new PausePopupPage(page));
  },

  levelEndPage: async ({ page }, use) => {
    await use(new LevelEndPage(page));
  },

  // ── Convenience pre-navigated fixtures ──────────────────────────────────────

  atStartScene: async ({ page }, use) => {
    await applyStandardMocks(page);
    await clearGameProgress(page);
    await page.goto(Routes.game({ lang: 'english' }));
    const startPage = new StartPage(page);
    await startPage.waitForStartScene();
    await use(startPage);
  },

  atLevelSelection: async ({ page }, use) => {
    await applyStandardMocks(page);
    await clearGameProgress(page);
    await page.goto(Routes.game({ lang: 'english' }));
    const startPage = new StartPage(page);
    await startPage.waitForStartScene();
    await startPage.clickStartArea();
    const levelSelectionPage = new LevelSelectionPage(page);
    await levelSelectionPage.waitForLevelSelection();
    await use(levelSelectionPage);
  },

  atGameplay: async ({ page }, use) => {
    await applyStandardMocks(page);
    await clearGameProgress(page);
    await page.goto(Routes.game({ lang: 'english' }));
    const startPage = new StartPage(page);
    await startPage.waitForStartScene();
    await startPage.clickStartArea();
    const levelSelectionPage = new LevelSelectionPage(page);
    await levelSelectionPage.waitForLevelSelection();
    await levelSelectionPage.clickLevel(1);
    const gameplayPage = new GameplayPage(page);
    await gameplayPage.waitForGameplayScene();
    await use(gameplayPage);
  },
});

export { expect } from '@playwright/test';
