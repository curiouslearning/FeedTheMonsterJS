import { Game } from "../../../scenes/game";

export default class RetryButton {
    public posX: number;
    public posY: number;
    public context: CanvasRenderingContext2D;
    public canvas: Game;
    public imagesLoaded: boolean = false;
    public retry_button_image: any;

    constructor(
        context: CanvasRenderingContext2D,
        canvas: Game,
        posX: number,
        posY: number
    ) {
        this.posX = posX;
        this.posY = posY;
        this.context = context;
        this.canvas = canvas;

        var retry_button_image = new Image();
        retry_button_image.src = "./assets/images/retry_btn.png";
        retry_button_image.onload = (e) => {
            this.imagesLoaded = true;
            this.retry_button_image = retry_button_image;
        }
    }

    draw() {
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.retry_button_image,
                this.posX,
                this.posY,
                this.canvas.width * 0.19,
                this.canvas.width * 0.19
            );
        }
    }

    onClick(xClick: number, yClick: number) {
        const distance = Math.sqrt(
            (xClick - this.posX - (this.canvas.width * 0.19) / 2) *
            (xClick - this.posX - (this.canvas.width * 0.19) / 2) +
            (yClick - this.posY - (this.canvas.width * 0.19) / 2) *
            (yClick - this.posY - (this.canvas.width * 0.19) / 2)
        );
        if (distance < (this.canvas.width * 0.19) / 2) {
            return true;
        }
    }
}
