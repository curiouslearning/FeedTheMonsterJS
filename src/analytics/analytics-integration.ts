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
/**
 * Defines the supported analytics event types used across the application.
 *
 * Each enum value maps to a specific event payload defined in {@link EventDataMap}.
 * These event types should be used when calling {@link AnalyticsIntegration.track}
 * to ensure type safety and consistency.
 *
 * @example
 * ```ts
 * analytics.track(AnalyticsEventType.SESSION_START, {
 *   json_version_number: "1.0.0",
 *   timestamp: Date.now()
 * });
 *
 * analytics.track(AnalyticsEventType.PUZZLE_COMPLETED, {
 *   json_version_number: "1.0.0",
 *   success: true,
 *   level: 3,
 *   puzzleId: 42,
 *   expectedAnswer: "cat",
 *   userAnswer: "cat",
 *   distractors: ["dog", "bird"],
 *   timeTaken: 2.5
 * });
 * ```
 *
 * @since 1.0.0
 */
export const enum AnalyticsEventType {
  /** Marks the start of a user session. */
  SESSION_START = 'session_start',

  /** Marks the end of a user session. */
  SESSION_END = 'session_end',

  /** Logged when a user completes a puzzle. */
  PUZZLE_COMPLETED = 'puzzle_completed',

  /** Logged when a user completes a level. */
  LEVEL_COMPLETED = 'level_completed',

  /** Logged when a user taps the start button. */
  TAPPED_START = 'tapped_start',

  /** Logged when a user selects a level. */
  SELECTED_LEVEL = 'selected_level',

  /** Download progress reached 25%. */
  DOWNLOAD_25 = 'download_25',

  /** Download progress reached 50%. */
  DOWNLOAD_50 = 'download_50',

  /** Download progress reached 75%. */
  DOWNLOAD_75 = 'download_75',

  /** Download completed successfully. */
  DOWNLOAD_COMPLETED = 'download_completed',

  /** Logged when a user clicks a level-end button (e.g., replay, continue). */
  LEVEL_END_BUTTON_CLICK = 'level_end_button_click',

  /**
   * @deprecated Use {@link AnalyticsEventType.TAPPED_START} instead.
   * This event is maintained for backward compatibility only.
   */
  USER_CLICKED = 'user_clicked'
}

/**
 * Maps each {@link AnalyticsEventType} to the expected payload type.
 *
 * This type enforces strict typing when calling {@link AnalyticsIntegration.track}.
 * Each event type is associated with a specific event interface to ensure that
 * event data is consistent and valid.
 *
 * @example
 * ```ts
 * // ✅ Correct usage:
 * analytics.track(AnalyticsEventType.SESSION_START, {
 *   json_version_number: "1.0.0",
 *   timestamp: Date.now(),
 *   sessionId: "abc-123"
 * });
 *
 * // ❌ Type error: wrong payload for event type
 * analytics.track(AnalyticsEventType.PUZZLE_COMPLETED, {
 *   json_version_number: "1.0.0",
 *   sessionId: "abc-123" // Property 'sessionId' does not exist in PuzzleCompletedEvent
 * });
 * ```
 *
 * @since 1.0.0
 */
type EventDataMap = {
  /** Payload schema for {@link AnalyticsEventType.SESSION_START} */
  [AnalyticsEventType.SESSION_START]: SessionStart;

  /** Payload schema for {@link AnalyticsEventType.SESSION_END} */
  [AnalyticsEventType.SESSION_END]: SessionEnd;

  /** Payload schema for {@link AnalyticsEventType.PUZZLE_COMPLETED} */
  [AnalyticsEventType.PUZZLE_COMPLETED]: PuzzleCompletedEvent;

  /** Payload schema for {@link AnalyticsEventType.LEVEL_COMPLETED} */
  [AnalyticsEventType.LEVEL_COMPLETED]: LevelCompletedEvent;

  /** Payload schema for {@link AnalyticsEventType.TAPPED_START} */
  [AnalyticsEventType.TAPPED_START]: TappedStart;

  /** Payload schema for {@link AnalyticsEventType.SELECTED_LEVEL} */
  [AnalyticsEventType.SELECTED_LEVEL]: SelectedLevel;

  /** Payload schema for {@link AnalyticsEventType.DOWNLOAD_25} */
  [AnalyticsEventType.DOWNLOAD_25]: DowloadPercentCompleted;

  /** Payload schema for {@link AnalyticsEventType.DOWNLOAD_50} */
  [AnalyticsEventType.DOWNLOAD_50]: DowloadPercentCompleted;

  /** Payload schema for {@link AnalyticsEventType.DOWNLOAD_75} */
  [AnalyticsEventType.DOWNLOAD_75]: DowloadPercentCompleted;

  /** Payload schema for {@link AnalyticsEventType.DOWNLOAD_COMPLETED} */
  [AnalyticsEventType.DOWNLOAD_COMPLETED]: DowloadPercentCompleted;

  /** Payload schema for {@link AnalyticsEventType.LEVEL_END_BUTTON_CLICK} */
  [AnalyticsEventType.LEVEL_END_BUTTON_CLICK]: levelEndButtonsCLick;

  /**
   * Payload schema for {@link AnalyticsEventType.USER_CLICKED}.
   *
   * @deprecated This event type is deprecated. Use
   * {@link AnalyticsEventType.TAPPED_START} instead.
   */
  [AnalyticsEventType.USER_CLICKED]: { click: 'Click' };
};

/**
 * `AnalyticsIntegration` is a singleton service that manages all analytics tracking
 * in the application. It extends {@link BaseAnalyticsIntegration} and serves as the
 * central entry point for initializing and sending analytics events.
 *
 * This class is designed using the singleton pattern. You **must** call
 * {@link AnalyticsIntegration.initializeAnalytics} once at app startup before
 * retrieving the instance via {@link AnalyticsIntegration.getInstance}.
 *
 * @remarks
 * - Ensures analytics package is initialized only once.
 * - Provides backward compatibility methods (`sendXYZEvent`) that are deprecated
 *   in favor of {@link AnalyticsIntegration.track}.
 * - Automatically enriches events with common properties (user, language, version).
 *
 * @example
 * ```ts
 * // Step 1. Initialize the Analytics Integration singleton.
 * await AnalyticsIntegration.initializeAnalytics();
 *
 * // Step 2. Get the singleton instance.
 * const analyticsIntegration = AnalyticsIntegration.getInstance();
 *
 * // Step 3. Track an event.
 * analyticsIntegration.track(AnalyticsEventType.SESSION_START, {
 *   json_version_number: "1.0.0",
 *   timestamp: Date.now(),
 *   sessionId: "abc-123"
 * });
 * ```
 *
 * @since 1.0.0
 */
export class AnalyticsIntegration extends BaseAnalyticsIntegration {
  private static instance: AnalyticsIntegration | null = null;

  protected constructor() {
    super();
  }

/**
 * Creates the base set of analytics event properties shared across all events.
 *
 * These common properties include:
 * - `cr_user_id`: A pseudonymous user identifier
 * - `ftm_language`: The current application language
 * - `profile_number`: Always `0` (reserved for multi-profile support)
 * - `version_number`: The app version, read from the DOM element with ID `"version-info-id"`
 * - `json_version_number`: The schema version for the event payload
 *
 * @param {string} jsonVersionNumber - The JSON schema version number for the event.
 * @returns {CommonEventProperties} Standardized base event metadata.
 *
 * @remarks
 * - If the DOM element `#version-info-id` is not found, `version_number` will be set to an empty string.
 * - This method is used internally by {@link AnalyticsIntegration.track} to ensure all
 *   analytics events include consistent base metadata.
 *
 * @example
 * ```ts
 * const baseProps = analyticsIntegration['createBaseEventData']("1.0.0");
 * // {
 * //   cr_user_id: "abcd1234",
 * //   ftm_language: "en",
 * //   profile_number: 0,
 * //   version_number: "2.5.0",
 * //   json_version_number: "1.0.0"
 * // }
 * ```
 *
 * @since 1.0.0
 * @internal
 */
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
/**
 * Initializes the analytics system.
 *
 * This method extends {@link BaseAnalyticsIntegration.initialize} to set up
 * the underlying analytics library. It must be called during the app startup
 * sequence to ensure that the analytics client is ready before events are tracked.
 *
 * @returns {Promise<void>} A promise that resolves once initialization is complete.
 *
 * @remarks
 * - This method is automatically called by {@link AnalyticsIntegration.initializeAnalytics}.
 * - Developers should not call this directly in most cases — prefer
 *   {@link AnalyticsIntegration.initializeAnalytics}.
 *
 * @example
 * ```ts
 * // Usually handled internally by initializeAnalytics()
 * await analyticsIntegration.initialize();
 * ```
 *
 * @since 1.0.0
 * @internal
 */
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
