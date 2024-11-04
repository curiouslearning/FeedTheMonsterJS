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

  constructor() {
    super();
  }

  onInit() {
    this.onButtonClick(({ data }) => {
      console.log({ data });
      // TODO confirm popup logic here for english language
      
    });

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
