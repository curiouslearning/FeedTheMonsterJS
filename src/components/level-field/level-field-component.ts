import {
  BaseHtmlOptions,
  BaseHTML
} from '@components/baseHTML/BaseHTML';
import {
  BAR_EMPTY,
  BAR_FULL,
  LEVEL_INDICATOR
} from "@constants";
import './level-field-component.scss';

export const DEFAULT_SELECTORS = {
  root: '.game-scene', //Class name of game scene div.
  bars: '.bar-level'
};


export const LEVEL_FIELD_LAYOUT = (id: string) => {
  return (`
    <div id="${id}" class="level_content-wrapper">
      <div class="level-field">
        <img class="level-background" src="${LEVEL_INDICATOR}"/>
        <div class="bar-level-wrapper">
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

export default class LevelFieldComponent extends BaseHTML {

  constructor(
    id: string = 'level-field',
    options: BaseHtmlOptions = { selectors: DEFAULT_SELECTORS }
  ){
    super(
      options,
      id,
      LEVEL_FIELD_LAYOUT
    );
  }

  updateLevel(index: number):void {
    const barIndex = index - 1;
    if (barIndex < 0) return;

    const { bars } = this.options.selectors;
    const barsEl = this.getElements(bars);

    if (barsEl.length && barsEl[barIndex]) {
      barsEl[barIndex].src = BAR_FULL;
    }
  }
}