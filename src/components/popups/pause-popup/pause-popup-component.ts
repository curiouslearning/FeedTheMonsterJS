import { BasePopupComponent } from "../base-popup/base-popup-component";
import { MapButton, RetryButtonHtml } from '@components/buttons';
import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';
import './pause-popup-component.scss';

export const PAUSE_POPUP_EVENT_DATA = {
  SELECT_LEVEL: 'select-level',
  RESTART_LEVEL: 'restart-level'
}

export class PausePopupComponent extends BasePopupComponent {
  selectLevelButton?: BaseButtonComponent;
  restartLevelButton?: BaseButtonComponent;

  protected override id = 'pause-popup';

  onInit() {
    const targetId = this.contentContainerId;
    // TODO integrate buttons
    this.selectLevelButton = new MapButton({ targetId });
    this.selectLevelButton.onClick(() => this.handleClick('select-level'));
    this.restartLevelButton = new RetryButtonHtml({ targetId });
    this.restartLevelButton.onClick(() => this.handleClick('restart-level'));
  }

  handleClick(data: string) {
    setTimeout(() => {
      this.close({ data });
    }, 300);
  }
}
