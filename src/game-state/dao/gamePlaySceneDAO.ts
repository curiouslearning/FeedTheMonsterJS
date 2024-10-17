export const createGameplaySceneDAO = (gameDataInstance) => {
    const versionNumber = !!gameDataInstance.majVersion && !!gameDataInstance.minVersion
        ? gameDataInstance.majVersion.toString() +
          "." +
          gameDataInstance.minVersion.toString()
        : "";
    //Returns a read only data of the values (except for canvas object) needed for gameplay scene.
    return {
        canvas: gameDataInstance.canvas,
        width: gameDataInstance.width,
        height: gameDataInstance.height,
        canavsElement: gameDataInstance.canavsElement,
        gameCanvasContext: gameDataInstance.gameCanvasContext,
        levelData: { ...gameDataInstance.gamePlayData.currentLevelData },
        levelNumber: gameDataInstance.gamePlayData.selectedLevelNumber,
        feedBackTexts: { ...gameDataInstance.feedbackTexts },
        rightToLeft: gameDataInstance?.rightToLeft,
        jsonVersionNumber: versionNumber,
        feedbackAudios: { ...gameDataInstance.feedbackAudios },
        isGamePaused: gameDataInstance.isGamePaused
    };
}