
import { syncLoadingImages } from '@common';
import {
    DEFAULT_BG_GROUP_IMGS,
    AUTUMN_BG_GROUP_IMGS,
    WINTER_BG_GROUP_IMGS
} from '@constants';

export const BACKGROUND_ASSET_LIST = {
    summer: { BG_GROUP_IMGS: DEFAULT_BG_GROUP_IMGS, draw: defaultBgDrawing },
    autumn: { BG_GROUP_IMGS: AUTUMN_BG_GROUP_IMGS, draw: autumBgDrawing },
    winter: { BG_GROUP_IMGS: WINTER_BG_GROUP_IMGS, draw: winterBgDrawing },
}

export async function createBackground(
 context,
 width,
 height,
 backgroundImg,
 drawMethod
) {
    const loadedImages = { ...await syncLoadingImages(backgroundImg) };
    const obj = {
        ...drawMethod(
            context,
            width,
            height,
            loadedImages
        )
    };
    return ({ ...obj });
};

export const loadDynamicBgAssets = (levelNumber, assetsList) => {
    const arr = Object.keys(assetsList); //availableBackgroundTypes
    let backgroundType = Math.floor(levelNumber / 10) % arr.length;
    if (levelNumber >= 30) {
        backgroundType = backgroundType % 3;
    }

    return {...assetsList[arr[backgroundType]]};
};

export function defaultBgDrawing(context,width, height, bgImages) {
   return {
        draw: () => {
            context.drawImage(
                bgImages?.DEFAULT_BACKGROUND_1,
                0,
                0,
                width,
                height
            );
            context.drawImage(
                bgImages?.ASSETS_PATH_TOTEM,
                width * 0.6,
                height / 6,
                width,
                height / 2
            );
            context.drawImage(
                bgImages?.ASSETS_PATH_FENCE,
                -width * 0.4,
                height / 3,
                width,
                height / 3
            );
            context.drawImage(
                bgImages?.ASSETS_PATH_HILL,
                -width * 0.25,
                height / 2,
                width * 1.5,
                height / 2
            );
        }
    };
};

export function autumBgDrawing(context,width, height, bgImages) {
    return {
        draw: () => {
            context.drawImage(
                bgImages.AUTUMN_BACKGROUND_1,
                0,
                0,
                width,
                height
            );
            context.drawImage(
                bgImages.AUTUMN_PILLAR_1,
                width * 0.38,
                height / 6,
                width / 1.2,
                height / 2
            );
            context.drawImage(
                bgImages.AUTUMN_FENCE_1,
                -width * 0.4,
                height / 4,
                width,
                height / 2
            );
            context.drawImage(
                bgImages.AUTUMN_HILL_1,
                -width * 0.25,
                height / 2,
                width * 1.5,
                height / 2
            )
        }
    };
};

export function winterBgDrawing(context,width, height, bgImages) {
    return {
        draw: () => {
            context.drawImage(
                bgImages.WINTER_BACKGROUND_1,
                0,
                0,
                width,
                height
            );
            context.drawImage(
                bgImages.WINTER_PILLAR_1,
                width * 0.38,
                height / 6,
                width / 1.2,
                height / 2
            );
            context.drawImage(
                bgImages.WINTER_FENCE_1,
                -width * 0.4,
                height / 4,
                width,
                height / 2
            );
            context.drawImage(
                bgImages.WINTER_HILL_1,
                -width * 0.25,
                height / 2,
                width * 1.5,
                height / 2
            );
        }
    };
};

export function levelSelectBgDrawing(context,width, height, bgImages) {
    return {
        draw: () => {
            context.drawImage(
                bgImages?.LEVEL_SELECTION_BACKGROUND,
                0,
                0,
                width,
                height
            );
        }
    };
};