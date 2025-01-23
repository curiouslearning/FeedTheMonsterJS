import {RiveMonsterComponent} from './rive-monster-component';
import {Rive, Layout, Fit, Alignment} from '@rive-app/canvas';

// Mock Rive library to avoid actual Rive implementation during tests
jest.mock('@rive-app/canvas', () => {
  return {
    Rive: jest.fn().mockImplementation(({onLoad}) => {
      if (onLoad) onLoad();
      return {
        play: jest.fn(),
        stop: jest.fn(),
        stateMachine: {inputs: [{onStateChange: jest.fn()}]},
        animationNames: ['Idle', 'Eat Happy'],
      };
    }),
    Layout: jest.fn(),
    Fit: {Contain: 'Contain'},
    Alignment: {TopCenter: 'TopCenter'},
  };
});

describe('RiveMonsterComponent', () => {
  let canvas: HTMLCanvasElement;
  let gameCanvas: HTMLCanvasElement;
  let component: RiveMonsterComponent;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    gameCanvas = document.createElement('canvas');
    gameCanvas.width = 800;
    gameCanvas.height = 600;
    component = new RiveMonsterComponent({
      canvas,
      autoplay: true,
      fit: 'Contain',
      alignment: 'TopCenter',
      gameCanvas,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize RiveMonsterComponent with the correct properties', () => {
    expect(component).toBeDefined();
    expect(component['riveInstance']).toBeDefined();
    expect(component['props'].canvas).toBe(canvas);
    expect(component['props'].gameCanvas).toBe(gameCanvas);
    expect(component['riveInstance'].animationNames).toContain('Idle');
  });

  it('should call Rive with correct parameters on instantiation', () => {
    expect(Rive).toHaveBeenCalledWith({
      src: './assets/eggMonsterFTM.riv',
      canvas: canvas,
      autoplay: true,
      stateMachines: 'State Machine 1',
      layout: expect.any(Layout),
      onLoad: expect.any(Function),
    });
  });

  it('should call onLoad callback if provided', () => {
    const onLoadMock = jest.fn();
    new RiveMonsterComponent({
      canvas,
      autoplay: true,
      onLoad: onLoadMock,
      gameCanvas,
    });
    expect(onLoadMock).toHaveBeenCalled();
  });

  it('should call the play method of the Rive instance with the correct animation name', () => {
    component.play('Idle');
    expect(component['riveInstance'].play).toHaveBeenCalledWith('Idle');
  });

  it('should call the stop method of the Rive instance', () => {
    component.stop();
    expect(component['riveInstance'].stop).toHaveBeenCalled();
  });

  it('should set hitboxRangeX and hitboxRangeY correctly based on gameCanvas dimensions', () => {
    expect(component['hitboxRangeX'].from).toBeGreaterThan(0);
    expect(component['hitboxRangeX'].to).toBeGreaterThan(0);
    expect(component['hitboxRangeY'].from).toBeGreaterThan(0);
    expect(component['hitboxRangeY'].to).toBeGreaterThan(0);
  });

  it('should return true if the click is within the hitbox range', () => {
    const mockEvent = {clientX: 400, clientY: 200};
    canvas.getBoundingClientRect = jest
      .fn()
      .mockReturnValue({left: 0, top: 0, width: 800, height: 600});

    expect(component['hitboxRangeX'].from).toBe(330);
    expect(component['hitboxRangeX'].to).toBe(470);
    expect(component['hitboxRangeY'].from).toBe(150);
    expect(component['hitboxRangeY'].to).toBe(250);

    const isHit = component.checkHitboxDistance(mockEvent);
    expect(isHit).toBe(true);
  });

  it('should return false if the click is outside the hitbox range', () => {
    const mockEvent = {clientX: 10, clientY: 10};
    canvas.getBoundingClientRect = jest
      .fn()
      .mockReturnValue({left: 0, top: 0, width: 800, height: 600});

    const isHit = component.checkHitboxDistance(mockEvent);
    expect(isHit).toBe(false);
  });

  it('should correctly calculate onClick hit detection', () => {
    const isHit = component.onClick(400, 540); // Match the monster's center
    expect(isHit).toBe(true); // Expect a valid hit
  });
});
