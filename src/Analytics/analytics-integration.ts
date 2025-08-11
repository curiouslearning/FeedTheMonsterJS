import {BaseAnalyticsIntegration} from './base-analytics-integration';
import {
  DowloadPercentCompleted,
  LevelCompletedEvent,
  PuzzleCompletedEvent,
  SelectedLevel,
  SessionEnd,
  SessionStart,
  TappedStart,
} from './analytics-event-interface';

/**
 * AnalyitcsIntegration is a singleton class that handles all Analytics analytics.
 * It is responsible for initializing the analytics package and tracking events.
 * 
 * Please note that this class is not async, so it will return the instance
 * even if it is not initialized.
 * 
 * @example
 * ```ts
 * // Step1. Initialize the Analytics Integration singleton.
 * await AnalticsIntegration.initializeAnalytics();
 * 
 * // Step2. Get the singleton instance.
 * const analyticsIntegration = AnalyticsIntegration.getInstance();
 * 
 * // Step3. Track an event.
 * analyticsIntegration.sendSessionStartEvent({});
 * ```
 */
export class AnalyticsIntegration extends BaseAnalyticsIntegration {
  private static instance: AnalyticsIntegration | null = null;

  protected constructor() {
    super();
  }

  /**
   * Initialize the Analytics Integration singleton.
   * This must be called once at app startup before any other Analytics methods.
   * This step makes sure that the analytics are initialized before any 
   * tracking is done.
   */
  public static async initializeAnalytics(): Promise<void> {
    if (!this.instance) {
      this.instance = new AnalyticsIntegration();
    }

    if (!this.instance.isAnalyticsReady()) {
      await this.instance.initialize();
    }
  }

  /**
   * Get the Analytics Integration instance.
   * @throws Error if getInstance is called before initializeApp
   */
  public static getInstance(): AnalyticsIntegration {
    if (!this.instance || !this.instance.isAnalyticsReady()) {
      throw new Error('AnalyticsIntegration.initializeAnalytics() must be called before accessing the instance');
    }
    
    return this.instance;
  }

  public async initialize(): Promise<void> {
    await super.initialize();
  }

  public sendSessionStartEvent(data: SessionStart): void {
    this.trackCustomEvent('session_start_test', data);
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
    // Create event data
    const eventData = { ...data };
    
    // Ensure foils is a comma-separated string
    if (Array.isArray(eventData.foils)) {
        eventData.foils = eventData.foils.join(',');
    }
    
    this.trackCustomEvent('puzzle_completed', eventData);
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
