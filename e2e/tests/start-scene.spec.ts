import { test, expect } from '../fixtures/game-fixtures';
import { applyStandardMocks, clearGameProgress } from '../helpers';
import { Routes } from '../constants/urls';
import { Selectors } from '../constants/selectors';

test.describe('Start Scene', () => {
  test.beforeEach(async ({ page }) => {
    await applyStandardMocks(page);
    await clearGameProgress(page);
  });

  test('play button is visible after loading completes', async ({ atStartScene: startPage }) => {
    await startPage.assertPlayButtonVisible();
  });

  test('game title is displayed', async ({ atStartScene: startPage }) => {
    await startPage.assertGameTitleVisible();
    const title = await startPage.getGameTitleText();
    expect(title.length).toBeGreaterThan(0);
  });

  test('version info element is present in the DOM', async ({ atStartScene: startPage }) => {
    await startPage.assertVersionInfoVisible();
  });

  test('rive monster canvas is present', async ({ page }) => {
    await applyStandardMocks(page);
    await clearGameProgress(page);
    await page.goto(Routes.game());
    const startPage = (await import('../pages/start-page')).StartPage;
    const sp = new startPage(page);
    await sp.waitForStartScene();
    await expect(page.locator(Selectors.riveCanvas)).toBeAttached();
  });

  test('clicking the start area navigates to level selection', async ({ page, atStartScene: startPage, levelSelectionPage }) => {
    await startPage.clickStartArea();
    await levelSelectionPage.waitForLevelSelection();
    await levelSelectionPage.assertLevelButtonVisible(1);
  });

  test('clicking the start scene area also navigates to level selection', async ({ page, atStartScene: startPage, levelSelectionPage }) => {
    await startPage.clickStartSceneArea();
    await levelSelectionPage.waitForLevelSelection();
  });

  test('dev toggle button is present but assessment button is hidden by default', async ({ atStartScene: startPage }) => {
    const toggleBtn = startPage.page.locator(Selectors.toggleDevBtn);
    const assessmentBtn = startPage.page.locator(Selectors.devAssessmentBtn);
    await expect(toggleBtn).toBeAttached();
    // Assessment button is only shown when debug mode is on
    const display = await assessmentBtn.evaluate((el: HTMLElement) => el.style.display);
    expect(display === 'none' || display === '').toBeTruthy();
  });
});
