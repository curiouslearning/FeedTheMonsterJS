// import { Game } from "../../../scenes/game";

export default class NextButton {
    public posX: number;
    public posY: number;
    public context: CanvasRenderingContext2D;
    // public canvas: Game;
    public width: any;
    public height: any;
    public imagesLoaded: boolean = false;
    public next_button_image: any;

    constructor(
        context: CanvasRenderingContext2D,
        width, height,
        posX: number,
        posY: number
    ) {
        this.posX = posX;
        this.posY = posY;
        this.context = context;
        // this.canvas = canvas;
        this.width = width;
        this.height = height;
        var next_button_image = new Image();
        next_button_image.src = "./assets/images/next_btn.png";
        next_button_image.onload = (e) => {
            this.imagesLoaded = true;
            this.next_button_image = next_button_image;
        }
    }
    draw() {
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.next_button_image,
                this.posX,
                this.posY,
                this.width * 0.19,
                this.width * 0.19
            );
        }
    }
    onClick(xClick: number, yClick: number) {
        const distance = Math.sqrt(
            (xClick - this.posX - (this.width * 0.19) / 2) *
            (xClick - this.posX - (this.width * 0.19) / 2) +
            (yClick - this.posY - (this.width * 0.19) / 2) *
            (yClick - this.posY - (this.width * 0.19) / 2)
        );
        if (distance < (this.width * 0.19) / 2) {
            return true;
        }
    }
}
