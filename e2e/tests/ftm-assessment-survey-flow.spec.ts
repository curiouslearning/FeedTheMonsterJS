/**
 * FeedTheMonsterJS – Full E2E Flow (TC_001 – TC_0016)
 *
 * Orchestrator: runs all 16 test cases as one serial worker in a single shared
 * browser session. Test logic lives exclusively in the files under isolated/.
 * Nothing here but page setup and the ordered list of registerTests calls.
 *
 * Execution order mirrors the manual test flow:
 *   App launch → Start screen → Navigation → Level selection → Gameplay →
 *   Assessment → Mini game → Level end
 *
 * To debug a specific area in isolation, run the corresponding file directly
 * from e2e/tests/isolated/.
 */

import { test, createSharedState } from '../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Routes } from '../constants/urls';
import { mockAnalytics, clearGameProgress, exposeGameInternals } from '../helpers';

import { registerTests as tc001 } from './isolated/tc-001-app-launch.spec';
import { registerTests as tc002_003 } from './isolated/tc-002-003-start-screen.spec';
import { registerTests as tc004_005 } from './isolated/tc-004-005-level-selection.spec';
import { registerTests as tc006_008 } from './isolated/tc-006-008-gameplay.spec';
import { registerTests as tc009_013 } from './isolated/tc-009-013-assessment.spec';
import { registerTests as tc014_015 } from './isolated/tc-014-015-mini-game.spec';
import { registerTests as tc016 } from './isolated/tc-016-level-completion.spec';

test.describe.serial('FeedTheMonsterJS – Full E2E Flow (TC_001 – TC_0016)', () => {
  test.describe.configure({ retries: 0 });

  let page: Page;
  const state = createSharedState();

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await mockAnalytics(page);
    await clearGameProgress(page);
    await exposeGameInternals(page);
    // TC_001 asserts the loading-screen state; navigate here so it catches first paint
    await page.goto(Routes.game({ lang: 'english' }));
  });

  test.afterAll(async () => {
    await page.close();
  });

  tc001(() => page);
  tc002_003(() => page);
  tc004_005(() => page);
  tc006_008(() => page, state);
  tc009_013(() => page, state);
  tc014_015(() => page);
  tc016(() => page);
});
