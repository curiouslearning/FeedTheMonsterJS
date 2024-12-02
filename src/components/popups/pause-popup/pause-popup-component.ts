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
  protected clickTimeout?;
  protected override id = 'pause-popup';

  onInit() {
    const targetId = this.contentContainerId;
    // TODO integrate buttons
    this.selectLevelButton = new MapButton({ id: 'map-button', className: 'me-4', targetId });
    this.selectLevelButton.onClick(() => this.handleClick('select-level'));
    this.restartLevelButton = new RetryButtonHtml({ targetId });
    this.restartLevelButton.onClick(() => this.handleClick('restart-level'));
    this.confirmPopup = new ConfirmPopupComponent({
      hideClose: true
    });

    this.openConfirm = debounce(() => {
      this.confirmPopup.open();
      this.audioPlayer.playAudio(AUDIO_ARE_YOU_SURE);
    }, 300);
  }

  handleClick(data: any) {
    if (lang === 'english') {
      const unsub = this.confirmPopup.onClose((confirmData) => {
        unsub();
        this.handleConfirmClose(confirmData, data);
      });

      this.openConfirm();
      
    } else {
      super.handleClick(data);
    }
  }

  /**
   * 
   * @param confirmClickEvent Function that handles closing of the confirmation popup.
   * @param pauseData 
   */
  handleConfirmClose(confirmClickEvent: PopupClickEvent, pauseData: any) {
    // if confirmation was "yes", we pass pause data to base click handler (pause data = level-reset or level-select)
    if (confirmClickEvent.data) super.handleClick(pauseData);

    // if confimation was "no", we pass false with 0 timeout to base click handler.
    super.handleClick(false, 0);
  }

  destroy(): void {
    this.confirmPopup.destroy();
    super.destroy();
  }
}
