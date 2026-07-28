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

export interface SharedFlowState {
  capturedStonePos: { x: number; y: number; text: string } | null;
  monsterHitboxCenter: { x: number; y: number } | null;
  correctAssessmentBtnId: string | null;
  wrongAssessmentBtnId: string | null;
}

export function createSharedState(): SharedFlowState {
  return {
    capturedStonePos: null,
    monsterHitboxCenter: null,
    correctAssessmentBtnId: null,
    wrongAssessmentBtnId: null,
  };
}

/**
 * Shared state for TC_009–TC_013 (dynamic assessment + full-level flow).
 * Carries stone positions, hitbox centre, and dynamically-discovered level
 * configuration across all dynamic gameplay test cases.
 */
export interface FullGameplayFlowState {
  /** Correct stone position for the current puzzle (updated each puzzle). */
  capturedStonePos: { x: number; y: number; text: string } | null;
  /** Monster drop-zone hitbox centre in canvas-relative CSS pixels. */
  monsterHitboxCenter: { x: number; y: number } | null;
  /** 1-based puzzle segment at which the assessment triggers (0 = not eligible). */
  assessmentTriggerPuzzle: number;
  /** 1-based puzzle segment where the mini-game is scheduled (0 = none). */
  miniGameTriggerPuzzle: number;
  /** Total puzzles in the selected level. */
  totalPuzzleCount: number;
  /**
   * 0-based puzzle index when TC_009 started.
   * > 0 when TC_008 already completed puzzle 1; TC_010 uses this to skip
   * puzzles that are already done.
   */
  startingPuzzleIndex: number;
}

export function createFullGameplayFlowState(): FullGameplayFlowState {
  return {
    capturedStonePos: null,
    monsterHitboxCenter: null,
    assessmentTriggerPuzzle: 0,
    miniGameTriggerPuzzle: 0,
    totalPuzzleCount: 0,
    startingPuzzleIndex: 0,
  };
}
