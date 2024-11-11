import {
  BAR_EMPTY,
  BAR_FULL,
  LEVEL_INDICATOR
} from "@constants";

const DEFAULT_SELECTORS = {
  root: '.game-scene',
  bars: '.bar-level'
};

export const LEVEL_FIELD_LAYOUT = (id: string) => {
  return (`
    <div id="${id}" class="level_content-wrapper">
      <div class="level-field">
        <img class="level-background" src="${LEVEL_INDICATOR}"/>
        <div class="level-bars">
          <img class="bar-level" src="${BAR_EMPTY}" />
          <img class="bar-level" src="${BAR_EMPTY}" />
          <img class="bar-level" src="${BAR_EMPTY}" />
          <img class="bar-level" src="${BAR_EMPTY}" />
          <img class="bar-level" src="${BAR_EMPTY}" />
        </div>
      </div>
    </div>
  `);
}

export interface LevelFieldOptions {
  selectors: {
    root: string;
    bars: string;
  }
}

export class BaseLevelFieldComponent {
  private isRendered: boolean = false;
  private id: string;

  constructor(
    protected options: LevelFieldOptions = { selectors: DEFAULT_SELECTORS },
    id: string
  ) {
    this.id = id;
    this._init();
  }

  private _init() {
    this.render();
  }

  private render() {
    if (this.isRendered) return;
    const levelFieldTemplate = LEVEL_FIELD_LAYOUT(this.id);
    const { root } = this.options.selectors;
    const rootEl = document.querySelector(root);
    rootEl.insertAdjacentHTML('beforeend', levelFieldTemplate);
    this.isRendered = true;
  }

  private updateBar(index: number) {
    const barIndex = index - 1;
    if (barIndex < 0) return;
    const { bars } = this.options.selectors;
    const barsEl = document.querySelectorAll(bars) as NodeListOf<HTMLImageElement>;

    if (barsEl.length && barsEl[barIndex]) {
      barsEl[barIndex].src = BAR_FULL;
    }
  }

  private deleteLevelField() {
    document.getElementById(this.id).remove();
    this.isRendered = false;
  }

}