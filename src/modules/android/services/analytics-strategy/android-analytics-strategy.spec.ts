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
    it('Given a level_completed event with a duration, when track is called, then logSummaryData is called with the correct payload', () => {
      // Given
      const eventName = AndroidAnalyticsStrategy.EVENTS.LEVEL_COMPLETED;
      const data = { duration: 45 };

      // When
      strategy.track(eventName, data);

      // Then
      expect(mockLogSummaryData).toHaveBeenCalledTimes(1);
      expect(mockLogSummaryData).toHaveBeenCalledWith(
        { levels_completed: 1, time_spent_total_second: 45 },
        { levels_completed: 'add', time_spent_total_second: 'add' }
      );
    });

    it('Given a level_completed event with no duration, when track is called, then time_spent_total_second defaults to 0', () => {
      // Given
      const eventName = AndroidAnalyticsStrategy.EVENTS.LEVEL_COMPLETED;
      const data = {};

      // When
      strategy.track(eventName, data);

      // Then
      expect(mockLogSummaryData).toHaveBeenCalledWith(
        { levels_completed: 1, time_spent_total_second: 0 },
        { levels_completed: 'add', time_spent_total_second: 'add' }
      );
    });
  });

  describe('Scenario: Disposing the strategy', () => {
    it('Given an initialized strategy, when dispose is called, then it completes without error', () => {
      expect(() => strategy.dispose()).not.toThrow();
    });
  });
});
