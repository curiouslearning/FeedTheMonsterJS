import LevelFieldComponent from '../level-field/level-field-component';
import gameStateService from '@gameStateService';

export class LevelIndicators {
    private levelBarIndicator: LevelFieldComponent;
    private unsubscribeLoadPuzzleEvent: () => void;

    constructor() {
        this.levelBarIndicator = new LevelFieldComponent();
        this.unsubscribeLoadPuzzleEvent = gameStateService.subscribe(
            gameStateService.EVENTS.LOADPUZZLE,
            (event) => {
                this.handleLoadPuzzle(event);
            }
        )
    }

    setIndicators(indicatorCount: number, levelSegmentResult: boolean): void {
        //If levelSegmentResult passed, update the star to filled otherwise skip.
        if (levelSegmentResult) {
            this.levelBarIndicator.updateLevel(indicatorCount);
        }
    }

    public dispose() {
        this.unsubscribeLoadPuzzleEvent();
        this.levelBarIndicator.destroy();
    }

    public handleLoadPuzzle(event) {

        const { counter, levelSegmentResult} = event.detail;

        this.setIndicators(counter, levelSegmentResult);
    }
}
