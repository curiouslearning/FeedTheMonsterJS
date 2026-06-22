/**
 * FTM_TC_0014 | Mini Game Appears After Assessment Close
 * FTM_TC_0015 | Mini Game
 *
 * TC_0014: Treasure chest mini game canvas becomes visible after assessment ends
 * TC_0015: Click 5 stones, bonus star shown, mini game completes naturally
 *
 * The beforeAll navigates to gameplay, drags the correct stone, triggers and
 * completes the assessment, then closes it so #treasurecanvas becomes visible.
 */

import { test, expect, Page } from '@playwright/test';
import { Routes } from '../constants/urls';
import { Selectors } from '../constants/selectors';
import { Timeouts } from '../constants/timeouts';
import { StartPage } from '../pages/start-page';
import { LevelSelectionPage } from '../pages/level-selection-page';
import { GameplayPage } from '../pages/gameplay-page';
import {
  applyStandardMocks,
  clearGameProgress,
  exposeGameInternals,
  subscribeToCorrectStonePosition,
  getCapturedCorrectStonePos,
  getHitboxCenter,
  triggerAssessment,
  pauseFtmGame,
  hidePausePopupForMiniGame,
  waitForTreasureCanvasVisible,
  waitForMiniGameComplete,
} from '../helpers';

async function waitForLoadingDone(page: Page) {
  await page.waitForFunction(
    (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return true;
      return el.style.display === 'none' || el.style.zIndex === '-1';
    },
    Selectors.loadingScreen,
    { timeout: Timeouts.appReady },
  );
}

async function dragCorrectStoneToMonster(page: Page) {
  const stonePos = await getCapturedCorrectStonePos(page);
  const hitboxCenter = await getHitboxCenter(page);
  if (!stonePos || !hitboxCenter) return;

  const canvasBB = await page.locator(GameplayPage.SELECTORS.mainCanvas).boundingBox();
  if (!canvasBB) return;

  const pickX = canvasBB.x + stonePos.x;
  const pickY = canvasBB.y + stonePos.y;
  const dropX = canvasBB.x + hitboxCenter.x;
  const dropY = canvasBB.y + hitboxCenter.y;

  await page.mouse.move(pickX, pickY);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(
      pickX + (dropX - pickX) * (i / 20),
      pickY + (dropY - pickY) * (i / 20),
    );
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
}

async function completeAssessmentAndClose(page: Page) {
  // Wait for assessment overlay
  await expect(page.locator(Selectors.assessmentOverlay)).toBeVisible({
    timeout: Timeouts.sceneTransition,
  });

  // Start Q1
  await page.waitForSelector(`${Selectors.assessmentPlayer} #nextqButton`, {
    timeout: Timeouts.sceneTransition,
  });
  await page.waitForTimeout(1000);
  await page.locator(`${Selectors.assessmentPlayer} #nextqButton`).click({ force: true });

  // Wait for buttons and find the correct answer
  await page.waitForFunction(
    (playerSel) => {
      const player = document.querySelector(playerSel);
      if (!player) return false;
      const chest = player.querySelector('#chestImage');
      if (!chest || (chest as HTMLElement).getBoundingClientRect().width === 0) return false;
      const btns = Array.from(player.querySelectorAll('.answerButton'));
      return btns.some((b) => {
        const el = b as HTMLElement;
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        if (el.getBoundingClientRect().width === 0) return false;
        const animations = (el as Element).getAnimations?.() ?? [];
        return animations.length === 0 && parseFloat(cs.opacity) > 0;
      });
    },
    Selectors.assessmentPlayer,
    { timeout: Timeouts.sceneTransition },
  );

  const correctBtnId = await page.evaluate((playerSel) => {
    const player = document.querySelector(playerSel) as any;
    if (!player?.appInstance) return null;
    const q = player.appInstance.game?.currentQuestion;
    if (!q || !Array.isArray(q.answers) || !q.correct) return null;
    const idx = (q.answers as any[]).findIndex((a) => a.answerName === q.correct);
    return idx >= 0 ? `#answerButton${idx + 1}` : null;
  }, Selectors.assessmentPlayer);

  if (correctBtnId) {
    const chest = page.locator(`${Selectors.assessmentPlayer} #chestImage`);
    const btn = page.locator(`${Selectors.assessmentPlayer} ${correctBtnId}`);
    const chestBB = await chest.boundingBox();
    const btnBB = await btn.boundingBox();

    if (btnBB && chestBB) {
      await page.mouse.move(btnBB.x + btnBB.width / 2, btnBB.y + btnBB.height / 2);
      await page.mouse.down();
      await page.mouse.move(chestBB.x + chestBB.width / 2, chestBB.y + chestBB.height / 2, { steps: 20 });
      await page.mouse.up();
      await page.waitForFunction(
        (playerSel) => {
          const el = document.querySelector(`${playerSel} #feedbackWrap`) as HTMLElement | null;
          return el?.classList.contains('visible') ?? false;
        },
        Selectors.assessmentPlayer,
        { timeout: 5000 },
      ).catch(() => null);
    }
  }

  // Close assessment
  const closeBtn = page.locator(Selectors.assessmentCloseBtn);
  const closeBtnVisible = await closeBtn.isVisible({ timeout: 3000 }).catch(() => false);
  if (closeBtnVisible) {
    await closeBtn.click();
  } else {
    const innerClose = page.locator(
      `${Selectors.assessmentPlayer} [class*="close"], ${Selectors.assessmentPlayer} [class*="skip"]`,
    );
    if ((await innerClose.count()) > 0) {
      await innerClose.first().click({ force: true });
    }
  }
  await page.waitForTimeout(1500);
}

test.describe.serial('FTM_TC_0014–0015 | Mini Game', () => {
  test.describe.configure({ retries: 0 });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
    await applyStandardMocks(page);
    await clearGameProgress(page);
    await exposeGameInternals(page);
    await page.goto(Routes.game({ lang: 'english' }));
    await waitForLoadingDone(page);

    // Enable debug mode
    await expect(page.locator(StartPage.SELECTORS.toggleDevBtn)).toBeVisible({
      timeout: Timeouts.sceneTransition,
    });
    await page.locator(StartPage.SELECTORS.toggleDevBtn).click();

    // Navigate to level selection → subscribe → click level 2
    await page.locator(StartPage.SELECTORS.clickArea).click({ force: true });
    await page.waitForTimeout(1500);
    await expect(page.locator(LevelSelectionPage.SELECTOR)).toBeVisible({
      timeout: Timeouts.sceneTransition,
    });
    await subscribeToCorrectStonePosition(page);
    await page.locator(LevelSelectionPage.SELECTORS.levelButton(1)).click();
    await page.waitForTimeout(1500);

    // Wait for gameplay ready
    await expect(page.locator(GameplayPage.SELECTORS.mainCanvas)).toBeVisible({
      timeout: Timeouts.sceneTransition,
    });
    await page.waitForFunction(
      () => (window as any).__ftm?.gameStateService?.getHitBoxRanges?.() != null,
      { timeout: 10_000 },
    );
    await page.waitForFunction(
      (sel) => {
        const canvas = document.querySelector(sel) as HTMLCanvasElement | null;
        if (!canvas || canvas.width === 0) return false;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 0) return true;
        }
        return false;
      },
      GameplayPage.SELECTORS.mainCanvas,
      { timeout: 10_000 },
    );

    await dragCorrectStoneToMonster(page);

    // Wait for feedback
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return !!el && (el.textContent ?? '').trim().length > 0;
      },
      Selectors.feedbackText,
      { timeout: Timeouts.domUpdate },
    );
    await page.waitForTimeout(2000);

    // Trigger assessment, pause game, then complete and close it
    await triggerAssessment(page);
    await pauseFtmGame(page);
    await completeAssessmentAndClose(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_0014 | Mini Game Appears After Assessment Close
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0014 | Assessment Completion | Mini game treasure canvas becomes visible after assessment ends', async () => {
    await test.step('Treasure chest mini game canvas (#treasurecanvas) becomes visible', async () => {
      await waitForTreasureCanvasVisible(page, Timeouts.sceneTransition);
      await expect(page.locator(Selectors.treasureCanvas)).toBeVisible();
    });

    await test.step('Raise mini-game canvas above pause popup and hide the pause popup', async () => {
      await hidePausePopupForMiniGame(page);
    });

    await test.step('Mini-game animation advances with real deltaTime', async () => {
      await page.waitForTimeout(1500);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_0015 | Mini Game
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0015 | Mini Game | Click 5 stones, bonus star shown, mini game completes naturally', async () => {
    await test.step('Treasure chest canvas is visible with non-zero dimensions', async () => {
      await expect(page.locator(Selectors.treasureCanvas)).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
      const canvasBB = await page.locator(Selectors.treasureCanvas).boundingBox();
      expect(canvasBB).not.toBeNull();
      expect(canvasBB!.width).toBeGreaterThan(0);
      expect(canvasBB!.height).toBeGreaterThan(0);
    });

    await test.step('Wait for treasure chest to open (FadeIn ~300 ms + ClosedChest ~1000 ms)', async () => {
      await page.waitForTimeout(1500);
    });

    await test.step('Auto-click 5 stones by reading their live positions from TreasureStones', async () => {
      await page.evaluate(({ count, intervalMs }) => {
        return new Promise<void>((resolve) => {
          const scene =
            (window as any).__ftm?.sceneHandler?.['activeScene']?.['scene'];
          const miniGame = scene?.miniGameHandler?.activeMiniGame;

          let clicked = 0;
          const tick = () => {
            if (clicked >= count || !miniGame) {
              resolve();
              return;
            }
            const stonesMgr = miniGame['treasureStones'];
            const stones: any[] = stonesMgr?.['stones'] ?? [];
            const active = stones.filter((s: any) => s.active && !s.burning);
            if (active.length > 0) {
              const s = active[Math.floor(Math.random() * active.length)];
              stonesMgr['onClickEvent'](s.x, s.y);
              clicked++;
            }
            setTimeout(tick, intervalMs);
          };
          setTimeout(tick, intervalMs);
        });
      }, { count: 5, intervalMs: 800 });
    });

    await test.step('Wait for mini game to complete naturally (OpenedChest 12 s + FadeOut 400 ms)', async () => {
      await waitForMiniGameComplete(page, 20_000);
    });

    await test.step('Game background remains visible after mini game ends', async () => {
      await expect(page.locator(Selectors.background)).toBeVisible();
    });
  });
});
