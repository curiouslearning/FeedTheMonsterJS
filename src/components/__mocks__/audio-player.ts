const mockAudioPlayerInstance = {
  preloadGameAudio: jest.fn(),
  playAudio: jest.fn(),
  stopAllAudios: jest.fn(),
  playButtonClickSound: jest.fn(),
  playPromptAudio: jest.fn(),
  playAudioQueue: jest.fn(),
  stopFeedbackAudio: jest.fn(),
  preloadPromptAudio: jest.fn(),
  handlePlayPromptAudioClickEvent: jest.fn(),
  audioContext: {
    createBufferSource: jest.fn(() => ({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn(),
    })),
    destination: {},
  },
};

export const AudioPlayer = jest.fn().mockImplementation(() => {
  return mockAudioPlayerInstance;
});

// Attach the static instance property
(AudioPlayer as any).instance = mockAudioPlayerInstance;
