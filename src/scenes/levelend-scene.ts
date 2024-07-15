import { loadImages } from "../common/common";
import { CLICK } from "../common/event-names";
import { AudioPlayer } from "../components/audio-player";
import { Background } from "../components/background";
import CloseButton from "../components/buttons/close-button";
import NextButton from "../components/buttons/next-button";
import RetryButton from "../components/buttons/retry-button";
import { Monster } from "../components/monster";

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
  public background: Background;
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
    this.background = new Background(
      this.context,
      this.width,
      this.height,
      currentLevel
    );

    this.switchToGameplayCB = switchToGameplayCB;
    this.switchToLevelSelectionCB = switchToLevelSelectionCB;
    this.data = data;
    this.starDrawnCount = 0;
    this.closeButton = new CloseButton(
      context,
      canvas,
      this.width * 0.2 - (this.width * 0.19) / 2,
      this.height /1.25
    );
    this.retryButton = new RetryButton(
      this.context,
      this.canvas,
      this.width * 0.5 - (this.width * 0.19) / 2,
      this.height /1.25
    );
    this.nextButton = new NextButton(
      this.context,
      this.width,
      this.height,
      this.width * 0.8 - (this.width * 0.19) / 2,
      this.height /1.25
    );
    this.audioPlayer = new AudioPlayer();
    this.starCount = starCount;
    this.currentLevel = currentLevel;
    this.images = {
      backgroundImg: "./assets/images/WIN_screen_bg.png",
      star1Img: "./assets/images/pinStar1.png",
      star2Img: "./assets/images/pinStar2.png",
      star3Img: "./assets/images/pinStar3.png",
      winBackgroundImg: "./assets/images/bg_v01.jpg",
    };
    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
      this.starAnimation();
    });
    this.addEventListener();
    this.audioPlayer = new AudioPlayer();
  }
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
    this.background.draw();
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.loadedImages.backgroundImg,
        0,
        0,
        this.width,
        this.height+this.height*0.12
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
    // console.log(" levelend mouseclick ");
    const selfElement:HTMLElement =document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.closeButton.onClick(x, y)) {
      this.audioPlayer.playButtonClickSound("./assets/audios/ButtonClick.mp3");
      // console.log(" close button clicked");

      this.switchToLevelSelectionCB("LevelEnd");
    }
    if (this.retryButton.onClick(x, y)) {
      this.audioPlayer.playButtonClickSound("./assets/audios/ButtonClick.mp3");
      // console.log(" retry button clicked");
      let gamePlayData = {
        currentLevelData: this.data.levels[this.currentLevel],
        selectedLevelNumber: this.currentLevel,
      };
      // pass same data as level is same
      this.switchToGameplayCB(gamePlayData, "LevelEnd");
    }
    if (this.nextButton.onClick(x, y) && this.starCount >= 2) {
      this.audioPlayer.playButtonClickSound("./assets/audios/ButtonClick.mp3");
      let next = Number(this.currentLevel) + 1;
      // console.log(typeof next, " next button clicked", next);
      let gamePlayData = {
        currentLevelData: this.data.levels[next],
        selectedLevelNumber: next,
      };

      this.switchToGameplayCB(gamePlayData, "LevelEnd");
    }
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
    this.audioPlayer.stopAllAudios();
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    document
      .getElementById("canvas")
      .removeEventListener(CLICK, this.handleMouseClick, false);
    document.removeEventListener("visibilitychange", this.pauseAudios, false);
  };
}
