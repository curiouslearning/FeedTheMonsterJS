import scheduler, { TimerId } from "@services/scheduler";

export class TimeoutRegistry {
  private timeouts: Set<TimerId> = new Set();

  setTimeout(callback: () => void, delay: number): TimerId {
    const timerId = scheduler.setTimeout(() => {
      this.timeouts.delete(timerId);
      callback();
    }, delay);
    this.timeouts.add(timerId);
    return timerId;
  }

  cancel(timerId: TimerId | null | undefined): void {
    if (timerId === null || timerId === undefined) {
      return;
    }
    scheduler.cancelTimeout(timerId);
    this.timeouts.delete(timerId);
  }

  cancelAll(): void {
    for (const timerId of this.timeouts) {
      scheduler.cancelTimeout(timerId);
    }
    this.timeouts.clear();
  }
}
