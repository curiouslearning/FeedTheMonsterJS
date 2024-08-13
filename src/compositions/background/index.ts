//import { loadImages } from "../../common/common";
import { loadImages } from '../../util/util';
import {
    DEFAULT_BG_GROUP_IMGS,
    AUTUMN_BG_GROUP_IMGS,
    WINTER_BG_GROUP_IMGS
} from '../../constants/'

const determineBgImg = (levelNumber) => {
    const availableBackgroundTypes = ["Summer", "Autumn", "Winter"];
    // let backgroundType = Math.floor(levelNumber / 10) %
    //         availableBackgroundTypes.length;
    // if (levelNumber >= 30) {
    //     backgroundType = backgroundType % 3;
    // }


    return DEFAULT_BG_GROUP_IMGS;
};

function drawing(context,width, height, bgImages) {
   return {
        draw: () => {
            context.drawImage(
                bgImages.DEFAULT_BACKGROUND_1,
                0,
                0,
                width,
                height
            );
            context.drawImage(
                bgImages.PILLAR_IMAGE_1,
                width * 0.6,
                height / 6,
                width,
                height / 2
            );
            context.drawImage(
                bgImages.FENCE_IMAGE_1,
                -width * 0.4,
                height / 3,
                width,
                height / 3
            );
            context.drawImage(
                bgImages.HILL_IMAGE_1,
                -width * 0.25,
                height / 2,
                width * 1.5,
                height / 2
            );
        }
    }
};

export async function createBackground(context, width, height, levelNumber) {
    //this.context = {...context}
    console.log('context men ', context)
    const backgroundImgObj = determineBgImg(levelNumber);
    const loadedImages = {...await loadImages(backgroundImgObj)}
    const obj = {
        width,
        height,
        levelNumber,
        loadedImages: loadedImages,
        ...drawing(context, width, height, loadedImages)
    }
    return ({
        ...obj
    })
};