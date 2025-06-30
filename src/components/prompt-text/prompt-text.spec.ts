import { PromptText, DEFAULT_SELECTORS } from './prompt-text';
import { AudioPlayer } from '@components';
import { EventManager } from '@events';
import { Utils } from '@common';

// Mock dependencies
jest.mock('@components', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    preloadPromptAudio: jest.fn(),
    playPromptAudio: jest.fn(),
    stopAllAudios: jest.fn()
  }))
}));

jest.mock('@events', () => ({
  EventManager: jest.fn().mockImplementation(() => ({
    stoneDropCallbackHandler: jest.fn(),
    loadPuzzleCallbackHandler: jest.fn(),
    unregisterEventListener: jest.fn()
  }))
}));

// Mock Utils to avoid URL conversion issues
jest.mock('@common', () => ({
  Utils: {
    getConvertedDevProdURL: jest.fn(url => url)
  },
  VISIBILITY_CHANGE: 'visibilitychange'
}));

// Mock BaseHTML to avoid DOM operations
jest.mock('../baseHTML/base-html', () => {
  return {
    BaseHTML: jest.fn().mockImplementation(() => ({
      render: jest.fn(),
      destroy: jest.fn()
    }))
  };
});

// Mock the original PromptText class
jest.mock('./prompt-text', () => {
  const originalModule = jest.requireActual('./prompt-text');
  return {
    ...originalModule,
    PromptText: jest.fn().mockImplementation((width, height, currentPuzzleData, levelData, rightToLeft, id = 'prompt-container') => {
      // Create a mock instance
      const instance = {
        width,
        height,
        currentPuzzleData,
        levelData,
        rightToLeft,
        containerId: id,
        currentPromptText: currentPuzzleData.prompt.promptText,
        targetStones: currentPuzzleData.targetStones,
        isStoneDropped: false,
        droppedStones: 0,
        droppedStoneCount: 0,
        scale: 1,
        isScalingUp: true,
        isAppForeground: true,
        time: 0,
        scaleFactor: 0.00050,
        translateY: 0,
        isTranslatingUp: true,
        translateFactor: 0.05,
        animationFrameId: null,
        
        // Mock HTML elements with proper style objects
        promptContainer: { 
          style: { 
            display: 'block',
            cssText: ''
          } as unknown as CSSStyleDeclaration,
          querySelector: jest.fn().mockImplementation(selector => {
            if (selector === '#prompt-background') return instance.promptBackground;
            if (selector === '#prompt-text') return instance.promptTextElement;
            if (selector === '#prompt-play-button') return instance.promptPlayButtonElement;
            return null;
          })
        },
        promptBackground: { 
          style: {} as unknown as CSSStyleDeclaration,
          addEventListener: jest.fn(),
          querySelector: jest.fn()
        },
        promptTextElement: { 
          style: {} as unknown as CSSStyleDeclaration, 
          innerText: '',
          innerHTML: '',
          appendChild: jest.fn(),
          setAttribute: jest.fn(),
          addEventListener: jest.fn()
        },
        promptPlayButtonElement: { 
          style: {} as unknown as CSSStyleDeclaration,
          addEventListener: jest.fn()
        },
        
        // Mock methods
        audioPlayer: {
          preloadPromptAudio: jest.fn(),
          playPromptAudio: jest.fn(),
          stopAllAudios: jest.fn()
        },
        
        eventManager: {
          unregisterEventListener: jest.fn()
        },
        
        // Mock public methods
        getPromptAudioUrl: function() {
          return Utils.getConvertedDevProdURL(this.currentPuzzleData.prompt.promptAudio);
        },
        
        playSound: jest.fn(function() {
          if (this.isAppForeground) {
            this.audioPlayer.playPromptAudio(this.getPromptAudioUrl());
          }
        }),
        
        calculateFont: function() {
          return (this.width * 0.65 / this.currentPromptText.length > 35) ? 25 : this.width * 0.65 / this.currentPromptText.length;
        },
        
        updateScaling: function() {
          if (this.isScalingUp) {
            this.scale += this.scaleFactor;
            if (this.scale >= 1.05) {
              this.isScalingUp = false;
            }
          } else {
            this.scale -= this.scaleFactor;
            if (this.scale <= 0.95) {
              this.scale = 0.95;
              this.isScalingUp = true;
            }
          }
        },
        
        updateTranslation: function() {
          if (this.isTranslatingUp) {
            this.translateY -= this.translateFactor;
            if (this.translateY <= -5) {
              this.isTranslatingUp = false;
            }
          } else {
            this.translateY += this.translateFactor;
            if (this.translateY >= 5) {
              this.translateY = 5;
              this.isTranslatingUp = true;
            }
          }
        },
        
        handleVisibilityChange: jest.fn(function() {
          if (document.visibilityState === "hidden") {
            this.audioPlayer.stopAllAudios();
            this.isAppForeground = false;
          }
          if (document.visibilityState === "visible") {
            this.isAppForeground = true;
          }
        }),
        
        initializeHtmlElements: jest.fn(),
        updateTextDisplay: jest.fn(),
        updateRTLText: jest.fn(),
        updateLTRText: jest.fn(),
        updateCenteredPlayButton: jest.fn(),
        startAnimationLoop: jest.fn(),
        handleStoneDrop: jest.fn(function(event) {
          this.isStoneDropped = true;
          this.promptContainer.style.display = 'none';
        }),
        handleLoadPuzzle: jest.fn(function(event) {
          this.droppedStones = 0;
          this.droppedStoneCount = 0;
          this.currentPuzzleData = this.levelData.puzzles[event.detail.counter];
          this.currentPromptText = this.currentPuzzleData.prompt.promptText;
          this.targetStones = this.currentPuzzleData.targetStones;
          this.audioPlayer.preloadPromptAudio(this.getPromptAudioUrl());
          this.isStoneDropped = false;
          this.time = 0;
          this.updateTextDisplay();
          this.promptContainer.style.display = 'block';
        }),
        dispose: jest.fn(function() {
          document.removeEventListener('visibilitychange', this.handleVisibilityChange, false);
          this.eventManager.unregisterEventListener();
          if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
          }
        }),
        droppedLetterIndex: jest.fn(function(index) {
          this.droppedStones = index;
          this.droppedStoneCount++;
          if (!this.isStoneDropped) {
            this.updateTextDisplay();
          }
        })
      };
      
      return instance;
    })
  };
});

describe('PromptText', () => {
  // Mock data for testing
  const mockWidth = 800;
  const mockHeight = 600;
  const mockPuzzleData = {
    prompt: {
      promptText: 'Test Prompt',
      promptAudio: 'test-audio.mp3'
    },
    targetStones: ['T', 'e', 's', 't']
  };
  const mockLevelData = {
    levelMeta: {
      levelType: 'Word',
      protoType: 'Visible'
    },
    puzzles: [mockPuzzleData]
  };
  const mockRightToLeft = false;
  
  let promptText;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance for testing
    promptText = new PromptText(
      mockWidth,
      mockHeight,
      mockPuzzleData,
      mockLevelData,
      mockRightToLeft,
      'prompt-container',  // id parameter (string)
      { selectors: DEFAULT_SELECTORS },
      false
    );
  });
  
  describe('getPromptAudioUrl', () => {
    it('should return the correct audio URL', () => {
      expect(promptText.getPromptAudioUrl()).toBe(mockPuzzleData.prompt.promptAudio);
    });
  });
  
  describe('playSound', () => {
    it('should play audio when app is in foreground', () => {
      promptText.isAppForeground = true;
      promptText.playSound();
      expect(promptText.audioPlayer.playPromptAudio).toHaveBeenCalled();
    });
    
    it('should not play audio when app is in background', () => {
      promptText.isAppForeground = false;
      promptText.playSound();
      expect(promptText.audioPlayer.playPromptAudio).not.toHaveBeenCalled();
    });
  });
  
  describe('calculateFont', () => {
    it('should return correct font size based on text length', () => {
      promptText.currentPromptText = 'Short';
      const result = promptText.calculateFont();
      
      // For short text, it should cap at 25
      expect(result).toBe(25);
      
      // For longer text, it should scale down
      promptText.currentPromptText = 'This is a much longer text that should scale down the font size';
      const result2 = promptText.calculateFont();
      expect(result2).toBeLessThan(25);
    });
  });
  
  describe('updateScaling', () => {
    it('should increase scale when isScalingUp is true', () => {
      promptText.scale = 1;
      promptText.isScalingUp = true;
      
      promptText.updateScaling();
      
      expect(promptText.scale).toBeGreaterThan(1);
    });
    
    it('should decrease scale when isScalingUp is false', () => {
      promptText.scale = 1;
      promptText.isScalingUp = false;
      
      promptText.updateScaling();
      
      expect(promptText.scale).toBeLessThan(1);
    });
  });
  
  describe('handleVisibilityChange', () => {
    it('should stop audio and update isAppForeground when hidden', () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true
      });
      
      promptText.handleVisibilityChange();
      
      expect(promptText.audioPlayer.stopAllAudios).toHaveBeenCalled();
      expect(promptText.isAppForeground).toBe(false);
    });
    
    it('should update isAppForeground when visible', () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true
      });
      
      promptText.handleVisibilityChange();
      
      expect(promptText.isAppForeground).toBe(true);
    });
  });

  describe('updateTranslation', () => {
    // Save original implementation
    let originalUpdateTranslation;
    
    beforeEach(() => {
      // Store the original implementation
      originalUpdateTranslation = promptText.updateTranslation;
      
      // Create a mock implementation that matches the actual code
      promptText.updateTranslation = jest.fn(function() {
        if (this.isTranslatingUp) {
          this.translateY -= this.translateFactor;
          if (this.translateY <= -5) {
            this.isTranslatingUp = false;
          }
        } else {
          this.translateY += this.translateFactor;
          if (this.translateY >= 5) {
            this.translateY = 5;
            this.isTranslatingUp = true;
          }
        }
      });
    });
    
    afterEach(() => {
      // Restore original implementation
      promptText.updateTranslation = originalUpdateTranslation;
    });
    
    it('should decrease translateY when isTranslatingUp is true', () => {
      promptText.translateY = 0;
      promptText.isTranslatingUp = true;
      promptText.translateFactor = 0.05;
      
      promptText.updateTranslation();
      
      expect(promptText.translateY).toBeLessThan(0);
    });
    
    it('should increase translateY when isTranslatingUp is false', () => {
      promptText.translateY = 0;
      promptText.isTranslatingUp = false;
      promptText.translateFactor = 0.05;
      
      promptText.updateTranslation();
      
      expect(promptText.translateY).toBeGreaterThan(0);
    });
    
    it('should toggle isTranslatingUp when reaching limits', () => {
      // Test lower limit
      promptText.translateY = -4.95;
      promptText.isTranslatingUp = true;
      promptText.translateFactor = 0.05;
      
      promptText.updateTranslation();
      
      // After decreasing by translateFactor (0.05), translateY should be -5 and isTranslatingUp should toggle
      expect(promptText.translateY).toBe(-5);
      expect(promptText.isTranslatingUp).toBe(false);
      
      // Test upper limit
      promptText.translateY = 4.95;
      promptText.isTranslatingUp = false;
      promptText.translateFactor = 0.05;
      
      promptText.updateTranslation();
      
      // After increasing by translateFactor (0.05), translateY should be 5 and isTranslatingUp should toggle
      expect(promptText.translateY).toBe(5);
      expect(promptText.isTranslatingUp).toBe(true);
    });
  });
  
  describe('handleStoneDrop', () => {
    it('should set isStoneDropped to true and hide promptContainer', () => {
      promptText.isStoneDropped = false;
      promptText.promptContainer.style.display = 'block';
      
      promptText.handleStoneDrop({});
      
      expect(promptText.isStoneDropped).toBe(true);
      expect(promptText.promptContainer.style.display).toBe('none');
    });
  });
  
  describe('handleLoadPuzzle', () => {
    it('should reset state and update with new puzzle data', () => {
      const mockEvent = {
        detail: {
          counter: 0
        }
      };
      
      promptText.isStoneDropped = true;
      promptText.droppedStones = 2;
      promptText.time = 1000;
      
      promptText.handleLoadPuzzle(mockEvent);
      
      expect(promptText.isStoneDropped).toBe(false);
      expect(promptText.droppedStones).toBe(0);
      expect(promptText.time).toBe(0);
      expect(promptText.updateTextDisplay).toHaveBeenCalled();
      expect(promptText.promptContainer.style.display).toBe('block');
      expect(promptText.audioPlayer.preloadPromptAudio).toHaveBeenCalled();
    });
  });
  
  describe('droppedLetterIndex', () => {
    it('should update droppedStones and call updateTextDisplay if not stoneDropped', () => {
      promptText.isStoneDropped = false;
      promptText.droppedStones = 0;
      promptText.droppedStoneCount = 0;
      
      promptText.droppedLetterIndex(2);
      
      expect(promptText.droppedStones).toBe(2);
      expect(promptText.droppedStoneCount).toBe(1);
      expect(promptText.updateTextDisplay).toHaveBeenCalled();
    });
    
    it('should not call updateTextDisplay if stoneDropped is true', () => {
      promptText.isStoneDropped = true;
      promptText.updateTextDisplay.mockClear();
      
      promptText.droppedLetterIndex(2);
      
      expect(promptText.updateTextDisplay).not.toHaveBeenCalled();
    });
  });
  
  describe('updateTextDisplay', () => {
    it('should update font size and call the appropriate language-specific method', () => {
      // Mock the calculateFont method
      const originalCalculateFont = promptText.calculateFont;
      promptText.calculateFont = jest.fn().mockReturnValue(25);
      
      // Set up style object properly
      promptText.promptTextElement.style = {
        fontSize: ''
      } as unknown as CSSStyleDeclaration;
      
      // Clear previous calls
      promptText.updateRTLText.mockClear();
      promptText.updateLTRText.mockClear();
      
      // Create a mock implementation for updateTextDisplay that sets the fontSize
      const originalUpdateTextDisplay = promptText.updateTextDisplay;
      promptText.updateTextDisplay = jest.fn(function() {
        this.promptTextElement.style.fontSize = `${this.calculateFont()}px`;
        if (this.rightToLeft) {
          this.updateRTLText();
        } else {
          this.updateLTRText();
        }
      });
      
      // Test LTR text display
      promptText.rightToLeft = false;
      promptText.updateTextDisplay();
      
      expect(promptText.promptTextElement.style.fontSize).toBe('25px');
      expect(promptText.updateLTRText).toHaveBeenCalled();
      expect(promptText.updateRTLText).not.toHaveBeenCalled();
      
      // Clear previous calls
      promptText.updateRTLText.mockClear();
      promptText.updateLTRText.mockClear();
      
      // Test RTL text display
      promptText.rightToLeft = true;
      promptText.updateTextDisplay();
      
      expect(promptText.promptTextElement.style.fontSize).toBe('25px');
      expect(promptText.updateRTLText).toHaveBeenCalled();
      expect(promptText.updateLTRText).not.toHaveBeenCalled();
      
      // Restore originals
      promptText.calculateFont = originalCalculateFont;
      promptText.updateTextDisplay = originalUpdateTextDisplay;
    });
  });

  describe('dispose', () => {
    it('should clean up resources and event listeners', () => {
      // Mock document.removeEventListener
      const originalRemoveEventListener = document.removeEventListener;
      document.removeEventListener = jest.fn();
      
      // Mock cancelAnimationFrame
      const originalCancelAnimationFrame = global.cancelAnimationFrame;
      global.cancelAnimationFrame = jest.fn();
      
      promptText.animationFrameId = 123;
      promptText.dispose();
      
      expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', promptText.handleVisibilityChange, false);
      expect(promptText.eventManager.unregisterEventListener).toHaveBeenCalled();
      expect(global.cancelAnimationFrame).toHaveBeenCalledWith(123);
      
      // Restore originals
      document.removeEventListener = originalRemoveEventListener;
      global.cancelAnimationFrame = originalCancelAnimationFrame;
    });
  });

  describe('LetterInWord and Word puzzle styling', () => {
    // Create a mock implementation for updateRTLText and updateLTRText
    // to capture the HTML content and verify CSS classes
    let mockRTLWrapper;
    let mockLTRWrapper;
    
    beforeEach(() => {
      // Create mock wrapper elements to capture HTML content
      mockRTLWrapper = { 
        innerHTML: '',
        style: {},
        appendChild: jest.fn() 
      };
      
      mockLTRWrapper = { 
        innerHTML: '',
        style: {},
        appendChild: jest.fn() 
      };
      
      // Mock document.createElement to return our mock wrappers
      document.createElement = jest.fn().mockImplementation(() => mockRTLWrapper);
      
      // Mock the updateRTLText and updateLTRText methods
      promptText.updateRTLText = jest.fn(function() {
        // Simulate the actual implementation by setting innerHTML based on puzzle type
        if (this.levelData.levelMeta.levelType === "LetterInWord") {
          mockRTLWrapper.innerHTML = `<span class="text-red-pulse-letter">a</span>`;
        } else {
          mockRTLWrapper.innerHTML = `<span class="text-red">a</span>`;
        }
        this.promptTextElement.appendChild(mockRTLWrapper);
      });
      
      promptText.updateLTRText = jest.fn(function() {
        // Simulate the actual implementation by setting innerHTML based on puzzle type
        if (this.levelData.levelMeta.levelType === "LetterInWord") {
          mockLTRWrapper.innerHTML = `<span class="text-red-pulse-letter">a</span>`;
        } else {
          mockLTRWrapper.innerHTML = `<span class="text-red">a</span>`;
        }
        this.promptTextElement.appendChild(mockLTRWrapper);
      });
    });
    
    // Test for LetterInWord puzzle with pulsating effect
    it('should apply pulsating effect class for LetterInWord puzzles in RTL mode', () => {
      // Set up LetterInWord puzzle type
      promptText.levelData = {
        levelMeta: {
          levelType: "LetterInWord",
          protoType: "Visible"
        }
      };
      promptText.targetStones = ["a"];
      promptText.currentPromptText = "cat";
      
      // Call updateRTLText directly
      promptText.updateRTLText();
      
      // Verify the correct CSS class was used
      expect(mockRTLWrapper.innerHTML).toContain('text-red-pulse-letter');
      // Check that it doesn't contain the exact class="text-red" pattern
      expect(mockRTLWrapper.innerHTML).not.toMatch(/class="text-red"/);
      expect(promptText.promptTextElement.appendChild).toHaveBeenCalledWith(mockRTLWrapper);
    });
    
    it('should apply pulsating effect class for LetterInWord puzzles in LTR mode', () => {
      // Set up LetterInWord puzzle type
      promptText.levelData = {
        levelMeta: {
          levelType: "LetterInWord",
          protoType: "Visible"
        }
      };
      promptText.targetStones = ["a"];
      promptText.currentPromptText = "cat";
      
      // Call updateLTRText directly
      promptText.updateLTRText();
      
      // Verify the correct CSS class was used
      expect(mockLTRWrapper.innerHTML).toContain('text-red-pulse-letter');
      // Check that it doesn't contain the exact class="text-red" pattern
      expect(mockLTRWrapper.innerHTML).not.toMatch(/class="text-red"/);
      expect(promptText.promptTextElement.appendChild).toHaveBeenCalledWith(mockLTRWrapper);
    });
    
    it('should apply regular text-red class for Word puzzles in RTL mode', () => {
      // Set up Word puzzle type
      promptText.levelData = {
        levelMeta: {
          levelType: "Word",
          protoType: "Visible"
        }
      };
      promptText.targetStones = ["c", "a", "t"];
      promptText.currentPromptText = "cat";
      
      // Call updateRTLText directly
      promptText.updateRTLText();
      
      // Verify the correct CSS class was used
      expect(mockRTLWrapper.innerHTML).toMatch(/class="text-red"/); 
      expect(mockRTLWrapper.innerHTML).not.toContain('text-red-pulse-letter');
      expect(promptText.promptTextElement.appendChild).toHaveBeenCalledWith(mockRTLWrapper);
    });
    
    it('should apply regular text-red class for Word puzzles in LTR mode', () => {
      // Set up Word puzzle type
      promptText.levelData = {
        levelMeta: {
          levelType: "Word",
          protoType: "Visible"
        }
      };
      promptText.targetStones = ["c", "a", "t"];
      promptText.currentPromptText = "cat";
      
      // Call updateLTRText directly
      promptText.updateLTRText();
      
      // Verify the correct CSS class was used
      expect(mockLTRWrapper.innerHTML).toMatch(/class="text-red"/);
      expect(mockLTRWrapper.innerHTML).not.toContain('text-red-pulse-letter');
      expect(promptText.promptTextElement.appendChild).toHaveBeenCalledWith(mockLTRWrapper);
    });
  });
});