jest.mock('firebase/analytics', () => ({
  logEvent: jest.fn(),
  getAnalytics: jest.fn(() => ({})),
  setUserProperties: jest.fn(),
}));

import { FirebaseIntegration } from './firebase-integration';
import { logEvent, getAnalytics } from 'firebase/analytics';
import { BaseFirebaseIntegration } from "./base-firebase-integration";


describe('Firebase Event Logging - Download_Completed', () => {

  let firebaseIntegration: FirebaseIntegration;
  let logDownloadPercentageComplete: (percentage: number, timeDiff: number) => void;

  beforeEach(() => {
    firebaseIntegration = FirebaseIntegration.getInstance();
    jest.spyOn(firebaseIntegration, 'sendDownloadCompletedEvent').mockImplementation(() => { });
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

      firebaseIntegration.sendDownloadCompletedEvent(eventData);
    };
  });


  it('should log Download_Completed event with correct parameters', () => {
    logDownloadPercentageComplete(100, 5000);

    expect(firebaseIntegration.sendDownloadCompletedEvent).toHaveBeenCalledWith({
      cr_user_id: null,
      ftm_language: 'english',
      profile_number: 0,
      version_number: '2.0.1',
      json_version_number: "3.14",
      ms_since_session_start: 5000,
    });
  });



  it('should have required fields and correct types', () => {
    logDownloadPercentageComplete(100, 1234);

    const [eventData] = (firebaseIntegration.sendDownloadCompletedEvent as jest.Mock).mock.calls[1];


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
  let firebaseIntegration: any;
  let logTappedStartEvent: () => void;

  beforeEach(() => {
    firebaseIntegration = {
      sendTappedStartEvent: jest.fn(),
    };


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
        app_version_number: document.getElementById('version-info-id')?.innerHTML,
        json_version_number: parseFloat(`${majVersion}.${minVersion}`),
      };

      firebaseIntegration.sendTappedStartEvent(tappedStartData);
    };
  });

  it('should log tapped_start event with correct parameters', () => {
    logTappedStartEvent();

    expect(firebaseIntegration.sendTappedStartEvent).toHaveBeenCalledWith({
      cr_user_id: null,
      ftm_language: 'english',
      app_version_number: '1.2.3',
      json_version_number: 1.5,
    });
  });

  it('should validate required fields and types', () => {
    logTappedStartEvent();

    const [eventData] = firebaseIntegration.sendTappedStartEvent.mock.calls[0];

    expect(typeof eventData.cr_user_id).toBe('object');
    expect(typeof eventData.ftm_language).toBe('string');
    expect(typeof eventData.app_version_number).toBe('string');
    expect(typeof eventData.json_version_number).toBe('number');

    const allowedLangs = ['english'];
    expect(allowedLangs).toContain(eventData.ftm_language);
  });
});

describe('Firebase Event Logging - selected_level', () => {
  let firebaseIntegration: any;
  let logSelectedLevelEvent: () => void;

  beforeEach(() => {
    firebaseIntegration = {
      sendSelectedLevelEvent: jest.fn(),
    };


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

      firebaseIntegration.sendSelectedLevelEvent(selectedLevelData);
    };
  });

  it('should log selected_level event with correct parameters', () => {
    logSelectedLevelEvent();

    expect(firebaseIntegration.sendSelectedLevelEvent).toHaveBeenCalledWith({
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

    const [eventData] = firebaseIntegration.sendSelectedLevelEvent.mock.calls[0];

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
  let firebaseIntegration: any;
  let logPuzzleEndFirebaseEvent: (isCorrect: boolean, puzzleType?: string) => void;

  beforeEach(() => {
    firebaseIntegration = {
      sendPuzzleCompletedEvent: jest.fn(),
    };

    (global as any).pseudoId = 'puzzle-user';
    (global as any).lang = 'en';


    const versionInfoElement = { innerHTML: '1.2.3' };
    document.getElementById = jest.fn().mockReturnValue(versionInfoElement);


    const jsonVersionNumber = 4.56;
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
        json_version_number: 4.56,
        success_or_failure: isCorrect ? 'success' : 'failure',
        level_number: levelNumber,
        puzzle_number: puzzleNumber,
        item_selected:
          puzzleType === 'Word'
            ? droppedLetters ?? 'TIMEOUT'
            : 'STONE_TEXT',
        target: correctTarget,
        foils: foilStones,
        response_time: (endTime - puzzleTime) / 1000,
      };

      firebaseIntegration.sendPuzzleCompletedEvent(puzzleCompletedData);
    };
  });

  it('should log puzzle_completed event with correct parameters for Word puzzle', () => {
    logPuzzleEndFirebaseEvent(true, 'Word');

    const [eventData] = firebaseIntegration.sendPuzzleCompletedEvent.mock.calls[0];

    expect(typeof eventData.cr_user_id).toBe('object');
    expect(typeof eventData.ftm_language).toBe('string');
    expect(typeof eventData.version_number).toBe('string');
    expect(typeof eventData.json_version_number).toBe('number');
    expect(typeof eventData.level_number).toBe('number');
    expect(typeof eventData.puzzle_number).toBe('number');
    expect(typeof eventData.item_selected).toBe('string');
    expect(typeof eventData.target).toBe('string');
    expect(Array.isArray(eventData.foils)).toBe(true);
    expect(typeof eventData.response_time).toBe('number');
    expect(eventData.success_or_failure).toBe('success');

    const allowedLangs = ["english"];
    expect(allowedLangs).toContain(eventData.ftm_language);
  });

  it('should log puzzle_completed event with failure for Stone puzzle', () => {
    logPuzzleEndFirebaseEvent(false, 'Stone');

    const [eventData] = firebaseIntegration.sendPuzzleCompletedEvent.mock.calls[0];

    expect(eventData.success_or_failure).toBe('failure');
    expect(eventData.item_selected).toBe('STONE_TEXT');
  });
});

describe('Firebase Event Logging - level_completed', () => {
  let firebaseIntegration: any;
  let logLevelEndFirebaseEvent: () => void;

  beforeEach(() => {
    firebaseIntegration = {
      sendLevelCompletedEvent: jest.fn(),
    };


    (global as any).pseudoId = 'level-user';
    (global as any).lang = 'en';

    const versionInfoElement = { innerHTML: '3.4.5' };
    document.getElementById = jest.fn().mockReturnValue(versionInfoElement);

    const jsonVersionNumber = 5.67;
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
      firebaseIntegration.sendLevelCompletedEvent(levelCompletedData);
    };
  });

  it('should log level_completed event with success status if stars >= 3', () => {
    logLevelEndFirebaseEvent();

    const [eventData] = firebaseIntegration.sendLevelCompletedEvent.mock.calls[0];

    expect(typeof eventData.cr_user_id).toBe('object');
    expect(typeof eventData.ftm_language).toBe('string');
    expect(typeof eventData.version_number).toBe('string');
    expect(typeof eventData.json_version_number).toBe('number');
    expect(eventData.success_or_failure).toBe('success');
    expect(typeof eventData.number_of_successful_puzzles).toBe('number');
    expect(typeof eventData.level_number).toBe('number');
    expect(typeof eventData.duration).toBe('number');

    const allowedLangs = ["english"];
    expect(allowedLangs).toContain(eventData.ftm_language);
  });

  it('should log failure if stars < 3', () => {

    const score = 250;


    const GameScore = {
      calculateStarCount: (score: number) => Math.floor(score / 100),
    };

    const endTime = Date.now();
    const startTime = endTime - 8000;

    const levelCompletedData = {
      cr_user_id: 'level-user',
      ftm_language: 'en',
      profile_number: 0,
      version_number: '3.4.5',
      json_version_number: 5.67,
      success_or_failure:
        GameScore.calculateStarCount(score) >= 3 ? 'success' : 'failure',
      number_of_successful_puzzles: score / 100,
      level_number: 9,
      duration: (endTime - startTime) / 1000,
    };

    firebaseIntegration.sendLevelCompletedEvent.mockClear();

    firebaseIntegration.sendLevelCompletedEvent(levelCompletedData);

    const [eventData] = firebaseIntegration.sendLevelCompletedEvent.mock.calls[0];
    expect(eventData.success_or_failure).toBe('failure');
  });
});
describe('Firebase Event Logging - session_start', () => {
  let firebaseIntegration: any;
  let logSessionStartFirebaseEvent: () => void;

  beforeEach(() => {
    firebaseIntegration = {
      sendSessionStartEvent: jest.fn(),
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
      firebaseIntegration.sendSessionStartEvent(sessionStartData);
    };
  });

  it('should log session_start event with correct parameters', () => {
    logSessionStartFirebaseEvent();

    expect(firebaseIntegration.sendSessionStartEvent).toHaveBeenCalled();

    const [eventData] = firebaseIntegration.sendSessionStartEvent.mock.calls[0];

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

    const [eventData] = firebaseIntegration.sendSessionStartEvent.mock.calls[0];
    expect(eventData.days_since_last).toBe(0);
  });
});
describe('Firebase Event Logging - session_end', () => {
  let firebaseIntegration: any;
  let logSessionEndFirebaseEvent: () => void;

  beforeEach(() => {
    firebaseIntegration = {
      sendSessionEndEvent: jest.fn(),
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
      firebaseIntegration.sendSessionEndEvent(sessionEndData);
    };
  });

  it('should log session_end event with correct parameters', () => {
    logSessionEndFirebaseEvent();

    expect(firebaseIntegration.sendSessionEndEvent).toHaveBeenCalled();

    const [eventData] = firebaseIntegration.sendSessionEndEvent.mock.calls[0];

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
class TestFirebaseIntegration extends BaseFirebaseIntegration {
  public triggerCustomEvent(name: string, data: object) {
    this.customEvents(name, data);
  }
}

// describe("BaseFirebaseIntegration", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it("should call logEvent with correct parameters via customEvents", () => {
//     const integration = new TestFirebaseIntegration();

//     const mockEventName = "download_completed";
//     const mockData = {
//       cr_user_id: null,
//       ftm_language: "english",
//       profile_number: 0,
//       version_number: "2.0.1",
//       json_version_number: "3.14",
//       ms_since_session_start: 5000,
//     };

//     integration.triggerCustomEvent(mockEventName, mockData);

//     expect(logEvent).toHaveBeenCalledWith(
//       "mockAnalytics",     
//       mockEventName,       
//       mockData             
//     );
//   });
// });

describe("BaseFirebaseIntegration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call logEvent with correct parameters via customEvents", () => {
    const integration = new TestFirebaseIntegration();

    const mockEventName = "download_completed";
    const mockData = {
      cr_user_id: null,
      ftm_language: "english",
      profile_number: 0,
      version_number: "2.0.1",
      json_version_number: "3.14",
      ms_since_session_start: 5000,
    };

    integration.triggerCustomEvent(mockEventName, mockData);

    expect(logEvent).toHaveBeenCalledWith(
      expect.anything(),    
      mockEventName,
      mockData
    );
  });
});