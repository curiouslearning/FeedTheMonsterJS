import { AbstractAnalyticsStrategy } from '@curiouslearning/analytics';
import { AndroidInterface } from '@curiouslearning/core';
import { LevelCompletedEvent, PuzzleCompletedEvent } from 'src/analytics/analytics-event-interface';
import { AnalyticsEventType } from 'src/analytics/analytics-integration';
import { appConfig } from '@appConfig';
import {
  FTM_SUMMARY_DATA_DEFAULTS,
  FtmSummaryData,
} from '../../constants/summary-data-schema';

export interface AndroidAnalyticsStrategyOptions {
  cr_user_id: string;
  /** FTM sub-app version, forwarded to every payload as metadata.app_version. */
  app_version?: string;
  /** Selected language. Scopes the seed guard, since the container keys summaries per language. */
  lang: string;
}

export class AndroidAnalyticsStrategy extends AbstractAnalyticsStrategy {
  private readonly cr_user_id: string;
  /**
   * Typed with the FTM summary schema, so every summary write below is checked against it — a field
   * outside FTM_SUMMARY_DATA_DEFAULTS, or an options key naming one, will not compile.
   */
  private readonly androidInterface : AndroidInterface<FtmSummaryData>;

  constructor(options: AndroidAnalyticsStrategyOptions) {
    super();
    this.cr_user_id = options.cr_user_id;
    this.androidInterface = new AndroidInterface<FtmSummaryData>({
      app_id: 'feed-the-monster',
      cr_user_id: this.cr_user_id ?? '',
      lang: options.lang,
      metadata: {
        environment: appConfig.ENV,
        app_version: options.app_version ?? ''
      },
      log: appConfig.DEBUG_MODE
    });
  }

  async initialize(): Promise<void> {
    // No initialization needed for Android interface
    return Promise.resolve();
  }
  
  track(eventName: string, data: any): void {
     switch (eventName) {
      case AnalyticsEventType.LEVEL_COMPLETED:
        this.handleLevelCompleted(data as LevelCompletedEvent);
        break;
      case AnalyticsEventType.PUZZLE_COMPLETED:
        this.handlePuzzleCompleted(data);
        break;
      default:
        console.warn(`Unhandled event: ${eventName} with data:`, data);
    }
  }
  
  dispose(): void {
    // nothing to dispose for Android interface
  }

  /**
   * Seeds this user's summary document with 0 for every field in the schema, so the fields read 0
   * rather than being absent until the matching event fires. Core handles the once-per-document
   * guard and never throws, so this is safe to call on every launch.
   */
  logInitialSummaryData(): void {
    this.androidInterface.logInitialSummaryData(FTM_SUMMARY_DATA_DEFAULTS);
  }

  private handleLevelCompleted(data: LevelCompletedEvent) {
    const { duration, highest_level_completed , level_type, ftm_language ,level_number} = data;
    this.androidInterface.logSummaryData({
      levels_completed: 1,
      time_spent_total_second: duration ?? 0,
      highest_level_completed: highest_level_completed ?? 0
    }, {
      levels_completed: 'add',
      time_spent_total_second: 'add'
    });

    this.androidInterface.logUserSessionsData({
      type: level_type ?? 'unknown',
      event_type: 'level_completed',
      lang: ftm_language ?? 'unknown',
      level: level_number ?? 0,
    });
  }

  private handlePuzzleCompleted(data: PuzzleCompletedEvent) {
    const { success_or_failure, level_type, ftm_language, level_number, puzzle_number, version_number } = data;
    this.androidInterface.logSummaryData({
      puzzles_completed: 1,
      puzzle_success: success_or_failure === 'success' ? 1 : 0,
      puzzle_failure: success_or_failure === 'failure' ? 1 : 0,
    }, {
      puzzles_completed: 'add',
      puzzle_success: 'add',
      puzzle_failure: 'add'
    });

    this.androidInterface.logUserSessionsData({
      type: level_type ?? 'unknown',
      event_type: 'puzzle_completed',
      lang: ftm_language ?? 'unknown',
      is_success: success_or_failure === 'success',
      level: level_number ?? 0,
      puzzle: puzzle_number ?? 0
    });
  }
}
