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

class Scheduler {
  private timers: Map<TimerId, Timer> = new Map();

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

  clearTimeout(id: TimerId): void {
    if (id !== undefined && id !== null) {
      this.timers.delete(id);
    }
  }

  setInterval(callback: () => void, delay: number): TimerId {
    const id = nextTimerId++ as TimerId;
    this.timers.set(id, {
      id,
      callback,
      delay,
      remaining: delay,
      loop: true,
    });
    return id;
  }

  clearInterval(id: TimerId): void {
    this.clearTimeout(id);
  }

  update(delta: number): void {
    for (const timer of this.timers.values()) {
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
          this.timers.delete(timer.id);
        }
      }
    }
  }

  destroy(): void {
    this.timers.clear();
  }
}

// Making it a singleton
const scheduler = new Scheduler();
export default scheduler;
export { TimerId };