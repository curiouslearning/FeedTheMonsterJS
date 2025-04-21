import { BasePopupComponent, PopupClickEvent } from '@components/popups/base-popup/base-popup-component';
import { MapButton, RetryButtonHtml } from '@components/buttons';
import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';
import { AudioPlayer } from '@components';
import { lang } from '@common';
import { AUDIO_ARE_YOU_SURE } from '@constants';
import { ConfirmPopupComponent } from '@components/popups/confirm-popup/confirm-popup-component';
import { debounce } from 'lodash-es';

export const PAUSE_POPUP_EVENT_DATA = {
  SELECT_LEVEL: 'select-level',
  RESTART_LEVEL: 'restart-level'
}

export class PausePopupComponent extends BasePopupComponent {
  selectLevelButton?: BaseButtonComponent;
  restartLevelButton?: BaseButtonComponent;
  confirmPopup?: ConfirmPopupComponent;
  openConfirm = () => {};
  protected audioPlayer = new AudioPlayer();
  private enableTimeoutId?: number; // Timeout ID to avoid memory leaks
  protected override id = 'pause-popup';
  private isProcessingClick = false; // Flag to track if we're currently processing a click

  onInit() {
    const targetId = this.contentContainerId;

    // Initialize buttons and attach event listeners
    this.selectLevelButton = new MapButton({ id: 'map-button', className: 'me-4', targetId });
    if (this.selectLevelButton) {
      this.selectLevelButton.onClick(() => this.handleClick('select-level'));
    }

    this.restartLevelButton = new RetryButtonHtml({ targetId });
    if (this.restartLevelButton) {
      this.restartLevelButton.onClick(() => this.handleClick('restart-level'));
    }

    this.confirmPopup = new ConfirmPopupComponent({ hideClose: true });

    this.openConfirm = debounce(() => {
      this.confirmPopup.open();
      this.audioPlayer.playAudio(AUDIO_ARE_YOU_SURE);
    }, 300);
  }

  handleClick(data: any) {
    // If we're already processing a click, ignore this one
    if (this.isProcessingClick) {
      return;
    }

    // Set flag to prevent multiple clicks
    this.isProcessingClick = true;
    
    // Disable all buttons to prevent double clicks
    this.disableButtons();

    if (lang === 'english') {
      const unsub = this.confirmPopup.onClose((confirmData) => {
        unsub();
        this.handleConfirmClose(confirmData, data);
        this.scheduleEnableButtons(800); // Schedule re-enable after 2 seconds
        // Reset processing flag when confirmation is closed
        this.isProcessingClick = false;
      });

      this.openConfirm();
      
    } else {
      super.handleClick(data);
      this.scheduleEnableButtons(800); // Schedule re-enable after 2 seconds
      
      // Reset processing flag after a delay for non-English users
      setTimeout(() => {
        this.isProcessingClick = false;
      }, 800);
    }
  }

  /**
   * Handles confirmation popup close.
   * @param confirmClickEvent - The event data returned when the popup closes.
   * @param pauseData - The pause data (select-level or restart-level).
   */
  handleConfirmClose(confirmClickEvent: PopupClickEvent, pauseData: any) {
    if (confirmClickEvent.data) {
      // If the confirmation was "yes", call the base handler
      super.handleClick(pauseData);
    }

    // If the confirmation was "no", call the base handler with false data
    super.handleClick(false, 0);
  }

  /**
   * Disables both select and restart buttons.
   */
  disableButtons() {
    this.selectLevelButton?.setDisabled(true);
    this.restartLevelButton?.setDisabled(true);
    // Also disable the close button if it exists
    this.closeButton?.setDisabled(true);
  }

  /**
   * Enables both select and restart buttons.
   */
  enableButtons() {
    this.selectLevelButton?.setDisabled(false);
    this.restartLevelButton?.setDisabled(false);
    // Also enable the close button if it exists
    this.closeButton?.setDisabled(false);
  }

  /**
   * Schedule enabling of the buttons after a delay.
   * Prevents multiple timeouts from being active at the same time.
   * 
   * @param delay - Delay in milliseconds before enabling the buttons.
   */
  scheduleEnableButtons(delay: number) {
    // Clear any existing timeout to prevent multiple re-enable timeouts
    if (this.enableTimeoutId) {
      clearTimeout(this.enableTimeoutId);
    }

    // Schedule a new timeout and store the timeout ID
    this.enableTimeoutId = window.setTimeout(() => {
      this.enableButtons();
      this.enableTimeoutId = undefined; // Clear the reference after execution
    }, delay);
  }

  /**
   * Called when the component is destroyed.
   * Ensures no pending timeouts are left.
   */
  destroy(): void {
    if (this.enableTimeoutId) {
      clearTimeout(this.enableTimeoutId);
    }
    this.confirmPopup?.destroy();
    super.destroy();
  }
}
