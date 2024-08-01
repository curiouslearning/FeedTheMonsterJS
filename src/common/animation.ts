import { SceneHandler, StartScene1, LevelSelection1, GameScene1, EndScene1 } from "../sceneHandler/scene-handler";

export class Animation {
  private lastTime: number = 0;
  private sceneHandler: SceneHandler;

  constructor(sceneHandler: SceneHandler) {
    this.sceneHandler = sceneHandler;
    requestAnimationFrame(this.animation);
  }

  private animation = (timeStamp: number) => {
    const deltaTime = timeStamp - this.lastTime;
    this.lastTime = timeStamp;

    this.sceneHandler.context.clearRect(0, 0, this.sceneHandler.width, this.sceneHandler.height);
    if (this.sceneHandler.loading) {
      this.sceneHandler.loadingScreen.draw(deltaTime);
    }

    switch (SceneHandler.SceneName) {
      case StartScene1:
        this.sceneHandler.startScene.animation(deltaTime);
        break;
      case LevelSelection1:
        this.sceneHandler.levelSelectionScene.drawLevelSelection();
        break;
      case GameScene1:
        this.sceneHandler.gameplayScene.draw(deltaTime);
        break;
      case EndScene1:
        this.sceneHandler.levelEndScene.draw(deltaTime);
        break;
    }

    requestAnimationFrame(this.animation);
  };
}
