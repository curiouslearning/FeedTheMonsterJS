import { BasePopupComponent, PopupClickEvent } from '@components/popups/base-popup/base-popup-component';
import { MapButton, RetryButtonHtml } from '@components/buttons';
import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';
import { AudioPlayer } from '@components';
import { lang } from '@common';
import { AUDIO_ARE_YOU_SURE } from '@constants';
import { ConfirmPopupComponent } from '@components/popups/confirm-popup/confirm-popup-component';

export const PAUSE_POPUP_EVENT_DATA = {
  SELECT_LEVEL: 'select-level',
  RESTART_LEVEL: 'restart-level'
}

export class PausePopupComponent extends BasePopupComponent {
  selectLevelButton?: BaseButtonComponent;
  restartLevelButton?: BaseButtonComponent;
  confirmPopup?: ConfirmPopupComponent;
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
    
    this.audioPlayer = new AudioPlayer();
  }

  handleClick(data: any) {
    if (lang === 'english') {
      const unsub = this.confirmPopup.onClose((confirmData) => {
        unsub();
        this.handleConfirmClose(confirmData, data);
      });

      if (this.clickTimeout) clearTimeout(this.clickTimeout);
      this.clickTimeout = setTimeout(() => {
        this.confirmPopup.open();
        this.audioPlayer.playAudio(AUDIO_ARE_YOU_SURE);
      }, 300);
      
    } else {
      super.handleClick(data);
    }
  }

  handleConfirmClose(confirmClickEvent: PopupClickEvent, pauseData: any) {
    if (confirmClickEvent.data) super.handleClick(pauseData);

    super.handleClick(false, 0);
  }

  destroy(): void {
    this.confirmPopup.destroy();
    super.destroy();
  }
}
