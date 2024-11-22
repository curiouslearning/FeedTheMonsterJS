import { LevelEndScene } from './levelend-scene';
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';
import gameStateService from '@gameStateService';
import { AUDIO_INTRO } from '@constants';

jest.mock('@components/riveMonster/rive-monster-component');
jest.mock('@gameStateService');
jest.mock('@components');

describe('LevelEndScene', () => {
  let levelEndScene: LevelEndScene;
  let mockSwitchToGameplayCB: jest.Mock;
  let mockSwitchToLevelSelectionCB: jest.Mock;
  let mockData: any;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="levelEnd"></div>
      <canvas id="rivecanvas"></canvas>
      <div class="stars-container"></div>
      <div id="game-control"></div>
      <div id="levelEndButtons"></div>
    `;
    mockSwitchToGameplayCB = jest.fn();
    mockSwitchToLevelSelectionCB = jest.fn();
    mockData = {
      levels: [
        { levelMeta: { levelNumber: 1 } },
        { levelMeta: { levelNumber: 2 } },
        { levelMeta: { levelNumber: 3 } },
      ],
    };

    levelEndScene = new LevelEndScene(
      800,
      600,
      3,
      1,
      mockSwitchToGameplayCB,
      mockSwitchToLevelSelectionCB,
      mockData
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
      })
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
    expect(levelEndScene.riveMonster.play).toHaveBeenCalledWith(RiveMonsterComponent.Animations.EAT_HAPPY);
  });

  it('should call play with EAT_DISGUST animation for 1 or fewer stars', () => {
    levelEndScene.starCount = 1;
    levelEndScene.switchToReactionAnimation();
    expect(levelEndScene.riveMonster.play).toHaveBeenCalledWith(RiveMonsterComponent.Animations.EAT_DISGUST);
  });

  it('should call the retry button callback on retry button click', () => {
    levelEndScene.renderButtonsHTML();
    const retryButton = document.getElementById('levelend-retry-btn') as HTMLButtonElement;
    retryButton.click();
    expect(mockSwitchToGameplayCB).toHaveBeenCalled();
  });

  it('should call the map button callback on map button click', () => {
    levelEndScene.renderButtonsHTML();
    const mapButton = document.getElementById('levelend-map-btn') as HTMLButtonElement;
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
      expectedData
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
    levelEndScene.audioPlayer = { stopAllAudios: stopAllAudiosMock } as any;
  
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
    expect(levelEndScene.audioPlayer.playAudio).toHaveBeenCalledWith(AUDIO_INTRO);
  });
});
