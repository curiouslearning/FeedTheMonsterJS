export const AudioPlayer = jest.fn().mockImplementation(() => {
  return {
    playAudio: jest.fn().mockResolvedValue(''),
    playButtonClickSound: jest.fn().mockResolvedValue('')
  };
});