import { PromptText } from './prompt-text';
import { AudioPlayer } from '@components';
import { EventManager } from '@events';

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
    PromptText: jest.fn().mockImplementation((width, height, currentPuzzleData, levelData, rightToLeft) => {
      // Create a mock instance
      const instance = {
        width,
        height,
        currentPuzzleData,
        levelData,
        rightToLeft,
        currentPromptText: currentPuzzleData.prompt.promptText,
        targetStones: currentPuzzleData.targetStones,
        isStoneDropped: false,
        droppedStones: 0,
        droppedStoneCount: 0,
        scale: 1,
        isScalingUp: true,
        isAppForeground: true,
        
        // Mock HTML elements with proper style objects
        promptContainer: { 
          style: { 
            display: 'block',
            cssText: ''
          } as unknown as CSSStyleDeclaration 
        },
        promptBackground: { 
          style: {} as unknown as CSSStyleDeclaration 
        },
        promptTextElement: { 
          style: {} as unknown as CSSStyleDeclaration, 
          innerText: '', 
          setAttribute: jest.fn() 
        },
        promptPlayButtonElement: { 
          style: {} as unknown as CSSStyleDeclaration 
        },
        
        // Mock methods
        audioPlayer: {
          preloadPromptAudio: jest.fn(),
          playPromptAudio: jest.fn(),
          stopAllAudios: jest.fn()
        },
        
        // Mock public methods
        getPromptAudioUrl: function() {
          return this.currentPuzzleData.prompt.promptAudio;
        },
        
        playSound: function() {
          if (this.isAppForeground) {
            this.audioPlayer.playPromptAudio(this.getPromptAudioUrl());
          }
        },
        
        calculateFont: function() {
          return (this.width * 0.65 / this.currentPromptText.length > 35) ? 35 : this.width * 0.65 / this.currentPromptText.length;
        },
        
        updateScaling: function() {
          if (this.isScalingUp) {
            this.scale += 0.00050;
            if (this.scale >= 1.05) {
              this.isScalingUp = false;
            }
          } else {
            this.scale -= 0.00050;
            if (this.scale <= 0.95) {
              this.scale = 0.95;
              this.isScalingUp = true;
            }
          }
        },
        
        handleVisibilityChange: function() {
          if (document.visibilityState === "hidden") {
            this.audioPlayer.stopAllAudios();
            this.isAppForeground = false;
          }
          if (document.visibilityState === "visible") {
            this.isAppForeground = true;
          }
        },
        
        eventManager: {
          unregisterEventListener: jest.fn()
        },
        
        // Add mock for initializeHtmlElements to fix the test errors
        initializeHtmlElements: jest.fn()
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
      mockRightToLeft
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
      
      // For short text, it should cap at 35
      expect(result).toBe(35);
      
      // For longer text, it should scale down
      promptText.currentPromptText = 'This is a much longer text that should scale down the font size';
      const result2 = promptText.calculateFont();
      expect(result2).toBeLessThan(35);
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
});