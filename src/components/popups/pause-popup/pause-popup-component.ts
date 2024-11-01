import { BasePopupComponent } from "../base-popup/base-popup-component";

export class PausePopupComponent extends BasePopupComponent {
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
}
