import { SCENE_NAME_LEVEL_END } from '../constants';
import { GameStateService } from '../gameStateService/gameStateService';

export interface ContainerAppInterfaceOptions {
  androidInterface: any;
  gameStateService: GameStateService;
}

/**
 * For POC purposes, not the final implementation.
 * 
 * Potentially move android interface logic to common module
 */
export class ContainerAppInterface {
  private androidInterface: any;
  private gameStateService: GameStateService;
  private subscribers: Record<string, any> = {};

  constructor(options: ContainerAppInterfaceOptions) {
    this.gameStateService = options.gameStateService;
    this.androidInterface = options.androidInterface;
    this.initialize();
  }

  private handleLeveEnd() {
    try {
      const levelEndData = this.gameStateService.getLevelEndSceneData();
      delete levelEndData.data;
      this.androidInterface.logEvent(JSON.stringify(levelEndData));
    } catch (e) {
      console.error('Error: ContainerAppInterface.handleLevelEnd', e)
    }
  }
  
  private initialize() {
    this.subscribers['levelend'] = this.gameStateService.subscribe(
      this.gameStateService.EVENTS.SWITCH_SCENE_EVENT,
      (sceneName: string) => {
        if (sceneName !== SCENE_NAME_LEVEL_END) return;
        this.handleLeveEnd();
      }
    )
  }
}