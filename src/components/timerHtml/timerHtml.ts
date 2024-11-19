import { BaseHTML, BaseHtmlOptions } from '../baseHTML/base-html';
import { TIMER_EMPTY, ROTATING_CLOCK, TIMER_FULL } from "@constants";
import './timerHtml.scss';

export const TIMER_HTML_SELECTORS = {
  root: '.gameplay-wrapper', // Class name of the game scene div
};

export const TIMER_HTML_LAYOUT = (id: string) => `
  <div id="${id}" class="timer-ticking-wrapper">
    <img id="timer-empty" class="timer-empty" src="${TIMER_EMPTY}" alt="Timer Empty" />
    <img id="rotating-clock" class="rotating-clock" src="${ROTATING_CLOCK}" alt="Rotating Clock" />
    <div id="timer-full-container" class="timer-full-container">
      <img id="timer-full" class="timer-full" src="${TIMER_FULL}" alt="Timer Full" />
    </div>
  </div>
`;

export default class TimerHTMLComponent extends BaseHTML {
  constructor(
    id: string = 'timer-html-component',
    options: BaseHtmlOptions = { selectors: TIMER_HTML_SELECTORS }
  ) {
    super(options, id, TIMER_HTML_LAYOUT);
    // Automatically render the component on instantiation
    this.render();

  }

  destroy() {
    super.destroy(); // Ensures the component is removed from the DOM
  }
}
