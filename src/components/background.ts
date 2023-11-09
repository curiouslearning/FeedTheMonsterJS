import { loadImages } from "../common/common";

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

interface PillerImageConfig {
    xPos: number;
    yPos: number;
    imageWidth: number;
    imageHeight: number
}

interface HillImageConfig {
    xPos: number;
    yPos: number;
    imageWidth: number;
    imageHeight: number
}

interface FenceImageConfig {
    xPos: number;
    yPos: number;
    imageWidth: number;
    imageHeight: number
}

interface GrassImageConfig {
    xPos: number;
    yPos: number;
    imageWidth: number;
    imageHeight: number
}


export class Background {
    public width: number;
    public height: number;
    public context: CanvasRenderingContext2D;
    public imagesLoaded: boolean = false;
    public loadedImages: any;
    public levelNumber: number;
    public availableBackgroundTypes = ["Summer", "Autumn", "Winter"];
    public backgroundType: number;
    private pillerImageConfig: PillerImageConfig;
    private fenceImageConfig: FenceImageConfig;
    private hillImageConfig: HillImageConfig;
    private grassImageConfig: GrassImageConfig;


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
        this.setComponentConfigs();

        loadImages(images, (images) => {
            this.loadedImages = Object.assign({}, images);
            this.imagesLoaded = true;
        });
    }

    setComponentConfigs = () => {
        this.pillerImageConfig = {
            xPos: this.width * 0.38,
            yPos: this.height / 6,
            imageWidth: this.width / 1.2,
            imageHeight: this.height / 2,
        }

        this.fenceImageConfig = {
            xPos: -this.width * 0.4,
            yPos: this.height / 4,
            imageWidth: this.width,
            imageHeight: this.height / 2,
        }

        this.hillImageConfig = {
            xPos: -this.width * 0.25,
            yPos: this.height / 2,
            imageWidth: this.width * 1.5,
            imageHeight: this.height / 2,
        }

        this.grassImageConfig = {
            xPos: -this.width * 0.25,
            yPos: this.height / 2 + (this.height / 2) * 0.1,
            imageWidth: this.width * 1.5,
            imageHeight: this.height / 2,
        }
    }


    draw() {
        if (this.imagesLoaded) {
            switch (this.availableBackgroundTypes[this.backgroundType]) {
                case "Winter":
                    {
                        this.context.drawImage(this.loadedImages.winterBgImg, 0, 0, this.width, this.height);
                        this.context.drawImage(
                            this.loadedImages.winterPillerImg,
                            this.pillerImageConfig.xPos,
                            this.pillerImageConfig.yPos,
                            this.pillerImageConfig.imageWidth,
                            this.pillerImageConfig.imageHeight
                        );
                        this.context.drawImage(
                            this.loadedImages.winterFenceImg,
                            this.fenceImageConfig.xPos,
                            this.fenceImageConfig.yPos,
                            this.fenceImageConfig.imageWidth,
                            this.fenceImageConfig.imageHeight
                        );
                        this.context.drawImage(
                            this.loadedImages.winterHillImg,
                            this.hillImageConfig.xPos,
                            this.hillImageConfig.yPos,
                            this.hillImageConfig.imageWidth,
                            this.hillImageConfig.imageHeight
                        );
                        this.context.drawImage(
                            this.loadedImages.winterGrassImg,
                            this.grassImageConfig.xPos,
                            this.grassImageConfig.yPos,
                            this.grassImageConfig.imageWidth,
                            this.grassImageConfig.imageHeight
                        );
                    }

                    break;
                case "Autumn":
                    {
                        this.context.drawImage(this.loadedImages.autumnBgImg, 0, 0, this.width, this.height);
                        this.context.drawImage(
                            this.loadedImages.autumnPillerImg,
                            this.pillerImageConfig.xPos,
                            this.pillerImageConfig.yPos,
                            this.pillerImageConfig.imageWidth,
                            this.pillerImageConfig.imageHeight
                        );
                        this.context.drawImage(
                            this.loadedImages.autumnFenceImg,
                            this.fenceImageConfig.xPos,
                            this.fenceImageConfig.yPos,
                            this.fenceImageConfig.imageWidth,
                            this.fenceImageConfig.imageHeight
                        );
                        this.context.drawImage(
                            this.loadedImages.autumnHillImg,
                            this.hillImageConfig.xPos,
                            this.hillImageConfig.yPos,
                            this.hillImageConfig.imageWidth,
                            this.hillImageConfig.imageHeight
                        );
                        this.context.drawImage(
                            this.loadedImages.autumnGrassImg,
                            this.grassImageConfig.xPos,
                            this.grassImageConfig.yPos,
                            this.grassImageConfig.imageWidth,
                            this.grassImageConfig.imageHeight
                        );
                    }
                    break;
                default:
                    {
                        this.context.drawImage(this.loadedImages.bgImg, 0, 0, this.width, this.height);
                        this.context.drawImage(
                            this.loadedImages.pillerImg,
                            this.width * 0.6,
                            this.pillerImageConfig.yPos,
                            this.width,
                            this.pillerImageConfig.imageHeight
                        );
                        this.context.drawImage(
                            this.loadedImages.fenchImg,
                            this.fenceImageConfig.xPos,
                            this.fenceImageConfig.yPos,
                            this.fenceImageConfig.imageWidth,
                            this.fenceImageConfig.imageHeight
                        );
                        this.context.drawImage(
                            this.loadedImages.hillImg,
                            this.hillImageConfig.xPos,
                            this.hillImageConfig.yPos,
                            this.hillImageConfig.imageWidth,
                            this.hillImageConfig.imageHeight
                        );
                        this.context.drawImage(
                            this.loadedImages.grassImg,
                            this.grassImageConfig.xPos,
                            this.grassImageConfig.yPos,
                            this.grassImageConfig.imageWidth,
                            this.grassImageConfig.imageHeight
                        );
                    }
                    break;
            }
        }
    }
}