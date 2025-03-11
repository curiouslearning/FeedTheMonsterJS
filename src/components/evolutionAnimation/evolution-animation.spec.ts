import { EvolutionAnimationComponent } from './evolution-animation';
import { BaseHTML } from '@components/baseHTML/base-html';
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';
import { EVOL_MONSTER } from '@constants';

// Mock dependencies
const mockDestroy = jest.fn();
const mockDispose = jest.fn();

jest.mock('@components/baseHTML/base-html', () => ({
  BaseHTML: jest.fn().mockImplementation(() => ({
    destroy: mockDestroy,
    _init: jest.fn(),
    render: jest.fn()
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
    })
  };
});

describe('EvolutionAnimationComponent', () => {
  let evolutionAnimation: EvolutionAnimationComponent;
  let canvas: HTMLCanvasElement;
  let backgroundElement: HTMLElement;
  let levelendBackground: HTMLElement;

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
      src: EVOL_MONSTER[0]
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
    jest.advanceTimersByTime(6500); // Updated to match component's EVOLUTION_ANIMATION_COMPLETE_DELAY

    // Check if onComplete was called
    expect(onComplete).toHaveBeenCalled();
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
});
