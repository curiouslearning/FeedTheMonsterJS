import { AssessmentSurveyManager } from './assessment-survey-manager';
type MessageHandler = (event: MessageEvent) => void;
declare global {
  interface HTMLElement {
    setAnalyticsConfig: (config: any) => void;
  }
}
class MockBroadcastChannel {
  public static postMessageCalls = 0;
  public static responseOk = true;

  private handlers: MessageHandler[] = [];

  constructor(public readonly name: string) { }

  public addEventListener(type: string, handler: MessageHandler): void {
    if (type === 'message') {
      this.handlers.push(handler);
    }
  }

  public removeEventListener(type: string, handler: MessageHandler): void {
    if (type !== 'message') {
      return;
    }

    this.handlers = this.handlers.filter((existingHandler) => existingHandler !== handler);
  }

  public postMessage(message: { command?: string; data?: string }): void {
    MockBroadcastChannel.postMessageCalls += 1;

    if (message?.command === 'CacheAssessmentLanguage') {
      const event = {
        data: {
          msg: 'AssessmentLanguageCached',
          data: {
            dataKey: message.data,
            ok: MockBroadcastChannel.responseOk,
          },
        },
      } as MessageEvent;

      this.handlers.forEach((handler) => handler(event));
    }
  }

  public close(): void {
    this.handlers = [];
  }

  public static reset(): void {
    MockBroadcastChannel.postMessageCalls = 0;
    MockBroadcastChannel.responseOk = true;
  }
}

describe('AssessmentSurveyManager', () => {
  let manager: AssessmentSurveyManager;
  let fetchMock: jest.Mock;

  const setHeadResponseMap = (responseMap: Record<string, boolean>) => {
    fetchMock.mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method === 'HEAD') {
        return {
          ok: Boolean(responseMap[url]),
        } as Response;
      }

      return {
        ok: false,
      } as Response;
    });
  };

  beforeEach(() => {
    document.body.innerHTML = '<div class="game-scene"></div>';
    window.history.pushState({}, '', '/');

    if (!('serviceWorker' in navigator)) {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true,
      });
    }

    (global as any).BroadcastChannel = MockBroadcastChannel;

    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;

    // mock setAnalyticsConfig on HTMLElement since custom element is not registered in jsdom
    HTMLElement.prototype.setAnalyticsConfig = jest.fn();

    MockBroadcastChannel.reset();
    manager = new AssessmentSurveyManager();
  });

  afterEach(() => {
    manager.close();
    jest.clearAllMocks();
    delete HTMLElement.prototype.setAnalyticsConfig;
  });

  it('should derive data key from URL alias and render inside .game-scene', async () => {
    window.history.pushState({}, '', '/?cr_lang=englishwestafrican&assessment_type=words');

    setHeadResponseMap({
      '/assessment-survey/data/west-african-english-words.json': true,
    });

    await manager.open({});

    const overlay = document.getElementById('assessment-survey-overlay');
    const playerElement = overlay?.querySelector('assessment-survey-player');

    expect(overlay).not.toBeNull();
    expect(overlay?.parentElement?.classList.contains('game-scene')).toBe(true);
    expect(overlay?.style.position).toBe('absolute');
    expect(overlay?.style.width).toBe('100%');
    expect(playerElement?.getAttribute('data-key')).toBe('west-african-english-words');
    expect(MockBroadcastChannel.postMessageCalls).toBe(1);
  });

  it('should fallback to default assessment key when requested data key is unavailable', async () => {
    setHeadResponseMap({
      '/assessment-survey/data/missing-data-key.json': false,
      '/assessment-survey/data/zulu-lettersounds.json': true,
    });

    await manager.open({ dataKey: 'missing-data-key' });

    const overlay = document.getElementById('assessment-survey-overlay');
    const playerElement = overlay?.querySelector('assessment-survey-player');

    expect(playerElement?.getAttribute('data-key')).toBe('zulu-lettersounds');
  });

  it('should resolve assessment type input into language-scoped data key', async () => {
    window.history.pushState({}, '', '/?cr_lang=englishwestafrican');

    setHeadResponseMap({
      '/assessment-survey/data/west-african-english-sightwords.json': true,
    });

    await manager.open({ dataKey: 'sightwords' });

    const overlay = document.getElementById('assessment-survey-overlay');
    const playerElement = overlay?.querySelector('assessment-survey-player');

    expect(playerElement?.getAttribute('data-key')).toBe('west-african-english-sightwords');
  });

  it('should use warmed key and avoid duplicate cache requests on open', async () => {
    setHeadResponseMap({
      '/assessment-survey/data/zulu-lettersounds.json': true,
    });

    await manager.warmupAssessmentLanguageCache('zulu-lettersounds');

    expect(MockBroadcastChannel.postMessageCalls).toBe(1);

    await manager.open({ dataKey: 'zulu-lettersounds' });

    expect(MockBroadcastChannel.postMessageCalls).toBe(1);
  });

  it('should warm multiple assessment types and dedupe cache requests', async () => {
    window.history.pushState({}, '', '/?cr_lang=englishwestafrican');

    setHeadResponseMap({
      '/assessment-survey/data/west-african-english-lettersounds.json': true,
      '/assessment-survey/data/west-african-english-sightwords.json': true,
    });

    await manager.warmupAssessmentLanguageCaches([
      'lettersounds',
      'sightwords',
      'lettersounds',
    ]);

    expect(MockBroadcastChannel.postMessageCalls).toBe(2);

    await manager.open({ dataKey: 'lettersounds' });
    await manager.open({ dataKey: 'sightwords' });

    expect(MockBroadcastChannel.postMessageCalls).toBe(2);
  });

  it('should close and clear overlay when close button is clicked', async () => {
    setHeadResponseMap({
      '/assessment-survey/data/zulu-lettersounds.json': true,
    });

    await manager.open({ dataKey: 'zulu-lettersounds' });

    const overlay = document.getElementById('assessment-survey-overlay');
    const closeButton = document.getElementById('assessment-survey-close-button') as HTMLButtonElement;

    closeButton.click();

    expect(overlay?.style.display).toBe('none');
    expect(overlay?.innerHTML).toBe('');
  });

  it('should close when assessment player dispatches closed event', async () => {
    setHeadResponseMap({
      '/assessment-survey/data/zulu-lettersounds.json': true,
    });

    await manager.open({ dataKey: 'zulu-lettersounds' });

    const overlay = document.getElementById('assessment-survey-overlay');
    const playerElement = overlay?.querySelector('assessment-survey-player');

    playerElement?.dispatchEvent(new CustomEvent('closed'));

    expect(overlay?.style.display).toBe('none');
    expect(overlay?.innerHTML).toBe('');
  });

  it('should forward lifecycle callbacks and invoke onClosed once', async () => {
    setHeadResponseMap({
      '/assessment-survey/data/zulu-lettersounds.json': true,
    });

    const onLoaded = jest.fn();
    const onCompleted = jest.fn();
    const onClosed = jest.fn();

    await manager.open({
      dataKey: 'zulu-lettersounds',
      onLoaded,
      onCompleted,
      onClosed,
    });

    const overlay = document.getElementById('assessment-survey-overlay');
    const playerElement = overlay?.querySelector('assessment-survey-player');

    playerElement?.dispatchEvent(new CustomEvent('loaded'));
    playerElement?.dispatchEvent(new CustomEvent('completed'));
    playerElement?.dispatchEvent(new CustomEvent('closed'));
    playerElement?.dispatchEvent(new CustomEvent('closed'));

    expect(onLoaded).toHaveBeenCalledTimes(1);
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('should forward analytics config to player element when env vars are set', async () => {
    process.env.FIREBASE_API_KEY = 'test-api-key';
    process.env.FIREBASE_AUTH_DOMAIN = 'test-auth-domain';
    process.env.FIREBASE_DATABASE_URL = 'test-database-url';
    process.env.FIREBASE_PROJECT_ID = 'test-project-id';
    process.env.FIREBASE_STORAGE_BUCKET = 'test-storage-bucket';
    process.env.FIREBASE_MESSAGING_SENDER_ID = 'test-messaging-sender-id';
    process.env.FIREBASE_APP_ID = 'test-app-id';
    process.env.FIREBASE_MEASUREMENT_ID = 'test-measurement-id';

    try {
      setHeadResponseMap({
        '/assessment-survey/data/zulu-lettersounds.json': true,
      });

      await manager.open({ dataKey: 'zulu-lettersounds' });

      const overlay = document.getElementById('assessment-survey-overlay');
      const playerElement = overlay?.querySelector('assessment-survey-player') as HTMLElement;

      expect(playerElement?.setAnalyticsConfig).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        authDomain: 'test-auth-domain',
        databaseURL: 'test-database-url',
        projectId: 'test-project-id',
        storageBucket: 'test-storage-bucket',
        messagingSenderId: 'test-messaging-sender-id',
        appId: 'test-app-id',
        measurementId: 'test-measurement-id',
      });
    } finally {
      delete process.env.FIREBASE_API_KEY;
      delete process.env.FIREBASE_AUTH_DOMAIN;
      delete process.env.FIREBASE_DATABASE_URL;
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_STORAGE_BUCKET;
      delete process.env.FIREBASE_MESSAGING_SENDER_ID;
      delete process.env.FIREBASE_APP_ID;
      delete process.env.FIREBASE_MEASUREMENT_ID;
    }
  });

  it('should not forward analytics config when env vars are missing', async () => {
    setHeadResponseMap({
      '/assessment-survey/data/zulu-lettersounds.json': true,
    });

    await manager.open({ dataKey: 'zulu-lettersounds' });

    const overlay = document.getElementById('assessment-survey-overlay');
    const playerElement = overlay?.querySelector('assessment-survey-player') as HTMLElement;

    expect(playerElement?.setAnalyticsConfig).not.toHaveBeenCalled();
  });
});