import {
  CLICK,
  MOUSEDOWN,
  MOUSEMOVE,
  MOUSEUP,
  TOUCHEND,
  TOUCHMOVE,
  TOUCHSTART,
} from "@common";

export default class CursorComponent {
  eventHandler: HTMLElement;
  hasEventsHooked: boolean = false;

  constructor(targetHTML: HTMLElement) {
    this.eventHandler = targetHTML;
    // Bind all event handlers
    this.handleCursorMouseUp = this.handleCursorMouseUp.bind(this);
    this.handleCursorMouseMove = this.handleCursorMouseMove.bind(this);
    this.handleCursorMouseDown = this.handleCursorMouseDown.bind(this);
    this.handleCursorTouchStart = this.handleCursorTouchStart.bind(this);
    this.handleCursorTouchMove = this.handleCursorTouchMove.bind(this);
    this.handleCursorTouchEnd = this.handleCursorTouchEnd.bind(this);
    this.handleCursorMouseClick = this.handleCursorMouseClick.bind(this);
  }

  /**
 * Override this method in a subclass to handle the mouse up event.
 * This gets triggered when the MOUSEUP event is fired on `eventHandler`.
 */
  public handleCursorMouseUp(event) {}

  /**
 * Override this method in a subclass to handle the mouse up event.
 * This gets triggered when the MOUSEMOVE event is fired on `eventHandler`.
 */

  public handleCursorMouseMove(event) {}

  /**
 * Override this method in a subclass to handle the mouse move event.
 * This gets triggered when the MOUSEDOWN event is fired on `eventHandler`.
 */
  public handleCursorMouseDown(event) {}

  /**
* Override this method in a subclass to handle the touch start event.
* This gets triggered when the TOUCHSTART event is fired on `eventHandler`.
*/
  public handleCursorTouchStart(event) {}

  /**
* Override this method in a subclass to handle the touch move event.
* This gets triggered when the TOUCHMOVE event is fired on `eventHandler`.
*/
  public handleCursorTouchMove(event) {}

  /**
* Override this method in a subclass to handle the touch end event.
* This gets triggered when the TOUCHEND event is fired on `eventHandler`.
*/
  public handleCursorTouchEnd(event) {}

  /**
* Override this method in a subclass to handle the mouse click event.
* This gets triggered when the MOUSECLICK event is fired on `eventHandler`.
*/
  public handleCursorMouseClick(event) {}

  /**
   * When using addEventListeners, you need to manually initialize,
   *  after you have defined the properties you need for each event methods.
   */
  public addEventListeners() {
    this.eventHandler.addEventListener(MOUSEUP, this.handleCursorMouseUp, false);
    this.eventHandler.addEventListener(MOUSEMOVE, this.handleCursorMouseMove, false);
    this.eventHandler.addEventListener(MOUSEDOWN, this.handleCursorMouseDown, false);
    this.eventHandler.addEventListener(TOUCHSTART, this.handleCursorTouchStart, false);
    this.eventHandler.addEventListener(TOUCHMOVE, this.handleCursorTouchMove, false);
    this.eventHandler.addEventListener(TOUCHEND, this.handleCursorTouchEnd, false);
    this.eventHandler.addEventListener(CLICK, this.handleCursorMouseClick, false);
    this.hasEventsHooked = true;
  }

  public removeEventListeners () {
    if (this.hasEventsHooked) {
      this.eventHandler.removeEventListener(MOUSEUP, this.handleCursorMouseUp, false);
      this.eventHandler.removeEventListener(MOUSEMOVE, this.handleCursorMouseMove, false);
      this.eventHandler.removeEventListener(MOUSEDOWN, this.handleCursorMouseDown, false);
      this.eventHandler.removeEventListener(TOUCHSTART, this.handleCursorTouchStart, false);
      this.eventHandler.removeEventListener(TOUCHMOVE, this.handleCursorTouchMove, false);
      this.eventHandler.removeEventListener(TOUCHEND, this.handleCursorTouchEnd, false);
      this.eventHandler.removeEventListener(CLICK, this.handleCursorMouseClick, false);
      this.hasEventsHooked = false;
    }
  }

}