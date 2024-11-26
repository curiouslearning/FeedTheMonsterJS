/*
 *  data-access-objects.ts
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
  	? gameData.majVersion.toString() + "." + gameData.minVersion.toString()
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
		isGamePaused: gameData.isGamePaused,
		data: gameData.data,
		isLastLevel: gameData.isLastLevel
	};
}

export const createStonePositionsDAO = ({
	offsetCoordinateValue,
	width,
	height,
	riveCanvasWidth,
	riveCanvasHeight
}) => {
	/*
	*  If rive width and height are not properly set,
	*  use the original canvas width and height instead.
	*/
	const widthVal = riveCanvasWidth ? riveCanvasWidth : width;
	const heightVal = riveCanvasHeight ? riveCanvasHeight : height;
	const deviceWidth = 540; //Lower than 540 width some stones are too close to monster.
	const setCoordinateFactor = (defaultVal, smallerVal) => {
		/*
		 * Temp handling to make sure no stones are overlap on rive monster.
		 * This function can be removed once we have the official rive file
		 * as we will have the origial width and height to properly adjust the
		 * stone coordinates.
		 *
		 * Returns a static factor value used for setting coordinates.
		*/
		return deviceWidth > widthVal ? smallerVal : defaultVal;
	}

  //Coordinates with comments are the ones near to the monster.
	const staticCoordinateFactors = [
		[5, 1.9], //Left stone 1 - upper
		[7, 1.5], //Left stone 2
		[setCoordinateFactor(4.3, 4.5), 1.28], //Left stone 3
		[6.4, 1.1], //Left stone 4 - very bottom
		[setCoordinateFactor(2, 1.3), 1.07], //Middle stone that is located right below the monster.
		[[2.3, 2.1], 1.9], //Right stone 1 - upper
		[[setCoordinateFactor(2.8, 2.5), 2], 1.2], //Right stone 2
		[[setCoordinateFactor(3, 2.4), 2.1], 1.42],  //Right stone 3
	];

	const randomizedStonePositions = staticCoordinateFactors.map(
	(coordinatesFactors: [number[] | number, number], index) => {
		const factorX = coordinatesFactors[0];
		const factorY = coordinatesFactors[1];
		let coordinateX = Array.isArray(factorX)
			? ((widthVal / factorX[0]) + (widthVal / factorX[1]))
			: (widthVal / factorX);
		let coordinateY = heightVal / factorY;
		const offsetXAdjustment = index < 4 ? 25 : 0; //Only use +25 on stones on the left side.
		const posX = coordinateX - offsetCoordinateValue;
		const posY = coordinateY - offsetCoordinateValue;

		return [
			posX + offsetXAdjustment,
			posY,
		]
	}
	).sort(() => Math.random() - 0.5);

	return randomizedStonePositions;
}

// TODO: move this back to level end component
export const createLevelEndDataDAO = (gameState) => {
  return {
		starCount: gameState.levelEndData.starCount,
		currentLevel: gameState.levelEndData.currentLevel,
		isTimerEnded: gameState.levelEndData.isTimerEnded,
		data: gameState.data
	};
}

//Add more data access objects below here.