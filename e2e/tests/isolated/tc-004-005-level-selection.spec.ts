/**
 * FTM_TC_004 | Level Selection Screen
 * FTM_TC_005 | Navigation from Level Screen to Gameplay Screen
 *
 * TC_004: All levels unlocked in debug mode; level 2 is clickable
 * TC_005: Gameplay screen loads successfully after level button click
 *
 * Run via the orchestrator: e2e/tests/ftm-assessment-survey-flow.spec.ts
 */

import { test, expect } from '../../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Selectors } from '../../constants/selectors';
import { Timeouts } from '../../constants/timeouts';
import { LevelSelectionPage } from '../../pages/level-selection-page';
import { GameplayPage } from '../../pages/gameplay-page';
import { subscribeToCorrectStonePosition } from '../../helpers';

export function registerTests(getPage: () => Page): void {
  // ─────────────────────────────────────────────────────────────────────────
  // TC_004 | Level Selection Screen
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_004 | Level Selection | All levels unlocked in debug mode; level 2 is clickable', async () => {
    const page = getPage();

    await test.step('Level selection grid is visible', async () => {
      await expect(page.locator(LevelSelectionPage.SELECTORS.grid)).toBeVisible();
    });

    await test.step('Level 1 button (grid index 0) is visible and not locked', async () => {
      await expect(page.locator(LevelSelectionPage.SELECTORS.levelButton(0))).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
    });

    await test.step('Level 2 button (grid index 1) is visible and enabled in debug mode', async () => {
      const level2Btn = page.locator(LevelSelectionPage.SELECTORS.levelButton(1));
      await expect(level2Btn).toBeVisible({ timeout: Timeouts.domUpdate });
      await expect(level2Btn).toBeEnabled();
    });

    await test.step('Subscribe to CORRECT_STONE_POSITION before level loads', async () => {
      await subscribeToCorrectStonePosition(page);
    });

    await test.step('Click level 2 button to navigate to gameplay screen', async () => {
      await page.locator(LevelSelectionPage.SELECTORS.levelButton(1)).click();
      await page.waitForTimeout(1500);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_005 | Navigation from Level Screen to Gameplay Screen
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_005 | Navigation | Gameplay screen loads successfully after level button click', async () => {
    const page = getPage();

    await test.step('Main game canvas is visible', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.mainCanvas)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Pause button is visible', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.pauseButton)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Background wrapper is visible', async () => {
      await expect(page.locator(Selectors.background)).toBeVisible();
    });

    await test.step('Rive monster canvas is attached', async () => {
      await expect(page.locator(Selectors.riveCanvas)).toBeAttached();
    });
  });
}
