import { loadImages } from "../../common/common";
import { CLICK, MOUSEUP } from "../common/event-names";
import CloseButton from "../components/buttons/close-button";
import NextButton from "../components/buttons/next-button";
import RetryButton from "../components/buttons/retry-button";
import { Monster } from "../components/monster";
export class LevelEndScene {
  public canvas: any;
  public height: number;
  public width: number;
  public images: any;
  public loadedImages: any;
  public imagesLoaded: any;
  public id: string;
  public context: CanvasRenderingContext2D;
  public monster: Monster;
  public closeButton: any;
  public retryButton: any;
  public nextButton: any;
  public starCount: number;
  public nextLevel: number;
  public switchToGameplayCB: any;
  public switchToLevelSelectionCB: any;
  public data: any;

  constructor(
    canvas: any,
    height: number,
    width: number,
    context: CanvasRenderingContext2D,
    starCount: number,
    nextLevel: number,
    switchToGameplayCB,
    switchToLevelSelectionCB,
    data,
    monsterPhaseNumber: number
  ) {
    this.canvas = canvas;
    this.height = height;
    this.width = width;
    this.context = context;
    this.monster = new Monster(this.canvas, monsterPhaseNumber);
    // console.log(" currentlevelPlayed in levelenEEd: ", currentlevelPlayed.levelNumber);
    this.switchToGameplayCB = switchToGameplayCB;
    this.switchToLevelSelectionCB = switchToLevelSelectionCB;
    this.data = data;

    this.closeButton = new CloseButton(
      context,
      canvas,
      this.width * 0.2 - (this.width * 0.19) / 2,
      this.height * 0.7
    );
    this.retryButton = new RetryButton(
      this.context,
      this.canvas,
      this.width * 0.5 - (this.width * 0.19) / 2,
      this.height * 0.7
    );
    this.nextButton = new NextButton(
      this.context,
      this.width,
      this.height,
      this.width * 0.8 - (this.width * 0.19) / 2,
      this.height * 0.7
    );
    this.starCount = starCount;
    this.nextLevel = nextLevel;
    this.images = {
      backgroundImg: "../../../assets/images/WIN_screen_bg.png",
      star1Img: "../../../assets/images/pinStar1.png",
      star2Img: "../../../assets/images/pinStar2.png",
      star3Img: "../../../assets/images/pinStar3.png",
    };
    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
    });
    // this.draw(16.45);
    this.addEventListener();
  }
  draw(deltaTime: number) {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.loadedImages.backgroundImg,
        0,
        0,
        this.width,
        this.height
      );
      this.drawStars();

      this.monster.animation(deltaTime);
      this.closeButton.draw();
      this.retryButton.draw();
      this.nextButton.draw();
    }
  }
  drawStars() {
    if (this.starCount >= 1) {
      this.context.drawImage(
        this.loadedImages.star1Img,
        this.width * 0.2 - (this.width * 0.19) / 2,
        this.height * 0.2,
        this.width * 0.19,
        this.width * 0.19
      );
      if (this.starCount <= 3 && this.starCount > 1) {
        this.context.drawImage(
          this.loadedImages.star2Img,
          this.width * 0.5 - (this.width * 0.19) / 2,
          this.height * 0.15,
          this.width * 0.19,
          this.width * 0.19
        );
        if (this.starCount >= 3) {
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
  }

  handleMouseClick = (event) => {
    console.log(" levelend mouseclick ");
    const selfElement = <HTMLElement>document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.closeButton.onClick(x, y)) {
      console.log(" close button clicked");

      this.switchToLevelSelectionCB();
    }
    if (this.retryButton.onClick(x, y)) {
      console.log(" retry button clicked");
      let gamePlayData = {
        currentLevelData: this.data.levels[this.nextLevel],
        selectedLevelNumber: this.nextLevel,
      };
      // pass same data as level is same
      this.switchToGameplayCB(gamePlayData);
    }
    if (this.nextButton.onClick(x, y)) {
      let next = Number(this.nextLevel) + 1;
      console.log(typeof next, " next button clicked", next);
      let gamePlayData = {
        currentLevelData: this.data.levels[next],
        selectedLevelNumber: next,
      };

      this.switchToGameplayCB(gamePlayData);
    }
  };

  dispose = () => {
    document
      .getElementById("canvas")
      .removeEventListener(CLICK, this.handleMouseClick, false);
  };
}