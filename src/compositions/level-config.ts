
import {
  MAP_ICON_IMG,
  MAP_ICON_SPECIAL_IMG,
  MAP_LOCK_IMG,
  STAR_IMG,
  SPECIAL_LEVELS,
} from "@constants";
import { syncLoadingImages } from '@common';

const isSpecialLevel = (index) => SPECIAL_LEVELS.includes(index);

export const getdefaultCloudBtnsPos = (canvas) => {
    return [
      [
        [
            canvas.width / 10,
            canvas.height / 10
        ],
        [
            canvas.width / 2.5,
            canvas.height / 10
        ],
        [
          canvas.width / 3 + canvas.width / 2.8,
          canvas.height / 10,
        ],
        [
            canvas.width / 10,
            canvas.height / 3
        ],
        [
            canvas.width / 2.5,
            canvas.height / 3
        ],
        [
            canvas.width / 3 + canvas.width / 2.8,
            canvas.height / 3,
        ],
        [
            canvas.width / 10,
            canvas.height / 1.8
        ],
        [
            canvas.width / 2.5,
            canvas.height / 1.8
        ],
        [
          canvas.width / 3 + canvas.width / 2.8,
          canvas.height / 1.8,
        ],
        [
            canvas.width / 2.5,
            canvas.height / 1.3
        ],
      ],
    ];
}

export const loadLevelImages = async () => {
    return await syncLoadingImages(
        {
            balloonImg: MAP_ICON_IMG,
            specialBloonImg: MAP_ICON_SPECIAL_IMG,
            lockImg: MAP_LOCK_IMG,
            starImg: STAR_IMG
        }
    );
};

export async function createLevelObject(
    xPos: number,
    yPos: number,
    index: number,
    images
) {
    const isSpecial = isSpecialLevel(index);
    const obj = {
        x: xPos,
        y: yPos,
        index,
        isSpecial,
        ...images,
        balloonImg: isSpecial ? images?.specialBloonImg : images?.balloonImg
    };

    return ({ ...obj });
}