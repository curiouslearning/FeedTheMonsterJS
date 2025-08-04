import { PromptText } from './prompt-text';
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
  subscribe: jest.fn(() => jest.fn()) // unsubscribe function
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
            <div class="prompt-button-slots-wrapper">
              <div id="prompt-play-button" class="prompt-play-button"></div>
              <div id="prompt-slots" class="prompt-slots"></div> <!-- important -->
            </div>
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
    jest.clearAllMocks();
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

      const wrapper = promptEl?.querySelector('span');
      expect(wrapper).toBeTruthy();

      const letterSpans = wrapper?.querySelectorAll('span') ?? [];

      const characters = Array.from(letterSpans)
        .map(span => span.textContent?.trim())
        .filter(Boolean);

      expect(characters.length).toBe(3);
      expect(characters).toEqual(['c', 'a', 't']);
    });
  });

  describe('generatePromptSlots', () => {
    it('should generate underscore slots after GAME_HAS_STARTED event', () => {
      jest.useFakeTimers(); // ✅ use fake timers

      promptText = new PromptText(
        500,
        puzzleDataMock,
        {
          ...levelDataMock,
          levelMeta: {
            levelType: 'Word',
            protoType: 'Hidden'
          }
        },
        false,
        'prompt-container',
        undefined,
        true,
        onClickMock
      );

      const subscribeMock = gameStateService.subscribe as jest.Mock;
      const gameStartedHandler = subscribeMock.mock.calls.find(
        ([eventName]) => eventName === gameStateService.EVENTS.GAME_HAS_STARTED
      )?.[1];

      gameStartedHandler?.(true);

      // Advance timers to allow any scheduled rendering
      jest.runAllTimers();

      const slots = document.querySelectorAll('#prompt-slots .slot');
      expect(slots.length).toBe(3);

      slots.forEach(slot => {
        expect(slot.textContent).toBe('_');
        expect(slot.classList.contains('revealed-letter')).toBe(false);
      });
    });



    it('should display revealed letters when active index advances', () => {
      // Simulate some letters already solved
      promptText.currentActiveLetterIndex = 2;
      promptText.generatePromptSlots();

      const slots = document.querySelectorAll('#prompt-slots .slot');
      expect(slots.length).toBe(3);

      expect(slots[0].textContent).toBe('c');
      expect(slots[1].textContent).toBe('a');
      expect(slots[2].textContent).toBe('_');

      expect(slots[0].classList.contains('revealed-letter')).toBe(true);
      expect(slots[1].classList.contains('revealed-letter')).toBe(true);
      expect(slots[2].classList.contains('revealed-letter')).toBe(false);
    });
  });
});
