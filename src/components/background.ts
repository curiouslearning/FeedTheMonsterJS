import { loadImages } from "../common/common";
import {
    DEFAULT_BACKGROUND_1,
    HILL_IMAGE_1,
    PILLAR_IMAGE_1,
    FENCE_IMAGE_1,
    AUTUMN_BACKGROUND_1,
    AUTUMN_HILL_1,
    AUTUMN_PILLAR_1,
    AUTUMN_SIGN_1,
    AUTUMN_FENCE_1,
    WINTER_BACKGROUND_1,
    WINTER_HILL_1,
    WINTER_SIGN_1,
    WINTER_FENCE_1,
    WINTER_PILLAR_1
} from '../constants';

// to do need to optimize more
var images = {
    bgImg: DEFAULT_BACKGROUND_1,
    hillImg: HILL_IMAGE_1,
    pillerImg: PILLAR_IMAGE_1,
    fenchImg: FENCE_IMAGE_1,

    autumnBgImg: AUTUMN_BACKGROUND_1,
    autumnHillImg: AUTUMN_HILL_1,
    autumnPillerImg: AUTUMN_PILLAR_1,
    autumnSignImg: AUTUMN_SIGN_1,
    autumnFenceImg: AUTUMN_FENCE_1,

    winterBgImg: WINTER_BACKGROUND_1,
    winterHillImg: WINTER_HILL_1,
    winterSignImg: WINTER_SIGN_1,
    winterFenceImg: WINTER_FENCE_1,
    winterPillerImg: WINTER_PILLAR_1,
};


export class Background {
    public width: number;
    public height: number;
    public context: CanvasRenderingContext2D;
    public imagesLoaded: boolean = false;
    public loadedImages: any;
    public levelNumber: number;
    public availableBackgroundTypes = ["Summer", "Autumn", "Winter"];
    public backgroundType: number;


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
                        this.context.drawImage(
                            this.loadedImages.winterBgImg,
                            0,
                            0,
                            this.width,
                            this.height
                        );
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
                        )
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
                        )
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
                        )
                    }
                    break;
            }
        }
    }
}