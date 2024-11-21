import {CLICK, isDocumentVisible} from '@common';
import {AudioPlayer, Monster} from '@components';
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
  public height: number;
  public width: number;
  public starCount: number;
  public currentLevel: number;
  public switchToGameplayCB: Function;
  public switchToLevelSelectionCB: Function;
  public data: any;
  public audioPlayer: AudioPlayer;
  public isLastLevel: boolean;
  public levelEndElement = document.getElementById('levelEnd');
  public riveMonster: RiveMonsterComponent;
  public canvasElement: HTMLCanvasElement;
  constructor(
    height: number,
    width: number,
    starCount: number,
    currentLevel: number,
    switchToGameplayCB,
    switchToLevelSelectionCB,
    data,
  ) {
    this.height = height;
    this.width = width;
    this.switchToGameplayCB = switchToGameplayCB;
    this.switchToLevelSelectionCB = switchToLevelSelectionCB;
    this.data = data;
    this.audioPlayer = new AudioPlayer();
    this.canvasElement = document.getElementById("rivecanvas") as HTMLCanvasElement;
    this.starCount = starCount;
    this.currentLevel = currentLevel;
    this.isLastLevel = this.currentLevel ===
    this.data.levels[this.data.levels.length - 1].levelMeta.levelNumber;
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
      width: this.canvasElement.width, // Example width and height, adjust as needed
      height: this.canvasElement.height,
      onLoad: () => {
        console.log("Rive monster called");
        
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
      this.riveMonster.play(RiveMonsterComponent.Animations.EAT_HAPPY);
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
    const gameControl = document.getElementById(
      'game-control',
    ) as HTMLCanvasElement;
    button.onClick(() => {
      // this is to revert back the level end element to original z indev value 7
      this.levelEndElement.style.zIndex = '7';
      // making sure this moves at the back since we dont need pause button in the levelend scene bnut this code might be remove when working on the destroy function in FM-329
      gameControl.style.zIndex = '-1';
      onClickCallback();
    });
  }

  buttonCallbackFn(action: 'map' | 'retry' | 'next') {
    if (action === 'map') {
      this.handlePublishEvent(true);
      this.switchToLevelSelectionCB();
    } else {
      let levelData;
      if (action === 'retry') {
        levelData = this.data.levels[this.currentLevel - 1];
      } else if (
        action === 'next' &&
        this.currentLevel < this.data.levels.length
      ) {
        levelData = this.data.levels[this.currentLevel];
      }
  
      const gamePlayData = {
        currentLevelData: {
          ...levelData,
          levelNumber: action === 'next' ? this.currentLevel + 1 : this.currentLevel,
        },
        selectedLevelNumber: action === 'next' ? this.currentLevel + 1 : this.currentLevel,
      };
  
      this.handlePublishEvent(true, gamePlayData);
      this.switchToGameplayCB(gamePlayData);
    }
  }  

  renderButtonsHTML() {
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
  
    // Only add NextButton if not the last level
    if (!this.isLastLevel && this.starCount >= 2) {
      buttonConfigs.push({
        ButtonClass: NextButtonHtml,
        id: 'levelend-next-btn',
        onClick: () => {
          this.buttonCallbackFn('next');
        },
      });
    } else {
      const nextButton = document.getElementById("levelend-next-btn");
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
    // this.monster.dispose();
    this.audioPlayer.stopAllAudios();
    document.removeEventListener('visibilitychange', this.pauseAudios, false);
  };
}
