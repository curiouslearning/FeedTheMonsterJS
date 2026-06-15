/**
 * End-to-end navigation flow tests.
 * These validate the full user journey: load → start → level-select → gameplay.
 */
import { test, expect } from '../fixtures/game-fixtures';
import { applyStandardMocks, clearGameProgress } from '../helpers';
import { Routes } from '../constants/urls';

test.describe('Full Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await applyStandardMocks(page);
    await clearGameProgress(page);
  });

  test('complete flow: load → start scene → level selection → gameplay', async ({
    page,
    loadingPage,
    startPage,
    levelSelectionPage,
    gameplayPage,
  }) => {
    await page.goto(Routes.game());

    // Step 1: loading screen shows then hides
    await loadingPage.assertLoadingVisible();
    await loadingPage.waitForLoadingToComplete();

    // Step 2: start scene is rendered
    await startPage.waitForStartScene();
    await startPage.assertPlayButtonVisible();

    // Step 3: click start area → level selection (play button may bypass via FEATURE_QUICK_START)
    await startPage.clickStartArea();
    await levelSelectionPage.waitForLevelSelection();
    await levelSelectionPage.assertLevelButtonVisible(1);

    // Step 4: select level 1 → gameplay
    await levelSelectionPage.clickLevel(1);
    await gameplayPage.waitForGameplayScene();
    await gameplayPage.assertCanvasVisible();
    await gameplayPage.assertPauseButtonVisible();
  });

  test('back from gameplay to level selection via pause → map', async ({
    page,
    atGameplay: gameplayPage,
    pausePopupPage,
    levelSelectionPage,
  }) => {
    await gameplayPage.clickPauseButton();
    await pausePopupPage.waitForPausePopup();
    await pausePopupPage.clickMapButton();

    try {
      await pausePopupPage.waitForConfirmDialog();
      await pausePopupPage.confirmAction();
    } catch {
      // Confirm dialog only appears for English locale
    }

    await levelSelectionPage.waitForLevelSelection();
  });

  test('url parameter cr_lang=english loads english content', async ({ page, startPage }) => {
    await applyStandardMocks(page);
    await clearGameProgress(page);
    await page.goto(Routes.game({ lang: 'english' }));
    await startPage.waitForStartScene();
    const title = await startPage.getGameTitleText();
    // English data must have a non-empty title
    expect(title.length).toBeGreaterThan(0);
  });
});
