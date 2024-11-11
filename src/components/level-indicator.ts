import { EventManager } from "@events";
import LevelFieldComponent from './level-field/level-field-component';

export class LevelIndicators extends EventManager{
    private levelBarIndicator: LevelFieldComponent;

    constructor() {
        super({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        })
        this.levelBarIndicator = new LevelFieldComponent();
    }
    setIndicators(indicatorCount) {
        this.levelBarIndicator.updateLevel(indicatorCount);
    }

    addDropStoneEvent() {
        document.addEventListener('dropstone', (event) => {
            this.setIndicators(2);
        });
    }

    public dispose() {
        this.unregisterEventListener();
        this.levelBarIndicator.destroy();
    }

    public handleStoneDrop(event) {
    }

    public handleLoadPuzzle(event) {
        this.setIndicators(event.detail.counter);
    }
}
