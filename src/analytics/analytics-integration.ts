import {BaseAnalyticsIntegration} from './base-analytics-integration';
import type {
  CommonEventProperties,
  DowloadPercentCompleted,
  LevelCompletedEvent,
  PuzzleCompletedEvent,
  SelectedLevel,
  SessionEnd,
  SessionStart,
  TappedStart,
  levelEndButtonsCLick,
} from './analytics-event-interface';
import { lang, pseudoId } from '@common';

export const enum AnalyticsEventType {
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  PUZZLE_COMPLETED = 'puzzle_completed',
  LEVEL_COMPLETED = 'level_completed',
  TAPPED_START = 'tapped_start',
  SELECTED_LEVEL = 'selected_level',
  DOWNLOAD_25 = 'download_25',
  DOWNLOAD_50 = 'download_50',
  DOWNLOAD_75 = 'download_75',
  DOWNLOAD_COMPLETED = 'download_completed',
  LEVEL_END_BUTTON_CLICK = 'level_end_button_click',
  /** @deprecated Deprecated in favor of tapped_start event. */
  USER_CLICKED = 'user_clicked'
}

type EventDataMap = {
  [AnalyticsEventType.SESSION_START]: SessionStart;
  [AnalyticsEventType.SESSION_END]: SessionEnd;
  [AnalyticsEventType.PUZZLE_COMPLETED]: PuzzleCompletedEvent;
  [AnalyticsEventType.LEVEL_COMPLETED]: LevelCompletedEvent;
  [AnalyticsEventType.TAPPED_START]: TappedStart;
  [AnalyticsEventType.SELECTED_LEVEL]: SelectedLevel;
  [AnalyticsEventType.DOWNLOAD_25]: DowloadPercentCompleted;
  [AnalyticsEventType.DOWNLOAD_50]: DowloadPercentCompleted;
  [AnalyticsEventType.DOWNLOAD_75]: DowloadPercentCompleted;
  [AnalyticsEventType.DOWNLOAD_COMPLETED]: DowloadPercentCompleted;
  [AnalyticsEventType.LEVEL_END_BUTTON_CLICK]: levelEndButtonsCLick;
  [AnalyticsEventType.USER_CLICKED]: { click: 'Click' };
};

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

  private createBaseEventData(jsonVersionNumber: string): CommonEventProperties {
    return {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id")?.innerHTML || '',
      json_version_number: jsonVersionNumber,
    };
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

  /**
   * Core method to track all analytics events
   * @param eventType The type of event to track
   * @param data The event data
   */
  public track<T extends AnalyticsEventType>(
    eventType: T,
    eventData: Partial<CommonEventProperties> & { json_version_number: string } & Omit<EventDataMap[T], keyof CommonEventProperties>
  ): void {
    const baseData = this.createBaseEventData(eventData.json_version_number);
    let data = { ...baseData, ...eventData } as EventDataMap[T];

    this.trackCustomEvent(eventType, data);
  }

  /** @deprecated Use track(AnalyticsEventType.SESSION_START, data) instead */
  public sendSessionStartEvent(data: SessionStart): void {
    this.track(AnalyticsEventType.SESSION_START, data);
  }

  /** @deprecated Use track(AnalyticsEventType.SESSION_END, data) instead */
  public sendSessionEndEvent(data: SessionEnd): void {
    this.track(AnalyticsEventType.SESSION_END, data);
  }

  /** @deprecated Use track(AnalyticsEventType.SELECTED_LEVEL, data) instead */
  public sendSelectedLevelEvent(data: SelectedLevel): void {
    this.track(AnalyticsEventType.SELECTED_LEVEL, data);
  }

  /** @deprecated Use track(AnalyticsEventType.TAPPED_START, data) instead */
  public sendTappedStartEvent(data: TappedStart): void {
    this.track(AnalyticsEventType.TAPPED_START, data);
  }

  /** @deprecated Use track(AnalyticsEventType.PUZZLE_COMPLETED, data) instead */
  public sendPuzzleCompletedEvent(data: PuzzleCompletedEvent): void {
    this.track(AnalyticsEventType.PUZZLE_COMPLETED, data);
  }

  /** @deprecated Use track(AnalyticsEventType.LEVEL_COMPLETED, data) instead */
  public sendLevelCompletedEvent(data: LevelCompletedEvent): void {
    this.track(AnalyticsEventType.LEVEL_COMPLETED, data);
  }

  /** @deprecated This event type is deprecated. Consider using other tracking methods */
  public sendUserClickedOnPlayEvent(): void {
    this.track(AnalyticsEventType.USER_CLICKED, { 
      json_version_number: '',
      click: 'Click' 
    });
  }

  /** @deprecated Use track(AnalyticsEventType.DOWNLOAD_COMPLETED, data) instead */
  public sendDownloadCompletedEvent(data: DowloadPercentCompleted): void {
    this.track(AnalyticsEventType.DOWNLOAD_COMPLETED, data);
  }

  /** @deprecated Use track(AnalyticsEventType.DOWNLOAD_25, data) instead */
  public sendDownload25PercentCompletedEvent(
    data: DowloadPercentCompleted,
  ): void {
    this.track(AnalyticsEventType.DOWNLOAD_25, data);
  }

  /** @deprecated Use track(AnalyticsEventType.DOWNLOAD_50, data) instead */
  public sendDownload50PercentCompletedEvent(
    data: DowloadPercentCompleted,
  ): void {
    this.track(AnalyticsEventType.DOWNLOAD_50, data);
  }

  /** @deprecated Use track(AnalyticsEventType.DOWNLOAD_75, data) instead */
  public sendDownload75PercentCompletedEvent(
    data: DowloadPercentCompleted,
  ): void {
    this.track(AnalyticsEventType.DOWNLOAD_75, data);
  }
}
