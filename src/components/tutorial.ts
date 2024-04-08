import { createRippleEffect } from "../common/utils";
import { GameScore } from "../data/game-score";

export class Tutorial {
  public width: number;
  public height: number;
  public context: CanvasRenderingContext2D;
  public tutorialImg: any;
  public imagesLoaded: boolean = false;
  public targetStonePositions: any;
  public startx: number;
  public starty: number;
  public endx: number;
  public endy: number;
  public endTutorial: boolean = false;
  public puzzleNumber: number;
  public playMnstrClkTtrlAnim: boolean = true;
  public totalTime: number = 0;
  private monsterStoneDifference:number=0;
  x: number;
  y: number;
  dx: number;
  dy: number;
  absdx: number;
  absdy: number;
  startRipple: boolean = false;
  drawRipple: (x: number, y: number, restart?: boolean) => void;

  constructor(context, width, height, puzzleNumber?) {
    this.width = width;
    this.height = height;
    this.context = context;
    this.startx = 0;
    this.starty = 0;
    this.endx = this.width / 2;
    this.endy = this.height / 2 - 30;
    this.puzzleNumber = (puzzleNumber>=0)?puzzleNumber:null;
    this.tutorialImg = new Image();
    this.tutorialImg.src = "./assets/images/tutorial_hand.png";
    this.drawRipple = createRippleEffect(this.context)
    this.tutorialImg.onload = () => {
      this.imagesLoaded = true;
    };
  }

  updateTargetStonePositions(targetStonePosition: number[]) {
    this.startx = targetStonePosition[0] - 22;
    this.starty = targetStonePosition[1] - 50;
    this.monsterStoneDifference = Math.sqrt((this.startx - this.endx) * (this.startx - this.endx) + (this.starty - this.endy) * (this.starty - this.endy));
    this.animateImage();
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  setTutorialEnd(endTutorial: boolean) {
    this.endTutorial = endTutorial;
  }

  animateImage() {
    this.x = this.startx;
    this.y = this.starty;
    this.dx = (this.endx - this.startx) / 5000;
    this.dy = (this.endy - this.starty) / 5000;
    this.absdx = this.isMobile() ? Math.abs(this.dx) * 3 : Math.abs(this.dx);
    this.absdy = this.isMobile() ? Math.abs(this.dy) * 3 : Math.abs(this.dy);
    this.setTutorialEnd(false);
  }

  draw(deltaTime: number,img:CanvasImageSource,imageSize:number) {
    if (this.imagesLoaded && !this.endTutorial && this.shouldPlayTutorial()) {
      this.x =
        this.dx >= 0
          ? this.x + this.absdx * deltaTime
          : this.x - this.absdx * deltaTime;
      this.y =
        this.dy >= 0
          ? this.y + this.absdy * deltaTime
          : this.y - this.absdy * deltaTime;
      const disx = this.x - this.endx + this.absdx;
      const disy = this.y - this.endy + this.absdy;
      const distance = Math.sqrt(disx * disx + disy * disy);
      let monsterStoneDifferenceInPercentage=(100*distance/this.monsterStoneDifference);
      if (monsterStoneDifferenceInPercentage < 15) {
        if(monsterStoneDifferenceInPercentage>1){
        this.createHandScaleAnimation(deltaTime,this.endx,this.endy,true)
      }else{
        this.x=this.startx; 
        this.y=this.starty;
      }}else if(monsterStoneDifferenceInPercentage>80){
        this.createHandScaleAnimation(deltaTime,this.startx+15,this.starty+10,false);
      }else{
      let previousAlpha = this.context.globalAlpha;
      this.context.globalAlpha = 0.4;
      this.context.drawImage(img, this.x, this.y + 20, imageSize, imageSize);
      this.context.globalAlpha = previousAlpha;
      this.context.drawImage(this.tutorialImg, this.x + 15, this.y + 10);//draws the hand stone drag animation!
    }}
  }
 createHandScaleAnimation(deltaTime:number,offsetX:number,offsetY:number,shouldCreateRipple:boolean) {
    this.totalTime += Math.floor(deltaTime);
    const transitionDuration = 500;
    const scaleFactor = this.sinusoidalInterpolation(this.totalTime, 1, 1.5, transitionDuration);
    const scaledWidth = this.tutorialImg.width * scaleFactor;
    const scaledHeight = this.tutorialImg.height * scaleFactor;
    this.context.drawImage(this.tutorialImg, offsetX, offsetY, scaledWidth, scaledHeight);
    shouldCreateRipple?(null):(this.drawRipple(offsetX+this.width*0.02,offsetY+this.tutorialImg.height/2,false))
    
    
}
sinusoidalInterpolation(time, minScale, maxScale, duration) {
    const amplitude = (maxScale - minScale) / 2;
    const frequency = Math.PI / duration;
    return minScale + amplitude * Math.sin(frequency * time);
}
  
  clickOnMonsterTutorial(deltaTime) {
    if (this.shouldPlayMonsterClickTutorialAnimation) {
        const transitionDuration = 2000;
        const bottomPosition = this.height /2.2 + (this.tutorialImg.height/0.8 );
        const topPosition = this.height / 2.2 + (this.tutorialImg.height/0.8 )- this.tutorialImg.height;
        let currentOffsetY;
        const offsetX = this.endx;
        if (this.totalTime < transitionDuration / 2) {
            currentOffsetY = topPosition + (this.totalTime / (transitionDuration / 2)) * (bottomPosition - topPosition);
            this.drawRipple(offsetX, this.height / 2.2 + (this.tutorialImg.height / 1.8), true)
        } else {
            currentOffsetY = bottomPosition - ((this.totalTime - transitionDuration / 2) / (transitionDuration / 2)) * (bottomPosition - topPosition);
            this.drawRipple(offsetX, this.height / 2.2 + (this.tutorialImg.height)+ this.tutorialImg.height)
        }
        this.context.drawImage(
            this.tutorialImg,
            offsetX,
            currentOffsetY,
            this.tutorialImg.width,
            this.tutorialImg.height
        );
  
        if (currentOffsetY <= topPosition) {
            this.totalTime = 0;
        }
        this.totalTime += deltaTime;
    }
  }


  shouldPlayTutorial(): boolean {
    let playDragAnimationForFirstPuzzle =
      GameScore.getAllGameLevelInfo().length <= 0 && this.puzzleNumber == 0;
    return playDragAnimationForFirstPuzzle;
  }

  shouldPlayMonsterClickTutorialAnimation(): boolean{
    let playDragAnimationForFirstPuzzle =
      GameScore.getAllGameLevelInfo().length <= 0 && this.playMnstrClkTtrlAnim;
    return playDragAnimationForFirstPuzzle;
  }

  setPuzzleNumber(puzzleNumer: number) {
    this.puzzleNumber = puzzleNumer;
  }

  setPlayMonsterClickAnimation(value: boolean) {
    this.playMnstrClkTtrlAnim = value;
  }
}
