/**
 * Mock AudioContext as this is not supported by js-dom
 */
global.AudioContext = jest.fn().mockImplementation(() => ({
  createMediaStreamSource: jest.fn(),
  createMediaElementSource: jest.fn(),
  createBufferSource: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    loop: false,
  })),
  decodeAudioData: jest.fn().mockImplementation((buffer, successCallback, errorCallback) => {
    successCallback(buffer);
  }),
  destination: {},
}));

jest.mock('@components/audio-player');