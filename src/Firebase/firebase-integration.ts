import { BaseFirebaseIntegration } from "./base-firebase-integration";
import { Dowload25PercentCompleted, Dowload50PercentCompleted, Dowload75PercentCompleted, DownloadCompleted, LevelCompletedEvent, PuzzleCompletedEvent, SelectedLevel, SessionEnd, SessionStart, TappedStart } from "./firebase-event-interface";

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
    public sendSessionStartEvent(data: SessionStart): void {
        this.customEvents("session_start", data);
    }
    public sendSessionEndEvent(data: SessionEnd): void {
        this.customEvents("session_end", data);
    }
    public sendSelectedLevelEvent(data: SelectedLevel): void {
        this.customEvents("selected_level", data);
    }
    public sendTappedStartEvent(data: TappedStart): void {
        this.customEvents("tapped_start", data);
    }
    public sendPuzzleCompletedEvent(data: PuzzleCompletedEvent): void {
        this.customEvents("puzzle_completed", data);
    }

    public sendLevelCompletedEvent(data: LevelCompletedEvent): void {
        this.customEvents("level_completed", data);
    }

    public sendUserClickedOnPlayEvent(): void {
        this.customEvents('user_clicked', { click: 'Click' });
    }

    public sendDownloadCompletedEvent(data: DownloadCompleted): void {
        this.customEvents('download_completed', data);
    }public sendDownload25PercentCompletedEvent(data:Dowload25PercentCompleted): void {
        this.customEvents('download_25',data);
    }
    public sendDownload50PercentCompletedEvent(data:Dowload50PercentCompleted): void {
        this.customEvents('download_50',data);
    }
    public sendDownload75PercentCompletedEvent(data:Dowload75PercentCompleted): void {
        this.customEvents('download_75',data);
    }
}
