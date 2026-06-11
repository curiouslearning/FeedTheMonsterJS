import { MiniGameStateService } from './miniGameStateService';
import { AudioPlayer } from '@components/audio-player';
import { GameScore } from '@data';
import { SURPRISE_BONUS_STAR, STONE_BURN, AUDIO_MINIGAME } from '@constants';

// Mock dependencies
jest.mock('@components/audio-player', () => {
  return {
    AudioPlayer: jest.fn().mockImplementation(() => ({
      preloadGameAudio: jest.fn(),
    })),
  };
});

jest.mock('@data', () => ({
  GameScore: {
    getAllGameLevelInfo: jest.fn(),
  },
}));

describe('Testing MiniGameStateService.', () => {
  let service: MiniGameStateService;
  let mockAudioPlayer: jest.Mocked<AudioPlayer>;

  beforeEach(() => {
    (GameScore.getAllGameLevelInfo as jest.Mock).mockReturnValue([]);
    service = new MiniGameStateService();
    mockAudioPlayer = service.audioPlayer as jest.Mocked<AudioPlayer>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Testing initialization:', () => {
    it('should initialize with default events and mini game levels', () => {
      expect(service.EVENTS).toEqual({
        IS_MINI_GAME_DONE: 'IS_MINI_GAME_DONE',
        MINI_GAME_WILL_START: 'MINI_GAME_WILL_START',
      });

      // Ensure treasureChestCompletedLevel includes expected keys (2, 5, 15, 25, etc.)
      const keys = Object.keys((service as any).treasureChestCompletedLevel);
      expect(keys).toContain('2');
      expect(keys).toContain('5');
      expect(keys).toContain('15');
    });
  });

  describe('Testing initMiniGameLevelList method:', () => {
    it('should populate from GameScore data if available', () => {
      (GameScore.getAllGameLevelInfo as jest.Mock).mockReturnValue([
        { levelNumber: 1, treasureChestMiniGameScore: 1 },
        { levelNumber: 4, treasureChestMiniGameScore: 0 },
      ]);

      const s = new MiniGameStateService();
      const map = (s as any).treasureChestCompletedLevel;

      // levelNumber + 1 = 2
      expect(map[2].isMiniGameComplete).toBe(true);
      // levelNumber + 1 = 5 (exists in base set)
      expect(map[5].isMiniGameComplete).toBe(false);
    });
  });

  describe('Testing event handling (publishing):', () => {
    it('should update completion status when IS_MINI_GAME_DONE is published', () => {
      const map = (service as any).treasureChestCompletedLevel;
      map[3] = { isMiniGameComplete: false };

      service.publish(service.EVENTS.IS_MINI_GAME_DONE, {
        miniGameScore: 1,
        gameLevel: 2, // +1 → 3
      });

      expect(map[3].isMiniGameComplete).toBe(true);
    });

    it('should preload game audio when MINI_GAME_WILL_START is published', () => {
      service.publish(service.EVENTS.MINI_GAME_WILL_START, { level: 5 });

      expect(mockAudioPlayer.preloadGameAudio).toHaveBeenCalledTimes(3);
      expect(mockAudioPlayer.preloadGameAudio).toHaveBeenNthCalledWith(1, SURPRISE_BONUS_STAR);
      expect(mockAudioPlayer.preloadGameAudio).toHaveBeenNthCalledWith(2, STONE_BURN);
      expect(mockAudioPlayer.preloadGameAudio).toHaveBeenNthCalledWith(3, AUDIO_MINIGAME);
    });
  });

  describe('Testing shouldShowMiniGame method:', () => {
    it('should return random level when mini game is available and not complete', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      (service as any).treasureChestCompletedLevel = {
        2: { isMiniGameComplete: false },
      };

      const result = service.shouldShowMiniGame({ gameLevel: 1, levelSegmentLength: 10 });
      expect(result).toBe(6); // (0.5 * 10) + 1 = 6
    });

    it('should return 0 when mini game is complete or not available', () => {
      (service as any).treasureChestCompletedLevel = {
        2: { isMiniGameComplete: true },
      };

      const result = service.shouldShowMiniGame({ gameLevel: 1, levelSegmentLength: 10 });
      expect(result).toBe(0);
    });
  });
});
