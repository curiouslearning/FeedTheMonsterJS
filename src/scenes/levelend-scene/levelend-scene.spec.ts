import {LevelEndScene} from './levelend-scene';
import {RiveMonsterComponent} from '@components/riveMonster/rive-monster-component';
import gameStateService from '@gameStateService';
import {AUDIO_INTRO, EVOL_MONSTER} from '@constants';
import {AudioPlayer} from '@components';

// Mocking the AudioPlayer class
jest.mock('@components', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    stopAllAudios: jest.fn(), // Mock stopAllAudios
    playAudio: jest.fn(),
    playButtonClickSound: jest.fn(),
    stopFeedbackAudio: jest.fn(),
  })),
}));

jest.mock('@components/riveMonster/rive-monster-component');
jest.mock('@gameStateService');
jest.mock('@components');

describe('LevelEndScene', () => {
  let levelEndScene: LevelEndScene;
  let mockSwitchToGameplayCB: jest.Mock;
  let mockSwitchToLevelSelectionCB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock `getGamePlaySceneDetails` to return valid data
    (gameStateService.getGamePlaySceneDetails as jest.Mock).mockReturnValue({
      isLastLevel: false, // Mocked value
    });

    // Mock `getLevelEndSceneData` to return valid data
    (gameStateService.getLevelEndSceneData as jest.Mock).mockReturnValue({
      starCount: 3,
      currentLevel: 1,
      data: {
        levels: [
          {levelMeta: {levelNumber: 1}},
          {levelMeta: {levelNumber: 2}},
          {levelMeta: {levelNumber: 3}},
        ],
      },
    });

    document.body.innerHTML = `
      <div id="levelEnd"></div>
      <canvas id="rivecanvas"></canvas>
      <div class="stars-container"></div>
      <div id="game-control"></div>
      <div id="levelEndButtons"></div>
    `;

    mockSwitchToGameplayCB = jest.fn();
    mockSwitchToLevelSelectionCB = jest.fn();

    // Initialize the LevelEndScene
    levelEndScene = new LevelEndScene(
      1,
      mockSwitchToGameplayCB,
      mockSwitchToLevelSelectionCB,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize the RiveMonsterComponent with default settings', () => {
    expect(RiveMonsterComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        canvas: expect.any(HTMLCanvasElement),
        autoplay: true,
        fit: 'contain',
        alignment: 'topCenter',
      }),
    );
  });

  it('should display the level end background when showing the level end screen', () => {
    const levelEndElement = document.getElementById('levelEnd');
    levelEndScene.showLevelEndScreen();
    expect(levelEndElement?.style.display).toBe('block');
  });

  it('should hide the level end background when toggled off', () => {
    levelEndScene.toggleLevelEndBackground(false);
    const levelEndElement = document.getElementById('levelEnd');
    expect(levelEndElement?.style.display).toBe('none');
  });

  it('should render the correct number of stars in the stars container', () => {
    levelEndScene.renderStarsHTML();
    const starsContainer = document.querySelector('.stars-container');
    expect(starsContainer?.children.length).toBe(3);
  });

  it('should call play with EAT_HAPPY animation for 2 or more stars', () => {
    levelEndScene.starCount = 2;
    levelEndScene.switchToReactionAnimation();
    expect(levelEndScene.riveMonster.play).toHaveBeenCalledWith(
      RiveMonsterComponent.Animations.HAPPY,
    );
  });

  it('should call play with EAT_DISGUST animation for 1 or fewer stars', () => {
    levelEndScene.starCount = 1;
    levelEndScene.switchToReactionAnimation();
    expect(levelEndScene.riveMonster.play).toHaveBeenCalledWith(
      RiveMonsterComponent.Animations.SAD,
    );
  });

  it('should call the retry button callback on retry button click', () => {
    levelEndScene.renderButtonsHTML();
    const retryButton = document.getElementById(
      'levelend-retry-btn',
    ) as HTMLButtonElement;
    retryButton.click();
    expect(mockSwitchToGameplayCB).toHaveBeenCalled();
  });

  it('should call the map button callback on map button click', () => {
    levelEndScene.renderButtonsHTML();
    const mapButton = document.getElementById(
      'levelend-map-btn',
    ) as HTMLButtonElement;
    mapButton.click();
    expect(mockSwitchToLevelSelectionCB).toHaveBeenCalled();
  });

  it('should remove the next button if it is the last level', () => {
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
    // Mocking the visibility state to simulate the document being hidden
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });

    // Mock the audioPlayer object and the stopAllAudios method
    const stopAllAudiosMock = jest.fn();
    levelEndScene.audioPlayer = {stopAllAudios: stopAllAudiosMock} as any;

    // Trigger the pauseAudios method, which should call stopAllAudios when the document is hidden
    levelEndScene.pauseAudios();

    // Assert that stopAllAudios was called
    expect(stopAllAudiosMock).toHaveBeenCalled();
  });

  it('should play the intro audio if the document is visible', () => {
    // Mocking the visibility state to simulate the document being visible
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });

    // Set the conditions for the LevelEndScene
    levelEndScene.starCount = 2;

    // Assuming `pauseAudios` triggers the audio play when visibility state is 'visible'
    levelEndScene.pauseAudios();

    // Check if the correct audio file is played
    expect(levelEndScene.audioPlayer.playAudio).toHaveBeenCalledWith(
      AUDIO_INTRO,
    );
  });

  describe('LevelEnd buttons rendering', () => {
    it('should render MapButton', () => {
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-map-btn')).not.toBeNull();
    });

    it('should call switchToLevelSelectionCB when Map button is clicked', () => {
      levelEndScene.renderButtonsHTML();
      const mapButton = document.getElementById(
        'levelend-map-btn',
      ) as HTMLButtonElement;
      mapButton.click();
      expect(mockSwitchToLevelSelectionCB).toHaveBeenCalled();
    });

    it('should render RetryButtonHtml', () => {
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-retry-btn')).not.toBeNull();
    });

    it('should call switchToGameplayCB with correct data when Retry button is clicked', () => {
      levelEndScene.renderButtonsHTML();
      const retryButton = document.getElementById(
        'levelend-retry-btn',
      ) as HTMLButtonElement;
      retryButton.click();
      expect(mockSwitchToGameplayCB).toHaveBeenCalledWith();
    });

    it('should render NextButtonHtml if isLastLevel is false', () => {
      levelEndScene.isLastLevel = false; // Explicitly set to false
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-next-btn')).not.toBeNull();
    });

    it('should call switchToGameplayCB with correct data when Next button is clicked', () => {
      levelEndScene.isLastLevel = false; // Ensure it’s not the last level
      levelEndScene.renderButtonsHTML();
      const nextButton = document.getElementById(
        'levelend-next-btn',
      ) as HTMLButtonElement;
      nextButton.click();
      expect(mockSwitchToGameplayCB).toHaveBeenCalledWith();
    });

    it('should not render NextButtonHtml if isLastLevel is true', () => {
      levelEndScene.isLastLevel = true; // Simulate last level scenario
      levelEndScene.renderButtonsHTML();
      const nextButton = document.getElementById('levelend-next-btn');
      expect(nextButton).toBeNull(); // Confirm the button does not exist
    });
  });

  describe('Dispose functionality', () => {
    it('should not dispose NextButtonHtml if not created', () => {
      levelEndScene.isLastLevel = true; // Simulate last level scenario
      levelEndScene.renderButtonsHTML();
      levelEndScene.dispose();
      expect(levelEndScene.nextButtonInstance).toBeNull(); // Updated to check for null
    });

    it('should dispose of all button instances on dispose', () => {
      levelEndScene.isLastLevel = false; // Explicitly set to false
      levelEndScene.renderButtonsHTML();
      levelEndScene.dispose();

      expect(levelEndScene.mapButtonInstance).toBeNull();
      expect(levelEndScene.retryButtonInstance).toBeNull();
      expect(levelEndScene.nextButtonInstance).toBeNull();
    });
  });

  describe('Evolution functionality', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="levelEnd"></div>
        <canvas id="rivecanvas"></canvas>
        <div id="background"></div>
      `;
    });

    it('should initialize evolution monster with correct props', () => {
      levelEndScene.evolveMonster = true;
      levelEndScene['initializeEvolutionMonster']();

      expect(RiveMonsterComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          canvas: expect.any(HTMLCanvasElement),
          autoplay: true,
          src: expect.any(String),
          isEvolving: true,
        }),
      );
    });

    it('should set correct canvas position during evolution', () => {
      levelEndScene.setCanvasPosition('evolution');
      expect(levelEndScene.canvasElement.style.zIndex).toBe('13');

      levelEndScene.setCanvasPosition('normal');
      expect(levelEndScene.canvasElement.style.zIndex).toBe('4');
    });

    it('should handle evolution completion correctly', () => {
      // Setup
      document.body.innerHTML = `
        <div id="levelend-background"></div>
        <canvas id="rivecanvas"></canvas>
      `;
      
      // Execute
      levelEndScene['handleEvolutionComplete']();
      
      // Assert
      const bgElement = document.getElementById('levelend-background');
      expect(bgElement.classList.contains('fade-out')).toBe(true);
      expect(levelEndScene.canvasElement.style.zIndex).toBe('4');
    });

    it('should get correct evolution source based on phase', () => {
      // Test for phase 1
      expect(levelEndScene['getEvolutionSource'](1)).toBe(EVOL_MONSTER[2]);
      
      // Test for phase 2
      expect(levelEndScene['getEvolutionSource'](2)).toBe(EVOL_MONSTER[3]);
      
      // Test fallback for invalid phase
      expect(levelEndScene['getEvolutionSource'](999)).toBe(EVOL_MONSTER[1]);
    });

    it('should run evolution animation with correct timing', () => {
      jest.useFakeTimers();
      
      // Setup spies
      const initEvolutionMonsterSpy = jest.spyOn(levelEndScene as any, 'initializeEvolutionMonster');
      const initEvolutionBackgroundSpy = jest.spyOn(levelEndScene as any, 'initializeEvolutionBackground');
      const handleEvolutionCompleteSpy = jest.spyOn(levelEndScene as any, 'handleEvolutionComplete');
      
      // Run evolution animation
      levelEndScene.evolveMonster = true;
      levelEndScene.runEvolutionAnimation();
      
      // Check initial setup
      expect(initEvolutionMonsterSpy).toHaveBeenCalled();
      expect(initEvolutionBackgroundSpy).toHaveBeenCalled();
      expect(levelEndScene.canvasElement.style.zIndex).toBe('13');
      
      // Fast forward timer
      jest.advanceTimersByTime(levelEndScene['EVOLUTION_ANIMATION_DELAY']);
      
      // Check completion handler was called
      expect(handleEvolutionCompleteSpy).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });
});
