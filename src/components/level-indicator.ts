import { EventManager } from "@events";
import LevelField from './level-field/level-field';

export class LevelIndicators extends EventManager{
    private levelBarIndicator: any

    constructor() {
        super({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        })
        this.levelBarIndicator = new LevelField('levels');
    }
    setIndicators(indicatorCount) {
        this.levelBarIndicator.updateBar(indicatorCount);
    }

    addDropStoneEvent() {
        document.addEventListener('dropstone', (event) => {
            this.setIndicators(2);
        });
    }

    public dispose() {
        this.unregisterEventListener();
        this.levelBarIndicator.deleteLevelField();
    }

    public handleStoneDrop(event) {
    }

    public handleLoadPuzzle(event) {
        this.setIndicators(event.detail.counter);
    }
}
