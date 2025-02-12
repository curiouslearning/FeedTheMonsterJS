import { RiveMonsterComponent } from './rive-monster-component';
import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

jest.mock('@rive-app/canvas', () => {
  return {
    Rive: jest.fn().mockImplementation(({ onLoad }) => {
      if (onLoad) onLoad();
      return {
        play: jest.fn(),
        stop: jest.fn(),
        stateMachineInputs: jest.fn().mockReturnValue([
          { name: 'backToIdle', fire: jest.fn() },
          { name: 'isStomped', fire: jest.fn() },
          { name: 'isMouthOpen', fire: jest.fn() },
          { name: 'isMouthClosed', fire: jest.fn() },
          { name: 'isChewing', fire: jest.fn() },
          { name: 'isHappy', fire: jest.fn() },
          { name: 'isSpit', fire: jest.fn() },
          { name: 'isSad', fire: jest.fn() },
        ]),
        cleanup: jest.fn(),
      };
    }),
    Layout: jest.fn(),
    Fit: { Contain: 'Contain' },
    Alignment: { Center: 'Center' },
  };
});

describe('RiveMonsterComponent', () => {
  let canvas, gameCanvas, component;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    gameCanvas = document.createElement('canvas');
    gameCanvas.width = 800;
    gameCanvas.height = 600;
    component = new RiveMonsterComponent({
      canvas,
      autoplay: true,
      fit: 'Contain',
      alignment: 'Center',
      gameCanvas,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize RiveMonsterComponent with correct properties', () => {
    expect(component).toBeDefined();
    expect(component['riveInstance']).toBeDefined();
    expect(component['props'].canvas).toBe(canvas);
    expect(component['props'].gameCanvas).toBe(gameCanvas);
  });

  it('should call Rive with correct parameters on instantiation', () => {
    expect(Rive).toHaveBeenCalledWith({
      src: './assets/eggMonsterFTM.riv',
      canvas: canvas,
      autoplay: true,
      stateMachines: ['State Machine 1'],
      layout: expect.any(Layout),
      onLoad: expect.any(Function),
      useOffscreenRenderer: true,
    });
  });

  it('should call onLoad callback if provided', () => {
    const onLoadMock = jest.fn();
    new RiveMonsterComponent({ canvas, autoplay: true, onLoad: onLoadMock, gameCanvas });
    expect(onLoadMock).toHaveBeenCalled();
  });

  it('should play the specified animation', () => {
    component.play('Idle');
    expect(component['riveInstance'].play).toHaveBeenCalledWith('Idle');
  });

  it('should stop the animation', () => {
    component.stop();
    expect(component['riveInstance'].stop).toHaveBeenCalled();
  });

  it('should return true if the click is within the hitbox range', () => {
    const mockEvent = { clientX: 400, clientY: 200 };
    canvas.getBoundingClientRect = jest.fn().mockReturnValue({ left: 0, top: 0, width: 800, height: 600 });

    const isHit = component.checkHitboxDistance(mockEvent);
    expect(isHit).toBe(true);
  });

  it('should return false if the click is outside the hitbox range', () => {
    const mockEvent = { clientX: 10, clientY: 10 };
    canvas.getBoundingClientRect = jest.fn().mockReturnValue({ left: 0, top: 0, width: 800, height: 600 });

    const isHit = component.checkHitboxDistance(mockEvent);
    expect(isHit).toBe(false);
  });

  it('should correctly change phase and reload animation', () => {
    component.changePhase(1);
    expect(component['riveInstance']).toBeDefined();
    expect(Rive).toHaveBeenCalledWith({
      src: './assets/blue_egg.riv',
      canvas: component['props'].canvas,
      autoplay: component['props'].autoplay,
      stateMachines: ['State Machine 1'],
      layout: expect.any(Layout),
      onLoad: expect.any(Function),
      useOffscreenRenderer: true,
    });
  });

  it('should not change to an invalid phase index', () => {
    console.warn = jest.fn();
    component.changePhase(5);
    expect(console.warn).toHaveBeenCalledWith('Invalid phase index: 5');
  });

  it('should trigger state machine input if found', () => {
    const fireMock = jest.fn();
    jest.spyOn(component, 'getInputs').mockReturnValue([{ name: 'isHappy', fire: fireMock }]);

    component.triggerInput('isHappy');
    expect(fireMock).toHaveBeenCalled();
  });

  it('should log a warning if input is not found', () => {
    console.warn = jest.fn();
    component.triggerInput('nonExistentInput');
    expect(console.warn).toHaveBeenCalledWith('Input nonExistentInput not found.');
  });

  it('should dispose of Rive instance', () => {
    component.dispose();
    expect(component['riveInstance'].cleanup).toHaveBeenCalled();
    expect(component['riveInstance']).toBeNull();
  });
});
