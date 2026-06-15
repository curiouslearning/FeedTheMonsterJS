/**
 * Helpers that reach into the running app's JS context via page.evaluate().
 *
 * The game uses ES-module singletons (gameStateService, assessmentSurveyManager).
 * We expose them on window in the test environment by injecting a small script
 * via page.addInitScript() – see exposeGameInternals().
 */
import { Page } from '@playwright/test';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';

/**
 * Called BEFORE page.goto(). Ensures window.__ftm exists so callers never
 * have to null-check it before the game populates it.
 *
 * The dev build (NODE_ENV !== 'production') in feedTheMonster.ts already does:
 *   window.__ftm = { gameStateService, assessmentSurveyManager }
 * after featureFlagsService.initialize(). This helper is kept for backward
 * compatibility and to guarantee __ftm is defined from the start.
 */
export async function exposeGameInternals(page: Page) {
  await page.addInitScript(() => {
    (window as any).__ftm = (window as any).__ftm || {};
  });
}

/**
 * Returns the current puzzle's target stone text(s) from the running game.
 * Requires exposeGameInternals() to have been called and the gameplay scene to
 * be active.  Falls back to null if state is not accessible.
 */
export async function getCurrentPuzzleTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const gss = (window as any).__ftm?.gameStateService;
    if (!gss) return [];
    const data = gss.gamePlayData;
    if (!data?.currentLevelData?.puzzles) return [];
    const currentPuzzleIndex = gss.currentPuzzleIndex ?? 0;
    const puzzle = data.currentLevelData.puzzles[currentPuzzleIndex];
    return puzzle?.targetStones ?? [];
  });
}

/**
 * Publishes a game state event directly.  Useful for shortcutting to specific
 * scenes without driving full UI interactions.
 */
export async function publishGameEvent(page: Page, eventName: string, payload?: unknown) {
  await page.evaluate(
    ({ event, payload }) => {
      const gss = (window as any).__ftm?.gameStateService;
      if (gss) {
        gss.publish(event, payload);
      }
    },
    { event: eventName, payload },
  );
}

/**
 * Triggers the assessment survey overlay programmatically.
 * Use this in TC_009 to guarantee the overlay appears without needing to play
 * through every puzzle.
 */
export async function triggerAssessment(page: Page) {
  await page.evaluate(() => {
    const asm = (window as any).__ftm?.assessmentSurveyManager;
    if (asm) {
      asm.open({
        onLoaded: () => {},
        onComplete: () => {},
        onRewardTrigger: () => {},
        onClose: () => {},
      });
    }
  });
}

/**
 * Waits for an element inside the assessment-survey-player component.
 * The component may use either regular DOM or a light shadow root.
 */
export async function waitForAssessmentElement(
  page: Page,
  innerSelector: string,
  timeout: number = Timeouts.sceneTransition,
) {
  await page.waitForFunction(
    ({ outer, inner }) => {
      const player = document.querySelector(outer);
      if (!player) return false;
      // Try regular DOM first
      if (player.querySelector(inner)) return true;
      // Try shadow root
      if ((player as any).shadowRoot?.querySelector(inner)) return true;
      return false;
    },
    { outer: Selectors.assessmentPlayer, inner: innerSelector },
    { timeout },
  );
}

/**
 * Returns the bounding box of an element inside assessment-survey-player,
 * searching both regular DOM and shadow DOM.
 */
export async function getAssessmentElementBbox(
  page: Page,
  innerSelector: string,
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  return page.evaluate(
    ({ outer, inner }) => {
      const player = document.querySelector(outer);
      if (!player) return null;
      const el =
        player.querySelector(inner) ??
        (player as any).shadowRoot?.querySelector(inner);
      if (!el) return null;
      const r = (el as HTMLElement).getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    },
    { outer: Selectors.assessmentPlayer, inner: innerSelector },
  );
}

/**
 * Triggers level-end scene by publishing the required game events.
 * Pass starCount 1–5 to simulate different outcomes.
 */
export async function triggerLevelEndScene(
  page: Page,
  starCount = 3,
  currentLevel = 0,
  isLastLevel = false,
) {
  await page.evaluate(
    ({ starCount, currentLevel, isLastLevel }) => {
      const gss = (window as any).__ftm?.gameStateService;
      if (!gss) return;

      const data = gss.getFTMData?.();
      if (!data) return;

      gss.isLastLevel = isLastLevel;

      gss.publish(gss.EVENTS.LEVEL_END_DATA_EVENT, {
        levelEndData: {
          starCount,
          currentLevel,
          isTimerEnded: false,
          treasureChestScore: 0,
          score: starCount * 4,
        },
        data,
      });

      gss.publish(gss.EVENTS.SWITCH_SCENE_EVENT, 'LevelEnd');
    },
    { starCount, currentLevel, isLastLevel },
  );
}

/**
 * Checks whether the feedback text contains a positive (correct) message.
 * The game uses game data's FeedbackTexts (Fantastic, Great, Amazing).
 */
export async function waitForPositiveFeedback(page: Page, timeout = Timeouts.domUpdate) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const text = (el.textContent ?? '').trim();
      return text.length > 0;
    },
    Selectors.feedbackText,
    { timeout },
  );
}
