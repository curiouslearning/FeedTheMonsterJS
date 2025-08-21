jest.mock('firebase/analytics', () => ({
  logEvent: jest.fn(),
  getAnalytics: jest.fn(() => ({})),
  setUserProperties: jest.fn(),
}));

import { AnalyticsIntegration, AnalyticsEventType } from './analytics-integration';
import { logEvent, getAnalytics } from 'firebase/analytics';
import { BaseAnalyticsIntegration } from "./base-analytics-integration";

// Mock the AnalyticsService and related classes
let mockAnalyticsService = {
  track: jest.fn(),
  register: jest.fn()
};

jest.mock('@curiouslearning/analytics', () => ({
  AnalyticsService: jest.fn().mockImplementation(() => mockAnalyticsService),
  FirebaseStrategy: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    firebaseApp: {}
  })),
  StatsigStrategy: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('AnalyticsIntegration Core', () => {
  let analyticsIntegration: AnalyticsIntegration;

  beforeEach(async () => {
    (AnalyticsIntegration as any).instance = null;
    jest.clearAllMocks();
    mockAnalyticsService.track.mockClear();
    mockAnalyticsService.register.mockClear();

    await AnalyticsIntegration.initializeAnalytics();
    analyticsIntegration = AnalyticsIntegration.getInstance();

    (global as any).pseudoId = null;
    (global as any).lang = 'english';
    const versionInfoElement = { innerHTML: '1.2.3' };
    document.getElementById = jest.fn().mockReturnValue(versionInfoElement);
  });

  describe('track method', () => {
    it('should handle base event data correctly', () => {
      analyticsIntegration.track(AnalyticsEventType.TAPPED_START, {
        json_version_number: '2.0',
      });

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'tapped_start',
        expect.objectContaining({
          cr_user_id: null,
          ftm_language: 'english',
          profile_number: 0,
          version_number: '1.2.3',
          json_version_number: '2.0',
        })
      );
    });

    it('should handle array to string conversion for puzzle foils', () => {
      analyticsIntegration.track(AnalyticsEventType.PUZZLE_COMPLETED, {
        json_version_number: '2.0',
        success_or_failure: 'success',
        level_number: 1,
        puzzle_number: 2,
        item_selected: 'CAT',
        target: 'DOG',
        foils: 'RAT,BAT,HAT',
        response_time: 1.5,
      });

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'puzzle_completed',
        expect.objectContaining({
          foils: 'RAT,BAT,HAT',
        })
      );
    });

    it('should preserve string foils in puzzle events', () => {
      const foilString = 'RAT,BAT,HAT';
      analyticsIntegration.track(AnalyticsEventType.PUZZLE_COMPLETED, {
        json_version_number: '2.0',
        success_or_failure: 'success',
        level_number: 1,
        puzzle_number: 2,
        item_selected: 'CAT',
        target: 'DOG',
        foils: foilString,
        response_time: 1.5,
      });

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'puzzle_completed',
        expect.objectContaining({
          foils: foilString,
        })
      );
    });

    it('should handle download events with correct data', () => {
      analyticsIntegration.track(AnalyticsEventType.DOWNLOAD_25, {
        json_version_number: '2.0',
        ms_since_session_start: 1000,
      });

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'download_25',
        expect.objectContaining({
          ms_since_session_start: 1000,
        })
      );
    });

    it('should handle level completed events with correct data', () => {
      analyticsIntegration.track(AnalyticsEventType.LEVEL_COMPLETED, {
        json_version_number: '2.0',
        success_or_failure: 'success',
        number_of_successful_puzzles: 3,
        level_number: 5,
        duration: 120,
      });

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'level_completed',
        expect.objectContaining({
          success_or_failure: 'success',
          number_of_successful_puzzles: 3,
          level_number: 5,
          duration: 120,
        })
      );
    });

    it('should handle deprecated user clicked event', () => {
      analyticsIntegration.track(AnalyticsEventType.USER_CLICKED, {
        json_version_number: '2.0',
        click: 'Click',
      });

      expect(mockAnalyticsService.track).toHaveBeenCalledWith(
        'user_clicked',
        expect.objectContaining({
          click: 'Click',
        })
      );
    });
  });

  describe('Singleton', () => {
    beforeEach(() => {
    // Reset the singleton instance and mocks before each test
    (AnalyticsIntegration as any).instance = null;
    jest.clearAllMocks();
    mockAnalyticsService.track.mockClear();
    mockAnalyticsService.register.mockClear();
  });

  it('should throw error when getInstance is called before initialization', () => {
    expect(() => {
      AnalyticsIntegration.getInstance();
    }).toThrow('AnalyticsIntegration.initializeAnalytics() must be called before accessing the instance');
  });

  it('should initialize analytics and return same instance', async () => {
    await AnalyticsIntegration.initializeAnalytics();
    const instance1 = AnalyticsIntegration.getInstance();
    const instance2 = AnalyticsIntegration.getInstance();
    
    expect(instance1).toBeTruthy();
    expect(instance1).toBe(instance2);
  });

  it('should not reinitialize if already initialized', async () => {
    await AnalyticsIntegration.initializeAnalytics();
    const instance1 = AnalyticsIntegration.getInstance();
    
    await AnalyticsIntegration.initializeAnalytics();
    const instance2 = AnalyticsIntegration.getInstance();
    
    expect(instance1).toBe(instance2);
  });
});

describe('Firebase Event Logging - Download_Completed', () => {
  let analyticsIntegration: AnalyticsIntegration;
  let logDownloadPercentageComplete: (percentage: number, timeDiff: number) => void;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAnalyticsService.track.mockClear();
    await AnalyticsIntegration.initializeAnalytics();
    analyticsIntegration = AnalyticsIntegration.getInstance();
    const versionInfoElement = { innerHTML: '2.0.1' };
    const getJsonVersionNumber = () => '3.14';

    (global as any).pseudoId = 'test-user-1';
    (global as any).lang = 'hi';

    logDownloadPercentageComplete = (percentage: number, timeDiff: number) => {
      if (percentage !== 100) return;

      const eventData = {
        cr_user_id: null,
        ftm_language: "english",
        profile_number: 0,
        version_number: versionInfoElement.innerHTML,
        json_version_number: getJsonVersionNumber(),
        ms_since_session_start: timeDiff,
      };

      analyticsIntegration.track(AnalyticsEventType.DOWNLOAD_COMPLETED, eventData);
    };
  });

  it('should log Download_Completed event with correct parameters', () => {
    logDownloadPercentageComplete(100, 5000);

    expect(mockAnalyticsService.track).toHaveBeenCalledWith(
      'download_completed',
      expect.objectContaining({
        cr_user_id: null,
        ftm_language: 'english',
        profile_number: 0,
        version_number: '2.0.1',
        json_version_number: "3.14",
        ms_since_session_start: 5000,
      })
    );
  });

  it('should have required fields and correct types', () => {
    logDownloadPercentageComplete(100, 1234);

    expect(mockAnalyticsService.track).toHaveBeenCalledWith(
      AnalyticsEventType.DOWNLOAD_COMPLETED,
      expect.objectContaining({
        cr_user_id: null,
        ftm_language: "english",
        profile_number: 0,
        version_number: "2.0.1",
        json_version_number: "3.14",
        ms_since_session_start: 1234,
      })
    );

    const [eventName, eventData] = mockAnalyticsService.track.mock.calls[0];
    expect(typeof eventData.cr_user_id).toBe('object');
    expect(typeof eventData.ftm_language).toBe('string');
    expect(typeof eventData.version_number).toBe('string');
    expect(typeof eventData.json_version_number).toBe('string');
    expect(typeof eventData.ms_since_session_start).toBe('number');

    const allowedLangs = ["english"];
    expect(allowedLangs).toContain(eventData.ftm_language);
  });
});

describe('Firebase Event Logging - tapped_start', () => {
  let analyticsIntegration: AnalyticsIntegration;
  let logTappedStartEvent: () => void;

  beforeEach(async () => {
    await AnalyticsIntegration.initializeAnalytics();
    analyticsIntegration = AnalyticsIntegration.getInstance();
    jest.spyOn(analyticsIntegration, 'sendTappedStartEvent').mockImplementation(() => {});

    const versionInfoElement = { innerHTML: '1.2.3' };
    document.getElementById = jest.fn().mockReturnValue(versionInfoElement);

    (global as any).pseudoId = 'user-123';
    (global as any).lang = 'hi';

    const majVersion = 1;
    const minVersion = 5;

    logTappedStartEvent = () => {
      const tappedStartData = {
        cr_user_id: null,
        ftm_language: "english",
        profile_number: 0,
        version_number: document.getElementById('version-info-id')?.innerHTML,
        json_version_number: `${majVersion}.${minVersion}`,
      };

      analyticsIntegration.sendTappedStartEvent(tappedStartData);
    };
  });

  it('should log tapped_start event with correct parameters', () => {
    logTappedStartEvent();

    expect(analyticsIntegration.sendTappedStartEvent).toHaveBeenCalledWith({
      cr_user_id: null,
      ftm_language: 'english',
      profile_number: 0,
      version_number: '1.2.3',
      json_version_number: '1.5',
    });
  });

  it('should validate required fields and types', () => {
    logTappedStartEvent();

    const calls = jest.mocked(analyticsIntegration.sendTappedStartEvent).mock.calls;
    const [eventData] = calls[0];

    expect(typeof eventData.cr_user_id).toBe('object');
    expect(typeof eventData.ftm_language).toBe('string');
    expect(typeof eventData.version_number).toBe('string');
    expect(typeof eventData.json_version_number).toBe('string');

    const allowedLangs = ['english'];
    expect(allowedLangs).toContain(eventData.ftm_language);
  });
});

describe('Firebase Event Logging - selected_level', () => {
  let analyticsIntegration: AnalyticsIntegration;
  let logSelectedLevelEvent: () => void;

  beforeEach(async () => {
    await AnalyticsIntegration.initializeAnalytics();
    analyticsIntegration = AnalyticsIntegration.getInstance();
    jest.spyOn(analyticsIntegration, 'sendSelectedLevelEvent').mockImplementation(() => {});

    const versionInfoElement = { innerHTML: '3.0.0' };
    document.getElementById = jest.fn().mockReturnValue(versionInfoElement);

    (global as any).pseudoId = 'user-456';
    (global as any).lang = 'sw';

    const majVersion = 2;
    const minVersion = 3;
    const levelNumber = 5;

    logSelectedLevelEvent = () => {
      const selectedLevelData = {
        cr_user_id: null,
        ftm_language: "english",
        profile_number: 0,
        version_number: document.getElementById('version-info-id')?.innerHTML,
        json_version_number: `${majVersion}.${minVersion}`,
        level_selected: levelNumber,
      };

      analyticsIntegration.sendSelectedLevelEvent(selectedLevelData);
    };
  });

  it('should log selected_level event with correct parameters', () => {
    logSelectedLevelEvent();

    expect(analyticsIntegration.sendSelectedLevelEvent).toHaveBeenCalledWith({
      cr_user_id: null,
      ftm_language: "english",
      profile_number: 0,
      version_number: '3.0.0',
      json_version_number: '2.3',
      level_selected: 5,
    });
  });

  it('should validate required fields and types', () => {
    logSelectedLevelEvent();

    const calls = jest.mocked(analyticsIntegration.sendSelectedLevelEvent).mock.calls;
    const [eventData] = calls[0];

    expect(typeof eventData.cr_user_id).toBe('object');
    expect(typeof eventData.ftm_language).toBe('string');
    expect(typeof eventData.version_number).toBe('string');
    expect(typeof eventData.json_version_number).toBe('string');
    expect(typeof eventData.level_selected).toBe('number');
    expect(typeof eventData.profile_number).toBe('number');

    const allowedLangs = ["english"];
    expect(allowedLangs).toContain(eventData.ftm_language);
  });
});

describe('Firebase Event Logging - puzzle_completed', () => {
  let analyticsIntegration: AnalyticsIntegration;
  let logPuzzleEndFirebaseEvent: (isCorrect: boolean, puzzleType?: string) => void;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AnalyticsIntegration.initializeAnalytics();
    analyticsIntegration = AnalyticsIntegration.getInstance();

    (global as any).pseudoId = 'puzzle-user';
    (global as any).lang = 'en';

    const versionInfoElement = { innerHTML: '1.2.3' };
    document.getElementById = jest.fn().mockReturnValue(versionInfoElement);

    const jsonVersionNumber = '4.56';
    const levelNumber = 7;
    const puzzleNumber = 2;
    const puzzleTime = Date.now() - 4000;

    const droppedLetters = 'DOG';
    const correctTarget = 'CAT';
    const foilStones = ['BAT', 'RAT'];

    logPuzzleEndFirebaseEvent = (isCorrect: boolean, puzzleType?: string) => {
      const endTime = Date.now();

      const puzzleCompletedData = {
        cr_user_id: null,
        ftm_language: "english",
        profile_number: 0,
        version_number: document.getElementById('version-info-id')?.innerHTML,
        json_version_number: jsonVersionNumber,
        success_or_failure: isCorrect ? 'success' : 'failure',
        level_number: levelNumber,
        puzzle_number: puzzleNumber,
        item_selected:
          puzzleType === 'Word'
            ? droppedLetters ?? 'TIMEOUT'
            : 'STONE_TEXT',
        target: correctTarget,
        foils: foilStones.join(','), // Convert array to comma-separated string
        response_time: (endTime - puzzleTime) / 1000,
      };

      analyticsIntegration.track(AnalyticsEventType.PUZZLE_COMPLETED, puzzleCompletedData);
    };
  });

  it('should log puzzle_completed event with correct parameters', () => {
    logPuzzleEndFirebaseEvent(true, 'Word');

    expect(mockAnalyticsService.track).toHaveBeenCalledWith(
      'puzzle_completed',
      expect.objectContaining({
        cr_user_id: null,
        ftm_language: "english",
        profile_number: 0,
        version_number: '1.2.3',
        json_version_number: '4.56',
        success_or_failure: 'success',
        level_number: 7,
        puzzle_number: 2,
        item_selected: 'DOG',
        target: 'CAT',
        foils: 'BAT,RAT' // Expect comma-separated string
      })
    );

    const [, eventData] = mockAnalyticsService.track.mock.calls[0];
    expect(typeof eventData.response_time).toBe('number');
  });

  it('should log puzzle_completed event with failure for Stone puzzle', () => {
    logPuzzleEndFirebaseEvent(false, 'Stone');

    expect(mockAnalyticsService.track).toHaveBeenCalledWith(
      'puzzle_completed',
      expect.objectContaining({
        success_or_failure: 'failure',
        item_selected: 'STONE_TEXT'
      })
    );
  });
});

describe('Firebase Event Logging - level_completed', () => {
  let analyticsIntegration: AnalyticsIntegration;
  let logLevelEndFirebaseEvent: () => void;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AnalyticsIntegration.initializeAnalytics();
    analyticsIntegration = AnalyticsIntegration.getInstance();

    (global as any).pseudoId = 'level-user';
    (global as any).lang = 'en';

    const versionInfoElement = { innerHTML: '3.4.5' };
    document.getElementById = jest.fn().mockReturnValue(versionInfoElement);

    const jsonVersionNumber = '5.67';
    const startTime = Date.now() - 7000;
    const score = 350;
    const levelNumber = 9;

    const GameScore = {
      calculateStarCount: (score: number) => Math.floor(score / 100),
    };

    logLevelEndFirebaseEvent = () => {
      const endTime = Date.now();
      const levelCompletedData = {
        cr_user_id: null,
        ftm_language: "english",
        profile_number: 0,
        version_number: document.getElementById('version-info-id')?.innerHTML,
        json_version_number: jsonVersionNumber,
        success_or_failure:
          GameScore.calculateStarCount(score) >= 3 ? 'success' : 'failure',
        number_of_successful_puzzles: score / 100,
        level_number: levelNumber,
        duration: (endTime - startTime) / 1000,
      };
      analyticsIntegration.track(AnalyticsEventType.LEVEL_COMPLETED, levelCompletedData);
    };
  });

  it('should log level_completed event with success status if stars >= 3', () => {
    logLevelEndFirebaseEvent();

    expect(mockAnalyticsService.track).toHaveBeenCalledWith(
      'level_completed',
      expect.objectContaining({
        cr_user_id: null,
        ftm_language: "english",
        profile_number: 0,
        version_number: '3.4.5',
        json_version_number: '5.67',
        success_or_failure: 'success',
        number_of_successful_puzzles: 3.5,
        level_number: 9
      })
    );

    const [, eventData] = mockAnalyticsService.track.mock.calls[0];
    expect(typeof eventData.duration).toBe('number');
  });

  it('should log failure if stars < 3', () => {
    const score = 250;
    const GameScore = {
      calculateStarCount: (score: number) => Math.floor(score / 100),
    };

    const endTime = Date.now();
    const startTime = endTime - 8000;

    const levelCompletedData = {
      cr_user_id: null,
      ftm_language: "english",
      profile_number: 0,
      version_number: '3.4.5',
      json_version_number: '5.67',
      success_or_failure:
        GameScore.calculateStarCount(score) >= 3 ? 'success' : 'failure',
      number_of_successful_puzzles: score / 100,
      level_number: 9,
      duration: (endTime - startTime) / 1000,
    };

    analyticsIntegration.sendLevelCompletedEvent(levelCompletedData);

    expect(mockAnalyticsService.track).toHaveBeenCalledWith(
      'level_completed',
      expect.objectContaining({
        success_or_failure: 'failure'
      })
    );
  });
});

describe('Firebase Event Logging - session_start', () => {
  let analyticsIntegration: any;
  let logSessionStartFirebaseEvent: () => void;

  beforeEach(() => {
    analyticsIntegration = {
      track: jest.fn(),
    };

    (global as any).pseudoId = 'session-user';
    (global as any).lang = 'en';

    const versionInfoElement = { innerHTML: '1.2.3' };


    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => (store[key] = value.toString()),
        clear: () => (store = {}),
      };
    })();
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });


    const twoDaysAgoMs = Date.now() - 2 * 24 * 60 * 60 * 1000;
    localStorage.setItem('lastSessionEndTime', twoDaysAgoMs.toString());

    const majVersion = 1;
    const minVersion = 5;

    logSessionStartFirebaseEvent = () => {
      let lastSessionEndTime = localStorage.getItem('lastSessionEndTime');
      let lastTime = 0;
      const startSessionTime = new Date().getTime();
      if (lastSessionEndTime) {
        let parsedTimestamp = parseInt(lastSessionEndTime);
        if (!isNaN(parsedTimestamp)) {
          lastTime = Math.abs(new Date().getTime() - parsedTimestamp);
        }
      }
      const daysSinceLast = lastTime ? lastTime / (1000 * 60 * 60 * 24) : 0;
      const roundedDaysSinceLast = parseFloat(daysSinceLast.toFixed(3));
      const sessionStartData = {
        cr_user_id: null,
        ftm_language: "english",
        profile_number: 0,
        version_number: versionInfoElement.innerHTML,
        json_version_number: majVersion.toString() + '.' + minVersion.toString(),
        days_since_last: roundedDaysSinceLast,
      };
      analyticsIntegration.track(AnalyticsEventType.SESSION_START, sessionStartData);
    };
  });

  it('should log session_start event with correct parameters', () => {
    logSessionStartFirebaseEvent();

    expect(analyticsIntegration.track).toHaveBeenCalledWith(
      AnalyticsEventType.SESSION_START,
      expect.any(Object)
    );

    const [, eventData] = analyticsIntegration.track.mock.calls[0];

    expect(typeof eventData.cr_user_id).toBe('object');
    expect(typeof eventData.ftm_language).toBe('string');
    expect(typeof eventData.version_number).toBe('string');
    expect(typeof eventData.json_version_number).toBe('string');
    expect(typeof eventData.days_since_last).toBe('number');

    const allowedLangs = ["english"];
    expect(allowedLangs).toContain(eventData.ftm_language);
    expect(eventData.days_since_last).toBeGreaterThanOrEqual(2);
  });

  it('should handle missing lastSessionEndTime gracefully', () => {
    localStorage.clear();

    logSessionStartFirebaseEvent();

    const [, eventData] = analyticsIntegration.track.mock.calls[0];
    expect(eventData.days_since_last).toBe(0);
  });
});

describe('Firebase Event Logging - session_end', () => {
  let analyticsIntegration: any;
  let logSessionEndFirebaseEvent: () => void;

  beforeEach(() => {
    analyticsIntegration = {
      track: jest.fn(),
    };

    (global as any).pseudoId = 'session-user-end';
    (global as any).lang = 'en';


    const versionInfoElement = { innerHTML: '1.2.3' };


    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => (store[key] = value.toString()),
        clear: () => (store = {}),
      };
    })();
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });

    const majVersion = 1;
    const minVersion = 5;


    const startSessionTime = Date.now() - 10000;

    logSessionEndFirebaseEvent = () => {
      const sessionEndData = {
        cr_user_id: null,
        ftm_language: "english",
        profile_number: 0,
        version_number: versionInfoElement.innerHTML,
        json_version_number: majVersion.toString() + '.' + minVersion.toString(),
        duration: (new Date().getTime() - startSessionTime) / 1000,
      };
      localStorage.setItem('lastSessionEndTime', new Date().getTime().toString());
      analyticsIntegration.track(AnalyticsEventType.SESSION_END, sessionEndData);
    };
  });

  it('should log session_end event with correct parameters', () => {
    logSessionEndFirebaseEvent();

    expect(analyticsIntegration.track).toHaveBeenCalledWith(
      AnalyticsEventType.SESSION_END,
      expect.any(Object)
    );

    const [, eventData] = analyticsIntegration.track.mock.calls[0];

    expect(typeof eventData.cr_user_id).toBe('object');
    expect(typeof eventData.ftm_language).toBe('string');
    expect(typeof eventData.version_number).toBe('string');
    expect(typeof eventData.json_version_number).toBe('string');
    expect(typeof eventData.duration).toBe('number');

    const allowedLangs = ["english"];
    expect(allowedLangs).toContain(eventData.ftm_language);
    expect(eventData.duration).toBeGreaterThan(9);
  });

  it('should set lastSessionEndTime in localStorage', () => {
    const spySetItem = jest.spyOn(localStorage, 'setItem');

    logSessionEndFirebaseEvent();

    expect(spySetItem).toHaveBeenCalledWith('lastSessionEndTime', expect.any(String));
  });
});

class TestAnalyticsIntegration extends BaseAnalyticsIntegration {
  public triggerCustomEvent(name: string, data: object) {
    this.trackCustomEvent(name, data);
  }
}

describe('BaseAnalyticsIntegration', () => {
  let integration: TestAnalyticsIntegration;

  beforeEach(async () => {
    await AnalyticsIntegration.initializeAnalytics();
    integration = new TestAnalyticsIntegration();
    await integration.initialize();
  });

  it('should call track with correct parameters via customEvents', () => {
    const mockEventName = 'download_completed';
    const mockData = {
      cr_user_id: null,
      ftm_language: "english",
      profile_number: 0,
      version_number: "2.0.1",
      json_version_number: "3.14",
      ms_since_session_start: 5000,
    };

    integration.triggerCustomEvent(mockEventName, mockData);

    expect(mockAnalyticsService.track).toHaveBeenCalledWith(
      mockEventName,
      mockData
    );
  });

  it('should initialize analytics service with Firebase and Statsig strategies', async () => {
    expect(mockAnalyticsService.register).toHaveBeenCalledWith('firebase', expect.anything());
    expect(mockAnalyticsService.register).toHaveBeenCalledWith('statsig', expect.anything());
  });
  });
});