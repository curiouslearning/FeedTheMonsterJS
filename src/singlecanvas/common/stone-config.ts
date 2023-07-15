import { Tutorial } from "../components/tutorial";

export class StoneConfig {
    public x: number;
    public y: number;
    public origx: number;
    public origy: number;
    // public drawready: boolean;
    public text: string;
    public img: CanvasImageSource;
    public imageSize: number;
    public textFontSize: number;
    public canvasWidth: number;
    public canvasHeight: number;
    public imageCenterOffsetX: number;
    public imageCenterOffsetY: number;
    public context: CanvasRenderingContext2D;
    public tutorialInstance: Tutorial;

    public frame: any = 0;

    constructor(context, canvasWidth, canvasHeight, stoneLetter, xPos, yPos, img,tutorialInstance?) {
        this.x = xPos;
        this.y = yPos;
        this.origx = xPos;
        this.origy = yPos;
         // this.drawready = false;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.tutorialInstance = tutorialInstance;
        this.text = stoneLetter;
        this.img = img;
        this.context = context;
        // this.imageSize = this.context.measureText(this.text).width * 1.1;
        this.calculateImageAndFontSize();
        this.imageCenterOffsetX = this.imageSize / 2.3;
        this.imageCenterOffsetY = this.imageSize / 1.5;
        // this.img.src = "./assets/images/stone_pink_v02.png";

    }

    calculateImageAndFontSize() {
        if (
            this.context.measureText(this.text).width * 1.4 >
            this.canvasHeight / 13
        ) {
            this.imageSize = this.context.measureText(this.text).width * 1.1;
            this.textFontSize = this.canvasHeight / 25;
        } else {
            this.imageSize = this.canvasHeight / 13;
            this.textFontSize = this.canvasHeight / 20;
        }
    }


    getEase = (currentProgress, start, distance, steps) => {
        return -distance / 2 * (Math.cos(Math.PI * currentProgress / steps) - 1) + start;
    };


    getX = () => {
        if (this.frame >= 100) {
            // Animation has ended, return the final stone position
            return this.x;
        }
    
        let distance = this.x - 0;
        let steps = 100;
        let currentProgress = this.frame;
        return this.getEase(currentProgress, 0, distance, steps);
    }

    getY = () => {
        if (this.frame >= 100) {
            // Animation has ended, return the final stone position
            return this.y;
        }
    
        let distance = this.y - 0;
        let steps = 100;
        let currentProgress = this.frame;
        return this.getEase(currentProgress, 0, distance, steps);
    }

    draw(deltaTime) {
        if (this.frame < 100) {
            this.frame = this.frame + 1;
        }
        else{
            if(this.tutorialInstance!=null || this.tutorialInstance!=undefined)
            {
                this.tutorialInstance.draw(deltaTime);
            }
        }
        this.context.drawImage(
            this.img,
            this.getX() - this.imageCenterOffsetX,
            this.getY()- this.imageCenterOffsetY,
            this.imageSize,
            this.imageSize
        );
        // if (Math.round(this.x) == stoneConfig.targetX) {
        //     //reached its original position
        // }
        this.context.fillStyle = "white";
        this.context.font = this.textFontSize + "px Arial";
        this.context.textAlign = "center";
        this.context.fillText(this.text, this.getX(), this.getY());
    }

    update() {
        // update stone apearing animation
        // if (this.frame < 100) {
        //     this.frame = this.frame + 1;
        // }
       
    }
}
