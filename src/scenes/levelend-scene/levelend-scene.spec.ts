import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';
import {
  AUDIO_INTRO,
  SCENE_NAME_GAME_PLAY,
  SCENE_NAME_LEVEL_SELECT,
} from '@constants';
import gameStateService from '@gameStateService';
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';
import { LevelEndScene } from './levelend-scene';

// Mock implementations
const mockPlay = jest.fn();
const mockDispose = jest.fn();
const mockPlayAudio = jest.fn();
const mockStopAllAudios = jest.fn();

// Mock modules
jest.mock('@gameStateService');
jest.mock('@gameSettingsService');
jest.mock('@components/riveMonster/rive-monster-component', () => {
  const MockRiveMonsterComponent = jest.fn(() => ({
    play: mockPlay,
    dispose: mockDispose,
    stop: () => { }
  }));

  Object.assign(MockRiveMonsterComponent, {
    Animations: {
      IDLE: "Idle",
      SAD: "Sad",
      HAPPY: "Happy"
    }
  });

  return {
    RiveMonsterComponent: MockRiveMonsterComponent
  };
});

jest.mock('@components', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    playAudio: mockPlayAudio,
    stopAllAudios: mockStopAllAudios,
    preloadGameAudio: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@components/buttons/base-button-component/base-button-component');

describe('LevelEndScene', () => {
  let levelEndScene: LevelEndScene;
  let mockSwitchToGameplayCB: jest.Mock;
  let mockOnClick: jest.Mock;

  beforeEach(() => {
    // Clear mocks
    mockPlayAudio.mockClear();
    mockStopAllAudios.mockClear();
    preloadGameAudio: jest.fn().mockResolvedValue(undefined),

    // Set up DOM elements
    document.body.innerHTML = `
      <div id="levelEnd">
        <div class="stars-container"></div>
        <div id="levelEndButtons"></div>
      </div>
      <canvas id="game-control"></canvas>
      <canvas id="canvas"></canvas>
    `;

    // Mock BaseButtonComponent
    mockOnClick = jest.fn();
    (BaseButtonComponent as unknown as jest.Mock).mockImplementation(function (options) {
      // Create button element
      const button = document.createElement('button');
      button.id = options.id;
      const container = document.getElementById(options.targetId || 'game-control');
      container?.appendChild(button);

      // Add click handler
      this.onClick = (callback) => {
        button.addEventListener('click', callback);
      };

      // Add dispose method
      this.dispose = jest.fn();
    });

    // Mock gameStateService methods
    (gameStateService.getLevelEndSceneData as jest.Mock).mockReturnValue({
      starCount: 2,
      currentLevel: 1,
      data: {
        levels: [
          { id: 1 },
          { id: 2 }
        ]
      },
      monsterPhaseNumber: 1
    });

    (gameStateService.getGamePlaySceneDetails as jest.Mock).mockReturnValue({
      isLastLevel: false
    });

    // Create new instance
    levelEndScene = new LevelEndScene();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should initialize the RiveMonsterComponent with default settings', () => {
    expect(levelEndScene.riveMonster).toBeDefined();
  });

  it('should display the level end background when showing the level end screen', () => {
    levelEndScene.toggleLevelEndBackground(true);
    const levelEnd = document.getElementById('levelEnd');
    expect(levelEnd.style.display).toBe('block');
    expect(levelEnd.style.zIndex).toBe('11');
  });

  it('should hide the level end background when toggled off', () => {
    levelEndScene.toggleLevelEndBackground(false);
    const levelEnd = document.getElementById('levelEnd');
    expect(levelEnd.style.display).toBe('none');
  });

  it('should render the correct number of stars in the stars container', () => {
    const starsContainer = document.querySelector('.stars-container');
    const stars = starsContainer.querySelectorAll('img');
    expect(stars.length).toBe(2); // Based on starCount: 2 from mock
  });

  it('should publish gameplay data event with correct data when switching levels', () => {
    // Mock current level data
    (gameStateService.getLevelEndSceneData as jest.Mock).mockReturnValue({
      starCount: 2,
      currentLevel: 1,
      data: {
        levels: [
          { id: 1 },
          { id: 2 }
        ]
      },
      monsterPhaseNumber: 1,
      currentLevelData: { id: 1 }
    });

    levelEndScene = new LevelEndScene();

    const expectedData = {
      currentLevelData: expect.any(Object),
      selectedLevelNumber: 2,
    };

    levelEndScene.buttonCallbackFn('next');

    expect(gameStateService.publish).toHaveBeenCalledWith(
      gameStateService.EVENTS.GAMEPLAY_DATA_EVENT,
      expectedData
    );
  });

  it('should play happy animation for 2 or more stars', () => {
    // Reset with 2 stars
    (gameStateService.getLevelEndSceneData as jest.Mock).mockReturnValue({
      starCount: 2,
      currentLevel: 1,
      data: { levels: [{ id: 1 }] },
      monsterPhaseNumber: 1
    });

    levelEndScene = new LevelEndScene();

    // Force document to be visible
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });

    levelEndScene.switchToReactionAnimation();

    // Verify correct animation was played
    expect(mockPlay).toHaveBeenCalledWith(RiveMonsterComponent.Animations.HAPPY);
  });

  it('should play sad animation for 1 or fewer stars', () => {
    // Reset with 1 star
    (gameStateService.getLevelEndSceneData as jest.Mock).mockReturnValue({
      starCount: 1,
      currentLevel: 1,
      data: { levels: [{ id: 1 }] },
      monsterPhaseNumber: 1
    });

    levelEndScene = new LevelEndScene();

    // Force document to be visible
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });

    levelEndScene.switchToReactionAnimation();

    // Verify correct animation was played
    expect(mockPlay).toHaveBeenCalledWith(RiveMonsterComponent.Animations.SAD);
  });

  it('should call the retry button callback on retry button click', () => {
    levelEndScene.buttonCallbackFn('retry');
    expect(gameStateService.publish).toHaveBeenCalledWith(
      gameStateService.EVENTS.SWITCH_SCENE_EVENT,
      SCENE_NAME_GAME_PLAY
    );
  });

  it('should call the map button callback on map button click', () => {
    levelEndScene.buttonCallbackFn('map');
    expect(gameStateService.publish).toHaveBeenCalledWith(
      gameStateService.EVENTS.SWITCH_SCENE_EVENT,
      SCENE_NAME_LEVEL_SELECT
    );
  });

  it('should not render next button if it is the last level', () => {
    levelEndScene.isLastLevel = true;
    levelEndScene.renderButtonsHTML();
    const nextButton = document.getElementById('levelend-next-btn');
    expect(nextButton).toBeNull();
  });


  it('should publish gameplay data event with correct data when switching levels', () => {
    const expectedData = {
      currentLevelData: expect.any(Object),
      selectedLevelNumber: 2,
    };
    levelEndScene.buttonCallbackFn('next');
    expect(gameStateService.publish).toHaveBeenCalledWith(
      gameStateService.EVENTS.GAMEPLAY_DATA_EVENT,
      expectedData,
    );
  });

  it('should pause all audios when the document is hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });

    levelEndScene.pauseAudios();

    expect(mockStopAllAudios).toHaveBeenCalled();
  });

  it('should play the intro audio if the document is visible', () => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });

    // Reset with 2 stars
    (gameStateService.getLevelEndSceneData as jest.Mock).mockReturnValue({
      starCount: 2,
      currentLevel: 1,
      data: { levels: [{ id: 1 }] },
      monsterPhaseNumber: 1
    });

    levelEndScene = new LevelEndScene();
    levelEndScene.pauseAudios();

    expect(mockPlayAudio).toHaveBeenCalledWith(AUDIO_INTRO);
  });

  describe('LevelEnd buttons rendering', () => {
    beforeEach(() => {
      // Mock gameStateService.publish
      (gameStateService.publish as jest.Mock).mockClear();
    });

    it('should render MapButton', () => {
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-map-btn')).toBeDefined();
    });

    it('should render RetryButton', () => {
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-retry-btn')).toBeDefined();
    });

    it('should render NextButton if not last level', () => {
      levelEndScene.isLastLevel = false;
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-next-btn')).toBeDefined();
    });

    it('should call switchToGameplayCB when Retry button is clicked', () => {
      // Render buttons
      levelEndScene.renderButtonsHTML();

      // Get retry button and click it
      const retryButton = document.getElementById('levelend-retry-btn');
      expect(retryButton).toBeDefined();
      retryButton?.click();

      // Verify the correct events were published
      expect(gameStateService.publish).toHaveBeenCalledWith(
        gameStateService.EVENTS.SWITCH_SCENE_EVENT,
        SCENE_NAME_GAME_PLAY
      );
    });

    it('should call switchToLevelSelectionCB when Map button is clicked', () => {
      // Render buttons
      levelEndScene.renderButtonsHTML();

      // Get map button and click it
      const mapButton = document.getElementById('levelend-map-btn');
      expect(mapButton).toBeDefined();
      mapButton?.click();

      // Verify the correct events were published
      expect(gameStateService.publish).toHaveBeenCalledWith(
        gameStateService.EVENTS.SWITCH_SCENE_EVENT,
        SCENE_NAME_LEVEL_SELECT
      );
    });
  });

  describe('dispose', () => {
    it('should dispose of all button instances on dispose', () => {
      levelEndScene.isLastLevel = false;
      levelEndScene.renderButtonsHTML();
      levelEndScene.dispose();

      expect(levelEndScene.mapButtonInstance).toBeNull();
      expect(levelEndScene.retryButtonInstance).toBeNull();
      expect(levelEndScene.nextButtonInstance).toBeNull();
    });

    it('should clean up all button instances', () => {
      // Create button instances
      levelEndScene.renderButtonsHTML();

      // Create spies
      const nextButtonDisposeSpy = jest.spyOn(levelEndScene.nextButtonInstance, 'dispose');
      const retryButtonDisposeSpy = jest.spyOn(levelEndScene.retryButtonInstance, 'dispose');
      const mapButtonDisposeSpy = jest.spyOn(levelEndScene.mapButtonInstance, 'dispose');

      // Call dispose
      levelEndScene.dispose();

      // Verify all dispose methods were called
      expect(nextButtonDisposeSpy).toHaveBeenCalled();
      expect(retryButtonDisposeSpy).toHaveBeenCalled();
      expect(mapButtonDisposeSpy).toHaveBeenCalled();

      // Verify instances were nullified
      expect(levelEndScene.nextButtonInstance).toBeNull();
      expect(levelEndScene.retryButtonInstance).toBeNull();
      expect(levelEndScene.mapButtonInstance).toBeNull();
    });

    it('should remove event listeners and stop audio', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      levelEndScene.dispose();

      expect(mockStopAllAudios).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        levelEndScene.pauseAudios,
        false
      );
    });
  });
});
