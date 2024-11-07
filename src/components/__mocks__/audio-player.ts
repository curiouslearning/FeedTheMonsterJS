export const AudioPlayer = jest.fn().mockImplementation(() => {
  return {
    playButtonClickSound: jest.fn().mockResolvedValue('')
  };
});