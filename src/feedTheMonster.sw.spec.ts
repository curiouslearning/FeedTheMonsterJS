/**
 * Client-side registration spec (US1).
 *
 * The app entrypoint (feedTheMonster.ts) self-instantiates at import and pulls in
 * the full game dependency graph, so the library-facing registration is isolated
 * in `@services/sw-registration` and tested here directly.
 */
const registerServiceWorkerUpdates = jest.fn();

jest.mock("@curiouslearning/sw", () => ({
  registerServiceWorkerUpdates: (...args: any[]) =>
    registerServiceWorkerUpdates(...args),
}));

import { registerFeedTheMonsterServiceWorker } from "@services/sw-registration";

describe("client: service worker registration (US1)", () => {
  afterEach(() => jest.clearAllMocks());

  it("Given the app boots, When it registers the worker, Then registerServiceWorkerUpdates is called with { swUrl: './sw.js', mode: 'confirm' }", async () => {
    const fakeRegistration = { update: jest.fn() };
    registerServiceWorkerUpdates.mockResolvedValue(fakeRegistration);

    const result = await registerFeedTheMonsterServiceWorker();

    expect(registerServiceWorkerUpdates).toHaveBeenCalledTimes(1);
    expect(registerServiceWorkerUpdates).toHaveBeenCalledWith({
      swUrl: "./sw.js",
      mode: "confirm",
    });
    // The underlying registration is returned so callers can update()/await ready.
    expect(result).toBe(fakeRegistration);
  });

  it("Given no channelName/readyMessage are passed, When registering, Then both sides fall back to the library's shared defaults", async () => {
    registerServiceWorkerUpdates.mockResolvedValue({ update: jest.fn() });

    await registerFeedTheMonsterServiceWorker();

    const options = registerServiceWorkerUpdates.mock.calls[0][0];
    expect(options).not.toHaveProperty("channelName");
    expect(options).not.toHaveProperty("readyMessage");
  });
});
