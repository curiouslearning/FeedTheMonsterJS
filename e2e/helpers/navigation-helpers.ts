import { Page } from '@playwright/test';
import { LoadingPage } from '../pages/loading-page';
import { StartPage } from '../pages/start-page';
import { LevelSelectionPage } from '../pages/level-selection-page';
import { GameplayPage } from '../pages/gameplay-page';
import { LevelEndPage } from '../pages/level-end-page';
import { Routes } from '../constants/urls';

/** Navigates from a fresh page load to the start scene (loading complete). */
export async function navigateToStartScene(page: Page, lang = 'english') {
  await page.goto(Routes.game({ lang }));
  const loadingPage = new LoadingPage(page);
  await loadingPage.waitForLoadingToComplete();
  const startPage = new StartPage(page);
  await startPage.waitForStartScene();
  return startPage;
}

/**
 * Navigates from a fresh page load all the way to the level-selection screen.
 * Clicks the play button to dismiss the start scene.
 */
export async function navigateToLevelSelection(page: Page, lang = 'english') {
  const startPage = await navigateToStartScene(page, lang);
  // startSceneClickArea publishes SWITCH_SCENE → LEVEL_SELECT regardless of
  // the FEATURE_QUICK_START flag; play button may bypass level selection.
  await startPage.clickStartArea();
  const levelSelectionPage = new LevelSelectionPage(page);
  await levelSelectionPage.waitForLevelSelection();
  return levelSelectionPage;
}

/**
 * Navigates from a fresh page load to gameplay for the given level.
 * Assumes the level is unlocked (fresh state = level 1 only).
 */
export async function navigateToGameplay(
  page: Page,
  gameLevel = 1,
  lang = 'english',
) {
  const levelSelectionPage = await navigateToLevelSelection(page, lang);
  await levelSelectionPage.clickLevel(gameLevel);
  const gameplayPage = new GameplayPage(page);
  await gameplayPage.waitForGameplayScene();
  return gameplayPage;
}

/**
 * Seeds localStorage so every level up to `maxLevel` appears already played
 * with 3 stars. Call this BEFORE page.goto() to unlock levels.
 */
export async function seedLevelProgress(
  page: Page,
  maxLevel: number,
  lang = 'english',
) {
  await page.addInitScript(
    ({ maxLevel, lang }) => {
      const scores = Array.from({ length: maxLevel }, (_, i) => ({
        levelNumber: i,
        starCount: 3,
        score: 100,
        treasureChestMiniGameScore: 0,
      }));
      localStorage.setItem(`${lang}gamePlayedInfo`, JSON.stringify(scores));
      localStorage.setItem(`storePreviousPlayedLevel${lang}`, String(maxLevel));
    },
    { maxLevel, lang },
  );
}

/**
 * Clears all game progress from localStorage.
 * Use in beforeEach to guarantee a clean state.
 */
export async function clearGameProgress(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
  });
}
