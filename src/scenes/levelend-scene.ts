import { loadImages } from "@common";
import { CLICK } from "@common/event-names";
import { AudioPlayer } from "@components/audio-player";
import CloseButton from "@components/buttons/close-button";
import NextButton from "@components/buttons/next-button";
import RetryButton from "@components/buttons/retry-button";
import { Monster } from "@components/monster";
import {
  BACKGROUND_ASSET_LIST,
  createBackground,
  loadDynamicBgAssets,
} from "@compositions/background";
import { drawImageOnCanvas } from "@common";
import { LevelEndSceneInterface } from "@interfaces/levelEndSceneInterface";

export class LevelEndScene implements LevelEndSceneInterface {
  public canvas: HTMLCanvasElement;
  public height: number;
  public width: number;
  public images: any;
  public loadedImages: any;
  public imagesLoaded: any;
  public id: string;
  public context: CanvasRenderingContext2D;
  public monster: Monster;
  public closeButton: CloseButton;
  public retryButton: RetryButton;
  public nextButton: NextButton;
  public starCount: number;
  public currentLevel: number;
  public switchToGameplayCB: Function;
  public switchToLevelSelectionCB: Function;
  public data: any;
  public background: any;
  public audioPlayer: AudioPlayer;
  public timeouts: any[];
  public starDrawnCount: number;

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
    this.initializeProperties(
      canvas,
      height,
      width,
      context,
      starCount,
      currentLevel,
      switchToGameplayCB,
      switchToLevelSelectionCB,
      data
    );
    this.monster = this.createMonster(monsterPhaseNumber);
    this.initializeButtons();
    this.audioPlayer = new AudioPlayer();
    this.images = this.loadImages();
    this.addEventListener();
    this.setupBg();
  }

  private initializeProperties(
    canvas,
    height: number,
    width: number,
    context: CanvasRenderingContext2D,
    starCount: number,
    currentLevel: number,
    switchToGameplayCB: Function,
    switchToLevelSelectionCB: Function,
    data: any
  ) {
    this.canvas = canvas;
    this.height = height;
    this.width = width;
    this.context = context;
    this.switchToGameplayCB = switchToGameplayCB;
    this.switchToLevelSelectionCB = switchToLevelSelectionCB;
    this.data = data;
    this.starDrawnCount = 0;
    this.starCount = starCount;
    this.currentLevel = currentLevel;
    this.timeouts = [];
  }

  private createMonster(monsterPhaseNumber: number): Monster {
    return new Monster(
      this.canvas,
      monsterPhaseNumber,
      this.switchToReactionAnimation
    );
  }

  private initializeButtons() {
    this.closeButton = new CloseButton(
      this.context,
      this.canvas,
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
  }

  private loadImages() {
    const images = {
      backgroundImg: "./assets/images/WIN_screen_bg.png",
      star1Img: "./assets/images/pinStar1.png",
      star2Img: "./assets/images/pinStar2.png",
      star3Img: "./assets/images/pinStar3.png",
      winBackgroundImg: "./assets/images/bg_v01.jpg",
    };
    loadImages(images, (loadedImages) => {
      this.loadedImages = { ...loadedImages };
      this.imagesLoaded = true;
      this.starAnimation();
    });
    return images;
  }

  private setupBg = async () => {
    const { BG_GROUP_IMGS, draw } = loadDynamicBgAssets(
      this.currentLevel,
      BACKGROUND_ASSET_LIST
    );
    this.background = await createBackground(
      this.context,
      this.width,
      this.height,
      BG_GROUP_IMGS,
      draw
    );
  };

  switchToReactionAnimation = () => {
    if (this.starCount <= 1) {
      if (document.visibilityState === "visible") {
        this.audioPlayer.playAudio("./assets/audios/LevelLoseFanfare.mp3");
      }
      this.monster.changeToSpitAnimation();
    } else {
      if (document.visibilityState === "visible") {
        this.audioPlayer.playAudio("./assets/audios/LevelWinFanfare.mp3");
        this.audioPlayer.playAudio("./assets/audios/intro.mp3");
      }
      this.monster.changeToEatAnimation();
    }
  };

  draw(deltaTime: number) {
    this.background?.draw();
    if (this.imagesLoaded) {
      drawImageOnCanvas(
        this.context,
        this.loadedImages.backgroundImg,
        0,
        0,
        this.width,
        this.height + this.height * 0.12
      );
      this.drawStars();

      this.monster.update(deltaTime);
      this.closeButton.draw();
      this.retryButton.draw();
      if (this.starCount >= 2) {
        this.nextButton.draw();
      }
    }
  }

  private drawStars() {
    const positions = [
      { img: this.loadedImages.star1Img, x: this.width * 0.2 },
      { img: this.loadedImages.star2Img, x: this.width * 0.5 },
      { img: this.loadedImages.star3Img, x: this.width * 0.82 },
    ];

    positions.forEach((position, index) => {
      if (this.starCount > index && this.starDrawnCount > index) {
        drawImageOnCanvas(
          this.context,
          position.img,
          position.x - (this.width * 0.19) / 2,
          this.height * 0.2,
          this.width * 0.19,
          this.width * 0.19
        );
      }
    });
  }

  starAnimation() {
    const animations = [
      { delay: 500, count: 1 },
      { delay: 1000, count: 2 },
      { delay: 1500, count: 3 },
    ];
    this.timeouts = animations.map((animation) => {
      return setTimeout(() => {
        this.starDrawnCount = animation.count;
      }, animation.delay);
    });
  }

  addEventListener() {
    document
      .getElementById("canvas")
      .addEventListener(CLICK, this.handleMouseClick, false);
    document.addEventListener("visibilitychange", this.pauseAudios, false);
  }

  private handleButtonClick(
    x: number,
    y: number,
    button: any,
    callback: Function,
    args: any = null
  ) {
    if (button.onClick(x, y)) {
      this.audioPlayer.playButtonClickSound();
      callback(args);
    }
  }

  handleMouseClick = (event) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.handleButtonClick(
      x,
      y,
      this.closeButton,
      this.switchToLevelSelectionCB,
      "LevelEnd"
    );
    this.handleButtonClick(x, y, this.retryButton, this.retryLevel);
    if (this.starCount >= 2) {
      this.handleButtonClick(x, y, this.nextButton, this.switchToNextLevel);
    }
  };

  private retryLevel = () => {
    let gamePlayData = {
      currentLevelData: {
        ...this.data.levels[this.currentLevel],
        levelNumber: this.currentLevel,
      },
      selectedLevelNumber: this.currentLevel,
    };
    this.switchToGameplayCB(gamePlayData, "LevelEnd");
  };

  private switchToNextLevel = () => {
    let next = Number(this.currentLevel) + 1;
    let gamePlayData = {
      currentLevelData: { ...this.data.levels[next], levelNumber: next },
      selectedLevelNumber: next,
    };
    this.switchToGameplayCB(gamePlayData, "LevelEnd");
  };

  pauseAudios = () => {
    if (document.visibilityState === "visible") {
      if (this.starCount >= 2) {
        this.audioPlayer.playAudio("./assets/audios/intro.mp3");
      }
    } else {
      this.audioPlayer.stopAllAudios();
    }
  };

  dispose = () => {
    this.monster.dispose();
    this.audioPlayer.stopAllAudios();
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    document
      .getElementById("canvas")
      .removeEventListener(CLICK, this.handleMouseClick, false);
    document.removeEventListener("visibilitychange", this.pauseAudios, false);
  };
}
