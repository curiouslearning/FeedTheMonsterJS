import scheduler from "@services/scheduler";
import { TimeoutRegistry } from "@common";

describe("TimeoutRegistry", () => {
  afterEach(() => {
    scheduler.destroy();
    jest.restoreAllMocks();
  });

  test("setTimeout schedules and removes after execution", () => {
    const registry = new TimeoutRegistry();
    const callback = jest.fn();

    registry.setTimeout(callback, 10);
    scheduler.update(9);
    expect(callback).not.toHaveBeenCalled();

    scheduler.update(1);
    expect(callback).toHaveBeenCalledTimes(1);

    const cancelSpy = jest.spyOn(scheduler, "cancelTimeout");
    registry.cancelAll();
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  test("cancel prevents scheduled callback", () => {
    const registry = new TimeoutRegistry();
    const callback = jest.fn();

    const timerId = registry.setTimeout(callback, 5);
    registry.cancel(timerId);
    scheduler.update(10);

    expect(callback).not.toHaveBeenCalled();
  });

  test("cancel ignores null and undefined", () => {
    const registry = new TimeoutRegistry();

    expect(() => registry.cancel(null)).not.toThrow();
    expect(() => registry.cancel(undefined)).not.toThrow();
  });

  test("cancelAll clears all scheduled callbacks", () => {
    const registry = new TimeoutRegistry();
    const callbackA = jest.fn();
    const callbackB = jest.fn();

    registry.setTimeout(callbackA, 5);
    registry.setTimeout(callbackB, 10);
    registry.cancelAll();

    scheduler.update(20);
    expect(callbackA).not.toHaveBeenCalled();
    expect(callbackB).not.toHaveBeenCalled();
  });
});
