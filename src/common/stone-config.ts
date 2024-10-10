import { font } from "@common";
import { TimerTicking, Tutorial } from "@components";

export class StoneConfig {
    public x: number;
    public y: number;
    public origx: number;
    public origy: number;
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
    public timerTickingInstance: TimerTicking;
    public frame: number = 0;

    constructor(context, canvasWidth, canvasHeight, stoneLetter, xPos, yPos, img,timerTickingInstance,tutorialInstance?) {
        this.x = xPos;
        this.y = yPos;
        this.origx = xPos;
        this.origy = yPos;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.tutorialInstance = tutorialInstance;
        this.text = stoneLetter;
        this.img = img;
        this.context = context;
        this.calculateImageAndFontSize();
        this.imageCenterOffsetX = this.imageSize / 2.3;
        this.imageCenterOffsetY = this.imageSize / 1.5;
        this.timerTickingInstance = timerTickingInstance;

    }

    calculateImageAndFontSize() {
        if (
            this.context.measureText(this.text).width * 1.4 >
            this.canvasHeight / 9.5
        ) {
            this.imageSize = this.context.measureText(this.text).width * 1.1;
            this.textFontSize = this.canvasHeight / 25;
            if (this.text.length >= 3  && this.origx<50 && this.origx< this.canvasWidth/2 ) {
                  this.x = this.origx + 21;
            }
        } else {
            this.imageSize = this.canvasHeight / 9.5;
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
        return this.getEase(this.frame, 0, this.x, 100);
    }

    getY = () => {
        if (this.frame >= 100) {
            // Animation has ended, return the final stone position
            return this.y;
        }

        return this.getEase(this.frame, 0, this.y, 100);
    }

    adjustSize(shouldResize, num) {
        return shouldResize ? num * 1.25 : num;
    }

    draw(deltaTime: number, shouldResize: boolean = false) {
        const x = this.getX() - this.adjustSize(shouldResize, this.imageCenterOffsetX);
        const y = this.getY()- this.adjustSize(shouldResize, this.imageCenterOffsetY);


        // Apply shadow properties
        this.context.fillStyle = 'red';
        this.context.shadowColor = 'rgba(255, 255, 255, 1)'; // Color of the shadow
        this.context.shadowBlur = 12; // Blur level of the shadow
        this.context.shadowOffsetX = 0; // Horizontal shadow offset
        this.context.shadowOffsetY = 0; // Vertical shadow offset
        this.context.drawImage(
            this.img,
            x,
            y,
            this.adjustSize(shouldResize, this.imageSize),
            this.adjustSize(shouldResize, this.imageSize),
        );
        this.context.fillStyle = "white";
        this.context.font = this.textFontSize + `px ${font}, monospace`;
        this.context.textAlign = "center";
         // Set shadow properties
         this.context.shadowOffsetX = 0; // Move shadow to the right by 10 pixels
         this.context.shadowOffsetY = 0; // Move shadow down by 10 pixels
         this.context.shadowBlur = 0;    // Blur the shadow by 15 pixels
         this.context.shadowColor = 'transparent '; // Semi-transparent white shadow
        this.context.fillText(this.text, this.getX(), this.getY());

        if (this.frame < 100) {
            this.frame = this.frame + 1;
        }
        else if(this.tutorialInstance!=null || this.tutorialInstance!=undefined){
                this.tutorialInstance.draw(deltaTime,this.img,this.imageSize);
            }
    }
}
