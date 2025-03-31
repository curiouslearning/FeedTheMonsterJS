import { EvolutionAnimationComponent } from './evolution-animation';
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';
import { EVOL_MONSTER } from '@constants';
import * as CommonUtils from '@common';

// Mock dependencies
const mockDestroy = jest.fn();
const mockDispose = jest.fn();
const mockStopAllAudios = jest.fn();
const mockPreloadGameAudio = jest.fn().mockResolvedValue(undefined);
const mockPlayFeedbackAudios = jest.fn();

// Mock isDocumentVisible function
jest.mock('@common', () => ({
  ...jest.requireActual('@common'),
  isDocumentVisible: jest.fn(),
  Utils: {
    getLanguageSpecificFont: jest.fn().mockResolvedValue('font-name')
  }
}));

// Mock gameStateService
jest.mock('@gameStateService', () => ({
  __esModule: true,
  default: {
    getLevelEndSceneData: jest.fn().mockReturnValue({ monsterPhaseNumber: 0 }),
    checkMonsterPhaseUpdation: jest.fn().mockReturnValue(1),
    updateMonsterPhaseState: jest.fn()
  }
}));

jest.mock('@components/baseHTML/base-html', () => ({
  BaseHTML: jest.fn().mockImplementation(() => ({
    destroy: mockDestroy,
    _init: jest.fn(),
    render: jest.fn()
  }))
}));

// Mock AudioPlayer
jest.mock('@components/audio-player', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    stopAllAudios: mockStopAllAudios,
    preloadGameAudio: mockPreloadGameAudio,
    playFeedbackAudios: mockPlayFeedbackAudios,
    playAudio: jest.fn(),
    playButtonClickSound: jest.fn()
  }))
}));

// Mock RiveMonsterComponent as a class to properly support inheritance
jest.mock('@components/riveMonster/rive-monster-component', () => {
  return {
    RiveMonsterComponent: jest.fn().mockImplementation(function(this: any, props: any) {
      this.props = props;
      this.dispose = mockDispose;
      this.getCanvas = jest.fn().mockReturnValue(document.createElement('canvas'));
      this.play = jest.fn();
      this.executeRiveAction = jest.fn().mockImplementation((event, callback) => {
        if (callback) callback();
      });
    })
  };
});

describe('EvolutionAnimationComponent', () => {
  let evolutionAnimation: EvolutionAnimationComponent;
  let canvas: HTMLCanvasElement;
  let backgroundElement: HTMLElement;
  let levelendBackground: HTMLElement;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create a canvas element for testing
    canvas = document.createElement('canvas');
    canvas.id = 'rivecanvas';

    // Create background element
    backgroundElement = document.createElement('div');
    backgroundElement.id = 'background';
    document.body.appendChild(backgroundElement);

    // Create levelend-background element
    levelendBackground = document.createElement('div');
    levelendBackground.id = 'levelend-background';
    document.body.appendChild(levelendBackground);

    // Spy on document event listeners
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (evolutionAnimation) {
      evolutionAnimation.dispose();
    }
    // Clean up elements
    [backgroundElement, levelendBackground].forEach(element => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Restore spies
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should initialize with correct evolution source based on phase number', () => {
    evolutionAnimation = new EvolutionAnimationComponent({
      canvas,
      monsterPhaseNumber: 1,
      autoplay: true
    });

    // Check if RiveMonsterComponent was called with correct props
    expect(RiveMonsterComponent).toHaveBeenCalledWith({
      canvas,
      monsterPhaseNumber: 1,
      autoplay: true,
      src: EVOL_MONSTER[0],
    });
  });

  it('should fallback to EVOL_MONSTER[0] for unknown phase numbers', () => {
    evolutionAnimation = new EvolutionAnimationComponent({
      canvas,
      monsterPhaseNumber: 999, // Unknown phase
      autoplay: true
    });

    // Check if fallback source was passed to RiveMonsterComponent
    expect(RiveMonsterComponent).toHaveBeenCalledWith({
      canvas,
      monsterPhaseNumber: 999,
      autoplay: true,
      src: EVOL_MONSTER[0]
    });
  });

  it('should set canvas position correctly', () => {
    evolutionAnimation = new EvolutionAnimationComponent({
      canvas,
      monsterPhaseNumber: 1,
      autoplay: true
    });

    // Test evolution position
    evolutionAnimation.setCanvasPosition('evolution');
    expect(canvas.style.zIndex).toBe('13');

    // Test normal position
    evolutionAnimation.setCanvasPosition('normal');
    expect(canvas.style.zIndex).toBe('4');
  });

  it('should call onComplete callback after animation completes', () => {
    const onComplete = jest.fn();
    evolutionAnimation = new EvolutionAnimationComponent({
      canvas,
      monsterPhaseNumber: 1,
      autoplay: true,
      onComplete
    });

    // Mock setTimeout
    jest.useFakeTimers();
    evolutionAnimation.startAnimation();
    jest.advanceTimersByTime(7500); // Updated to match component's EVOLUTION_ANIMATION_COMPLETE_DELAY

    // Check if onComplete was called
    expect(onComplete).toHaveBeenCalled();
    
    // Restore real timers
    jest.useRealTimers();
  });

  it('should handle evolution completion by updating background and canvas position', () => {
    evolutionAnimation = new EvolutionAnimationComponent({
      canvas,
      monsterPhaseNumber: 1,
      autoplay: true
    });

    // Call handleEvolutionComplete directly
    evolutionAnimation['handleEvolutionComplete']();

    // Check if background got fade-out class
    expect(levelendBackground.classList.contains('fade-out')).toBe(true);
    
    // Check if canvas position was updated
    expect(canvas.style.zIndex).toBe('4'); // normal position
  });

  it('should call stopAllAudios when playEvolutionCompletionAudios is called', async () => {
    evolutionAnimation = new EvolutionAnimationComponent({
      canvas,
      monsterPhaseNumber: 1,
      autoplay: true
    });

    // Mock Promise.all to resolve immediately
    const originalPromiseAll = Promise.all;
    Promise.all = jest.fn().mockImplementation(() => {
      return Promise.resolve([]);
    });

    // Call playEvolutionCompletionAudios directly
    evolutionAnimation['playEvolutionCompletionAudios']();

    // Check if stopAllAudios was called
    expect(mockStopAllAudios).toHaveBeenCalled();
    
    // Check if preloadGameAudio was called twice (for AUDIO_MONSTER_EVOLVE and AUDIO_INTRO)
    expect(mockPreloadGameAudio).toHaveBeenCalledTimes(2);
    
    // Wait for the Promise.all to resolve
    await Promise.resolve();
    
    // Check if playFeedbackAudios was called
    expect(mockPlayFeedbackAudios).toHaveBeenCalled();
    
    // Restore original Promise.all
    Promise.all = originalPromiseAll;
  });

  it('should add visibility change event listener on initialization', () => {
    evolutionAnimation = new EvolutionAnimationComponent({
      canvas,
      monsterPhaseNumber: 1,
      autoplay: true
    });

    // Check if addEventListener was called with the correct event and handler
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange', 
      expect.any(Function), 
      false
    );
  });

  it.skip('should clean up resources including event listeners when disposed', () => {
    // Create a spy on document.removeEventListener
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    // Create the component
    evolutionAnimation = new EvolutionAnimationComponent({
      canvas,
      monsterPhaseNumber: 1,
      autoplay: true
    });
    
    // Manually set up spies on the component's methods to verify they're called
    const audioPlayerStopAllAudios = jest.spyOn(evolutionAnimation['audioPlayer'], 'stopAllAudios');
    
    // Dispose the component
    evolutionAnimation.dispose();
    
    // Verify that audio is stopped when disposed
    expect(audioPlayerStopAllAudios).toHaveBeenCalled();
    
    // Verify that event listener is removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      evolutionAnimation['pauseAudios'],
      false
    );
    
    // Clean up
    audioPlayerStopAllAudios.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should stop all audios when document is not visible', () => {
    evolutionAnimation = new EvolutionAnimationComponent({
      canvas,
      monsterPhaseNumber: 1,
      autoplay: true
    });

    // Mock isDocumentVisible to return false
    (CommonUtils.isDocumentVisible as jest.Mock).mockReturnValue(false);

    // Call pauseAudios directly
    evolutionAnimation['pauseAudios']();

    // Check if stopAllAudios was called
    expect(mockStopAllAudios).toHaveBeenCalled();
  });

  it('should not stop audios when document is visible', () => {
    evolutionAnimation = new EvolutionAnimationComponent({
      canvas,
      monsterPhaseNumber: 1,
      autoplay: true
    });

    // Reset the mock to ensure clean state
    mockStopAllAudios.mockClear();

    // Mock isDocumentVisible to return true
    (CommonUtils.isDocumentVisible as jest.Mock).mockReturnValue(true);

    // Call pauseAudios directly
    evolutionAnimation['pauseAudios']();

    // Check that stopAllAudios was not called
    expect(mockStopAllAudios).not.toHaveBeenCalled();
  });
});
