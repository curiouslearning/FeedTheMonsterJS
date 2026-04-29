import { AbstractAnalyticsStrategy } from '@curiouslearning/analytics';
import { AndroidInterface } from '@curiouslearning/core';

export interface AndroidAnalyticsStrategyOptions {
  cr_user_id: string;
}

export class AndroidAnalyticsStrategy extends AbstractAnalyticsStrategy {
  private readonly cr_user_id: string;
  private readonly androidInterface : AndroidInterface;

  /**
   * TODO: consolidate these events in one place, current duplication of analytics events.
   * Events can be shared between in-game functionality and not just analytics.
   */
  static readonly EVENTS = {
    LEVEL_COMPLETED: 'level_completed'
  };

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
      case AndroidAnalyticsStrategy.EVENTS.LEVEL_COMPLETED:
        this.handleLevelCompleted(data);
        break;
      default:
        console.warn(`Unhandled event: ${event} width data:`, data);
    }
  }
  
  dispose(): void {
    // nothing to dispose for Android interface
  }

  private handleLevelCompleted(data: any) {
    const { duration } = data;
    this.androidInterface .logSummaryData({
      levels_completed: 1,
      time_spent_total_second: duration ?? 0
    }, {
      levels_completed: 'add',
      time_spent_total_second: 'add'
    });
  }
}