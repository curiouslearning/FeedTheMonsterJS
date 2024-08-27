import { StartScene } from "@scenes/start-scene";
import { DataModal } from "@data/data-modal";
import { LevelSelectionScreen } from "@scenes/level-selection-scene";
import { GameplayScene } from "@scenes/gameplay-scene";
import { LoadingScene } from "@scenes/loading-scene";
import { LevelEndScene } from "@scenes/levelend-scene";

export interface SceneHandlerInterface {
  canvas: HTMLCanvasElement;
  data: DataModal;
  width: number;
  height: number;
  startScene: StartScene;
  levelSelectionScene: LevelSelectionScreen;
  gameplayScene: GameplayScene;
  levelEndScene: LevelEndScene;
  canavsElement: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  loadingScreen: LoadingScene;
  loading: boolean;

  startAnimationLoop(): void;
  devToggle(): void;
  checkMonsterPhaseUpdation(): number;
  animation(timeStamp: number): void;
  switchSceneToGameplay(
    gamePlayData: any,
    changeSceneRequestFrom?: string
  ): void;
  switchSceneToEndLevel(
    starCount: number,
    monsterPhaseNumber: number,
    currentLevelNumber: number,
    isTimerEnded: boolean
  ): void;
  switchSceneToLevelSelection(changeSceneRequestFrom?: string): void;
}
