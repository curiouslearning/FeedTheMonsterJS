
import {
    MAP_ICON_IMG,
    MAP_LOCK_IMG,
    STAR_IMG,
    SPECIAL_LEVELS,
    MAP_ICON_SPECIAL_LEVELS_DONE,
    MAP_ICON_SPECIAL_LEVELS_ONGOING
} from "@constants";
import { syncLoadingImages } from '@common';

const isSpecialLevel = (index) => SPECIAL_LEVELS.includes(index);

export const getdefaultCloudBtnsPos = (canvas) => {
    //Note: For Width; Divide by lower number move to right, divide by greater number move to left.
    //For Height; Divide by lower number move to lower, divide by greater number move to upper.
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
        ], // Position for 5, 15, 25 and so on
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

export const loadLevelImages = () => {
    return syncLoadingImages(
        {
            balloonImg: MAP_ICON_IMG,
            specialBloonImg: MAP_ICON_SPECIAL_LEVELS_ONGOING,
            specialBloonDoneImg: MAP_ICON_SPECIAL_LEVELS_DONE,
            lockImg: MAP_LOCK_IMG,
            starImg: STAR_IMG
        }
    );
};

export async function createLevelObject(
    xPos: number,
    yPos: number,
    index: number,
    images,
) {
    const isSpecial = isSpecialLevel(index);

    // NOTE: This needs refactoring. There's currently no reliable way to validate
    // whether the level is completed, making it hard to determine which assets
    // should be used for the treasure chest.

    const obj = {
        x: xPos,
        y: yPos,
        index,
        isSpecial,
        ...images,
        balloonImg: isSpecial ? images?.specialBloonImg : images?.balloonImg,
        treasureChestOpened: images?.specialBloonDoneImg // placing the done asset here for now as quick way to access and use it.
    };

    return ({ ...obj });
}