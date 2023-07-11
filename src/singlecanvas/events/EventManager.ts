export class EventManager {
    private stoneDropCallbackHandler: Function;
    private loadPuzzleCallbackHandler: Function;

    constructor(
        protected handler: {
            stoneDropCallbackHandler: Function;
            loadPuzzleCallbackHandler: Function;
        }
    ) {
        console.log(handler, "<---------------------")
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
        this.stoneDropCallbackHandler();
    }

    private handleLoadPuzzleEvent(event: Event) {
        this.loadPuzzleCallbackHandler();
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
