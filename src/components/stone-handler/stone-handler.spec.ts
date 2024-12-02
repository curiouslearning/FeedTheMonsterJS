// Import dependencies
import StoneHandler from './stone-handler'; // Adjust path as necessary
import { StoneConfig } from '@common';
import { AudioPlayer } from '@components';
import { AUDIO_PATH_ON_DRAG } from '@constants'; // Import the constant

// Mock the Tutorial class
jest.mock('@components', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    playAudio: jest.fn(),
  })),
  Tutorial: jest.fn().mockImplementation(() => ({
    setPuzzleNumber: jest.fn(),
    updateTargetStonePositions: jest.fn(),
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
