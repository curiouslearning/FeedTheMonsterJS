import { loadImages } from "../common/common";
import Sound from "../common/sound";
import { CLICK } from "../common/event-names";
import { AudioPlayer } from "../components/audio-player";
import { Background } from "../components/background";
import CloseButton from "../components/buttons/close-button";
import NextButton from "../components/buttons/next-button";
import RetryButton from "../components/buttons/retry-button";
import { Monster } from "../components/monster";
var self;
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
  public currentLevel: number;
  public switchToGameplayCB: any;
  public switchToLevelSelectionCB: any;
  public data: any;
  public background: any;
  public audioPlayer: any;
  public sound: Sound;
  public timeouts;
  public starDrawnCount:number;
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
    this.sound = new Sound();
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
    // console.log(" currentlevelPlayed in levelenEEd: ", currentlevelPlayed.levelNumber);
    this.switchToGameplayCB = switchToGameplayCB;
    this.switchToLevelSelectionCB = switchToLevelSelectionCB;
    this.data = data;
    this.starDrawnCount=0;
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
    // this.draw(16.45);
    this.addEventListener();
    self = this;
    this.audioPlayer = new AudioPlayer();
  }
  switchToReactionAnimation() {
    if (self.starCount <= 1) {
      if (document.visibilityState === "visible") {
      self.sound.playSound("./assets/audios/LevelLoseFanfare.mp3");
      }
      self.monster.changeToSpitAnimation();
    } else {
      if (document.visibilityState === "visible") {
      self.sound.playSound("./assets/audios/LevelWinFanfare.mp3");
      self.sound.playSound("./assets/audios/intro.mp3");
    } 
      self.monster.changeToEatAnimation();
    }
  }
  draw(deltaTime: number) {
    this.background.draw();
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
      if(this.starCount>=2){
      this.nextButton.draw();
      }
    }
  }
  starAnimation(){
    const animations = [
      { delay: 500, count: 1 },
      { delay: 1000, count: 2 },
      { delay: 1500, count: 3 }
    ];

    this.timeouts = animations.map(animation => {
      return setTimeout(() => {
        this.starDrawnCount = animation.count;
      }, animation.delay);
    });
  }
  drawStars() {
    if (this.starCount >= 1&&this.starDrawnCount>=1) {
      this.context.drawImage(
        this.loadedImages.star1Img,
        this.width * 0.2 - (this.width * 0.19) / 2,
        this.height * 0.2,
        this.width * 0.19,
        this.width * 0.19
      );
      
      if (this.starCount <= 3 && this.starCount > 1&&this.starDrawnCount <= 3 && this.starDrawnCount > 1) {
        this.context.drawImage(
          this.loadedImages.star2Img,
          this.width * 0.5 - (this.width * 0.19) / 2,
          this.height * 0.15,
          this.width * 0.19,
          this.width * 0.19
        );
        if (this.starCount >= 3&&this.starDrawnCount >= 3) {
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
    console.log(" levelend mouseclick ");
    const selfElement = <HTMLElement>document.getElementById("canvas");
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.closeButton.onClick(x, y)) {
      this.audioPlayer.playAudio(false, "./assets/audios/ButtonClick.mp3");
      console.log(" close button clicked");

      this.switchToLevelSelectionCB("LevelEnd");
    }
    if (this.retryButton.onClick(x, y)) {
      this.audioPlayer.playAudio(false, "./assets/audios/ButtonClick.mp3");
      console.log(" retry button clicked");
      let gamePlayData = {
        currentLevelData: this.data.levels[this.currentLevel],
        selectedLevelNumber: this.currentLevel,
      };
      // pass same data as level is same
      this.switchToGameplayCB(gamePlayData, "LevelEnd");
    }
    if (this.nextButton.onClick(x, y) && this.starCount >=2) {
      this.audioPlayer.playAudio(false, "./assets/audios/ButtonClick.mp3");
      let next = Number(this.currentLevel) + 1;
      console.log(typeof next, " next button clicked", next);
      let gamePlayData = {
        currentLevelData: this.data.levels[next],
        selectedLevelNumber: next,
      };

      this.switchToGameplayCB(gamePlayData, "LevelEnd");
    }
  };
  pauseAudios(){
    if (document.visibilityState === "visible") {
      if(self.starCount >=2){
        self.sound.playSound("./assets/audios/intro.mp3");
      }
    }else{
      self.sound.pauseSound();
    }
  }
  dispose = () => {
    this.sound.pauseSound();
    self.audioPlayer.stopAudio();
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    document
      .getElementById("canvas")
      .removeEventListener(CLICK, this.handleMouseClick, false);
      document.removeEventListener(
        "visibilitychange",
        this.pauseAudios,
        false
      );
  };
}
