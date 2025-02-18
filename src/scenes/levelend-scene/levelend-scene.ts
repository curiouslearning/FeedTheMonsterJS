import { CLICK, isDocumentVisible } from '@common';
import { AudioPlayer } from '@components';
import { MapButton, NextButtonHtml, RetryButtonHtml } from '@components/buttons';
import {
  AUDIO_INTRO,
  AUDIO_LEVEL_LOSE,
  AUDIO_LEVEL_WIN,
  EVOL_MONSTER,
  PIN_STAR_1,
  PIN_STAR_2,
  PIN_STAR_3,
  SCENE_NAME_LEVEL_SELECT,
  SCENE_NAME_GAME_PLAY,
  MONSTER_PHASES
} from '@constants';
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import './levelend-scene.scss';
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';
import { BaseHTML } from '@components/baseHTML/base-html';

export class LevelEndScene {
  static renderButtonsHTML() {
    throw new Error('Method not implemented.');
  }

  public starCount: number;
  public currentLevel: number;
  public monsterPhaseNumber: number;
  public newPhaseNumber: number;
  public data: any;
  public audioPlayer: AudioPlayer;
  public isLastLevel: boolean;
  public levelEndElement = document.getElementById('levelEnd');
  private backgroundElement: BaseHTML;
  public nextButtonInstance: NextButtonHtml;
  public retryButtonInstance: RetryButtonHtml;
  public mapButtonInstance: MapButton;
  public riveMonster: RiveMonsterComponent;
  public canvasElement: HTMLCanvasElement;
  private readonly EVOLUTION_ANIMATION_DELAY = 5500;
  private starAnimationTimeouts: number[] = [];
  private evolutionTimeout: number | null = null;
  public evolveMonster: boolean;

  constructor() {
    const { starCount, currentLevel, data, monsterPhaseNumber } = gameStateService.getLevelEndSceneData();
    const { isLastLevel } = gameStateService.getGamePlaySceneDetails();
    this.monsterPhaseNumber = gameStateService.checkMonsterPhaseUpdation();
    this.evolveMonster = this.monsterPhaseNumber > monsterPhaseNumber;
    this.canvasElement = gameSettingsService.getRiveCanvasValue();
    this.data = data;
    this.audioPlayer = new AudioPlayer();
    this.starCount = starCount;
    this.currentLevel = currentLevel;
    this.isLastLevel = isLastLevel;
    this.initializeRiveMonster(monsterPhaseNumber);
    this.toggleLevelEndBackground(true);
    this.showLevelEndScreen(); // Display the level end screen
    this.addEventListener();
    this.renderStarsHTML();
    // Call switchToReactionAnimation during initialization
    this.switchToReactionAnimation();
    // trigger monster evolution animation
    /**
     * This is the value to determine if we need to trigger evolution animation or not
     */
  }

  initializeRiveMonster(oldMonsterPhaseNumber: number) {
    // Initialize the RiveMonsterComponent instead of directly using Rive
    this.riveMonster = new RiveMonsterComponent({
      canvas: this.canvasElement,
      autoplay: true,
      fit: "contain",
      alignment: "topCenter",
      src: MONSTER_PHASES[oldMonsterPhaseNumber], //use old asset before evolution.
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
      if (this.riveMonster) this.riveMonster.play(RiveMonsterComponent.Animations.SAD);
    } else {
      if (isDocumentVisible()) {
        this.audioPlayer.playAudio(AUDIO_LEVEL_WIN);
        this.audioPlayer.playAudio(AUDIO_INTRO);
      }
      if (this.riveMonster) this.riveMonster.play(RiveMonsterComponent.Animations.HAPPY);
    }
  };

  private initializeEvolutionBackground() {
    return new BaseHTML(
      {
        selectors: { root: '#background' }
      },
      'levelend-background',
      (id) => (`<div id="${id}"></div>`),
      true
    );
  }

  setCanvasPosition(position: 'evolution' | 'normal') {
    const CANVAS_POSITIONS = {
      evolution: {
        zIndex: '13',
      },
      normal: {
        zIndex: '4',
      }
    };

    const pos = CANVAS_POSITIONS[position];

    this.canvasElement.style.zIndex = pos.zIndex;
  }

  private handleEvolutionComplete = () => {
    const bgElement = document.getElementById('levelend-background');
    if (bgElement) {
      bgElement.classList.add('fade-out');
    }
    this.setCanvasPosition('normal');
  };

  /**
   * Returns the appropriate monster evolution animation source based on the phase
   * @param {number} phase - The current phase of monster evolution (1-3)
   * @returns {string} The path to the Rive animation file for the specified phase
   * @description Maps different monster evolution phases to their corresponding animation files.
   * If the specified phase is not found in the map, it falls back to the first evolution animation.
   * @example
   * // Get evolution animation for phase 1
   * const evolutionSrc = getEvolutionSource(1); // returns MONSTER_EVOLUTION[2]
   */
  private getEvolutionSource(phase: number): string {
    // Map different evolution animations based on phase
    const evolutionMap = {
      1: EVOL_MONSTER[0],
      // Add more evoluition phases as needed
    };

    return evolutionMap[phase] || EVOL_MONSTER[1]; // fallback to first evolution if phase not found
  }

  private initializeEvolutionMonster() {
    // need to dispose first. making sure that it wont go back to the old state after animating
    this.riveMonster.dispose();
    const evolutionSrc = this.getEvolutionSource(1);

    return new RiveMonsterComponent({
      canvas: this.canvasElement,
      autoplay: true,
      src: evolutionSrc,
      isEvolving: this.evolveMonster,
    });
  }

  runEvolutionAnimation() {
    if (this.evolveMonster) {
      this.riveMonster = this.initializeEvolutionMonster();
      this.backgroundElement = this.initializeEvolutionBackground();

      // Set initial position for evolution
      this.setCanvasPosition('evolution');

      // Schedule evolution completion
      setTimeout(() => {
        this.handleEvolutionComplete()
        //update the record in game state.
        gameStateService.updateMonsterPhaseState(this.monsterPhaseNumber);
      }, this.EVOLUTION_ANIMATION_DELAY);
    }
  }

  renderStarsHTML() {
    const starsContainer = document.querySelector('.stars-container');
    if (!starsContainer) return;

    // Clear any existing timeouts and previously rendered stars
    this.clearStarAnimationTimeouts();
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
      const showTimeout = window.setTimeout(() => {
        starImg.classList.add('show');

        // Initialize Rive monster after the last star animation only if conditions are met
        if (i === this.starCount - 1) {
          this.evolutionTimeout = window.setTimeout(() => {
            // Only initialize if current level stars >= 2
            if (this.starCount >= 2) {
              this.callEvolutionAnimation();
            }
          }, 500); // Wait another half second after last star appears
        }
      }, i * 500); // Half-second delay between each star

      this.starAnimationTimeouts = [...this.starAnimationTimeouts, showTimeout];
    }
  }

  callEvolutionAnimation() {
    console.log('All stars have been rendered and phase '+ this.monsterPhaseNumber + ' monster loaded');
    this.riveMonster.changePhase(this.monsterPhaseNumber);
    // Additional logic can be added here
    this.runEvolutionAnimation();
  }

  private clearStarAnimationTimeouts() {
    // Clear star animation timeouts
    this.starAnimationTimeouts.forEach(timeout => window.clearTimeout(timeout));
    this.starAnimationTimeouts = [];

    // Clear evolution timeout
    if (this.evolutionTimeout) {
      window.clearTimeout(this.evolutionTimeout);
      this.evolutionTimeout = null;
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

    const button = new ButtonClass({ targetId: buttonsContainerId, id });

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
      gameStateService.publish(
        gameStateService.EVENTS.SWITCH_SCENE_EVENT,
        SCENE_NAME_GAME_PLAY,
      );
    };

    switch (action) {
      case 'map':
        this.handlePublishEvent(true);
        gameStateService.publish(
          gameStateService.EVENTS.SWITCH_SCENE_EVENT,
          SCENE_NAME_LEVEL_SELECT,
        );
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
    // Clear all timeouts first
    this.clearStarAnimationTimeouts();

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

    if (this.backgroundElement) this.backgroundElement.destroy();
    if (this.riveMonster) {
      this.riveMonster.dispose();
    }
  };
}