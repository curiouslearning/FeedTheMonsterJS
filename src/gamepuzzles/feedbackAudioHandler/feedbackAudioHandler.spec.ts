import FeedbackAudioHandler, { FeedbackType } from './feedbackAudioHandler';
import { AudioPlayer } from "@components";

// Mock the AudioPlayer class
jest.mock('@components', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    playAudioQueue: jest.fn(),
    stopAllAudios: jest.fn()
  }))
}));

// Mock the Audio class
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  loop: false
}));

// Mock the Utils functions
jest.mock('@common', () => ({
  Utils: {
    getRandomNumber: jest.fn().mockReturnValue(2),
    getConvertedDevProdURL: jest.fn(url => url)
  }
}));

// Mock the constants
jest.mock('@constants', () => ({
  AUDIO_PATH_EATS: 'eats.mp3',
  AUDIO_PATH_MONSTER_SPIT: 'spit.mp3',
  AUDIO_PATH_MONSTER_DISSAPOINTED: 'disappointed.mp3',
  AUDIO_PATH_POINTS_ADD: 'points.mp3',
  AUDIO_PATH_CHEERING_FUNC: jest.fn(num => `cheering${num}.mp3`),
  AUDIO_PATH_CORRECT_STONE: 'correct.mp3'
}));

describe('FeedbackAudioHandler', () => {
  let feedbackAudioHandler: FeedbackAudioHandler;
  let originalMathRound;
  const mockFeedbackAudios = {
    fantastic: 'fantastic.mp3',
    great: 'great.mp3',
    amazing: 'amazing.mp3'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Store original Math.round
    originalMathRound = Math.round;
    // Mock Math.round to always return 0 for predictable test results
    Math.round = jest.fn().mockReturnValue(0);
    feedbackAudioHandler = new FeedbackAudioHandler(mockFeedbackAudios);
  });

  afterEach(() => {
    // Restore Math.round
    Math.round = originalMathRound;
  });

  test('should initialize with correct audio files', () => {
    expect(feedbackAudioHandler['feedbackAudios']).toEqual([
      'fantastic.mp3',
      'great.mp3',
      'amazing.mp3'
    ]);
    expect(global.Audio).toHaveBeenCalledWith('correct.mp3');
  });

  test('should play correct answer feedback', () => {
    feedbackAudioHandler.playFeedback(FeedbackType.CORRECT_ANSWER, 0);
    
    // Check that the correct audio was played
    expect(feedbackAudioHandler['correctStoneAudio'].play).toHaveBeenCalled();
    expect(feedbackAudioHandler['audioPlayer'].playAudioQueue).toHaveBeenCalledWith(
      false,
      'cheering2.mp3',
      'points.mp3',
      'fantastic.mp3'
    );
  });

  test('should play partial correct feedback', () => {
    feedbackAudioHandler.playFeedback(FeedbackType.PARTIAL_CORRECT, 0);
    
    // Check that the correct audio was played
    expect(feedbackAudioHandler['audioPlayer'].playAudioQueue).toHaveBeenCalledWith(
      false,
      'cheering2.mp3'
    );
  });

  test('should play incorrect feedback', () => {
    jest.useFakeTimers();
    feedbackAudioHandler.playFeedback(FeedbackType.INCORRECT, 0);
    
    // Advance timers to trigger the setTimeout callback
    jest.advanceTimersByTime(1700);
    
    // Since Math.round is mocked to return 0, which is <= 0,
    
    jest.useRealTimers();
  });

  test('should stop all audio', () => {
    feedbackAudioHandler.stopAllAudio();
    
    expect(feedbackAudioHandler['audioPlayer'].stopAllAudios).toHaveBeenCalled();
    expect(feedbackAudioHandler['correctStoneAudio'].pause).toHaveBeenCalled();
  });

  test('should dispose resources', () => {
    feedbackAudioHandler.dispose();
    
    expect(feedbackAudioHandler['audioPlayer'].stopAllAudios).toHaveBeenCalled();
    expect(feedbackAudioHandler['correctStoneAudio'].pause).toHaveBeenCalled();
    expect(feedbackAudioHandler['correctStoneAudio'].src).toBe('');
  });
});
