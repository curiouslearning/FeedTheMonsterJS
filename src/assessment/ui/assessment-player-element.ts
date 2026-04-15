import '@curiouslearning/assessment-survey/register';
import { AnalyticsConfig, AssessmentCompletedPayload, AssessmentSurveyPlayerElement } from '@curiouslearning/assessment-survey';
import { ASSESSMENT_SKIP_BTN } from '@constants';
import { getAssessmentBasePath } from '../assessment-asset-path';

export interface AssessmentPlayerElementOptions {
  playerTag: string;
  dataKey: string;
  analyticsConfig?: AnalyticsConfig;
  onLoaded?: () => void;
  onClose?: () => void;
  onComplete?: (payload: AssessmentCompletedPayload) => void;
  onRewardTrigger?: (payload: AssessmentCompletedPayload) => void;
}

export interface AssessmentCloseButtonOptions {
  closeButtonId: string;
  onClose: () => void;
}

export interface AssessmentSkipButtonOptions {
  skipButtonId: string;
  onSkip: () => void;
}

export function createAssessmentPlayerElement(options: AssessmentPlayerElementOptions): AssessmentSurveyPlayerElement {
  const playerElement = document.createElement(options.playerTag) as AssessmentSurveyPlayerElement;
  const assessmentBasePath = getAssessmentBasePath();

  playerElement.style.display = 'block';
  playerElement.style.width = '100%';
  playerElement.style.height = '100%';

  playerElement.setAttribute('data-key', options.dataKey);
  playerElement.setAttribute('user-id', 'ftm-web-user');
  playerElement.setAttribute('user-source', 'feed-the-monster-web');
  playerElement.setAttribute('asset-base-url', assessmentBasePath);
  playerElement.setAttribute('data-base-url', assessmentBasePath);
  playerElement.setAttribute('embed-mode', 'true');
  playerElement.setAttribute('host-theme', 'ftm-dim');

  if (options.analyticsConfig) {
    playerElement.setAnalyticsConfig(options.analyticsConfig);
  }

  if (options.onLoaded) {
    playerElement.subscribe(AssessmentSurveyPlayerElement.ONLOADED, () => {
      options.onLoaded?.();
    });
  }

  if (options.onClose) {
    playerElement.subscribe(AssessmentSurveyPlayerElement.ONCLOSE, () => {
      options.onClose?.();
    });
  }

  if (options.onComplete) {
    playerElement.subscribe<AssessmentCompletedPayload>(AssessmentSurveyPlayerElement.ONCOMPLETE, (payload) => {
      options.onComplete?.(payload);
    });
  }

  if (options.onRewardTrigger) {
    playerElement.subscribe<AssessmentCompletedPayload>(AssessmentSurveyPlayerElement.ONREWARDTRIGGER, (payload) => {
      options.onRewardTrigger?.(payload);
    });
  }

  return playerElement;
}

/*
* Close and Skip Assessment Button.
*/
export function createAssessmentCloseButton(options: AssessmentCloseButtonOptions): HTMLButtonElement {
  const closeButton = document.createElement('button');
  closeButton.id = options.closeButtonId;
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Skip assessment survey');

  closeButton.style.position = 'absolute';
  closeButton.style.top = '0px';
  closeButton.style.right = '0px';
  closeButton.style.width = '60px';
  closeButton.style.height = '48px';
  closeButton.style.border = 'none';
  closeButton.style.background = `center / contain no-repeat url("${ASSESSMENT_SKIP_BTN}")`;
  closeButton.style.cursor = 'pointer';
  closeButton.style.zIndex = '10001';

  closeButton.addEventListener('click', options.onClose);

  return closeButton;
}