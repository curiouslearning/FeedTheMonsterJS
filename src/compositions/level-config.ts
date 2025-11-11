
import {
    MAP_ICON_IMG,
    MAP_LOCK_IMG,
    STAR_IMG,
    SPECIAL_LEVELS,
    TREASURE_CHEST_SPECIAL_LEVELS_ONGOING,
    TREASURE_CHEST_SPECIAL_LEVELS_DONE
} from "@constants";
import { syncLoadingImages } from '@common';

const isSpecialLevel = (index) => SPECIAL_LEVELS.includes(index);

export const getdefaultCloudBtnsPos = (canvas) => {
    //Note: For Width; Divide by lower number move to right, divide by greater number move to left.
    //For Height; Divide by lower number move to lower, divide by greater number move to upper.
    return [
        [
            [
                canvas.width / 14,
                canvas.height / 10
            ],
            [
                canvas.width / 2.6,
                canvas.height / 10
            ],
            [
                canvas.width / 3 + canvas.width / 2.8,
                canvas.height / 10,
            ],
            [
                canvas.width / 14,
                canvas.height / 3
            ],
            [
                canvas.width / 2.6,
                canvas.height / 3
            ], // Position for 5, 15, 25 and so on
            [
                canvas.width / 3 + canvas.width / 2.8,
                canvas.height / 3,
            ],
            [
                canvas.width / 14,
                canvas.height / 1.8
            ],
            [
                canvas.width / 2.6,
                canvas.height / 1.8
            ],
            [
                canvas.width / 3 + canvas.width / 2.8,
                canvas.height / 1.8,
            ],
            [
                canvas.width / 2.6,
                canvas.height / 1.3
            ],
        ],
    ];
}

export const loadLevelImages = () => {
    return syncLoadingImages(
        {
            balloonImg: MAP_ICON_IMG,
            treasureChestImg: TREASURE_CHEST_SPECIAL_LEVELS_ONGOING,
            treasureChestDoneImg: TREASURE_CHEST_SPECIAL_LEVELS_DONE,
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

    const obj = {
        x: xPos,
        y: yPos,
        index,
        isSpecial,
        ...images,
    };

    return ({ ...obj });
}