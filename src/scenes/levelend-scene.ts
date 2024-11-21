import { loadImages, CLICK, isDocumentVisible } from "@common";
import { AudioPlayer } from "@components";
import { CloseButton, NextButton, RetryButton } from "@buttons";
import {
  AUDIO_INTRO,
  AUDIO_LEVEL_LOSE,
  AUDIO_LEVEL_WIN,
  PIN_STAR_1,
  PIN_STAR_2,
  PIN_STAR_3,
} from "@constants";
import gameStateService from '@gameStateService';

export class LevelEndScene {
  public canvas: HTMLCanvasElement;
  public height: number;
  public width: number;
  public context: CanvasRenderingContext2D;
  public closeButton: CloseButton;
  public retryButton: RetryButton;
  public nextButton: NextButton;
  public starCount: number;
  public currentLevel: number;
  public switchToGameplayCB: Function;
  public switchToLevelSelectionCB: Function;
  public data: any;
  public audioPlayer: AudioPlayer;
  public isLastLevel: boolean;
  public levelEndElement = document.getElementById("levelEnd");
  constructor(
    canvas: any,
    height: number,
    width: number,
    context: CanvasRenderingContext2D,
    starCount: number,
    currentLevel: number,
    switchToGameplayCB,
    switchToLevelSelectionCB,
    data,
    monsterPhaseNumber: number
  ) {
    this.canvas = canvas;
    this.height = height;
    this.width = width;
    this.context = context;
    this.switchToGameplayCB = switchToGameplayCB;
    this.switchToLevelSelectionCB = switchToLevelSelectionCB;
    this.data = data;
    this.canvas.style.zIndex = "8";
    this.closeButton = new CloseButton(
      context,
      canvas,
      this.width * 0.2 - (this.width * 0.19) / 2,
      this.height / 1.25
    );
    this.retryButton = new RetryButton(
      this.context,
      this.canvas,
      this.width * 0.5 - (this.width * 0.19) / 2,
      this.height / 1.25
    );
    this.nextButton = new NextButton(
      this.context,
      this.width,
      this.height,
      this.width * 0.8 - (this.width * 0.19) / 2,
      this.height / 1.25
    );
    this.audioPlayer = new AudioPlayer();
    this.starCount = starCount;
    this.currentLevel = currentLevel;
    // Subscribe to the LEVEL_END_BACKGROUND_TOGGLE event
    this.toggleLevelEndBackground(true);
    this.isLastLevel =
      this.currentLevel !==
      this.data.levels[this.data.levels.length - 1].levelMeta.levelNumber &&
      this.starCount >= 2;
    // this.monster = new Monster(
    //   this.canvas,
    //   monsterPhaseNumber,
    //   this.switchToReactionAnimation
    // );
    this.showLevelEndScreen();  // Display the level end screen
    this.addEventListener();
    this.renderStarsHTML();
  }
  // Method to show/hide the Level End background
  toggleLevelEndBackground = (shouldShow: boolean) => {
    if (this.levelEndElement) {
      this.levelEndElement.style.display = shouldShow ? 'block' : 'none';
    }
  };

  // Call this method where necessary to show the background when level ends
  showLevelEndScreen() {
    this.toggleLevelEndBackground(true); // Publish show event
    // Render the stars dynamically based on the star count
    this.renderStarsHTML();
  }

  switchToReactionAnimation = () => {
    if (this.starCount <= 1) {
      if (isDocumentVisible()) {
        this.audioPlayer.playAudio(AUDIO_LEVEL_LOSE);
      }
      // this.monster.changeToSpitAnimation(); //Commenting to handle interactive animation
    } else {
      if (isDocumentVisible()) {
        this.audioPlayer.playAudio(AUDIO_LEVEL_WIN);
        this.audioPlayer.playAudio(AUDIO_INTRO);
      }
      // this.monster.changeToEatAnimation();  //Commenting to handle interactive animation
    }
  };

  draw(deltaTime?: number) {
    // No background drawing here as it's handled in HTML
    // Draw buttons
    this.closeButton.draw();
    this.retryButton.draw();
    this.isLastLevel && this.nextButton.draw();
  }

  renderStarsHTML() {
    const starsContainer = document.querySelector(".stars-container");

    // Clear any previously rendered stars
    starsContainer.innerHTML = '';

    const starImages = [
      PIN_STAR_1, // Path to star 1 image
      PIN_STAR_2, // Path to star 2 image
      PIN_STAR_3, // Path to star 3 image
    ];

    for (let i = 0; i < this.starCount; i++) {
      const starImg = document.createElement("img");
      starImg.src = starImages[i];  // Set the star image source
      starImg.alt = `Star ${i + 1}`;
      starImg.classList.add('stars', `star${i + 1}`);
      starsContainer.appendChild(starImg);  // Add star to the container
    }
  }

  addEventListener() {
    document
      .getElementById("canvas")
      .addEventListener(CLICK, this.handleMouseClick, false);
    document.addEventListener("visibilitychange", this.pauseAudios, false);
  }

  private handlePublishEvent(shouldShowLoading: boolean, gamePlayData = null) {
    if (gamePlayData) {
      gameStateService.publish(gameStateService.EVENTS.GAMEPLAY_DATA_EVENT, gamePlayData);
    }
    gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, shouldShowLoading);
    setTimeout(() => {
      this.toggleLevelEndBackground(!shouldShowLoading);
    },
    800);

  }

  handleMouseClick = (event) => {
    const selfElement: HTMLElement = document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.closeButton.onClick(x, y)) {
      this.audioPlayer.playButtonClickSound();
      this.handlePublishEvent(true);
      this.switchToLevelSelectionCB();
    }
    if (this.retryButton.onClick(x, y)) {
      this.audioPlayer.playButtonClickSound();
      const gamePlayData = {
        currentLevelData: {
          ...this.data.levels[this.currentLevel],
          levelNumber: this.currentLevel,
        },
        selectedLevelNumber: this.currentLevel,
      };
      // pass same data as level is same
      this.handlePublishEvent(true, gamePlayData);
      this.switchToGameplayCB();
    }
    if (this.isLastLevel && this.nextButton.onClick(x, y)) {
      this.audioPlayer.playButtonClickSound();
      const next = Number(this.currentLevel) + 1;
      const gamePlayData = {
        currentLevelData: { ...this.data.levels[next], levelNumber: next },
        selectedLevelNumber: next,
      };
      this.handlePublishEvent(true, gamePlayData);
      this.switchToGameplayCB();
    }
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
    document
      .getElementById("canvas")
      .removeEventListener(CLICK, this.handleMouseClick, false);
    document.removeEventListener("visibilitychange", this.pauseAudios, false);
  };
}
