import { loadImages } from "../../common/common";

export default class PlayButton {
    public posX: number;
    public posY: number;
    public context: CanvasRenderingContext2D;
    public canvas: { width: number; height: number };
    public images: Object;
    public loadedImages: any;
    public imagesLoaded: boolean = false;

    constructor(
        context: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        posX: number,
        posY: number
    ) {
        this.posX = posX;
        this.posY = posY;
        this.context = context;
        this.canvas = canvas;

        this.images = {
            pause_button_image: "./assets/images/Play_button.png"
        }

        loadImages(this.images, (images) => {
            this.loadedImages = Object.assign({}, images);
            this.imagesLoaded = true;
        });
    }
    draw() {
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.loadedImages.pause_button_image,
                this.posX,
                this.posY,
                this.canvas.width / 3,
                this.canvas.width / 3
            );
        }
    }
    onClick(xClick: number, yClick: number) {
        const distance = Math.sqrt(
            (xClick - this.posX - this.canvas.width / 6) *
            (xClick - this.posX - this.canvas.width / 6) +
            (yClick - this.posY - this.canvas.width / 6) *
            (yClick - this.posY - this.canvas.width / 6)
        );

        if (distance < this.canvas.width / 8) {
            return true;
        }
    }
}
