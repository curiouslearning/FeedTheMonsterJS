import { AbstractAnalyticsStrategy } from '@curiouslearning/analytics';
import { AndroidInterface } from '@curiouslearning/core';
import { LevelCompletedEvent } from 'src/analytics/analytics-event-interface';
import { AnalyticsEventType } from 'src/analytics/analytics-integration';

export interface AndroidAnalyticsStrategyOptions {
  cr_user_id: string;
}

export class AndroidAnalyticsStrategy extends AbstractAnalyticsStrategy {
  private readonly cr_user_id: string;
  private readonly androidInterface : AndroidInterface;

  constructor(options: AndroidAnalyticsStrategyOptions) {
    super();
    this.cr_user_id = options.cr_user_id;
    this.androidInterface = new AndroidInterface({
      app_id: 'feed-the-monster',
      cr_user_id: this.cr_user_id ?? ''
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
        console.warn(`Unhandled event: ${event} width data:`, data);
    }
  }
  
  dispose(): void {
    // nothing to dispose for Android interface
  }

  private handleLevelCompleted(data: LevelCompletedEvent) {
    const { duration, highest_level_completed , levelType, ftm_language ,level_number} = data;
    this.androidInterface .logSummaryData({
      levels_completed: 1,
      time_spent_total_second: duration ?? 0,
      highest_level_completed: highest_level_completed ?? 0
    }, {
      levels_completed: 'add',
      time_spent_total_second: 'add'
    });

    this.androidInterface.logUserSessionsData({
      app_id: 'feedthemonster',
      cr_user_id: this.cr_user_id,
      data: {
        type: levelType ?? 'unknown',
        event_type: 'level_completed',
        lang: ftm_language ?? 'unknown',
        level: level_number ?? 0,
      }
    });
  }

  private handlePuzzleCompleted(data: any) {
    const { success_or_failure } = data;
    this.androidInterface .logSummaryData({
      puzzles_completed: 1,
      puzzle_success: success_or_failure === 'success' ? 1 : 0,
      puzzle_failure: success_or_failure === 'failure' ? 1 : 0,
    }, {
      puzzles_completed: 'add',
      puzzle_success: 'add',
      puzzle_failure: 'add'
    });
  }
}
