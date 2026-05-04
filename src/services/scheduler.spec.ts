import scheduler from './scheduler';

describe('Scheduler Service', () => {
  let callback: jest.Mock;

  beforeEach(() => {
    callback = jest.fn();
    scheduler.destroy(); // Ensure clean state before each test
  });

  // Feature: Schedule a one-time task
  // Scenario: Execute a callback after a delay
  test('should execute a callback after the specified delay', () => {
    // Given the scheduler is initialized
    // And I verify no timers are initially active (implicit by clean state)

    // When I schedule a task with a delay of 1000ms
    const delay = 1000;
    scheduler.setTimeout(callback, delay);

    // And I update the scheduler with 500ms
    scheduler.update(500);
    // Then the callback should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    // And I update the scheduler with another 500ms
    scheduler.update(500);
    // Then the callback should be called exactly once
    expect(callback).toHaveBeenCalledTimes(1);
  });

  // Feature: Schedule a repeating task
  // Scenario: Execute a callback repeatedly at intervals
  test('should execute a callback repeatedly at the specified interval', () => {
    // Given the scheduler is initialized

    // When I schedule a repeating task with an interval of 1000ms
    const interval = 1000;
    scheduler.setInterval(callback, interval);

    // And I update the scheduler with 1000ms
    scheduler.update(1000);
    // Then the callback should be called once
    expect(callback).toHaveBeenCalledTimes(1);

    // And I update the scheduler with another 1000ms
    scheduler.update(1000);
    // Then the callback should be called twice
    expect(callback).toHaveBeenCalledTimes(2);
  });

  // Feature: Cancel a scheduled task
  // Scenario: Cancel a pending timeout
  test('should not execute the callback if the timeout is cancelled', () => {
    // Given I have scheduled a task with a delay of 1000ms
    const delay = 1000;
    const timerId = scheduler.setTimeout(callback, delay);

    // When I cancel the task
    scheduler.cancelTimeout(timerId);

    // And I update the scheduler with 1000ms
    scheduler.update(1000);

    // Then the callback should not be called
    expect(callback).not.toHaveBeenCalled();
  });
});
