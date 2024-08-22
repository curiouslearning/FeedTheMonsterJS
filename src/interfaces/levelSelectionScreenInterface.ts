export interface ILevelSelectionScreen {
  width: number;
  height: number;
  callBack: Function;
  background: any;

  drawLevelSelection(): void;
  dispose(): void;
  logSelectedLevelEvent(): void;
}
