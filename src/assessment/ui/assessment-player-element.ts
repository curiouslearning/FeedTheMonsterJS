import '@curiouslearning/assessment-survey/register';
import './assessment-player-element.scss';
import {
  AnalyticsConfig,
  AssessmentCompletedPayload,
  AssessmentSurveyPlayerElement
} from '@curiouslearning/assessment-survey';
import {
  ASSESSMENT_SKIP_BTN,
  CANCEL_BTN_IMG,
  POPUP_BG_IMG,
  YES_BTN_IMG
} from '@constants';
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

export interface AssessmentExitOverlayOptions {
  overlayId: string;
  onCancel?: () => void;
  onConfirm?: () => void;
}

export interface AssessmentExitOverlayHandle {
  element: HTMLDivElement;
  removeEventListeners: () => void;
}

export function createAssessmentPlayerElement(options: AssessmentPlayerElementOptions): AssessmentSurveyPlayerElement {
  const playerElement = document.createElement(options.playerTag) as AssessmentSurveyPlayerElement;
  const assessmentBasePath = getAssessmentBasePath();

  playerElement.style.display = 'block';
  playerElement.style.width = '100%';
  playerElement.style.height = '100%';
  playerElement.style.visibility = 'hidden';

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
      playerElement.style.visibility = 'visible';
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

export function createAssessmentExitOverlay(
  options: AssessmentExitOverlayOptions
): AssessmentExitOverlayHandle {
  const overlay = document.createElement('div');
  const popupWrapper = document.createElement('div');
  const popupImage = document.createElement('img');
  const content = document.createElement('div');
  const label = document.createElement('div');
  const buttonContainer = document.createElement('div');
  const cancelButton = document.createElement('button');
  const yesButton = document.createElement('button');
  const cancelButtonImage = document.createElement('img');
  const yesButtonImage = document.createElement('img');

  overlay.id = options.overlayId;
  overlay.style.display = 'none';
  overlay.style.position = 'absolute';
  overlay.style.inset = '0';
  overlay.style.zIndex = '10002';
  overlay.style.background = 'rgba(0, 0, 0, 0.55)';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.classList.add('assessment-exit-overlay');

  popupWrapper.style.position = 'relative';
  popupWrapper.style.display = 'flex';
  popupWrapper.style.alignItems = 'center';
  popupWrapper.style.justifyContent = 'center';
  popupWrapper.style.maxHeight = '90vh';
  popupWrapper.classList.add('assessment-exit-popup');

  popupImage.src = POPUP_BG_IMG;
  popupImage.alt = 'Exit overlay background';
  popupImage.style.display = 'block';
  popupImage.style.width = '100%';
  popupImage.style.height = 'auto';
  popupImage.style.objectFit = 'contain';

  content.style.position = 'absolute';
  content.style.inset = '0';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.alignItems = 'center';
  content.style.justifyContent = 'center';
  content.style.gap = '24px';
  content.style.padding = '18% 14% 16%';
  content.classList.add('assessment-exit-content');

  label.textContent = 'Are you sure?';
  label.style.color = '#ffffff';
  label.style.fontFamily = 'Arial';
  label.style.fontWeight = '700';
  label.style.textAlign = 'center';
  label.classList.add('assessment-exit-label');

  buttonContainer.id = `${options.overlayId}-button-container`;
  buttonContainer.style.display = 'flex';
  buttonContainer.style.alignItems = 'center';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.width = '85%';
  buttonContainer.classList.add('assessment-exit-buttons');

  cancelButton.type = 'button';
  cancelButton.setAttribute('aria-label', 'Cancel exit');
  cancelButton.style.display = 'flex';
  cancelButton.style.alignItems = 'center';
  cancelButton.style.justifyContent = 'center';
  cancelButton.style.background = 'transparent';
  cancelButton.style.border = 'none';
  cancelButton.style.padding = '0';
  cancelButton.style.cursor = 'pointer';

  cancelButtonImage.src = CANCEL_BTN_IMG;
  cancelButtonImage.alt = 'Cancel';
  cancelButtonImage.style.display = 'block';
  cancelButtonImage.style.height = 'auto';
  cancelButtonImage.classList.add('assessment-exit-button-image');

  yesButton.type = 'button';
  yesButton.setAttribute('aria-label', 'Confirm exit');
  yesButton.style.display = 'flex';
  yesButton.style.alignItems = 'center';
  yesButton.style.justifyContent = 'center';
  yesButton.style.background = 'transparent';
  yesButton.style.border = 'none';
  yesButton.style.padding = '0';
  yesButton.style.cursor = 'pointer';

  yesButtonImage.src = YES_BTN_IMG;
  yesButtonImage.alt = 'Yes';
  yesButtonImage.style.display = 'block';
  yesButtonImage.style.height = 'auto';
  yesButtonImage.classList.add('assessment-exit-button-image');

  popupWrapper.appendChild(popupImage);
  popupWrapper.appendChild(content);
  content.appendChild(label);
  content.appendChild(buttonContainer);
  cancelButton.appendChild(cancelButtonImage);
  yesButton.appendChild(yesButtonImage);
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(yesButton);
  overlay.appendChild(popupWrapper);

  const handleCancelClick = () => {
    options.onCancel?.();
  };

  const handleConfirmClick = () => {
    options.onConfirm?.();
  };

  cancelButton.addEventListener('click', handleCancelClick);
  yesButton.addEventListener('click', handleConfirmClick);

  return {
    element: overlay,
    removeEventListeners: () => {
      cancelButton.removeEventListener('click', handleCancelClick);
      yesButton.removeEventListener('click', handleConfirmClick);
    },
  };
}
