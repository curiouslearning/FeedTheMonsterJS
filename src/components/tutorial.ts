import { TutorialLayer } from "../common/common";
import { CanvasStack } from "../utility/canvas-stack";
var self;
var tutorialImg = new Image();
tutorialImg.src = "./assets/images/tutorial_hand.png";

let startX = 0;
let startY = 0;
let endX = 200;
let endY = 100;
export class Tutorial {
  public zindex: number;
  public width: number;
  public height: number;
  public canvasStack: any;
  public id: any;
  public elementId: HTMLCanvasElement;
  public canavsElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public game: any;
  public targetStonePositions: any;
  public startx:number;
  public starty:number;
  public endx:number;
  public endy:number;
  public animationFrame: number;

  constructor(game, zindex?) {
    this.game = game;
    self = this;
    this.zindex = zindex;
    this.width = this.game.width;
    this.height = this.game.height
    this.canvasStack = new CanvasStack("canvas");
    this.startx = startX;
    this.starty = startY;
    this.endx = this.game.width/2;
    this.endy = this.game.height / 2;
    
  }

  createCanvas() {
    this.id = this.canvasStack.createLayer(
      this.height,
      this.width,
      "canvas"
    );
    this.elementId = document.getElementById(
        this.id
      ) as HTMLCanvasElement;
    this.canavsElement = document.getElementById(this.id) as HTMLCanvasElement;
    this.context = this.canavsElement.getContext("2d");
    // this.canavsElement.style.zIndex = "6";
    this.canavsElement.style.bottom = "0";
   
    endX = this.width/2;
    endY = this.height / 2 ;
    // this.animateImage();
    self.elementId.addEventListener('click',function(event){

        console.log('Clicked and touched');
        self.deleteCanvas();
    })
  }

  updateTargetStonePositions(targetStonePosition){
    startX = targetStonePosition[0] - 22;
    startY = targetStonePosition[1] - 50;
    this.startx = targetStonePosition[0] - 22;
    this.starty = targetStonePosition[1] - 50;
  }
  
  changeZindex(index) {
    this.canavsElement.style.zIndex = index;
  }

  deleteCanvas() {
    this.canvasStack.deleteLayer(this.id);
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  } 

  animateImage() {
    let x = startX;
    let y = startY;
    const dx = (this.endx - this.startx) / 60;
    const dy = (this.endy - this.starty) / 60;
    let absdx = Math.abs(dx);
    let absdy = Math.abs(dy);

    function between(x, min, max) {
      return x >= min && x <= max;
    }
  
    setTimeout(() => {
      const startTime = performance.now();
  
      const animate = () => {
        if(between(x,this.startx-15,startX+15) && between(y,this.starty-15,startY+15))
        {
          this.changeZindex(7);
        }
        else{
          this.changeZindex(6);
        }
        if (
          (x <= this.endx + absdx && x >= this.endx - absdx) &&
          (y <= this.endy + absdy && y >= this.endy - absdy)
        ) {
          // setTimeout(() => {
            
           setTimeout(()=>{
            x = this.startx;
            y = this.starty
            cancelAnimationFrame(this.animationFrame);
            this.changeZindex(0);
            // this.animationFrame=requestAnimationFrame(animate)
           },500)

            // setTimeout(()=>{
            //   this.deleteCanvas();
            // },500)
            // requestAnimationFrame(animate);
            // this.deleteCanvas();
          // }, 500);
          return;
        }
  
        x = (dx >= 0) ? x + absdx  : x - absdx;
        y = (dy >= 0) ? y + absdy : y - absdy;
  
        this.draw(x, y);
  
        this.animationFrame=requestAnimationFrame(animate);
        
      };
      this.animationFrame=requestAnimationFrame(animate);
    }, 1500);
  }

  draw(x: number, y: number) {
    //  this.context.clearRect(0, 0, this.width, this.height); // Clear the canvas
     this.context.drawImage(tutorialImg, x, y); 
  }
}
