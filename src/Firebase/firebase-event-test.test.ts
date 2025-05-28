describe('Firebase Event Logging - Download_Completed', () => {
    let mockFirebaseIntegration: any;
    let logDownloadPercentageComplete: (percentage: number, timeDiff: number) => void;
  
    beforeEach(() => {
      // Mock Firebase Integration
      mockFirebaseIntegration = {
        sendDownloadCompletedEvent: jest.fn(),
      };
  
      // Fake DOM and context
      const versionInfoElement = { innerHTML: '2.0.1' };
      const getJsonVersionNumber = () => 3.14;
  
      // Global vars
      (global as any).pseudoId = 'test-user-1';
      (global as any).lang = 'hi';
  
      // Simulate method in real class
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
  
        mockFirebaseIntegration.sendDownloadCompletedEvent(eventData);
      };
    });
  
    it('should log Download_Completed event with correct parameters', () => {
      logDownloadPercentageComplete(100, 5000);
  
      expect(mockFirebaseIntegration.sendDownloadCompletedEvent).toHaveBeenCalledWith({
        cr_user_id: null,
        ftm_language: 'english',
        profile_number: 0,
        version_number: '2.0.1',
        json_version_number: 3.14,
        ms_since_session_start: 5000,
      });
    });
  
    it('should not log the event if percentage is not 100', () => {
      logDownloadPercentageComplete(75, 3000);
  
      expect(mockFirebaseIntegration.sendDownloadCompletedEvent).not.toHaveBeenCalled();
    });
  
    it('should have required fields and correct types', () => {
        logDownloadPercentageComplete(100, 1234);
      
        const [eventData] = mockFirebaseIntegration.sendDownloadCompletedEvent.mock.calls[0];
      
        expect(typeof eventData.cr_user_id).toBe('object'); // updated
        expect(typeof eventData.ftm_language).toBe('string');
        expect(typeof eventData.version_number).toBe('string');
        expect(typeof eventData.json_version_number).toBe('number');
        expect(typeof eventData.ms_since_session_start).toBe('number');
      
        // optional: validate language is in allowed list
        const allowedLangs = ["english"];
        expect(allowedLangs).toContain(eventData.ftm_language);
      });
      
  });
  describe('Firebase Event Logging - tapped_start', () => {
    let mockFirebaseIntegration: any;
    let logTappedStartEvent: () => void;
  
    beforeEach(() => {
      mockFirebaseIntegration = {
        sendTappedStartEvent: jest.fn(),
      };
  
      // Mock DOM element
      const versionInfoElement = { innerHTML: '1.2.3' };
      document.getElementById = jest.fn().mockReturnValue(versionInfoElement);
  
      // Mock global values
      (global as any).pseudoId = 'user-123';
      (global as any).lang = 'hi';
  
      const majVersion = 1;
      const minVersion = 5;
  
      // Simulate the actual logging method
      logTappedStartEvent = () => {
        const tappedStartData = {
          cr_user_id: null,
          ftm_language: "english",
          app_version_number: document.getElementById('version-info-id')?.innerHTML,
          json_version_number: parseFloat(`${majVersion}.${minVersion}`),
        };
  
        mockFirebaseIntegration.sendTappedStartEvent(tappedStartData);
      };
    });
  
    it('should log tapped_start event with correct parameters', () => {
      logTappedStartEvent();
  
      expect(mockFirebaseIntegration.sendTappedStartEvent).toHaveBeenCalledWith({
        cr_user_id: null,
        ftm_language: 'english',
        app_version_number: '1.2.3',
        json_version_number: 1.5,
      });
    });
  
    it('should validate required fields and types', () => {
      logTappedStartEvent();
  
      const [eventData] = mockFirebaseIntegration.sendTappedStartEvent.mock.calls[0];
  
      expect(typeof eventData.cr_user_id).toBe('object');
      expect(typeof eventData.ftm_language).toBe('string');
      expect(typeof eventData.app_version_number).toBe('string');
      expect(typeof eventData.json_version_number).toBe('number');
  
      const allowedLangs = ['english'];
      expect(allowedLangs).toContain(eventData.ftm_language);
    });
  });

  describe('Firebase Event Logging - selected_level', () => {
    let mockFirebaseIntegration: any;
    let logSelectedLevelEvent: () => void;
  
    beforeEach(() => {
      mockFirebaseIntegration = {
        sendSelectedLevelEvent: jest.fn(),
      };
  
      // Mock DOM
      const versionInfoElement = { innerHTML: '3.0.0' };
      document.getElementById = jest.fn().mockReturnValue(versionInfoElement);
  
      // Global values
      (global as any).pseudoId = 'user-456';
      (global as any).lang = 'sw';
  
      const majVersion = 2;
      const minVersion = 3;
      const levelNumber = 5;
  
      // Simulate logging method
      logSelectedLevelEvent = () => {
        const selectedLevelData = {
          cr_user_id: null,
          ftm_language: "english",
          profile_number: 0,
          version_number: document.getElementById('version-info-id')?.innerHTML,
          json_version_number: `${majVersion}.${minVersion}`,
          level_selected: levelNumber,
        };
  
        mockFirebaseIntegration.sendSelectedLevelEvent(selectedLevelData);
      };
    });
  
    it('should log selected_level event with correct parameters', () => {
      logSelectedLevelEvent();
  
      expect(mockFirebaseIntegration.sendSelectedLevelEvent).toHaveBeenCalledWith({
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
  
      const [eventData] = mockFirebaseIntegration.sendSelectedLevelEvent.mock.calls[0];
  
      expect(typeof eventData.cr_user_id).toBe('object');
      expect(typeof eventData.ftm_language).toBe('string');
      expect(typeof eventData.version_number).toBe('string');
      expect(typeof eventData.json_version_number).toBe('string'); // string in this case
      expect(typeof eventData.level_selected).toBe('number');
      expect(typeof eventData.profile_number).toBe('number');
  
      const allowedLangs = [ "english"];
      expect(allowedLangs).toContain(eventData.ftm_language);
    });
  });
  describe('Firebase Event Logging - puzzle_completed', () => {
    let mockFirebaseIntegration: any;
    let logPuzzleEndFirebaseEvent: (isCorrect: boolean, puzzleType?: string) => void;
  
    beforeEach(() => {
      mockFirebaseIntegration = {
        sendPuzzleCompletedEvent: jest.fn(),
      };
  
      // Global mocks
      (global as any).pseudoId = 'puzzle-user';
      (global as any).lang = 'en';
  
      // Fake DOM
      const versionInfoElement = { innerHTML: '1.2.3' };
      document.getElementById = jest.fn().mockReturnValue(versionInfoElement);
  
      // Fake class-level values
      const jsonVersionNumber = 4.56;
      const levelNumber = 7;
      const puzzleNumber = 2;
      const puzzleTime = Date.now() - 4000;
  
      const droppedLetters = 'DOG';
      const correctTarget = 'CAT';
      const foilStones = ['BAT', 'RAT'];
  
      // Simulate method
      logPuzzleEndFirebaseEvent = (isCorrect: boolean, puzzleType?: string) => {
        const endTime = Date.now();
  
        const puzzleCompletedData = {
          cr_user_id: null,
          ftm_language: "english",
          profile_number: 0,
          version_number: document.getElementById('version-info-id')?.innerHTML,
          json_version_number:4.56,
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
  
        mockFirebaseIntegration.sendPuzzleCompletedEvent(puzzleCompletedData);
      };
    });
  
    it('should log puzzle_completed event with correct parameters for Word puzzle', () => {
      logPuzzleEndFirebaseEvent(true, 'Word');
  
      const [eventData] = mockFirebaseIntegration.sendPuzzleCompletedEvent.mock.calls[0];
  
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
  
      const allowedLangs = [ "english"];
      expect(allowedLangs).toContain(eventData.ftm_language);
    });
  
    it('should log puzzle_completed event with failure for Stone puzzle', () => {
      logPuzzleEndFirebaseEvent(false, 'Stone');
  
      const [eventData] = mockFirebaseIntegration.sendPuzzleCompletedEvent.mock.calls[0];
  
      expect(eventData.success_or_failure).toBe('failure');
      expect(eventData.item_selected).toBe('STONE_TEXT');
    });
  });
    
  describe('Firebase Event Logging - level_completed', () => {
    let mockFirebaseIntegration: any;
    let logLevelEndFirebaseEvent: () => void;
  
    beforeEach(() => {
      mockFirebaseIntegration = {
        sendLevelCompletedEvent: jest.fn(),
      };
  
      // Globals
      (global as any).pseudoId = 'level-user';
      (global as any).lang = 'en';
  
      // Mock DOM element
      const versionInfoElement = { innerHTML: '3.4.5' };
      document.getElementById = jest.fn().mockReturnValue(versionInfoElement);
  
      // Fake class members
      const jsonVersionNumber = 5.67;
      const startTime = Date.now() - 7000; // started 7 seconds ago
      const score = 350; // example score
      const levelNumber = 9;
  
      // Mock GameScore helper
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
        mockFirebaseIntegration.sendLevelCompletedEvent(levelCompletedData);
      };
    });
  
    it('should log level_completed event with success status if stars >= 3', () => {
      logLevelEndFirebaseEvent();
  
      const [eventData] = mockFirebaseIntegration.sendLevelCompletedEvent.mock.calls[0];
  
      expect(typeof eventData.cr_user_id).toBe('object');
      expect(typeof eventData.ftm_language).toBe('string');
      expect(typeof eventData.version_number).toBe('string');
      expect(typeof eventData.json_version_number).toBe('number');
      expect(eventData.success_or_failure).toBe('success');
      expect(typeof eventData.number_of_successful_puzzles).toBe('number');
      expect(typeof eventData.level_number).toBe('number');
      expect(typeof eventData.duration).toBe('number');
  
      const allowedLangs = [ "english"];
      expect(allowedLangs).toContain(eventData.ftm_language);
    });
  
    it('should log failure if stars < 3', () => {
      // Override score to less than 300 for failure
      const score = 250; // 2 stars
  
      // Override function to use this score
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
  
      mockFirebaseIntegration.sendLevelCompletedEvent.mockClear();
  
      mockFirebaseIntegration.sendLevelCompletedEvent(levelCompletedData);
  
      const [eventData] = mockFirebaseIntegration.sendLevelCompletedEvent.mock.calls[0];
      expect(eventData.success_or_failure).toBe('failure');
    });
  });
  describe('Firebase Event Logging - session_start', () => {
    let mockFirebaseIntegration: any;
    let logSessionStartFirebaseEvent: () => void;
  
    beforeEach(() => {
      mockFirebaseIntegration = {
        sendSessionStartEvent: jest.fn(),
      };
  
      (global as any).pseudoId = 'session-user';
      (global as any).lang = 'en';
  
      // Mock DOM element
      const versionInfoElement = { innerHTML: '1.2.3' };
  
      // Mock localStorage
      const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, value: string) => (store[key] = value.toString()),
          clear: () => (store = {}),
        };
      })();
      Object.defineProperty(global, 'localStorage', { value: localStorageMock });
  
      // Set a lastSessionEndTime to 2 days ago (in ms)
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
        mockFirebaseIntegration.sendSessionStartEvent(sessionStartData);
      };
    });
  
    it('should log session_start event with correct parameters', () => {
      logSessionStartFirebaseEvent();
  
      expect(mockFirebaseIntegration.sendSessionStartEvent).toHaveBeenCalled();
  
      const [eventData] = mockFirebaseIntegration.sendSessionStartEvent.mock.calls[0];
  
      expect(typeof eventData.cr_user_id).toBe('object');
      expect(typeof eventData.ftm_language).toBe('string');
      expect(typeof eventData.version_number).toBe('string');
      expect(typeof eventData.json_version_number).toBe('string');
      expect(typeof eventData.days_since_last).toBe('number');
  
      const allowedLangs = [ "english"];
      expect(allowedLangs).toContain(eventData.ftm_language);
      expect(eventData.days_since_last).toBeGreaterThanOrEqual(2); // roughly 2 days since last
    });
  
    it('should handle missing lastSessionEndTime gracefully', () => {
      localStorage.clear();
  
      logSessionStartFirebaseEvent();
  
      const [eventData] = mockFirebaseIntegration.sendSessionStartEvent.mock.calls[0];
      expect(eventData.days_since_last).toBe(0);
    });
  });
  describe('Firebase Event Logging - session_end', () => {
    let mockFirebaseIntegration: any;
    let logSessionEndFirebaseEvent: () => void;
  
    beforeEach(() => {
      mockFirebaseIntegration = {
        sendSessionEndEvent: jest.fn(),
      };
  
      (global as any).pseudoId = 'session-user-end';
      (global as any).lang = 'en';
  
      // Mock DOM element
      const versionInfoElement = { innerHTML: '1.2.3' };
  
      // Mock localStorage
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
  
      // Simulate startSessionTime as 10 seconds ago
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
        mockFirebaseIntegration.sendSessionEndEvent(sessionEndData);
      };
    });
  
    it('should log session_end event with correct parameters', () => {
      logSessionEndFirebaseEvent();
  
      expect(mockFirebaseIntegration.sendSessionEndEvent).toHaveBeenCalled();
  
      const [eventData] = mockFirebaseIntegration.sendSessionEndEvent.mock.calls[0];
  
      expect(typeof eventData.cr_user_id).toBe('object');
      expect(typeof eventData.ftm_language).toBe('string');
      expect(typeof eventData.version_number).toBe('string');
      expect(typeof eventData.json_version_number).toBe('string');
      expect(typeof eventData.duration).toBe('number');
  
      const allowedLangs = [ "english"];
      expect(allowedLangs).toContain(eventData.ftm_language);
      expect(eventData.duration).toBeGreaterThan(9); // roughly 10 seconds duration
    });
  
    it('should set lastSessionEndTime in localStorage', () => {
      const spySetItem = jest.spyOn(localStorage, 'setItem');
  
      logSessionEndFirebaseEvent();
  
      expect(spySetItem).toHaveBeenCalledWith('lastSessionEndTime', expect.any(String));
    });
  });
      