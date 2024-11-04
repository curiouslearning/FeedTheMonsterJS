import { BaseButtonComponent } from '@components/buttons/base-button/base-button-component';
import { BasePopupComponent } from "../base-popup/base-popup-component";

export class PausePopupComponent extends BasePopupComponent {
  selectLevelButton?: BaseButtonComponent;
  retartLevelButton?: BaseButtonComponent;

  protected override id = 'pause-popup';
  protected override template = `
    <div class="d-flex w-100 h-100">
      <div data-click="select-level">select level</div>
      <div data-click="restart-level">restart level</div>
    </div>
  `;

  onInit() {
    this.onButtonClick(({ data }) => {
      // TODO confirm popup logic here for english language
    });

    // TODO integrate buttons
    this.selectLevelButton = new BaseButtonComponent({
      id: 'popup-select-level',
      targetId: this.id
    });
    this.retartLevelButton = new BaseButtonComponent({
      id: 'popup-reset-level',
      targetId: this.id
    });
  }
}
