import { SceneHandler, StartScene1, LevelSelection1, GameScene1, EndScene1 } from "../sceneHandler/scene-handler";

export class Animation {
  private lastTime: number = 0;
  private sceneHandler: SceneHandler;
  private fpsInterval: number;
  private then: number;

  constructor(sceneHandler: SceneHandler, fps: number = 30) {
    this.sceneHandler = sceneHandler;
    this.fpsInterval = 1000 / fps;
    this.then = Date.now();
    requestAnimationFrame(this.animation);
  }

  private animation = () => {
    requestAnimationFrame(this.animation);

    const now = Date.now();
    const elapsed = now - this.then;

    if (elapsed > this.fpsInterval) {
      this.then = now - (elapsed % this.fpsInterval);

      const timeStamp = performance.now();
      const deltaTime = timeStamp - this.lastTime;
      this.lastTime = timeStamp;

      this.sceneHandler.context.clearRect(0, 0, this.sceneHandler.width, this.sceneHandler.height);
      if (this.sceneHandler.loading) {
        this.sceneHandler.loadingScreen.draw(deltaTime);
      }

      switch (SceneHandler.SceneName) {
        case StartScene1:
          console.log('StartScene1');
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
    }
  };
}
