import { AnalyticsEventType } from 'src/analytics/analytics-integration';
import { AndroidAnalyticsStrategy } from './android-analytics-strategy';

const mockLogSummaryData = jest.fn();

jest.mock('@curiouslearning/core', () => ({
  AndroidInterface: jest.fn().mockImplementation(() => ({
    logSummaryData: mockLogSummaryData,
  })),
}));

jest.mock('@curiouslearning/analytics', () => ({
  AbstractAnalyticsStrategy: class {
    initialize(): Promise<void> { return Promise.resolve(); }
    track(_eventName: string, _data: any): void {}
    dispose(): void {}
  },
}));

describe('Feature: Android analytics strategy', () => {
  let strategy: AndroidAnalyticsStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new AndroidAnalyticsStrategy({ cr_user_id: 'user-123' });
  });

  describe('Scenario: Initializing the strategy', () => {
    it('Given a valid cr_user_id, when initialize is called, then it resolves without error', async () => {
      await expect(strategy.initialize()).resolves.toBeUndefined();
    });
  });

  describe('Scenario: Tracking a level_completed event', () => {
    it('Given a level_completed event with duration and highest_level_completed, when track is called, then logSummaryData is called with all fields in the correct payload', () => {
      // Given
      const eventName = AnalyticsEventType.LEVEL_COMPLETED;
      const data = { duration: 45, highest_level_completed: 7 };

      // When
      strategy.track(eventName, data);

      // Then
      expect(mockLogSummaryData).toHaveBeenCalledTimes(1);
      expect(mockLogSummaryData).toHaveBeenCalledWith(
        { levels_completed: 1, time_spent_total_second: 45, highest_level_completed: 7 },
        { levels_completed: 'add', time_spent_total_second: 'add' }
      );
    });

    it('Given a level_completed event with no duration, when track is called, then time_spent_total_second defaults to 0', () => {
      // Given
      const eventName = AnalyticsEventType.LEVEL_COMPLETED;
      const data = { highest_level_completed: 3 };

      // When
      strategy.track(eventName, data);

      // Then
      expect(mockLogSummaryData).toHaveBeenCalledWith(
        { levels_completed: 1, time_spent_total_second: 0, highest_level_completed: 3 },
        { levels_completed: 'add', time_spent_total_second: 'add' }
      );
    });

    it('Given a level_completed event with no highest_level_completed, when track is called, then highest_level_completed defaults to 0', () => {
      // Given
      const eventName = AnalyticsEventType.LEVEL_COMPLETED;
      const data = { duration: 30 };

      // When
      strategy.track(eventName, data);

      // Then
      expect(mockLogSummaryData).toHaveBeenCalledWith(
        { levels_completed: 1, time_spent_total_second: 30, highest_level_completed: 0 },
        { levels_completed: 'add', time_spent_total_second: 'add' }
      );
    });
  });

  describe('Scenario: Tracking a puzzle_completed event', () => {
    it('Given a puzzle_completed event with success_or_failure true, when track is called, then logSummaryData is called with puzzle_success 1 and puzzle_failure 0', () => {
      // Given
      const eventName = AnalyticsEventType.PUZZLE_COMPLETED;
      const data = { success_or_failure: true };

      // When
      strategy.track(eventName, data);

      // Then
      expect(mockLogSummaryData).toHaveBeenCalledTimes(1);
      expect(mockLogSummaryData).toHaveBeenCalledWith(
        { puzzles_completed: 1, puzzle_success: 1, puzzle_failure: 0 },
        { puzzles_completed: 'add', puzzle_success: 'add', puzzle_failure: 'add' }
      );
    });

    it('Given a puzzle_completed event with success_or_failure false, when track is called, then logSummaryData is called with puzzle_success 0 and puzzle_failure 1', () => {
      // Given
      const eventName = AnalyticsEventType.PUZZLE_COMPLETED;
      const data = { success_or_failure: false };

      // When
      strategy.track(eventName, data);

      // Then
      expect(mockLogSummaryData).toHaveBeenCalledWith(
        { puzzles_completed: 1, puzzle_success: 0, puzzle_failure: 1 },
        { puzzles_completed: 'add', puzzle_success: 'add', puzzle_failure: 'add' }
      );
    });
  });

  describe('Scenario: Disposing the strategy', () => {
    it('Given an initialized strategy, when dispose is called, then it completes without error', () => {
      expect(() => strategy.dispose()).not.toThrow();
    });
  });
});
