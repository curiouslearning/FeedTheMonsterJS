import { LOADPUZZLE, STONEDROP } from "../common/event-names";

export class EventManager {
    private stoneDropCallbackHandler: Function;
    private loadPuzzleCallbackHandler: Function;

    constructor(
        protected handler: {
            stoneDropCallbackHandler?: Function;
            loadPuzzleCallbackHandler?: Function;
        }
    ) {
        this.stoneDropCallbackHandler = handler.stoneDropCallbackHandler;
        this.loadPuzzleCallbackHandler = handler.loadPuzzleCallbackHandler;
        document.addEventListener(
            STONEDROP,
            this.handleStoneDroppedEvent.bind(this),
            false
        );
        document.addEventListener(
            LOADPUZZLE,
            this.handleLoadPuzzleEvent.bind(this),
            false
        );
    }

    private handleStoneDroppedEvent(event: Event) {
        this.stoneDropCallbackHandler(event);
    }

    private handleLoadPuzzleEvent(event: Event) {
        this.loadPuzzleCallbackHandler(event);
    }

    public unregisterEventListener() {
        document.removeEventListener(
            STONEDROP,
            this.handleStoneDroppedEvent.bind(this),
            false
        );
        document.removeEventListener(
            LOADPUZZLE,
            this.handleLoadPuzzleEvent.bind(this),
            false
        );
    }
}
