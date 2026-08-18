/**
 * Service-worker test scaffolding shared by the worker specs.
 *
 * The worker script (`src/sw-src.ts`) executes side effects at module-evaluation
 * time (precache registration, `self.registration.active` read, BroadcastChannel
 * creation, `self.addEventListener` wiring). These helpers install a
 * `ServiceWorkerGlobalScope`-shaped `self` plus a `BroadcastChannel` and `caches`
 * mock so a spec can `import` the worker and then drive its captured event
 * handlers directly.
 */

type Listener = (event: any) => any;

/** In-memory BroadcastChannel that routes messages between instances by name. */
export class MockBroadcastChannel {
  private static registry = new Map<string, Set<MockBroadcastChannel>>();
  readonly name: string;
  readonly posted: any[] = [];
  onmessage: Listener | null = null;
  private listeners = new Set<Listener>();

  constructor(name: string) {
    this.name = name;
    const set = MockBroadcastChannel.registry.get(name) ?? new Set();
    set.add(this);
    MockBroadcastChannel.registry.set(name, set);
  }

  addEventListener(type: string, listener: Listener): void {
    if (type === "message") this.listeners.add(listener);
  }

  removeEventListener(type: string, listener: Listener): void {
    if (type === "message") this.listeners.delete(listener);
  }

  postMessage(data: any): void {
    this.posted.push(data);
    const peers = MockBroadcastChannel.registry.get(this.name);
    if (!peers) return;
    for (const peer of peers) {
      if (peer === this) continue;
      const event = { data };
      peer.onmessage?.(event);
      peer.listeners.forEach((l) => l(event));
    }
  }

  close(): void {
    MockBroadcastChannel.registry.get(this.name)?.delete(this);
  }

  /** Reset the cross-instance registry between tests. */
  static reset(): void {
    MockBroadcastChannel.registry.clear();
  }
}

export interface SwGlobalsHandle {
  /** Event handlers captured from `self.addEventListener`, keyed by event type. */
  handlers: Map<string, Listener[]>;
  /** Dispatch a captured handler with a synthetic event (awaits waitUntil/respondWith). */
  dispatch: (type: string, event: any) => Promise<void>;
  registration: { active: unknown; scope: string };
  clients: { claim: jest.Mock; matchAll: jest.Mock };
  skipWaiting: jest.Mock;
  restore: () => void;
}

export interface InstallSwGlobalsOptions {
  /** Whether a previous worker is already active (drives `isUpdate`). */
  hasActiveWorker?: boolean;
  scope?: string;
  href?: string;
  matchedClients?: Array<{ postMessage: jest.Mock }>;
}

/**
 * Installs SW globals onto the jsdom `self`/`global`. Call inside `beforeEach`,
 * BEFORE importing the worker module (use `jest.isolateModules` / dynamic import
 * so the worker re-evaluates against these globals).
 */
export function installServiceWorkerGlobals(
  options: InstallSwGlobalsOptions = {}
): SwGlobalsHandle {
  const {
    hasActiveWorker = false,
    scope = "https://example.org/",
    href = "https://example.org/index.html",
    matchedClients = [{ postMessage: jest.fn() }],
  } = options;

  const handlers = new Map<string, Listener[]>();
  const g = globalThis as any;

  const originalAddEventListener = g.self?.addEventListener;
  const originalDescriptors = {
    registration: Object.getOwnPropertyDescriptor(g.self ?? g, "registration"),
  };

  const registration = {
    active: hasActiveWorker ? {} : null,
    scope,
    update: jest.fn().mockResolvedValue(undefined),
  };
  const clients = {
    claim: jest.fn().mockResolvedValue(undefined),
    matchAll: jest.fn().mockResolvedValue(matchedClients),
  };
  const skipWaiting = jest.fn();

  g.BroadcastChannel = MockBroadcastChannel;
  g.caches = {
    open: jest.fn().mockResolvedValue({
      add: jest.fn().mockResolvedValue(undefined),
      put: jest.fn().mockResolvedValue(undefined),
      match: jest.fn().mockResolvedValue(undefined),
    }),
    match: jest.fn().mockResolvedValue(undefined),
    keys: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue(true),
  };

  const selfObj = g.self ?? g;
  selfObj.registration = registration;
  selfObj.clients = clients;
  selfObj.skipWaiting = skipWaiting;
  // jsdom's window.location is non-configurable and cannot be redefined; only
  // override when the environment allows it (e.g. a bare Node global).
  try {
    Object.defineProperty(selfObj, "location", {
      configurable: true,
      value: {
        href,
        origin: new URL(href).origin,
        pathname: new URL(href).pathname,
      },
    });
  } catch {
    /* keep the environment's existing location */
  }
  selfObj.addEventListener = (type: string, listener: Listener) => {
    const list = handlers.get(type) ?? [];
    list.push(listener);
    handlers.set(type, list);
  };

  const dispatch = async (type: string, event: any): Promise<void> => {
    const waits: Promise<any>[] = [];
    const wrapped = {
      ...event,
      waitUntil: (p: Promise<any>) => waits.push(Promise.resolve(p)),
      respondWith: (p: any) => waits.push(Promise.resolve(p)),
    };
    for (const listener of handlers.get(type) ?? []) {
      await listener(wrapped);
    }
    await Promise.all(waits);
  };

  return {
    handlers,
    dispatch,
    registration,
    clients,
    skipWaiting,
    restore: () => {
      MockBroadcastChannel.reset();
      if (originalAddEventListener) selfObj.addEventListener = originalAddEventListener;
      if (originalDescriptors.registration) {
        Object.defineProperty(
          selfObj,
          "registration",
          originalDescriptors.registration
        );
      }
    },
  };
}
