import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';
import { MONSTER_PHASES } from '@constants';
import { RiveMonsterComponent } from './rive-monster-component';

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
    Rive: jest.fn().mockImplementation(({ onLoad, stateMachines }) => {
      const instance = {
        __esModule: true,
        play: jest.fn(),
        stop: jest.fn(),
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
    Alignment: { Center: 'Center' }
  };
});

describe('RiveMonsterComponent', () => {
  let canvas, gameCanvas, component;

  beforeEach(() => {
    // Enable fake timers
    jest.useFakeTimers();
    
    // Mock window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1,
      configurable: true
    });
    
    // Mock console.warn
    jest.spyOn(console, 'warn');
    
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Mock getComputedStyle for moveCanvasUpOrDown
    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        top: '0px'
      }),
      configurable: true
    });
    
    gameCanvas = document.createElement('canvas');
    gameCanvas.width = 800;
    gameCanvas.height = 600;

    // Set up canvas style for getBoundingClientRect
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
      autoplay: true,
      gameCanvas
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
    expect(component['props'].gameCanvas).toBe(gameCanvas);
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
      useOffscreenRenderer: true
    });
  });

  it('should call onLoad callback if provided', () => {
    const onLoadMock = jest.fn();
    new RiveMonsterComponent({
      canvas,
      autoplay: true,
      onLoad: onLoadMock,
      gameCanvas
    });
    
    // Since onLoad is called in a setTimeout, we need to wait for it
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

  it('should return true if the click is within the hitbox range', () => {
    // Calculate expected hitbox center and range based on canvas dimensions
    const scale = 2; // We mocked devicePixelRatio to 2
    const monsterCenterX = (canvas.width / scale) / 2; // 400
    const monsterCenterY = (canvas.height / scale) / 2; // 300
    const rangeFactorX = 55;
    const rangeFactorY = 100;
    
    // Calculate a point that should be within the hitbox
    // The hitbox is centered horizontally and positioned in the lower part vertically
    const mockEvent = {
      clientX: monsterCenterX, // Center X
      clientY: monsterCenterY + rangeFactorY // Below center, within range
    };
    
    const isHit = component.checkHitboxDistance(mockEvent);
    expect(isHit).toBe(true);
  });

  it('should return false if the click is outside the hitbox range', () => {
    // Calculate expected hitbox center and range based on canvas dimensions
    const scale = 1; // We mocked devicePixelRatio to 1
    const monsterCenterX = (canvas.width / scale) / 2; // 400
    const monsterCenterY = (canvas.height / scale) / 2; // 300
    const rangeFactorX = 55;
    
    // Use a point that's definitely outside the hitbox (far left corner)
    const mockEvent = {
      clientX: monsterCenterX - rangeFactorX - 10, // Just outside the left boundary
      clientY: 10 // Way above the hitbox
    };
    
    const isHit = component.checkHitboxDistance(mockEvent);
    expect(isHit).toBe(false);
  });

  it('should correctly change phase and reload animation', () => {
    // Try to change to phase 1
    component.changePhase(1);
    
    // Verify riveInstance exists
    expect(component['riveInstance']).toBeDefined();
    
    // Verify Rive was called with correct parameters
    expect(Rive).toHaveBeenCalledWith({
      src: MONSTER_PHASES[1], // Second phase in the array
      canvas: component['props'].canvas,
      autoplay: component['props'].autoplay,
      stateMachines: ['State Machine 1'],
      layout: {
        fit: 'Contain',
        alignment: 'Center'
      },
      onLoad: expect.any(Function),
      useOffscreenRenderer: true
    });
  });

  it('should not change to an invalid phase index', () => {
    // Mock console.warn
    const mockWarn = jest.fn();
    const originalWarn = console.warn;
    console.warn = mockWarn;
    
    // Try to change to an invalid phase (5 is greater than the length of the array)
    component.changePhase(5);
    
    // Verify warning was called with correct message
    expect(mockWarn).toHaveBeenCalledWith('Invalid phase index: 5');
    
    // Restore console.warn
    console.warn = originalWarn;
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
    // Ensure riveInstance exists and is properly initialized
    expect(component['riveInstance']).toBeDefined();
    
    // Store reference to riveInstance before disposal
    const riveInstance = component['riveInstance'];
    
    component.dispose();
    
    // Check that cleanup was called on the instance
    expect(riveInstance.cleanup).toHaveBeenCalled();
    
    // Check that the instance was nullified
    expect(component['riveInstance']).toBeNull();
  });

  it('should return empty array for getInputs when in evolution mode', () => {
    const evolutionComponent = new RiveMonsterComponent({
      canvas,
      autoplay: true,
      isEvolving: true,
      gameCanvas
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
    // Create a component in evolution mode
    const evolutionComponent = new RiveMonsterComponent({
      canvas,
      autoplay: true,
      isEvolving: true,
      gameCanvas
    });
    
    // Ensure riveInstance exists
    expect(evolutionComponent['riveInstance']).toBeDefined();
    
    // Store reference to the initial instance
    const initialInstance = evolutionComponent['riveInstance'];
    
    // Call initializeRive to trigger evolution
    evolutionComponent.initializeRive();
    
    // Verify cleanupInstances was called on the initial instance
    expect(initialInstance.cleanupInstances).toHaveBeenCalled();
    
    // Verify we have a new instance
    expect(evolutionComponent['riveInstance']).toBeDefined();
    expect(evolutionComponent['riveInstance']).not.toBe(initialInstance);
  });
});
