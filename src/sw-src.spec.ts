/**
 * Worker specs for src/sw-src.ts.
 *
 * The worker runs side effects at import time, so each test resets modules and
 * re-installs SW globals before importing the worker fresh.
 */
import {
  installServiceWorkerGlobals,
  MockBroadcastChannel,
  SwGlobalsHandle,
} from "./test-utils/sw-mocks";

const mockPrecacheAndRoute = jest.fn();
const mockRegisterUpdateNotifier = jest.fn();
const mockIsCacheBustRequest = jest.fn();

jest.mock("workbox-precaching", () => ({
  precacheAndRoute: (...args: any[]) => mockPrecacheAndRoute(...args),
}));
jest.mock("workbox-core", () => ({
  cacheNames: { precache: "precache-" },
}));
jest.mock("@curiouslearning/sw", () => ({
  registerUpdateNotifier: (...args: any[]) => mockRegisterUpdateNotifier(...args),
  isCacheBustRequest: (...args: any[]) => mockIsCacheBustRequest(...args),
  CACHE_BUST_PARAM: "cache-bust",
}));

// The real library predicate checks the query string for CACHE_BUST_PARAM;
// mirror that so behavioral fetch tests exercise a faithful implementation.
mockIsCacheBustRequest.mockImplementation((url: string) => {
  try {
    return new URL(url).searchParams.has("cache-bust");
  } catch {
    return false;
  }
});

const importWorker = () => require("./sw-src");

describe("service worker: update-notification lifecycle (US1)", () => {
  let handle: SwGlobalsHandle;

  afterEach(() => {
    handle?.restore();
    jest.clearAllMocks();
  });

  it("Given a SW scope, When the worker evaluates, Then registerUpdateNotifier is called after precacheAndRoute", () => {
    jest.resetModules();
    handle = installServiceWorkerGlobals({ hasActiveWorker: true });

    importWorker();

    expect(mockPrecacheAndRoute).toHaveBeenCalledTimes(1);
    expect(mockRegisterUpdateNotifier).toHaveBeenCalledTimes(1);
    // Order: precache registration must run before the update notifier.
    expect(mockPrecacheAndRoute.mock.invocationCallOrder[0]).toBeLessThan(
      mockRegisterUpdateNotifier.mock.invocationCallOrder[0]
    );
  });

  it("Given the migrated worker, When it evaluates, Then it registers no hand-rolled 'activate' broadcast handler", () => {
    jest.resetModules();
    handle = installServiceWorkerGlobals({ hasActiveWorker: true });

    importWorker();

    // The activate/clients.claim/postMessage('Update Found') block moved into
    // registerUpdateNotifier — the worker must not add its own 'activate' listener.
    expect(handle.handlers.get("activate")).toBeUndefined();
  });

  it("Given a first install (no active worker), When it evaluates, Then it still only delegates to registerUpdateNotifier (no manual broadcast)", async () => {
    jest.resetModules();
    handle = installServiceWorkerGlobals({ hasActiveWorker: false });

    importWorker();

    expect(mockRegisterUpdateNotifier).toHaveBeenCalledTimes(1);
    // No client ever receives a worker-authored "Update Found" message.
    const postedUpdate = handle.clients.matchAll.mock.calls.length;
    expect(postedUpdate).toBe(0);
  });
});

describe("service worker: offline caching & fetch handling (US2)", () => {
  let handle: SwGlobalsHandle;
  let fetchMock: jest.Mock;
  const g = globalThis as any;

  const makeFetchEvent = (url: string, method = "GET") => {
    const respondWith = jest.fn();
    return {
      respondWith,
      request: { url, method, headers: {}, mode: "cors" },
    };
  };

  beforeEach(() => {
    jest.resetModules();
    handle = installServiceWorkerGlobals({ hasActiveWorker: true });
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    g.fetch = fetchMock;
    // Minimal Response so the worker's offline fallback can construct one.
    g.Response = class {
      body: any;
      status: number;
      constructor(body?: any, init?: { status?: number }) {
        this.body = body;
        this.status = init?.status ?? 200;
      }
    };
    // Minimal Request so the worker's /data/ aliasing can construct one.
    g.Request = class {
      url: string;
      constructor(url: string, init?: Record<string, unknown>) {
        this.url = url;
        Object.assign(this, init);
      }
    };
  });

  afterEach(() => {
    handle?.restore();
    jest.clearAllMocks();
  });

  it("Given the worker evaluates, Then precacheAndRoute is configured with ignoreURLParametersMatching and no runtime exclude", () => {
    importWorker();

    expect(mockPrecacheAndRoute).toHaveBeenCalledTimes(1);
    const options = mockPrecacheAndRoute.mock.calls[0][1];
    expect(options.ignoreURLParametersMatching).toBeDefined();
    expect(options).not.toHaveProperty("exclude");
  });

  it("Given a request carrying the cache-bust param, When fetch is handled, Then it bypasses the cache and goes straight to the network", () => {
    importWorker();
    const fetchHandler = handle.handlers.get("fetch")![0];
    const origin = g.self.location.origin;
    const event = makeFetchEvent(`${origin}/lang/en/ftm_en.json?cache-bust=123`);

    fetchHandler(event);

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(event.request);
    // Cache was never consulted for a cache-bust request.
    expect((g.caches.match as jest.Mock)).not.toHaveBeenCalled();
  });

  it("Given a /data/*.json request, When fetch is handled, Then it is aliased to the assessment asset path and served cache-first", async () => {
    importWorker();
    const fetchHandler = handle.handlers.get("fetch")![0];
    const origin = g.self.location.origin;
    const event = makeFetchEvent(`${origin}/data/mydatakey.json`);

    fetchHandler(event);

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    // Cache-first: caches.match is consulted with the aliased assessment path.
    const matchArg = (g.caches.match as jest.Mock).mock.calls[0][0];
    expect(String(matchArg.url ?? matchArg)).toContain("assessment-survey/data");
  });

  it("Given a normal request that misses the cache and cannot reach the network, When fetch is handled, Then a 503 fallback response is returned", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    importWorker();
    const fetchHandler = handle.handlers.get("fetch")![0];
    const origin = g.self.location.origin;
    const event = makeFetchEvent(`${origin}/assets/some-asset.png`);

    fetchHandler(event);

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    const response = await event.respondWith.mock.calls[0][0];
    expect(response.status).toBe(503);
  });

  it("Given any request, When fetch is handled, Then cache-bust detection is delegated to the shared library predicate (US3)", () => {
    importWorker();
    const fetchHandler = handle.handlers.get("fetch")![0];
    const origin = g.self.location.origin;
    const url = `${origin}/lang/en/ftm_en.json?cache-bust=1`;

    fetchHandler(makeFetchEvent(url));

    // No local searchParams check — the worker calls isCacheBustRequest(url).
    expect(mockIsCacheBustRequest).toHaveBeenCalledWith(url);
  });
});
