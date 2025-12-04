import {
  Debugger,
  lang,
} from "@common";
import { levelSelectionController } from './level-selection-controller';
import { getData, GameScore } from "@data";
import { AnalyticsIntegration, AnalyticsEventType } from "../../analytics/analytics-integration";
import {
  PreviousPlayedLevel,
  SCENE_NAME_GAME_PLAY,
} from "@constants";
import gameStateService from '@gameStateService';
import './level-selection-scene.scss'

export class LevelSelectionScreen {
  private data: any;
  private gameLevelData: any;
  private previousPlayedLevelNumber: number;
  private levelNumber: number;
  private majVersion: string;
  private minVersion: string;
  private analyticsIntegration: AnalyticsIntegration;

  private levelSelectionController: levelSelectionController;

  constructor() {
    this.data = gameStateService.getFTMData();
    this.gameLevelData = GameScore.getAllGameLevelInfo();
    this.previousPlayedLevelNumber =
      parseInt(
        Debugger.DebugMode
          ? localStorage.getItem(PreviousPlayedLevel + lang + "Debug")
          : localStorage.getItem(PreviousPlayedLevel + lang)
      ) | 0;

    this.levelSelectionController = new levelSelectionController({
      id: "level-selection-container", //container id name.
      options: {
        selectors: {
          root: '#background', // The background element to append the prompt to.
        }
      },
      startGameCallback: (gameLevelNumber: number) => { this.startGame(gameLevelNumber)},
      maxGameLevels: this.data?.levels.length, //Total game levels.
      playedGameLevels: this.gameLevelData,
      previousPlayedLevel: this.previousPlayedLevelNumber,
      isDebuggerOn: Debugger.DebugMode,
      gameLevels: this.data?.levels || []
    });

    this.analyticsIntegration = AnalyticsIntegration.getInstance();
    this.init();
  }

  private async init() {
    const data = await getData();
    this.majVersion = data.majversion;
    this.minVersion = data.minversion;
  }


  private startGame(level_number: string | number) {
    const gamePlayData = {
      currentLevelData: {
        ...this.data.levels[level_number],
        levelNumber: level_number,
      },
      selectedLevelNumber: level_number,
    };
    gameStateService.publish(gameStateService.EVENTS.GAMEPLAY_DATA_EVENT, gamePlayData);
    this.logSelectedLevelEvent();
    gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_GAME_PLAY);
  }

  public logSelectedLevelEvent() {
    this.analyticsIntegration.track(
      AnalyticsEventType.SELECTED_LEVEL,
      {
        json_version_number: !!this.majVersion && !!this.minVersion
          ? `${this.majVersion}.${this.minVersion}`
          : "",
        level_selected: this.levelNumber,
      }
    );
  }

  public dispose() {
    this.levelSelectionController.dispose();
  }
}