import { test, expect } from '../fixtures/game-fixtures';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';
import { assertCanvasHasContent } from '../helpers';

test.describe('Gameplay Scene', () => {
  test('main canvas is visible when gameplay starts', async ({ atGameplay: gameplayPage }) => {
    await gameplayPage.assertCanvasVisible();
  });

  test('pause button is visible in gameplay', async ({ atGameplay: gameplayPage }) => {
    await gameplayPage.assertPauseButtonVisible();
  });

  test('rive monster canvas is attached during gameplay', async ({ atGameplay: gameplayPage }) => {
    await expect(gameplayPage.riveCanvas).toBeAttached();
  });

  test('game control container is present', async ({ atGameplay: gameplayPage }) => {
    await expect(gameplayPage.gameControl).toBeVisible();
  });

  test('clicking pause button opens the pause popup', async ({ page, atGameplay: gameplayPage, pausePopupPage }) => {
    await gameplayPage.clickPauseButton();
    await pausePopupPage.waitForPausePopup();
    await pausePopupPage.assertPausePopupVisible();
  });

  test('closing pause popup resumes gameplay', async ({ page, atGameplay: gameplayPage, pausePopupPage }) => {
    await gameplayPage.clickPauseButton();
    await pausePopupPage.waitForPausePopup();
    await pausePopupPage.clickClose();
    await pausePopupPage.assertPausePopupHidden();
    // Gameplay canvas must still be visible after resume
    await gameplayPage.assertCanvasVisible();
  });

  test('pause popup contains map and retry buttons', async ({ atGameplay: gameplayPage, pausePopupPage }) => {
    await gameplayPage.clickPauseButton();
    await pausePopupPage.waitForPausePopup();
    await expect(pausePopupPage.mapButton).toBeVisible();
    await expect(pausePopupPage.retryButton).toBeVisible();
  });

  test('map button in pause popup navigates to level selection', async ({
    page,
    atGameplay: gameplayPage,
    pausePopupPage,
    levelSelectionPage,
  }) => {
    await gameplayPage.clickPauseButton();
    await pausePopupPage.waitForPausePopup();
    await pausePopupPage.clickMapButton();
    // English locale shows a confirm dialog before navigating
    try {
      await pausePopupPage.waitForConfirmDialog();
      await pausePopupPage.confirmAction();
    } catch {
      // No confirm dialog in non-English locales — proceed
    }
    await levelSelectionPage.waitForLevelSelection();
  });

  test('canvas has rendered content after gameplay loads', async ({ atGameplay: gameplayPage }) => {
    // Give the Rive / stone renderer a moment to paint
    await gameplayPage.page.waitForTimeout(2000);
    await assertCanvasHasContent(gameplayPage.page, Selectors.mainCanvas);
  });
});
