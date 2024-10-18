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