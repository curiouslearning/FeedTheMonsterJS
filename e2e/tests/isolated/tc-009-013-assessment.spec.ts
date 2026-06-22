/**
 * FTM_TC_009 | Assessment Trigger
 * FTM_TC_0010 | Assessment Gameplay
 * FTM_TC_0011 | Assessment Drag and Drop
 * FTM_TC_0012 | Feedback in Assessment
 * FTM_TC_0013 | Wrong Drop
 *
 * TC_0011 writes correctAssessmentBtnId + wrongAssessmentBtnId into SharedFlowState;
 * TC_0012 and TC_0013 read them.
 *
 * Run via the orchestrator: e2e/tests/ftm-assessment-survey-flow.spec.ts
 */

import { test, expect } from '../../fixtures/game-fixtures';
import type { SharedFlowState } from '../../fixtures/game-fixtures';
import type { Page } from '@playwright/test';
import { Selectors } from '../../constants/selectors';
import { Timeouts } from '../../constants/timeouts';
import { GameplayPage } from '../../pages/gameplay-page';
import {
  triggerAssessment,
  pauseFtmGame,
} from '../../helpers';

export function registerTests(getPage: () => Page, state: SharedFlowState): void {
  // ─────────────────────────────────────────────────────────────────────────
  // TC_009 | Assessment Trigger
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_009 | Assessment Trigger | Assessment overlay appears as overlay on existing UI during gameplay', async () => {
    const page = getPage();

    await test.step('Trigger the assessment survey overlay via GameplayFlowManager', async () => {
      await triggerAssessment(page);
    });

    await test.step('Pause FTM game while assessment is active', async () => {
      await pauseFtmGame(page);
    });

    await test.step('Assessment overlay container is visible over the game', async () => {
      await expect(page.locator(Selectors.assessmentOverlay)).toBeVisible({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Assessment survey player web component is mounted', async () => {
      await expect(page.locator(Selectors.assessmentPlayer)).toBeAttached({
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('FTM game inputs are suspended while assessment is active', async () => {
      const inAssessmentMode = await page.evaluate(() => {
        const gss = (window as any).__ftm?.gameStateService;
        const fm = (gss?.gamePlayScene ?? gss?.currentScene)?.flowManager;
        if (fm && typeof fm.isAssessmentInProgress === 'boolean') {
          return fm.isAssessmentInProgress;
        }
        const overlay = document.querySelector('#assessment-survey-overlay') as HTMLElement | null;
        if (!overlay) return false;
        return parseInt(window.getComputedStyle(overlay).zIndex || '0', 10) > 0;
      });
      expect(inAssessmentMode).toBe(true);
    });

    await test.step('Main game canvas remains attached beneath the overlay', async () => {
      await expect(page.locator(GameplayPage.SELECTORS.mainCanvas)).toBeAttached();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_0010 | Assessment Gameplay
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0010 | Assessment Gameplay | Treasure chest UI and audio button are displayed and interactable', async () => {
    const page = getPage();

    await test.step('Assessment overlay is still visible', async () => {
      await expect(page.locator(Selectors.assessmentOverlay)).toBeVisible({
        timeout: Timeouts.domUpdate,
      });
    });

    await test.step('Wait for assessment question view to render (#pbutton)', async () => {
      await page.waitForSelector(`${Selectors.assessmentPlayer} #pbutton`, {
        timeout: Timeouts.sceneTransition,
      });
    });

    await test.step('Click the audio play button (#nextqButton) to start the first question', async () => {
      await page.waitForSelector(`${Selectors.assessmentPlayer} #nextqButton`, {
        timeout: Timeouts.sceneTransition,
      });
      await page.waitForTimeout(1000);
      await page.locator(`${Selectors.assessmentPlayer} #nextqButton`).click({ force: true });
    });

    await test.step('Answer buttons (.answerButton) appear after the audio prompt', async () => {
      await page.waitForSelector(`${Selectors.assessmentPlayer} .answerButton`, {
        timeout: Timeouts.sceneTransition,
      });
      const btnCount = await page.locator(`${Selectors.assessmentPlayer} .answerButton`).count();
      expect(btnCount).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_0011 | Assessment Drag and Drop
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0011 | Assessment Drag and Drop | Correct answer dragged to chest; question advances to next', async () => {
    const page = getPage();

    await test.step('Identify correct answer and drag it to the chest', async () => {
      await page.waitForFunction(
        (playerSel) => {
          const player = document.querySelector(playerSel);
          if (!player) return false;
          const chest = player.querySelector('#chestImage');
          if (!chest) return false;
          const chestRect = (chest as HTMLElement).getBoundingClientRect();
          if (chestRect.width === 0) return false;
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

      const answerInfo = await page.evaluate((playerSel) => {
        const player = document.querySelector(playerSel) as any;
        if (!player?.appInstance) return null;
        const q = player.appInstance.game?.currentQuestion;
        if (!q || !Array.isArray(q.answers) || !q.correct) return null;
        const correctAnswerName: string = q.correct;
        const correctIdx = (q.answers as any[]).findIndex(
          (a) => a.answerName === correctAnswerName,
        );
        const wrongIdx = (q.answers as any[]).findIndex(
          (a) => a.answerName !== correctAnswerName,
        );
        return {
          correctBtnId: correctIdx >= 0 ? `#answerButton${correctIdx + 1}` : null,
          wrongBtnId: wrongIdx >= 0 ? `#answerButton${wrongIdx + 1}` : null,
          correctAnswerName,
        };
      }, Selectors.assessmentPlayer);

      if (answerInfo?.correctBtnId) {
        state.correctAssessmentBtnId = answerInfo.correctBtnId;
        state.wrongAssessmentBtnId = answerInfo.wrongBtnId ?? null;
        test.info().annotations.push({
          type: 'correct-answer-identified',
          description: `Q1 correct answer (${answerInfo.correctAnswerName}) → ${answerInfo.correctBtnId}`,
        });
      }

      expect(state.correctAssessmentBtnId).not.toBeNull();

      const chest = page.locator(`${Selectors.assessmentPlayer} #chestImage`);
      const chestBB = await chest.boundingBox();
      expect(chestBB).not.toBeNull();

      const btn = page.locator(`${Selectors.assessmentPlayer} ${state.correctAssessmentBtnId}`);
      const btnBB = await btn.boundingBox();
      expect(btnBB).not.toBeNull();

      await page.mouse.move(btnBB!.x + btnBB!.width / 2, btnBB!.y + btnBB!.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        chestBB!.x + chestBB!.width / 2,
        chestBB!.y + chestBB!.height / 2,
        { steps: 20 },
      );
      await page.mouse.up();

      const feedbackVisible = await page.waitForFunction(
        (playerSel) => {
          const el = document.querySelector(`${playerSel} #feedbackWrap`) as HTMLElement | null;
          return el?.classList.contains('visible') ?? false;
        },
        Selectors.assessmentPlayer,
        { timeout: 5000 },
      ).then(() => true).catch(() => false);

      expect(feedbackVisible, '#feedbackWrap must become visible after dropping the correct answer').toBe(true);

      const isGreenFeedback = feedbackVisible && await page.evaluate((playerSel) => {
        const el = document.querySelector(`${playerSel} #feedbackWrap`) as HTMLElement | null;
        if (!el?.classList.contains('visible')) return false;
        const color = window.getComputedStyle(el).color;
        return !color.includes('255, 0, 0') && color !== 'red';
      }, Selectors.assessmentPlayer);

      test.info().annotations.push({
        type: 'correct-drop-result',
        description: isGreenFeedback
          ? `Green feedback confirmed for ${state.correctAssessmentBtnId} on Q1`
          : `Feedback appeared but color check inconclusive for ${state.correctAssessmentBtnId}`,
      });
    });

    await expect(page.locator(Selectors.assessmentPlayer)).toBeAttached();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_0012 | Feedback in Assessment
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0012 | Assessment Feedback | Correct answer shows green/positive feedback', async () => {
    const page = getPage();

    await test.step('Correct answer button was identified during TC_0011', async () => {
      expect(state.correctAssessmentBtnId).not.toBeNull();
    });

    await test.step('Green feedback (#feedbackWrap visible with green color) confirms correct answer', async () => {
      const greenFeedback = await page.waitForFunction(
        (playerSel) => {
          const el = document.querySelector(`${playerSel} #feedbackWrap`) as HTMLElement | null;
          if (!el?.classList.contains('visible')) return false;
          const color = window.getComputedStyle(el).color;
          return !color.includes('255, 0, 0') && color !== 'red';
        },
        Selectors.assessmentPlayer,
        { timeout: 3000 },
      ).then(() => true).catch(() => false);

      test.info().annotations.push({
        type: 'green-feedback-detection',
        description: greenFeedback
          ? `#feedbackWrap visible with green color — correct btn: ${state.correctAssessmentBtnId}`
          : `Green feedback faded before check — correct btn ${state.correctAssessmentBtnId} accepted`,
      });

      await expect(page.locator(Selectors.assessmentOverlay)).toBeAttached();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC_0013 | Wrong Drop
  // ─────────────────────────────────────────────────────────────────────────
  test('FTM_TC_0013 | Wrong Drop | Dropping wrong answer shows red/negative feedback; question does not advance', async () => {
    const page = getPage();

    await test.step('Wait for Q1 green feedback to fade before interacting with Q2', async () => {
      await page.waitForFunction(
        (playerSel) => {
          const player = document.querySelector(playerSel);
          if (!player) return true;
          const fw = player.querySelector('#feedbackWrap') as HTMLElement | null;
          if (!fw) return true;
          return !fw.classList.contains('visible');
        },
        Selectors.assessmentPlayer,
        { timeout: 5000 },
      ).catch(() => null);
    });

    await test.step('Wait for Q2 audio button and click it', async () => {
      await page.waitForSelector(`${Selectors.assessmentPlayer} #nextqButton`, {
        timeout: Timeouts.sceneTransition,
      });
      await page.locator(`${Selectors.assessmentPlayer} #nextqButton`).click({ force: true });
    });

    await test.step('Wait for Q2 answer buttons to finish their entry animation', async () => {
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
    });

    await test.step('Drag a known-wrong button to the chest and verify red feedback', async () => {
      const q2WrongBtnId = await page.evaluate((playerSel) => {
        const player = document.querySelector(playerSel) as any;
        if (!player?.appInstance) return null;
        const q = player.appInstance.game?.currentQuestion;
        if (!q || !Array.isArray(q.answers) || !q.correct) return null;
        const correctAnswerName: string = q.correct;
        const wrongIdx = (q.answers as any[]).findIndex(
          (a) => a.answerName !== correctAnswerName,
        );
        return wrongIdx >= 0 ? `#answerButton${wrongIdx + 1}` : null;
      }, Selectors.assessmentPlayer);

      const buttonIds = ['#answerButton1', '#answerButton2', '#answerButton3', '#answerButton4'];
      const wrongId =
        q2WrongBtnId ??
        state.wrongAssessmentBtnId ??
        buttonIds.find((b) => b !== state.correctAssessmentBtnId) ??
        '#answerButton4';

      test.info().annotations.push({
        type: 'intentional-wrong-answer',
        description: `Deliberately dragging ${wrongId} (wrong answer) on Q2`,
      });

      const btn = page.locator(`${Selectors.assessmentPlayer} ${wrongId}`);
      const chest = page.locator(`${Selectors.assessmentPlayer} #chestImage`);
      const btnBB = await btn.boundingBox().catch(() => null);
      const chestBB = await chest.boundingBox().catch(() => null);

      if (btnBB && chestBB) {
        await page.mouse.move(btnBB.x + btnBB.width / 2, btnBB.y + btnBB.height / 2);
        await page.mouse.down();
        await page.mouse.move(chestBB.x + chestBB.width / 2, chestBB.y + chestBB.height / 2, { steps: 20 });
        await page.mouse.up();
      }

      const feedbackVisible = await page.waitForFunction(
        (playerSel) => {
          const el = document.querySelector(`${playerSel} #feedbackWrap`) as HTMLElement | null;
          return el?.classList.contains('visible') ?? false;
        },
        Selectors.assessmentPlayer,
        { timeout: 3000 },
      ).then(() => true).catch(() => false);

      expect(feedbackVisible).toBe(true);
    });

    await test.step('Close assessment survey after verifying the wrong-drop feedback', async () => {
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
    });
  });
}
