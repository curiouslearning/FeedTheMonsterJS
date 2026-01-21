import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';
import { MONSTER_PHASES } from '@constants';
import { RiveMonsterComponent } from './rive-monster-component';
import gameStateService from '@gameStateService';

jest.mock('@gameSettingsService', () => ({
  __esModule: true,
  default: {
    getCanvasSizeValues: jest.fn(),
    getRiveCanvasValue: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    EVENTS: {
      GAME_TRAIL_EFFECT_TOGGLE_EVENT: 'GAME_TRAIL_EFFECT_TOGGLE_EVENT',
    },
    getDevicePixelRatioValue: () => 2
  }
}));

jest.mock('@rive-app/canvas', () => {
  return {
    RuntimeLoader: {
      setWasmUrl: jest.fn(),
    },
    Rive: jest.fn().mockImplementation(({ onLoad, stateMachines }) => {
      const instance = {
        __esModule: true,
        play: jest.fn(),
        stop: jest.fn(),
        on: jest.fn(),
        stateMachineInputs: jest.fn().mockImplementation((name) => {
          if (stateMachines) {
            return [
              { name: 'backToIdle', fire: jest.fn() },
              { name: 'isStomped', fire: jest.fn() },
              { name: 'isMouthOpen', fire: jest.fn() },
              { name: 'isMouthClosed', fire: jest.fn() },
              { name: 'isChewing', fire: jest.fn() },
              { name: 'isHappy', fire: jest.fn() },
              { name: 'isSpit', fire: jest.fn() },
              { name: 'isSad', fire: jest.fn() }
            ];
          }
          return undefined;
        }),
        cleanup: jest.fn(),
        cleanupInstances: jest.fn()
      };

      if (onLoad && stateMachines) {
        setTimeout(() => onLoad(), 0);
      }

      return instance;
    }),
    Layout: jest.fn().mockImplementation((config) => ({
      fit: 'Contain',
      alignment: 'Center'
    })),
    Fit: { Contain: 'Contain' },
    Alignment: { Center: 'Center' },
    EventType: { RiveEvent: 'RiveEvent' }
  };
});

jest.mock('@gameStateService', () => ({
  __esModule: true,
  default: {
    saveHitBoxRanges: jest.fn()
  }
}));

describe('RiveMonsterComponent', () => {
  let canvas, gameCanvas, component;

  beforeEach(() => {
    jest.useFakeTimers();

    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1,
      configurable: true
    });

    jest.spyOn(console, 'warn');

    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        top: '0px'
      }),
      configurable: true
    });

    gameCanvas = document.createElement('canvas');
    gameCanvas.width = 800;
    gameCanvas.height = 600;

    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      }),
      configurable: true
    });

    component = new RiveMonsterComponent({
      canvas,
      autoplay: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should initialize RiveMonsterComponent with correct properties', () => {
    expect(component).toBeDefined();
    expect(component['riveInstance']).toBeDefined();
    expect(component['props'].canvas).toBe(canvas);
  });

  it('should call Rive with correct parameters on instantiation', () => {
    expect(Rive).toHaveBeenCalledWith({
      src: MONSTER_PHASES[0],
      canvas,
      autoplay: true,
      layout: {
        fit: 'Contain',
        alignment: 'Center'
      },
      stateMachines: ['State Machine 1'],
      onLoad: expect.any(Function),
      useOffscreenRenderer: true,
    });
  });

  it('should call onLoad callback if provided', () => {
    const onLoadMock = jest.fn();
    new RiveMonsterComponent({
      canvas,
      autoplay: true,
      onLoad: onLoadMock
    });

    jest.runAllTimers();
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
    const riveInstance = component['riveInstance'];
    component.dispose();

    expect(riveInstance.cleanup).toHaveBeenCalled();
    expect(component['riveInstance']).toBeNull();
  });

  it('should return empty array for getInputs when in evolution mode', () => {
    const evolutionComponent = new RiveMonsterComponent({
      canvas,
      autoplay: true,
      isEvolving: true
    });

    const inputs = evolutionComponent.getInputs();
    expect(inputs).toEqual([]);
  });

  it('should return state machine inputs when not in evolution mode', () => {
    const inputs = component.getInputs();
    expect(inputs).toEqual([
      { name: 'backToIdle', fire: expect.any(Function) },
      { name: 'isStomped', fire: expect.any(Function) },
      { name: 'isMouthOpen', fire: expect.any(Function) },
      { name: 'isMouthClosed', fire: expect.any(Function) },
      { name: 'isChewing', fire: expect.any(Function) },
      { name: 'isHappy', fire: expect.any(Function) },
      { name: 'isSpit', fire: expect.any(Function) },
      { name: 'isSad', fire: expect.any(Function) },
    ]);
  });

  it('should cleanup previous instance when evolving', () => {
    const previousMonster = new RiveMonsterComponent({
      canvas,
      autoplay: true,
      isEvolving: true
    });
    

    const initialInstance = previousMonster['riveInstance'];
    previousMonster.dispose();
    const evolutionComponent = new RiveMonsterComponent({
      canvas,
      autoplay: true,
      isEvolving: true
    });

    expect(initialInstance.cleanup).toHaveBeenCalled();
    expect(evolutionComponent['riveInstance']).toBeDefined();
    expect(evolutionComponent['riveInstance']).not.toBe(initialInstance);
  });
});
