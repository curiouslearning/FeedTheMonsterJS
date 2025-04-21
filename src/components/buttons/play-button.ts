import { PLAY_BTN_IMG } from "@constants";
import { TappedStart } from "../../Firebase/firebase-event-interface";
import { FirebaseIntegration } from "../../Firebase/firebase-integration";
import { loadImages, pseudoId, lang } from "@common";
import { getData } from "@data";
/*
  * Note: Deprecated. Use PlayButtonHtml from component buttons instead.
 */
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
        this.init();
        this.images = {
            pause_button_image: PLAY_BTN_IMG
        }

        loadImages(this.images, (images) => {
            this.loadedImages = Object.assign({}, images);
            this.imagesLoaded = true;
        });
    }
    private async init() {
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

    onClick(xClick: number, yClick: number): boolean {
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
