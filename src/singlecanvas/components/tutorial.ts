
var self;
let startX = 0;
let startY = 0;
let endX = 200;
let endY = 100;
export class Tutorial {
    public width: number;
    public height: number;
    public context: CanvasRenderingContext2D;
    public tutorialImg: any;
    public imagesLoaded: boolean = false;
    // public game: any;
    public targetStonePositions: any;
    public startx: number;
    public starty: number;
    public endx: number;
    public endy: number;
    public endTutorial: boolean = false;
    x: number;
    y: number;
    dx: number;
    dy: number;
    absdx: number;
    absdy: number;

    constructor(context, width, height) {
        // this.game = game;
        self = this;
        this.width = width;
        this.height = height;
        this.context = context;
        this.startx = startX;
        this.starty = startY;
        this.endx = this.width / 2;
        this.endy = this.height / 2-30;

        this.tutorialImg = new Image();
        this.tutorialImg.src = "./assets/images/tutorial_hand.png";
        this.tutorialImg.onload = () => {
            this.imagesLoaded = true;
        }
    }

    updateTargetStonePositions(targetStonePosition) {
        startX = targetStonePosition[0] - 22;
        startY = targetStonePosition[1] - 50;
        this.startx = targetStonePosition[0] - 22;
        this.starty = targetStonePosition[1] - 50;
        this.animateImage();
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }

    setTutorialEnd(endTutorial){
        this.endTutorial = endTutorial;

    }

    animateImage() {
        this.x = startX;
        this.y = startY;
        this.dx = (this.endx - this.startx) / 5000;
        this.dy = (this.endy - this.starty) / 5000;
        this.absdx = this.isMobile() ? Math.abs(this.dx) * 3 : Math.abs(this.dx);
        this.absdy = this.isMobile() ? Math.abs(this.dy) * 3 : Math.abs(this.dy);
        this.setTutorialEnd(false);
    }

    draw(deltaTime) {
        if (this.imagesLoaded && !this.endTutorial) {
                this.x =
                this.dx >= 0
                    ? this.x + this.absdx * (deltaTime) 
                    : this.x - this.absdx * (deltaTime) ;
                this.y =
                    this.dy >= 0
                        ? this.y + this.absdy * deltaTime
                        : this.y - this.absdy * deltaTime ;
                const disx = this.x - this.endx + this.absdx;
                const disy = this.y - this.endy + this.absdy;
                const distance = Math.sqrt(disx * disx + disy * disy);
                if (distance < 1) {
                    this.endTutorial = true;
                    // GameFields.tutorialStatus = true;
                
                }
                this.context.drawImage(this.tutorialImg, this.x, this.y);
          
        }
    }
}