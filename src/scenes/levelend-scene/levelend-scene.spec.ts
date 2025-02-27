import {LevelEndScene} from './levelend-scene';
import {RiveMonsterComponent} from '@components/riveMonster/rive-monster-component';
import gameStateService from '@gameStateService';
import {AudioPlayer} from '@components';
import { EvolutionAnimationComponent } from '@components/evolutionAnimation/evolution-animation';

// Mock RiveMonsterComponent first since EvolutionAnimationComponent extends it
const mockRiveMonster = {
  dispose: jest.fn(),
  getCanvas: jest.fn().mockReturnValue(document.createElement('canvas')),
  play: jest.fn()
};

jest.mock('@components/riveMonster/rive-monster-component', () => ({
  RiveMonsterComponent: Object.assign(
    jest.fn().mockImplementation(() => mockRiveMonster),
    {
      Animations: {
        IDLE: "Idle",
        SAD: "Sad",
        STOMP: "Stomp",
        STOMPHAPPY: "StompHappy",
        SPIT: "Spit",
        CHEW: "Chew",
        MOUTHOPEN: "MouthOpen",
        MOUTHCLOSED: "MouthClosed",
        HAPPY: "Happy"
      }
    }
  )
}));

// Mock EvolutionAnimationComponent
const mockEvolutionAnimation = {
  initialize: jest.fn(),
  startAnimation: jest.fn(),
  dispose: jest.fn(),
  setCanvasPosition: jest.fn(),
  getCanvas: jest.fn().mockReturnValue(document.createElement('canvas')),
  play: jest.fn()
};

jest.mock('@components/evolutionAnimation/evolution-animation', () => ({
  EvolutionAnimationComponent: jest.fn().mockImplementation(() => mockEvolutionAnimation)
}));

jest.mock('@gameStateService');
jest.mock('@components', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    stopAllAudios: jest.fn(),
    playAudio: jest.fn(),
    playButtonClickSound: jest.fn(),
    stopFeedbackAudio: jest.fn(),
  })),
}));

jest.mock('@constants', () => ({
  AUDIO_INTRO: 'audio/intro.mp3',
  AUDIO_LEVEL_LOSE: 'audio/level_lose.mp3',
  AUDIO_LEVEL_WIN: 'audio/level_win.mp3',
  EVOL_MONSTER: 'evolution_monster',
  PIN_STAR_1: 'star1.png',
  PIN_STAR_2: 'star2.png',
  PIN_STAR_3: 'star3.png',
  MONSTER_PHASES: [
    './assets/rive/eggMonsterFTM.riv',
    './assets/rive/blue_egg.riv',
    './assets/rive/green_egg.riv'
  ],
  SCENE_NAME_LEVEL_SELECT: 'SCENE_NAME_LEVEL_SELECT',
  SCENE_NAME_GAME_PLAY: 'SCENE_NAME_GAME_PLAY'
}));

describe('LevelEndScene', () => {
  let levelEndScene: LevelEndScene;
  let mockSwitchToGameplayCB: jest.Mock;
  let mockSwitchToLevelSelectionCB: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSwitchToGameplayCB = jest.fn();
    mockSwitchToLevelSelectionCB = jest.fn();

    (gameStateService.getGamePlaySceneDetails as jest.Mock).mockReturnValue({
      isLastLevel: false,
    });

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
      monsterPhaseNumber: 1,
    });

    (gameStateService.checkMonsterPhaseUpdation as jest.Mock).mockReturnValue(1);

    gameStateService.publish = jest.fn();
    gameStateService.EVENTS = {
      SWITCH_SCENE_EVENT: 'SWITCH_SCENE_EVENT',
      GAMEPLAY_DATA_EVENT: 'GAMEPLAY_DATA_EVENT',
      GAME_PAUSE_STATUS_EVENT: 'GAME_PAUSE_STATUS_EVENT',
      LEVEL_END_DATA_EVENT: 'LEVEL_END_DATA_EVENT'
    };

    document.body.innerHTML = `
      <div id="levelEnd"></div>
      <canvas id="rivecanvas"></canvas>
      <div class="stars-container"></div>
      <div id="game-control"></div>
      <div id="levelEndButtons"></div>
    `;

    levelEndScene = new LevelEndScene();
    
    levelEndScene.retryButtonInstance = {
      onClick: mockSwitchToGameplayCB,
      render: jest.fn(),
      dispose: jest.fn()
    } as any;

    levelEndScene.mapButtonInstance = {
      onClick: mockSwitchToLevelSelectionCB,
      render: jest.fn(),
      dispose: jest.fn()
    } as any;
  });

  afterEach(() => {
    levelEndScene.dispose();
    document.removeEventListener('visibilitychange', levelEndScene.pauseAudios);
    jest.clearAllMocks();
  });

  it('should initialize the RiveMonsterComponent with default settings', () => {
    expect(RiveMonsterComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        canvas: expect.any(HTMLCanvasElement),
        autoplay: true,
        alignment: 'topCenter',
        fit: 'contain',
        src: './assets/rive/blue_egg.riv'
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
    levelEndScene.buttonCallbackFn('retry');
    expect(gameStateService.publish).toHaveBeenCalledWith(
      gameStateService.EVENTS.SWITCH_SCENE_EVENT,
      'SCENE_NAME_GAME_PLAY'
    );
  });

  it('should call the map button callback on map button click', () => {
    levelEndScene.buttonCallbackFn('map');
    expect(gameStateService.publish).toHaveBeenCalledWith(
      gameStateService.EVENTS.SWITCH_SCENE_EVENT,
      'SCENE_NAME_LEVEL_SELECT'
    );
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
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });

    const stopAllAudiosMock = jest.fn();
    levelEndScene.audioPlayer = {stopAllAudios: stopAllAudiosMock} as any;

    levelEndScene.pauseAudios();

    expect(stopAllAudiosMock).toHaveBeenCalled();
  });

  it('should play the intro audio if the document is visible', () => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });

    levelEndScene.starCount = 2;

    levelEndScene.pauseAudios();

    expect(levelEndScene.audioPlayer.playAudio).toHaveBeenCalledWith(
      'audio/intro.mp3',
    );
  });

  describe('LevelEnd buttons rendering', () => {
    beforeEach(() => {
      // Set up DOM elements needed for button rendering
      document.body.innerHTML = `
        <div id="levelEnd" style="display: none; z-index: 1;"></div>
        <div id="levelEndButtons"></div>
        <div id="game-control"></div>
      `;
    });

    it('should render MapButton', () => {
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-map-btn')).not.toBeNull();
    });

    it('should call switchToLevelSelectionCB when Map button is clicked', () => {
      // First render the buttons
      levelEndScene.renderButtonsHTML();
      
      // Get the button instance and trigger its click handler
      const mapButton = document.getElementById('levelend-map-btn') as HTMLButtonElement;
      mapButton.click();
      
      expect(gameStateService.publish).toHaveBeenCalledWith(
        gameStateService.EVENTS.SWITCH_SCENE_EVENT,
        'SCENE_NAME_LEVEL_SELECT'
      );
    });

    it('should render RetryButtonHtml', () => {
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-retry-btn')).not.toBeNull();
    });

    it('should call switchToGameplayCB when Retry button is clicked', () => {
      // First render the buttons
      levelEndScene.renderButtonsHTML();
      
      // Get the button instance and trigger its click handler
      const retryButton = document.getElementById('levelend-retry-btn') as HTMLButtonElement;
      retryButton.click();
      
      expect(gameStateService.publish).toHaveBeenCalledWith(
        gameStateService.EVENTS.SWITCH_SCENE_EVENT,
        'SCENE_NAME_GAME_PLAY'
      );
    });

    it('should render NextButtonHtml if isLastLevel is false', () => {
      levelEndScene.isLastLevel = false;
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-next-btn')).not.toBeNull();
    });
  });

  describe('Dispose functionality', () => {
    it('should not dispose NextButtonHtml if not created', () => {
      levelEndScene.isLastLevel = true;
      levelEndScene.renderButtonsHTML();
      levelEndScene.dispose();
      expect(levelEndScene.nextButtonInstance).toBeNull();
    });

    it('should dispose of all button instances on dispose', () => {
      levelEndScene.isLastLevel = false;
      levelEndScene.renderButtonsHTML();
      levelEndScene.dispose();

      expect(levelEndScene.mapButtonInstance).toBeNull();
      expect(levelEndScene.retryButtonInstance).toBeNull();
      expect(levelEndScene.nextButtonInstance).toBeNull();
    });
  });

  describe('Evolution functionality', () => {
    let levelEndScene: LevelEndScene;
    let mockEvolutionAnimation;
    let mockRiveMonster;

    beforeEach(() => {
      // Reset the mock implementation before each test
      mockEvolutionAnimation = {
        initialize: jest.fn(),
        startAnimation: jest.fn(),
        dispose: jest.fn(),
        setCanvasPosition: jest.fn(),
        getCanvas: jest.fn().mockReturnValue(document.createElement('canvas')),
        play: jest.fn()
      };

      mockRiveMonster = {
        dispose: jest.fn(),
        getCanvas: jest.fn().mockReturnValue(document.createElement('canvas')),
        play: jest.fn()
      };

      // Mock gameStateService data
      (gameStateService.getLevelEndSceneData as jest.Mock).mockReturnValue({
        starCount: 3,
        currentLevel: 1,
        data: {},
        monsterPhaseNumber: 1
      });

      (gameStateService.getGamePlaySceneDetails as jest.Mock).mockReturnValue({
        isLastLevel: false
      });

      // Mock EvolutionAnimationComponent to return our mock instance
      jest.mocked(EvolutionAnimationComponent).mockImplementation(() => mockEvolutionAnimation);

      // Mock RiveMonsterComponent to return our mock instance
      jest.mocked(RiveMonsterComponent).mockImplementation(() => mockRiveMonster);

      levelEndScene = new LevelEndScene();
    });

    it('should create EvolutionAnimationComponent with correct props when calling evolution animation', () => {
      levelEndScene.callEvolutionAnimation();
      expect(EvolutionAnimationComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          canvas: expect.any(HTMLCanvasElement),
          monsterPhaseNumber: 1,
          autoplay: true
        })
      );
      expect(mockEvolutionAnimation.startAnimation).toHaveBeenCalled();
    });

    it('should clean up properly when disposing scene', () => {
      levelEndScene.callEvolutionAnimation();
      levelEndScene.dispose();
      expect(mockEvolutionAnimation.dispose).toHaveBeenCalled();
    });

    it('should create a new RiveMonsterComponent when initializing evolution monster', () => {
      levelEndScene.callEvolutionAnimation();
      expect(RiveMonsterComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          canvas: expect.any(HTMLCanvasElement),
          autoplay: true,
          fit: "contain",
          alignment: "topCenter",
          src: expect.any(String),
          onLoad: expect.any(Function)
        })
      );
    });
  });
});
