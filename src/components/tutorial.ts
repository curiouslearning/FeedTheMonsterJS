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
    public totalTime: number = 0;
    public playMonsterClickTutorial: boolean = true;
    x: number;
    y: number;
    dx: number;
    dy: number;
    absdx: number;
    absdy: number;

    constructor(context, width, height, puzzleNumber?) {
        this.width = width;
        this.height = height;
        this.context = context;
        this.startx = 0;
        this.starty = 0;
        this.endx = this.width / 2;
        this.endy = this.height / 2 ;
        // this.puzzleNumber = puzzleNumber
        console.log('PuzzleNumber-->',puzzleNumber);
        this.puzzleNumber = (puzzleNumber>=0)?puzzleNumber:null;
        console.log('PuzzleNumber2-->',this.puzzleNumber);
        this.tutorialImg = new Image();
        this.tutorialImg.src = "./assets/images/tutorial_hand.png";
        this.tutorialImg.onload = () => {
            this.imagesLoaded = true;
        }

    }

    updateTargetStonePositions(targetStonePosition: number[]) {
        this.startx = targetStonePosition[0] - 22;
        this.starty = targetStonePosition[1] - 50;
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

    draw(deltaTime: number) {
        if (this.imagesLoaded && !this.endTutorial && this.shouldPlayTutorial()) {
            this.x =
                this.dx >= 0
                    ? this.x + this.absdx * (deltaTime)
                    : this.x - this.absdx * (deltaTime);
            this.y =
                this.dy >= 0
                    ? this.y + this.absdy * deltaTime
                    : this.y - this.absdy * deltaTime;
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
    clickOnMonsterTutorial(deltaTime) {
        if(this.shouldPlayMonsterClickAnimation())
        {
            this.totalTime += Math.floor(deltaTime);
            const transitionDuration = 1000;
        
            const scaleFactor = this.sinusoidalInterpolation(this.totalTime, 1, 1.5, transitionDuration);
    
            const scaledWidth = this.tutorialImg.width * scaleFactor;
            const scaledHeight = this.tutorialImg.height * scaleFactor;
            const offsetX = this.endx;
            const offsetY = this.height / 1.9 + (this.tutorialImg.height / 2);
            this.context.drawImage(this.tutorialImg, offsetX, offsetY, scaledWidth, scaledHeight);

        }
       
    }
    
    sinusoidalInterpolation(time, minScale, maxScale, duration) {
        const amplitude = (maxScale - minScale) / 2;
        const frequency = Math.PI / duration;
        return minScale + amplitude * Math.sin(frequency * time);
    }
    
    
    shouldPlayTutorial(): boolean {
        let playDragAnimationForFirstPuzzle = GameScore.getAllGameLevelInfo().length <= 0 && this.puzzleNumber == 0;
        return playDragAnimationForFirstPuzzle;

    }

    shouldPlayMonsterClickAnimation(): boolean{
        let playMonsterClickAnimation = GameScore.getAllGameLevelInfo().length <= 0 && this.playMonsterClickTutorial;
        return playMonsterClickAnimation;
    }

    setPuzzleNumber(puzzleNumer: number) {
        this.puzzleNumber = puzzleNumer;
    }

    setPlayMonsterClickAnimation(value: boolean){
        this.playMonsterClickTutorial = value;

    }
}