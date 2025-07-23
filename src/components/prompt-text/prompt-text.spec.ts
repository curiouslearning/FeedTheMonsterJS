import { PromptText, DEFAULT_SELECTORS } from './prompt-text';
import { AudioPlayer } from '@components';
import { EventManager } from '@events';
import gameStateService from '@gameStateService';

jest.mock('@components', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    preloadPromptAudio: jest.fn(),
    handlePlayPromptAudioClickEvent: jest.fn(),
    stopAllAudios: jest.fn()
  }))
}));

jest.mock('@events', () => ({
  EventManager: jest.fn().mockImplementation(() => ({
    unregisterEventListener: jest.fn()
  }))
}));

jest.mock('@gameStateService', () => ({
  EVENTS: {
    WORD_PUZZLE_SUBMITTED_LETTERS_COUNT: 'WORD_PUZZLE_SUBMITTED_LETTERS_COUNT'
  },
  subscribe: jest.fn(() => jest.fn()) // unsubscribe fn
}));

describe('PromptText', () => {
  let promptText: PromptText;
  let levelDataMock: any;
  let puzzleDataMock: any;
  const onClickMock = jest.fn();

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="prompt-container">
        <div id="prompt-background" class="prompt-background">
          <div id="prompt-text-button-container">
            <div id="prompt-text" class="prompt-text"></div>
            <div id="prompt-play-button" class="prompt-play-button"></div>
          </div>
        </div>
      </div>
    `;

    levelDataMock = {
      levelMeta: {
        levelType: 'Word',
        protoType: 'Visible'
      },
      puzzles: [
        {
          segmentNumber: 0,
          prompt: {
            promptText: 'cat',
            promptAudio: 'https://feedthemonster.curiouscontent.org/lang/english/audios/cat.mp3'
          },
          foilStones: ['a', 'c', 't', 'n', 'm'],
          targetStones: ['c', 'a', 't']
        }
      ]
    };

    puzzleDataMock = levelDataMock.puzzles[0];

    promptText = new PromptText(
      500,
      puzzleDataMock,
      levelDataMock,
      false,
      'prompt-container',
      undefined,
      false,
      onClickMock
    );
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('test prompt creation', () => {
    it('should create the prompt container element', () => {
      const containerEl = document.getElementById('prompt-container');
      expect(containerEl).toBeTruthy();
    });

    it('should inject click event listeners into prompt elements', () => {
      const playButton = document.getElementById('prompt-play-button');
      const textElement = document.getElementById('prompt-text');
      const background = document.getElementById('prompt-background');

      playButton?.click();
      textElement?.click();
      background?.click();

      expect(onClickMock).toHaveBeenCalledTimes(3);
    });

    it('should hide the play button for non-audio level types', () => {
      const playButton = document.getElementById('prompt-play-button') as HTMLDivElement;
      expect(playButton.style.display).toBe('none');
    });

    it('should display the prompt text element', () => {
      const textElement = document.getElementById('prompt-text') as HTMLDivElement;
      expect(textElement.style.display).toBe('block');
    });
  });

  describe('generateTextMarkup', () => {
    it('should wrap each character in a span inside #prompt-text', () => {
      const promptEl = document.querySelector('#prompt-text');
      expect(promptEl).toBeTruthy();

      // Get the wrapper span (it contains the child letter spans)
      const wrapper = promptEl?.querySelector('span');
      expect(wrapper).toBeTruthy();

      // Get only the inner spans (the actual letter elements)
      const letterSpans = wrapper?.querySelectorAll('span') ?? [];

      const characters = Array.from(letterSpans)
        .map(span => span.textContent?.trim())
        .filter(Boolean);

      expect(characters.length).toBe(3);
      expect(characters).toEqual(['c', 'a', 't']);
    });
  });

});
