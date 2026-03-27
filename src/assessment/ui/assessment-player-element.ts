import '@curiouslearning/assessment-survey/register';
import { AssessmentSurveyPlayerElement, AnalyticsConfig } from '@curiouslearning/assessment-survey';

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
  const closeButton = document.createElement('button');
  closeButton.id = options.closeButtonId;
  closeButton.type = 'button';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close assessment survey');

  closeButton.style.position = 'absolute';
  closeButton.style.top = '12px';
  closeButton.style.right = '12px';
  closeButton.style.width = '40px';
  closeButton.style.height = '40px';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '9999px';
  closeButton.style.background = 'rgba(0, 0, 0, 0.7)';
  closeButton.style.color = '#ffffff';
  closeButton.style.fontSize = '28px';
  closeButton.style.lineHeight = '1';
  closeButton.style.cursor = 'pointer';
  closeButton.style.zIndex = '10001';

  closeButton.addEventListener('click', options.onClose);

  return closeButton;
}