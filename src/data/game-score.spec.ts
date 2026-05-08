import { GameScore } from './game-score';

jest.mock('@common', () => ({
  lang: 'en',
  Debugger: { DebugMode: false },
}));

const LANG_PREFIX = 'en';
const HIGHEST_KEY = `${LANG_PREFIX}highestLevelReached`;
const GAME_INFO_KEY = `${LANG_PREFIX}gamePlayedInfo`;

const makeLevelInfo = (levelNumber: number, starCount: number) => ({
  levelName: 'type1',
  levelNumber,
  score: starCount * 100,
  starCount,
  treasureChestMiniGameScore: 0,
});

describe('Feature: GameScore - highest level tracking', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => store[key] ?? null
    );
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => { store[key] = value; }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Scenario: updateHighestLevelReached with multiple played levels', () => {
    it('Given multiple played levels in storage, when updateHighestLevelReached is called, then the highest levelNumber is persisted to localStorage', () => {
      // Given
      store[GAME_INFO_KEY] = JSON.stringify([
        makeLevelInfo(0, 5),
        makeLevelInfo(3, 3),
        makeLevelInfo(1, 4),
      ]);

      // When
      GameScore.updateHighestLevelReached();

      // Then
      expect(store[HIGHEST_KEY]).toBe('3');
    });
  });

  describe('Scenario: updateHighestLevelReached with a single played level', () => {
    it('Given a single played level in storage, when updateHighestLevelReached is called, then that level number is persisted', () => {
      // Given
      store[GAME_INFO_KEY] = JSON.stringify([makeLevelInfo(2, 3)]);

      // When
      GameScore.updateHighestLevelReached();

      // Then
      expect(store[HIGHEST_KEY]).toBe('2');
    });
  });

  describe('Scenario: updateHighestLevelReached with no played levels', () => {
    it('Given no played levels in storage, when updateHighestLevelReached is called, then localStorage is not written', () => {
      // Given
      store[GAME_INFO_KEY] = JSON.stringify([]);

      // When
      GameScore.updateHighestLevelReached();

      // Then
      expect(store[HIGHEST_KEY]).toBeUndefined();
    });
  });

  describe('Scenario: getHighestLevelReached when value is already cached', () => {
    it('Given highestLevelReached is already stored in localStorage, when getHighestLevelReached is called, then it returns the cached value without recomputing', () => {
      // Given
      store[HIGHEST_KEY] = '7';

      // When
      const result = GameScore.getHighestLevelReached();

      // Then
      expect(result).toBe(7);
      expect(store[GAME_INFO_KEY]).toBeUndefined();
    });
  });

  describe('Scenario: getHighestLevelReached reconciles when cache is missing', () => {
    it('Given no cached value but played levels exist, when getHighestLevelReached is called, then it reconciles from game data and returns the highest level number', () => {
      // Given
      store[GAME_INFO_KEY] = JSON.stringify([
        makeLevelInfo(0, 5),
        makeLevelInfo(4, 3),
        makeLevelInfo(2, 4),
      ]);

      // When
      const result = GameScore.getHighestLevelReached();

      // Then
      expect(result).toBe(4);
      expect(store[HIGHEST_KEY]).toBe('4');
    });
  });

  describe('Scenario: getHighestLevelReached when no data exists at all', () => {
    it('Given no cached value and no played levels, when getHighestLevelReached is called, then it returns -1', () => {
      // When
      const result = GameScore.getHighestLevelReached();

      // Then
      expect(result).toBe(-1);
    });
  });
});
