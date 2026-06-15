import { test, expect } from '../fixtures/game-fixtures';
import { applyStandardMocks, clearGameProgress, seedLevelProgress } from '../helpers';
import { Routes } from '../constants/urls';
import { Selectors } from '../constants/selectors';

test.describe('Level Selection', () => {
  test('level selection container is visible after clicking play', async ({ atLevelSelection: levelSelectionPage }) => {
    await levelSelectionPage.assertLevelButtonVisible(1);
  });

  test('level selection grid renders level buttons', async ({ atLevelSelection: levelSelectionPage }) => {
    await expect(levelSelectionPage.grid).toBeVisible();
    // At minimum level 1 button must exist
    await expect(levelSelectionPage.levelButtonForLevel(1)).toBeAttached();
  });

  test('level 1 is unlocked on a fresh state', async ({ atLevelSelection: levelSelectionPage }) => {
    const locked = await levelSelectionPage.isLevelLocked(1);
    expect(locked).toBe(false);
  });

  test('level 2 is locked on a fresh state', async ({ atLevelSelection: levelSelectionPage }) => {
    // Without progress, only level 1 is playable
    const locked = await levelSelectionPage.isLevelLocked(2);
    expect(locked).toBe(true);
  });

  test('previous nav button is hidden on page 1', async ({ atLevelSelection: levelSelectionPage }) => {
    await levelSelectionPage.assertNavPrevHidden();
  });

  test('clicking level 1 transitions to gameplay', async ({ page, atLevelSelection: levelSelectionPage, gameplayPage }) => {
    await levelSelectionPage.clickLevel(1);
    await gameplayPage.waitForGameplayScene();
    await gameplayPage.assertCanvasVisible();
  });

  test('multiple levels are unlocked when progress exists', async ({ page }) => {
    await applyStandardMocks(page);
    await seedLevelProgress(page, 3, 'english');
    await page.goto(Routes.game());
    const { StartPage } = await import('../pages/start-page');
    const { LevelSelectionPage } = await import('../pages/level-selection-page');
    const sp = new StartPage(page);
    await sp.waitForStartScene();
    await sp.clickStartArea();
    const lsp = new LevelSelectionPage(page);
    await lsp.waitForLevelSelection();
    // After 3 levels completed, level 4 should be unlocked
    const locked = await lsp.isLevelLocked(4);
    expect(locked).toBe(false);
  });

  test('special level (index 4 = treasure chest) is present', async ({ atLevelSelection: levelSelectionPage }) => {
    // Grid index 4 is the special treasure-chest level button
    await expect(levelSelectionPage.levelButtonAt(4)).toBeAttached();
  });
});
