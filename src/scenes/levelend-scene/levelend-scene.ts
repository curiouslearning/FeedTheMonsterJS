import {CLICK, isDocumentVisible} from '@common';
import {AudioPlayer} from '@components';
import {MapButton, NextButtonHtml, RetryButtonHtml} from '@components/buttons';
import {
  AUDIO_INTRO,
  AUDIO_LEVEL_LOSE,
  AUDIO_LEVEL_WIN,
  PIN_STAR_1,
  PIN_STAR_2,
  PIN_STAR_3,
} from '@constants';
import gameStateService from '@gameStateService';
import './levelend-scene.scss';
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';

export class LevelEndScene {
  static renderButtonsHTML() {
    throw new Error('Method not implemented.');
  }
  public starCount: number;
  public currentLevel: number;
  public switchToGameplayCB: Function;
  public switchToLevelSelectionCB: Function;
  public data: any;
  public audioPlayer: AudioPlayer;
  public isLastLevel: boolean;
  public levelEndElement = document.getElementById('levelEnd');
  public nextButtonInstance: NextButtonHtml;
  public retryButtonInstance: RetryButtonHtml;
  public mapButtonInstance: MapButton;
  public riveMonster: RiveMonsterComponent;
  public canvasElement: HTMLCanvasElement;
  constructor(switchToGameplayCB, switchToLevelSelectionCB) {
    const {starCount, currentLevel, data} =
      gameStateService.getLevelEndSceneData();
    const {isLastLevel} = gameStateService.getGamePlaySceneDetails();
    this.switchToGameplayCB = switchToGameplayCB;
    this.switchToLevelSelectionCB = switchToLevelSelectionCB;
    this.data = data;
    this.audioPlayer = new AudioPlayer();
    this.canvasElement = document.getElementById("rivecanvas") as HTMLCanvasElement;
    this.starCount = starCount;
    this.currentLevel = currentLevel;
    this.isLastLevel = isLastLevel;
    this.initializeRiveMonster();
    // Subscribe to the LEVEL_END_BACKGROUND_TOGGLE event
    this.toggleLevelEndBackground(true);
    this.showLevelEndScreen(); // Display the level end screen
    this.addEventListener();
    this.renderStarsHTML();
    // Call switchToReactionAnimation during initialization
    this.switchToReactionAnimation();
  }

  initializeRiveMonster() {
    // Initialize the RiveMonsterComponent instead of directly using Rive
    this.riveMonster = new RiveMonsterComponent({
      canvas: this.canvasElement,
      autoplay: true,
      fit: "contain",
      alignment: "topCenter",
      onLoad: () => {
        this.riveMonster.play(RiveMonsterComponent.Animations.IDLE); // Start with the "Eat Happy" animation
      }
    });
  }
  // Method to show/hide the Level End background
  toggleLevelEndBackground = (shouldShow: boolean) => {
    if (this.levelEndElement) {
      this.levelEndElement.style.display = shouldShow ? 'block' : 'none';
      // this is to ensure that the level end scene is the top element when level end is active
      this.levelEndElement.style.zIndex = '11';
    }
  };

  // Call this method where necessary to show the background when level ends
  showLevelEndScreen() {
    this.toggleLevelEndBackground(true); // Publish show event
    // Render the stars dynamically based on the star count
    this.renderStarsHTML();
    this.renderButtonsHTML();
  }

  switchToReactionAnimation = () => {
    if (this.starCount <= 1) {
      if (isDocumentVisible()) {
        this.audioPlayer.playAudio(AUDIO_LEVEL_LOSE);
      }
      this.riveMonster.play(RiveMonsterComponent.Animations.EAT_DISGUST);
    } else {
      if (isDocumentVisible()) {
        this.audioPlayer.playAudio(AUDIO_LEVEL_WIN);
        this.audioPlayer.playAudio(AUDIO_INTRO);
      }
      this.riveMonster.play(RiveMonsterComponent.Animations.EATHAPPY);
    }
  };

  renderStarsHTML() {
    const starsContainer = document.querySelector('.stars-container');
    if (!starsContainer) return;
    // Clear any previously rendered stars
    starsContainer.innerHTML = '';

    const starImages = [
      PIN_STAR_1, // Path to star 1 image
      PIN_STAR_2, // Path to star 2 image
      PIN_STAR_3, // Path to star 3 image
    ];

    for (let i = 0; i < this.starCount; i++) {
      const starImg = document.createElement('img');
      starImg.src = starImages[i]; // Set the star image source
      starImg.alt = `Star ${i + 1}`;
      starImg.classList.add('stars', `star${i + 1}`);
      starsContainer.appendChild(starImg); // Add star to the container

      // Delay the addition of the 'show' class
      setTimeout(() => {
        starImg.classList.add('show');
      }, i * 500); // Half-second delay between each star
    }
  }

  private createButton(
    ButtonClass:
      | typeof MapButton
      | typeof RetryButtonHtml
      | typeof NextButtonHtml,
    id: string,
    onClickCallback: () => void,
  ) {
    const buttonsContainerId = 'levelEndButtons';

    const button = new ButtonClass({targetId: buttonsContainerId, id});

    // Save the button instances for disposal later
    if (ButtonClass === NextButtonHtml) {
      this.nextButtonInstance = button as NextButtonHtml;
    } else if (ButtonClass === RetryButtonHtml) {
      this.retryButtonInstance = button as RetryButtonHtml;
    } else if (ButtonClass === MapButton) {
      this.mapButtonInstance = button as MapButton;
    }

    const gameControl = document.getElementById(
      'game-control',
    ) as HTMLCanvasElement;

    button.onClick(() => {
      this.levelEndElement.style.zIndex = '7';
      gameControl.style.zIndex = '-1';
      onClickCallback();
    });
  }

  buttonCallbackFn(action: 'map' | 'retry' | 'next') {
    const handleRetryOrNext = (level: number) => {
      const gamePlayData = {
        currentLevelData: {
          ...this.data.levels[level],
          levelNumber: level,
        },
        selectedLevelNumber: level,
      };
      this.handlePublishEvent(true, gamePlayData);
      this.switchToGameplayCB();
    };

    switch (action) {
      case 'map':
        this.handlePublishEvent(true);
        this.switchToLevelSelectionCB();
        break;

      case 'retry':
        handleRetryOrNext(this.currentLevel);
        break;

      case 'next':
        if (this.currentLevel < this.data.levels.length) {
          handleRetryOrNext(this.currentLevel + 1);
        }
        break;

      default:
        console.warn(`Unhandled action: ${action}`);
    }
  }

  renderButtonsHTML() {
    const nextButton = document.getElementById('levelend-next-btn');
    // Define configurations for each button
    const buttonConfigs = [
      {
        ButtonClass: MapButton,
        id: 'levelend-map-btn',
        onClick: () => {
          this.buttonCallbackFn('map');
        },
      },
      {
        ButtonClass: RetryButtonHtml,
        id: 'levelend-retry-btn',
        onClick: () => {
          this.buttonCallbackFn('retry');
        },
      },
    ];
    // Add NextButtonHtml only if not the last level and the star count is sufficient
    if (!this.isLastLevel && this.starCount >= 2) {
      buttonConfigs.push({
        ButtonClass: NextButtonHtml,
        id: 'levelend-next-btn',
        onClick: () => {
          this.buttonCallbackFn('next');
        },
      });
    } else {
      if (nextButton) {
        nextButton.remove();
      }
    }
    // Create buttons based on configuration
    buttonConfigs.forEach(({ ButtonClass, id, onClick }) => {
      this.createButton(ButtonClass, id, onClick);
    });
  }

  addEventListener() {
    document.addEventListener('visibilitychange', this.pauseAudios, false);
  }

  private handlePublishEvent(shouldShowLoading: boolean, gamePlayData = null) {
    if (gamePlayData) {
      gameStateService.publish(
        gameStateService.EVENTS.GAMEPLAY_DATA_EVENT,
        gamePlayData,
      );
    }
    gameStateService.publish(
      gameStateService.EVENTS.SCENE_LOADING_EVENT,
      shouldShowLoading,
    );
    setTimeout(() => {
      this.toggleLevelEndBackground(!shouldShowLoading);
    }, 800);
  }

  handleMouseClick = event => {
    const selfElement: HTMLElement = document.getElementById('canvas');
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
  };

  pauseAudios = () => {
    if (isDocumentVisible()) {
      if (this.starCount >= 2) {
        this.audioPlayer.playAudio(AUDIO_INTRO);
      }
    } else {
      this.audioPlayer.stopAllAudios();
    }
  };

  dispose = () => {
    // Stop all audio
    this.audioPlayer.stopAllAudios();

    // Remove visibility change listener
    document.removeEventListener('visibilitychange', this.pauseAudios, false);

    // Dispose of the NextButtonHtml instance
    if (this.nextButtonInstance) {
      this.nextButtonInstance.dispose();
      this.nextButtonInstance = null; // Clean up the reference
    }

    // Dispose of the RetryButtonHtml instance
    if (this.retryButtonInstance) {
      this.retryButtonInstance.dispose();
      this.retryButtonInstance = null; // Clean up the reference
    }

    // Dispose of the MapButton instance
    if (this.mapButtonInstance) {
      this.mapButtonInstance.dispose();
      this.mapButtonInstance = null; // Clean up the reference
    }
  };
}
