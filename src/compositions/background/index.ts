
import { loadImages } from '../../util/util';

export async function createBackground(
 context,
 width,
 height,
 backgroundImg,
 drawMethod
) {
    const loadedImages = { ...await loadImages(backgroundImg) };
    const obj = {
        loadedImages: loadedImages,
        ...drawMethod(
            context,
            width,
            height,
            loadedImages
        )
    };
    return ({ ...obj });
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
                bgImages?.PILLAR_IMAGE_1,
                width * 0.6,
                height / 6,
                width,
                height / 2
            );
            context.drawImage(
                bgImages?.FENCE_IMAGE_1,
                -width * 0.4,
                height / 3,
                width,
                height / 3
            );
            context.drawImage(
                bgImages?.HILL_IMAGE_1,
                -width * 0.25,
                height / 2,
                width * 1.5,
                height / 2
            );
        }
    }
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
    }
};