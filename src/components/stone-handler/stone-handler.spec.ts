// Import dependencies
import StoneHandler from './stone-handler'; // Adjust path as necessary
import { StoneConfig } from '@common';
import { AudioPlayer, TimerTicking } from '@components';
import { AUDIO_PATH_ON_DRAG } from '@constants'; // Import the constant

jest.mock('@components', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    playAudio: jest.fn(),
  })),
}));

describe('StoneHandler - playDragAudioIfNecessary', () => {
  let stoneHandler: StoneHandler;
  let mockAudioPlayer: AudioPlayer;

  beforeEach(() => {
    const mockContext = {} as CanvasRenderingContext2D;
    const mockCanvas = {} as HTMLCanvasElement;

    // Mock levelData with the expected structure
    const mockLevelData = {
      puzzles: [
        {
          targetStones: ['A', 'B', 'C'], // Mock target stones
          foilStones: ['D', 'E', 'F'],  // Mock foil stones
        },
      ],
    };
    const mockFeedbackAudios = [];
    const mockTimerTickingInstance = {} as any;

    mockAudioPlayer = new AudioPlayer();
    stoneHandler = new StoneHandler(
      mockContext,
      mockCanvas,
      0, // Puzzle number
      mockLevelData, // Pass the mocked levelData
      mockFeedbackAudios,
      mockTimerTickingInstance
    );

    stoneHandler.audioPlayer = mockAudioPlayer;
  });

  it('should call playAudio when stone frame is greater than 99', () => {
    const stone: StoneConfig = { frame: 100 } as any; // Mocked stone
    stoneHandler.playDragAudioIfNecessary(stone);
    expect(mockAudioPlayer.playAudio).toHaveBeenCalledWith(AUDIO_PATH_ON_DRAG); // Use the constant
  });

  it('should not call playAudio when stone frame is less than or equal to 99', () => {
    const stone: StoneConfig = { frame: 99 } as any; // Mocked stone
    stoneHandler.playDragAudioIfNecessary(stone);
    expect(mockAudioPlayer.playAudio).not.toHaveBeenCalled();
  });
});

describe('StoneHandler - Latest Optimizations', () => {
  let stoneHandler: StoneHandler;
  let mockContext: CanvasRenderingContext2D;
  let mockCanvas: HTMLCanvasElement;
  let mockTimerTicking: TimerTicking;

  beforeEach(() => {
    mockContext = {
      measureText: jest.fn().mockReturnValue({ width: 100 }),
      fillText: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn()
    } as unknown as CanvasRenderingContext2D;

    mockCanvas = {
      width: 800,
      height: 600,
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 0,
        top: 0
      })
    } as unknown as HTMLCanvasElement;

    mockTimerTicking = {
      update: jest.fn()
    } as unknown as TimerTicking;

    const mockLevelData = {
      puzzles: [{
        targetStones: ['A', 'B'],
        foilStones: ['C', 'D', 'E']
      }]
    };

    stoneHandler = new StoneHandler(
      mockContext,
      mockCanvas,
      0,
      mockLevelData,
      [],
      mockTimerTicking
    );
  });

  describe('Stone Position Optimization', () => {
    it('should maintain stone count after shuffling', () => {
      const positions = [[0,0], [1,1], [2,2], [3,3], [4,4]];
      stoneHandler.stonePos = positions;
      
      const foilStones = ['A', 'B', 'C', 'D', 'E'];
      jest.spyOn(stoneHandler as any, 'getFoilStones').mockReturnValue(foilStones);
      
      const mockImage = {
        onload: null as any,
        width: 100,
        height: 100
      };

      stoneHandler.createStones(mockImage);
      mockImage.onload?.(new Event('load'));

      expect(stoneHandler.foilStones.length).toBe(foilStones.length);
    });

    it('should not duplicate positions after shuffling', () => {
      const positions = [[0,0], [1,1], [2,2]];
      stoneHandler.stonePos = positions;
      
      jest.spyOn(stoneHandler as any, 'getFoilStones').mockReturnValue(['A', 'B', 'C']);
      
      const mockImage = {
        onload: null as any,
        width: 100,
        height: 100
      };

      stoneHandler.createStones(mockImage);
      mockImage.onload?.(new Event('load'));

      const usedPositions = new Set();
      stoneHandler.foilStones.forEach(stone => {
        const posKey = `${stone.x},${stone.y}`;
        expect(usedPositions.has(posKey)).toBeFalsy();
        usedPositions.add(posKey);
      });
    });
  });

  describe('Performance Improvements', () => {
    it('should skip disposed stones in draw loop', () => {
      const mockStones = [
        { frame: 50, draw: jest.fn(), isDisposed: true },
        { frame: 100, draw: jest.fn(), isDisposed: false }
      ];
      stoneHandler.foilStones = mockStones as any[];
      
      stoneHandler.draw(16);
      
      expect(mockStones[0].draw).not.toHaveBeenCalled();
    });

    it('should handle animation completion efficiently', () => {
      const mockStones = [
        { frame: 100, draw: jest.fn(), isDisposed: false },
        { frame: 90, draw: jest.fn(), isDisposed: false }
      ];
      stoneHandler.foilStones = mockStones as any[];
      stoneHandler.isGamePaused = false;
      
      stoneHandler.draw(16);
      
      // Timer should not update since not all stones are at frame 100
      expect(mockTimerTicking.update).not.toHaveBeenCalled();
      
      // Update second stone to complete animation
      mockStones[1].frame = 100;
      stoneHandler.draw(16);
      
      // Now timer should update
      expect(mockTimerTicking.update).toHaveBeenCalledWith(16);
    });

    it('should not update timer when game is paused', () => {
      const mockStones = [
        { frame: 100, draw: jest.fn(), isDisposed: false },
        { frame: 100, draw: jest.fn(), isDisposed: false }
      ];
      stoneHandler.foilStones = mockStones as any[];
      stoneHandler.isGamePaused = true;
      
      stoneHandler.draw(16);
      
      expect(mockTimerTicking.update).not.toHaveBeenCalled();
    });
  });
});
