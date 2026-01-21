import {
  BaseHtmlOptions,
  BaseHTML
} from '../baseHTML/base-html';
import {
  LEVEL_CONTAINER,
  STAR_FILLED,
  STAR_EMPTY
} from "@constants";
import './level-field-component.scss';

export const DEFAULT_SELECTORS = {
  root: '.game-control', //Class name of game scene div.
  bars: '.bar-level'
};


export const LEVEL_FIELD_LAYOUT = (id: string) => {
  return (`
    <div id="${id}" class="level-content-bg">
      <div class="level_content-wrapper"
      style="background-image: url(${LEVEL_CONTAINER});">
        <div class="bar-level-wrapper">
           ${Array(5).fill(`<img class="bar-level" src="${STAR_EMPTY}" alt="bar" />`).join('')}
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
      barsEl[barIndex].src = STAR_FILLED;
    }
  }
}