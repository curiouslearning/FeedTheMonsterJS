import { BaseFirebaseIntegration } from "./base-firebase-integration";
import { LevelCompletedEvent, PuzzleCompletedEvent } from "./firebase-event-interface";

export class FirebaseIntegration extends BaseFirebaseIntegration {
    static instance: FirebaseIntegration;

    constructor() {
        super();
    }

    public static getInstance(): FirebaseIntegration {
        if (!FirebaseIntegration.instance) {
            FirebaseIntegration.instance = new FirebaseIntegration();
        }
        return FirebaseIntegration.instance;
    }

    public sendPuzzleCompletedEvent(data: PuzzleCompletedEvent): void {
        this.customEvents("puzzle_completed", data);
    }

    public sendLevelCompletedEvent(data: LevelCompletedEvent): void {
        this.customEvents("level_completed", data);
    }

    public sendSessionEndEvent(): void {
        this.sessionEnd();
    }

    public sendUserClickedOnPlayEvent(): void {
        this.customEvents('user_clicked', { click: 'Click' });
    }
}
