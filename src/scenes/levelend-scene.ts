import { loadImages, CLICK, isDocumentVisible } from "@common";
import { AudioPlayer, Monster } from "@components";
import { CloseButton, NextButton, RetryButton } from "@buttons";
import {
  BACKGROUND_ASSET_LIST,
  createBackground,
  loadDynamicBgAssets,
} from "@compositions";
import {
  AUDIO_INTRO,
  AUDIO_LEVEL_LOSE,
  AUDIO_LEVEL_WIN,
  DEFAULT_BACKGROUND_1,
  PIN_STAR_1,
  PIN_STAR_2,
  PIN_STAR_3,
  WIN_BG,
} from "@constants";

export class LevelEndScene {
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
    this.canvas = canvas;
    this.height = height;
    this.width = width;
    this.context = context;
    this.monster = new Monster(
      this.canvas,
      monsterPhaseNumber,
      this.switchToReactionAnimation
    );

    this.switchToGameplayCB = switchToGameplayCB;
    this.switchToLevelSelectionCB = switchToLevelSelectionCB;
    this.data = data;
    this.starDrawnCount = 0;
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
    this.images = {
      backgroundImg: WIN_BG,
      star1Img: PIN_STAR_1,
      star2Img: PIN_STAR_2,
      star3Img: PIN_STAR_3,
      winBackgroundImg: DEFAULT_BACKGROUND_1,
    };
    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
      this.starAnimation();
    });
    this.addEventListener();
    this.audioPlayer = new AudioPlayer();
    this.setupBg();
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
      if (isDocumentVisible()) {
        this.audioPlayer.playAudio(AUDIO_LEVEL_LOSE);
      }
      this.monster.changeToSpitAnimation();
    } else {
      if (isDocumentVisible()) {
        this.audioPlayer.playAudio(AUDIO_LEVEL_WIN);
        this.audioPlayer.playAudio(AUDIO_INTRO);
      }
      this.monster.changeToEatAnimation();
    }
  };
  draw(deltaTime: number) {
    this.background?.draw();
    if (this.imagesLoaded) {
      this.context.drawImage(
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
  drawStars() {
    if (this.starCount >= 1 && this.starDrawnCount >= 1) {
      this.context.drawImage(
        this.loadedImages.star1Img,
        this.width * 0.2 - (this.width * 0.19) / 2,
        this.height * 0.2,
        this.width * 0.19,
        this.width * 0.19
      );

      if (
        this.starCount <= 3 &&
        this.starCount > 1 &&
        this.starDrawnCount <= 3 &&
        this.starDrawnCount > 1
      ) {
        this.context.drawImage(
          this.loadedImages.star2Img,
          this.width * 0.5 - (this.width * 0.19) / 2,
          this.height * 0.15,
          this.width * 0.19,
          this.width * 0.19
        );
        if (this.starCount >= 3 && this.starDrawnCount >= 3) {
          this.context.drawImage(
            this.loadedImages.star3Img,
            this.width * 0.82 - (this.width * 0.19) / 2,
            this.height * 0.2,
            this.width * 0.19,
            this.width * 0.19
          );
        }
      }
    }
  }
  addEventListener() {
    document
      .getElementById("canvas")
      .addEventListener(CLICK, this.handleMouseClick, false);
    document.addEventListener("visibilitychange", this.pauseAudios, false);
  }

  handleMouseClick = (event) => {
    const selfElement:HTMLElement =document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.closeButton.onClick(x, y)) {
      this.audioPlayer.playButtonClickSound();
      this.switchToLevelSelectionCB("LevelEnd");
    }
    if (this.retryButton.onClick(x, y)) {
      this.audioPlayer.playButtonClickSound();
      let gamePlayData = {
        currentLevelData: {
          ...this.data.levels[this.currentLevel],
          levelNumber: this.currentLevel,
        },
        selectedLevelNumber: this.currentLevel,
      };
      // pass same data as level is same
      this.switchToGameplayCB(gamePlayData, "LevelEnd");
    }
    if (this.nextButton.onClick(x, y) && this.starCount >= 2) {
      this.audioPlayer.playButtonClickSound();
      let next = Number(this.currentLevel) + 1;
      let gamePlayData = {
        currentLevelData: { ...this.data.levels[next], levelNumber: next },
        selectedLevelNumber: next,
      };

      this.switchToGameplayCB(gamePlayData, "LevelEnd");
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
    this.monster.dispose();
    this.audioPlayer.stopAllAudios();
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    document
      .getElementById("canvas")
      .removeEventListener(CLICK, this.handleMouseClick, false);
    document.removeEventListener("visibilitychange", this.pauseAudios, false);
  };
}
