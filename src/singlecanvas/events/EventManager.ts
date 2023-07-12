export class EventManager {
    private stoneDropCallbackHandler: Function;
    private loadPuzzleCallbackHandler: Function;

    constructor(
        protected handler: {
            stoneDropCallbackHandler: Function;
            loadPuzzleCallbackHandler: Function;
        }
    ) {
        this.stoneDropCallbackHandler = handler.stoneDropCallbackHandler;
        this.loadPuzzleCallbackHandler = handler.loadPuzzleCallbackHandler;
        document.addEventListener(
            "stonesdropped",
            this.handleStoneDroppedEvent.bind(this),
            false
        );
        document.addEventListener(
            "loadpuzzle",
            this.handleLoadPuzzleEvent.bind(this),
            false
        );
    }

    private handleStoneDroppedEvent(event: Event) {
        console.log("stoneeeeeeeeee Droppppppp like Pro")
        this.stoneDropCallbackHandler(event);
    }

    private handleLoadPuzzleEvent(event: Event) {
        this.loadPuzzleCallbackHandler(event);
    }

    public unregisterEventListener() {
        document.removeEventListener(
            "stonesdropped",
            this.handleStoneDroppedEvent.bind(this),
            false
        );
        document.removeEventListener(
            "loadpuzzle",
            this.handleLoadPuzzleEvent.bind(this),
            false
        );
    }
}
