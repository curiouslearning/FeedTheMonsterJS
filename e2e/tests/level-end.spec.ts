import { test, expect } from '../fixtures/game-fixtures';
import { applyStandardMocks, seedLevelProgress } from '../helpers';
import { Routes } from '../constants/urls';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

/**
 * Level-end scene tests.
 *
 * Assumption: Because driving the full game through canvas interactions is
 * brittle, these tests reach the level-end scene by publishing the game-state
 * events directly via page.evaluate(), replicating the internal event bus.
 * This is the most stable approach for a canvas-heavy game.
 *
 * Requires: feedTheMonster.ts exposes `window.__ftm.gameStateService` in
 * non-production mode (NODE_ENV !== 'production').
 */
test.describe('Level End Scene', () => {
  async function triggerLevelEnd(
    page: any,
    { starCount = 3, currentLevel = 0, isLastLevel = false } = {},
  ) {
    await page.evaluate(
      ({ starCount, currentLevel, isLastLevel }: any) => {
        // gameStateService is exposed via window.__ftm in the dev build
        const gss = (window as any).__ftm?.gameStateService;
        if (!gss) throw new Error('window.__ftm.gameStateService not available');

        gss.publish(gss.EVENTS.LEVEL_END_DATA_EVENT, {
          starCount,
          currentLevel,
          data: gss.getFTMData(),
          monsterPhaseNumber: 0,
        });

        if (isLastLevel) {
          gss.isLastLevel = true;
        }

        gss.publish(gss.EVENTS.SWITCH_SCENE_EVENT, 'LevelEnd');
      },
      { starCount, currentLevel, isLastLevel },
    );
  }

  async function navigateToGameplay(page: any) {
    const { StartPage } = await import('../pages/start-page');
    const { LevelSelectionPage } = await import('../pages/level-selection-page');
    const { GameplayPage } = await import('../pages/gameplay-page');

    const sp = new StartPage(page);
    await sp.waitForStartScene();
    await sp.clickStartArea();
    const lsp = new LevelSelectionPage(page);
    await lsp.waitForLevelSelection();
    await lsp.clickLevel(1);
    const gp = new GameplayPage(page);
    await gp.waitForGameplayScene();
  }

  test.beforeEach(async ({ page }) => {
    await applyStandardMocks(page);
    await seedLevelProgress(page, 1, 'english');
  });

  test('level-end container appears after level completion event', async ({ page, levelEndPage }) => {
    await page.goto(Routes.game());
    await navigateToGameplay(page);
    await triggerLevelEnd(page, { starCount: 3 });
    await levelEndPage.waitForLevelEndScene();
    await levelEndPage.assertLevelEndVisible();
  });

  test('three stars are rendered for a perfect score', async ({ page, levelEndPage }) => {
    await page.goto(Routes.game());
    await navigateToGameplay(page);
    await triggerLevelEnd(page, { starCount: 3 });
    await levelEndPage.waitForLevelEndScene();
    await levelEndPage.assertStarCount(3);
  });

  test('map button is always present on level end', async ({ page, levelEndPage }) => {
    await page.goto(Routes.game());
    await navigateToGameplay(page);
    await triggerLevelEnd(page, { starCount: 1 });
    await levelEndPage.waitForLevelEndScene();
    await levelEndPage.waitForButtonsVisible();
    await levelEndPage.assertMapButtonVisible();
  });

  test('next button is shown when level passed and not last level', async ({ page, levelEndPage }) => {
    await page.goto(Routes.game());
    await navigateToGameplay(page);
    await triggerLevelEnd(page, { starCount: 3, currentLevel: 0, isLastLevel: false });
    await levelEndPage.waitForLevelEndScene();
    await levelEndPage.waitForButtonsVisible();
    await levelEndPage.assertNextButtonVisible();
  });

  test('clicking map button returns to level selection', async ({ page, levelEndPage, levelSelectionPage }) => {
    await page.goto(Routes.game());
    await navigateToGameplay(page);
    await triggerLevelEnd(page, { starCount: 3 });
    await levelEndPage.waitForLevelEndScene();
    await levelEndPage.waitForButtonsVisible();
    await levelEndPage.clickMapButton();
    await levelSelectionPage.waitForLevelSelection();
  });
});
