import { Opaque } from 'type-fest';

type TimerId = Opaque<number, 'TimerId'>;

type Timer = {
  id: TimerId;
  callback: () => void;
  delay: number;
  remaining: number;
  loop: boolean;
};

let nextTimerId = 0;

/**
 * Custom scheduler for managing time-based events within the game loop.
 * Unlike standard window.setTimeout/setInterval, this respects the game's 
 * pause state and is driven by deltaTime from the main update loop.
 * TODO: When migrated to Core Modules, integrate with the Core Scheduler.
 */
class Scheduler {
  private timers: Map<TimerId, Timer> = new Map();

  /**
   * Schedules a one-time callback after a specified delay.
   * @param callback The function to execute.
   * @param delay Delay in milliseconds.
   * @returns A unique TimerId for clearing the timeout.
   */
  setTimeout(callback: () => void, delay: number): TimerId {
    const id = nextTimerId++ as TimerId;
    this.timers.set(id, {
      id,
      callback,
      delay,
      remaining: delay,
      loop: false,
    });
    return id;
  }

  /**
   * Cancels a previously scheduled timeout or interval.
   * @param id The ID of the timer to clear.
   */
  cancelTimeout(id: TimerId): void {
    if (id !== undefined && id !== null) {
      this.timers.delete(id);
    }
  }

  /**
   * Schedules a repeating callback at a specified interval.
   * @param callback The function to execute.
   * @param delay Interval in milliseconds.
   * @returns A unique TimerId for clearing the interval.
   */
  setInterval(callback: () => void, delay: number): TimerId {
    const id = nextTimerId++ as TimerId;
    const safeDelay = Math.max(1, delay); // Minimum 1ms to prevent runaway intervals
    this.timers.set(id, {
      id,
      callback,
      delay: safeDelay,
      remaining: safeDelay,
      loop: true,
    });
    return id;
  }

  /**
   * Updates all active timers by subtracting the provided delta time.
   * Executed by the main game loop.
   * @param delta The time elapsed since the last update in milliseconds.
   */
  update(delta: number): void {
    const snapshot = [...this.timers.values()];
    for (const timer of snapshot) {
      if (!this.timers.has(timer.id)) continue; // already cancelled
      timer.remaining -= delta;
      if (timer.remaining <= 0) {
        try {
          timer.callback();
        } catch (e) {
          console.error("Error in scheduled callback:", e);
        }

        if (timer.loop) {
          timer.remaining += timer.delay;
        } else {
          this.cancelTimeout(timer.id);
        }
      }
    }
  }

  /**
   * Clears all active timers and resets the scheduler state.
   */
  destroy(): void {
    this.timers.clear();
  }
}

// Making it a singleton
const scheduler = new Scheduler();
export default scheduler;
export { TimerId };