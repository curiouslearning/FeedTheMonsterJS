/**
 * data-access-objects.ts
 *
 * This file contains functions that serve as Data Access Object (DAOs)
 * designed to retrieve initial values from the game state.
 * This provides a set of getters for accessing the underlying data,
 * that will be used when initiating or creating any component class or scene class.
 *
 * Note: DAOs will return a new object to ensure that it is a READ-ONLY data
 * and to avoid any data manupulation through pass-by-reference.
 */

export const createLoadingSceneDAO = (gameData) => {
    const canvas = gameData.loadingCanvas; //using canvas with "loading" ID.
    canvas.height = gameData.height; //using the original "canvas" ID height.
    canvas.width = gameData.width; //using the original "canvas" ID width.

    return {
        canvas,
        height: gameData.height,
        width: gameData.width,
        context: gameData.loadingContext,
    };
}

export const createGameplaySceneDAO = (gameData) => {
    const versionNumber = !!gameData.majVersion && !!gameData.minVersion
        ? gameData.majVersion.toString() +
          "." +
          gameData.minVersion.toString()
        : "";

    //Returns a read only data of the values (except for canvas object) needed for gameplay scene.
    return {
        canvas: gameData.canvas,
        width: gameData.width,
        height: gameData.height,
        canavsElement: gameData.canavsElement,
        gameCanvasContext: gameData.gameCanvasContext,
        levelData: { ...gameData.gamePlayData.currentLevelData },
        levelNumber: gameData.gamePlayData.selectedLevelNumber,
        feedBackTexts: { ...gameData.feedbackTexts },
        rightToLeft: gameData?.rightToLeft,
        jsonVersionNumber: versionNumber,
        feedbackAudios: { ...gameData.feedbackAudios },
        isGamePaused: gameData.isGamePaused
    };
}

export const createStonePositions = (gameData) => {
    const stonePos = [
        [5, 1.9],
        [2, 1.04], //Note: This stone is located right below the monster.
        [
            [2.8, 2],
            1.2
        ],
        [ 4.3, 1.28],
        [7, 1.5],
        [
            [2.3, 2.1],
            1.9
        ],
        [
            [2.3, 2.1],
            1.42
        ],
        [6.4, 1.1]

    ];
}

//Add more data access objects below here.