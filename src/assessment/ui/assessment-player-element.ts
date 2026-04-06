import '@curiouslearning/assessment-survey/register';
import { AssessmentSurveyPlayerElement, AnalyticsConfig } from '@curiouslearning/assessment-survey';
import { ASSESSMENT_SKIP_BTN } from '@constants';

export interface AssessmentPlayerElementOptions {
  playerTag: string;
  dataKey: string;
  analyticsConfig?: AnalyticsConfig;
  onLoaded?: () => void;
  onCompleted?: () => void;
  onClosed?: () => void;
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
  playerElement.style.display = 'block';
  playerElement.style.width = '100%';
  playerElement.style.height = '100%';

  playerElement.setAttribute('data-key', options.dataKey);
  playerElement.setAttribute('user-id', 'ftm-web-user');
  playerElement.setAttribute('user-source', 'feed-the-monster-web');
  playerElement.setAttribute('asset-base-url', '/assessment-survey');
  playerElement.setAttribute('data-base-url', '/assessment-survey');
  playerElement.setAttribute('embed-mode', 'true');
  playerElement.setAttribute('host-theme', 'ftm-dim');

  if (options.analyticsConfig) {
    playerElement.setAnalyticsConfig(options.analyticsConfig);
  }

  if (options.onLoaded) {
    playerElement.addEventListener('loaded', options.onLoaded);
  }

  if (options.onCompleted) {
    playerElement.addEventListener('completed', options.onCompleted);
  }

  if (options.onClosed) {
    playerElement.addEventListener('closed', options.onClosed);
  }

  return playerElement;
}

export function createAssessmentCloseButton(options: AssessmentCloseButtonOptions): HTMLButtonElement {
  const skipButton = document.createElement('button');
  skipButton.id = options.skipButtonId;
  skipButton.type = 'button';
  skipButton.setAttribute('aria-label', 'Skip assessment survey');

  skipButton.style.position = 'absolute';
  skipButton.style.top = '0px';
  skipButton.style.right = '0px';
  skipButton.style.width = '60px';
  skipButton.style.height = '48px';
  skipButton.style.border = 'none';
  skipButton.style.background = `center / contain no-repeat url("${ASSESSMENT_SKIP_BTN}")`;
  skipButton.style.cursor = 'pointer';
  skipButton.style.zIndex = '10001';

  closeButton.addEventListener('click', options.onClose);

  return closeButton;
}

