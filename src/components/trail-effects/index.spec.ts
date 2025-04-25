import TrailEffectsHandler from './index';


// 🔧 Mock Touch and TouchEvent for jsdom
global.Touch = class {
  identifier: number;
  target: EventTarget;
  clientX: number;
  clientY: number;

  constructor({ identifier, target, clientX, clientY }) {
    this.identifier = identifier;
    this.target = target;
    this.clientX = clientX;
    this.clientY = clientY;
  }
} as any;

global.TouchEvent = class extends UIEvent {
  touches: Touch[];

  constructor(type: string, touchInit: any = {}) {
    super(type, touchInit);
    this.touches = touchInit.touches || [];
  }
} as any;

describe('TrailEffectsHandler', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
  });

  afterEach(() => {
    canvas.remove();
    jest.restoreAllMocks(); // Clear all spies
  });

  it('should call handleCursorMouseUp on mouseup event', () => {
    const spy = jest.spyOn(TrailEffectsHandler.prototype, 'handleCursorMouseUp');
    const handler = new TrailEffectsHandler(canvas);

    canvas.dispatchEvent(new MouseEvent('mouseup'));

    expect(spy).toHaveBeenCalled();

    handler.dispose();
  });

  it('should call handleCursorMouseDown on mousedown event', () => {
    const spy = jest.spyOn(TrailEffectsHandler.prototype, 'handleCursorMouseDown');
    const handler = new TrailEffectsHandler(canvas);

    canvas.dispatchEvent(new MouseEvent('mousedown'));

    expect(spy).toHaveBeenCalled();

    handler.dispose();
  });

  it('should call handleCursorMouseMove on mousemove event', () => {
    const spy = jest.spyOn(TrailEffectsHandler.prototype, 'handleCursorMouseMove');
    const handler = new TrailEffectsHandler(canvas);

    canvas.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 100,
      clientY: 150
    }));

    expect(spy).toHaveBeenCalled();

    handler.dispose();
  });

  it('should call handleCursorTouchStart on touchstart event', () => {
    const spy = jest.spyOn(TrailEffectsHandler.prototype, 'handleCursorTouchStart');
    const handler = new TrailEffectsHandler(canvas);

    const touch = new Touch({
      identifier: 1,
      target: canvas,
      clientX: 50,
      clientY: 60
    });

    canvas.dispatchEvent(new TouchEvent('touchstart', {
      touches: [touch]
    }));

    expect(spy).toHaveBeenCalled();

    handler.dispose();
  });

  it('should call handleCursorTouchMove on touchmove event', () => {
    const spy = jest.spyOn(TrailEffectsHandler.prototype, 'handleCursorTouchMove');
    const handler = new TrailEffectsHandler(canvas);

    const touch = new Touch({
      identifier: 1,
      target: canvas,
      clientX: 70,
      clientY: 80
    });

    canvas.dispatchEvent(new TouchEvent('touchmove', {
      touches: [touch]
    }));

    expect(spy).toHaveBeenCalled();

    handler.dispose();
  });

  it('should call handleCursorTouchEnd on touchend event', () => {
    const spy = jest.spyOn(TrailEffectsHandler.prototype, 'handleCursorTouchEnd');
    const handler = new TrailEffectsHandler(canvas);

    canvas.dispatchEvent(new TouchEvent('touchend'));

    expect(spy).toHaveBeenCalled();

    handler.dispose();
  });

  it('should call handleCursorMouseClick on click event', () => {
    const spy = jest.spyOn(TrailEffectsHandler.prototype, 'handleCursorMouseClick');
    const handler = new TrailEffectsHandler(canvas);

    canvas.dispatchEvent(new MouseEvent('click'));

    expect(spy).toHaveBeenCalled();

    handler.dispose();
  });
});