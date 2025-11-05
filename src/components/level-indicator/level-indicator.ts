import { EventManager } from "@events";
import LevelFieldComponent from '../level-field/level-field-component';

export class LevelIndicators extends EventManager{
    private levelBarIndicator: LevelFieldComponent;

    constructor() {
        super({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        })
        this.levelBarIndicator = new LevelFieldComponent();
    }

    setIndicators(indicatorCount: number, levelSegmentResult: boolean): void {
        //If levelSegmentResult passed, update the star to filled otherwise skip.
        if (levelSegmentResult) {
            this.levelBarIndicator.updateLevel(indicatorCount);
        }
    }

    public dispose() {
        this.unregisterEventListener();
        this.levelBarIndicator.destroy();
    }

    public handleStoneDrop(event) {
    }

    public handleLoadPuzzle(event) {

        const { counter, levelSegmentResult} = event.detail;

        this.setIndicators(counter, levelSegmentResult);
    }
}
