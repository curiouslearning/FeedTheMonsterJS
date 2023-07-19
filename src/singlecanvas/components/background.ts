import { loadImages } from "../../common/common";

// to do need to optimize more
var images = {
    bgImg: "./assets/images/bg_v01.jpg",
    hillImg: "./assets/images/hill_v01.png",
    pillerImg: "./assets/images/Totem_v02_v01.png",
    grassImg: "./assets/images/FG_a_v01.png",
    fenchImg: "./assets/images/fence_v01.png",


    autumnBgImg: "./assets/images/Autumn_bg_v01.jpg",
    autumnHillImg: "./assets/images/Autumn_hill_v01.png",
    autumnPillerImg: "./assets/images/Autumn_sign_v01.png",
    autumnSignImg: "./assets/images/Autumn_sign_v01.png",
    autumnGrassImg: "./assets/images/Autumn_FG_v01.png",
    autumnFenceImg: "./assets/images/Autumn_fence_v01.png",


    winterBgImg: "./assets/images/Winter_bg_01.jpg",
    winterHillImg: "./assets/images/Winter_hill_v01.png",
    winterSignImg: "./assets/images/Winter_sign_v01.png",
    winterGrassImg: "./assets/images/Winter_FG_v01.png",
    winterFenceImg: "./assets/images/Winter_fence_v01.png",
    winterPillerImg: "./assets/images/Winter_sign_v01.png",
};


export class Background {
    public width: number;
    public height: number;
    public context: CanvasRenderingContext2D;
    public tutorialImg: any;
    public imagesLoaded: boolean = false;
    public loadedImages: any;
    // public game: any;
    public targetStonePositions: any;
    // images: { pillerImg: string; bgImg: string; hillImg: string; grassImg: string; fenchImg: string; };
    public levelNumber: any;
    public availableBackgroundTypes = ["Summer", "Autumn", "Winter"];
    public backgroundType: any;


    constructor(context, width, height, levelNumber) {
        this.width = width;
        this.height = height;
        this.context = context;
        this.levelNumber = levelNumber;

        this.backgroundType =
            Math.floor(this.levelNumber / 10) %
            this.availableBackgroundTypes.length;
        if (this.levelNumber >= 30) {
            this.backgroundType = this.backgroundType % 3;
        }

        loadImages(images, (images) => {
            this.loadedImages = Object.assign({}, images);
            this.imagesLoaded = true;
        });
    }


    draw() {
        if (this.imagesLoaded) {
            switch (this.availableBackgroundTypes[this.backgroundType]) {
                case "Winter":
                    {
                        this.context.drawImage(this.loadedImages.winterBgImg, 0, 0, this.width, this.height);
                        this.context.drawImage(
                            this.loadedImages.winterPillerImg,
                            this.width * 0.38,
                            this.height / 6,
                            this.width / 1.2,
                            this.height / 2
                        );
                        this.context.drawImage(
                            this.loadedImages.winterFenceImg,
                            -this.width * 0.4,
                            this.height / 4,
                            this.width,
                            this.height / 2
                        );
                        this.context.drawImage(
                            this.loadedImages.winterHillImg,
                            -this.width * 0.25,
                            this.height / 2,
                            this.width * 1.5,
                            this.height / 2
                        );
                        this.context.drawImage(
                            this.loadedImages.winterGrassImg,
                            -this.width * 0.25,
                            this.height / 2 + (this.height / 2) * 0.1,
                            this.width * 1.5,
                            this.height / 2
                        );
                    }

                    break;
                case "Autumn":
                    {
                        this.context.drawImage(this.loadedImages.autumnBgImg, 0, 0, this.width, this.height);
                        this.context.drawImage(
                            this.loadedImages.autumnPillerImg,
                            this.width * 0.38,
                            this.height / 6,
                            this.width / 1.2,
                            this.height / 2
                        );
                        this.context.drawImage(
                            this.loadedImages.autumnFenceImg,
                            -this.width * 0.4,
                            this.height / 4,
                            this.width,
                            this.height / 2
                        );
                        this.context.drawImage(
                            this.loadedImages.autumnHillImg,
                            -this.width * 0.25,
                            this.height / 2,
                            this.width * 1.5,
                            this.height / 2
                        );
                        this.context.drawImage(
                            this.loadedImages.autumnGrassImg,
                            -this.width * 0.25,
                            this.height / 2 + (this.height / 2) * 0.1,
                            this.width * 1.5,
                            this.height / 2
                        );
                    }
                    break;
                default:
                    {
                        this.context.drawImage(this.loadedImages.bgImg, 0, 0, this.width, this.height);
                        this.context.drawImage(
                            this.loadedImages.pillerImg,
                            this.width * 0.6,
                            this.height / 6,
                            this.width,
                            this.height / 2
                        );
                        this.context.drawImage(
                            this.loadedImages.fenchImg,
                            -this.width * 0.4,
                            this.height / 3,
                            this.width,
                            this.height / 3
                        );
                        this.context.drawImage(
                            this.loadedImages.hillImg,
                            -this.width * 0.25,
                            this.height / 2,
                            this.width * 1.5,
                            this.height / 2
                        );
                        this.context.drawImage(
                            this.loadedImages.grassImg,
                            -this.width * 0.25,
                            this.height / 2 + (this.height / 2) * 0.1,
                            this.width * 1.5,
                            this.height / 2
                        );
                    }
                    break;
            }
        }
    }
}