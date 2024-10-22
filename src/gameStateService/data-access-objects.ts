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

//Add more data access objects below here.