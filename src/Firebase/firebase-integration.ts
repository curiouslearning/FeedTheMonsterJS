import {BaseFirebaseIntegration} from './base-firebase-integration';
import {
  DowloadPercentCompleted,
  LevelCompletedEvent,
  PuzzleCompletedEvent,
  SelectedLevel,
  SessionEnd,
  SessionStart,
  TappedStart,
} from './firebase-event-interface';

/**
 * FirebaseIntegration is a singleton class that handles all Firebase analytics.
 * It is responsible for initializing the analytics package and tracking events.
 * 
 * Please note that this class is not async, so it will return the instance
 * even if it is not initialized.
 * 
 * @example
 * ```ts
 * // Step1. Initialize the Firebase Integration singleton.
 * await FirebaseIntegration.initializeAnalytics();
 * 
 * // Step2. Get the singleton instance.
 * const firebaseIntegration = FirebaseIntegration.getInstance();
 * 
 * // Step3. Track an event.
 * firebaseIntegration.sendSessionStartEvent({});
 * ```
 */
export class FirebaseIntegration extends BaseFirebaseIntegration {
  private static instance: FirebaseIntegration | null = null;

  protected constructor() {
    super();
  }

  /**
   * Initialize the Firebase Integration singleton.
   * This must be called once at app startup before any other Firebase methods.
   * This step makes sure that the analytics are initialized before any 
   * tracking is done.
   */
  public static async initializeAnalytics(): Promise<void> {
    if (!this.instance) {
      this.instance = new FirebaseIntegration();
    }

    if (!this.instance.isAnalyticsReady()) {
      await this.instance.initialize();
    }
  }

  /**
   * Get the Firebase Integration instance.
   * @throws Error if getInstance is called before initializeApp
   */
  public static getInstance(): FirebaseIntegration {
    if (!this.instance || !this.instance.isAnalyticsReady()) {
      throw new Error('FirebaseIntegration.initializeAnalytics() must be called before accessing the instance');
    }
    
    return this.instance;
  }

  public async initialize(): Promise<void> {
    await super.initialize();
  }

  public sendSessionStartEvent(data: SessionStart): void {
    this.trackCustomEvent('session_start', data);
  }

  public sendSessionEndEvent(data: SessionEnd): void {
    this.trackCustomEvent('session_end', data);
  }

  public sendSelectedLevelEvent(data: SelectedLevel): void {
    this.trackCustomEvent('selected_level', data);
  }

  public sendTappedStartEvent(data: TappedStart): void {
    this.trackCustomEvent('tapped_start', data);
  }

  public sendPuzzleCompletedEvent(data: PuzzleCompletedEvent): void {
    this.trackCustomEvent('puzzle_completed', data);
  }

  public sendLevelCompletedEvent(data: LevelCompletedEvent): void {
    this.trackCustomEvent('level_completed', data);
  }

  public sendUserClickedOnPlayEvent(): void {
    this.trackCustomEvent('user_clicked', {click: 'Click'});
  }

  public sendDownloadCompletedEvent(data: DowloadPercentCompleted): void {
    this.trackCustomEvent('download_completed', data);
  }

  public sendDownload25PercentCompletedEvent(
    data: DowloadPercentCompleted,
  ): void {
    this.trackCustomEvent('download_25', data);
  }

  public sendDownload50PercentCompletedEvent(
    data: DowloadPercentCompleted,
  ): void {
    this.trackCustomEvent('download_50', data);
  }

  public sendDownload75PercentCompletedEvent(
    data: DowloadPercentCompleted,
  ): void {
    this.trackCustomEvent('download_75', data);
  }
}
