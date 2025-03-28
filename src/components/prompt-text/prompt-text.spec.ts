import { PromptText } from './prompt-text';
import { PROMPT_PLAY_BUTTON, PROMPT_TEXT_BG } from '@constants';
import { AudioPlayer } from '@components';

jest.mock('@components', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    preloadPromptAudio: jest.fn(),
    playPromptAudio: jest.fn(),
    stopAllAudios: jest.fn()
  }))
}));

describe('PromptText', () => {
  let promptText: PromptText;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any; // Use any type for easier mocking
  
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

  // Mock Image implementation
  class MockImage {
    public onload: () => void;
    public onerror: (error: any) => void;
    public src: string;
    public width: number = 100;
    public height: number = 100;
    
    constructor() {
      this.onload = () => {};
      this.onerror = () => {};
      this.src = '';
    }
    
    // Simulate image loading
    simulateLoad() {
      this.onload();
    }
    
    // Simulate image error
    simulateError() {
      this.onerror(new Error('Image loading failed'));
    }
    
    // For attribute setting
    setAttribute(name: string, value: string) {
      // Do nothing, just a mock
    }
  }

  beforeEach(() => {
    // Mock document methods
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();
    
    // Create a real canvas for testing
    mockCanvas = document.createElement('canvas');
    
    // Create a mock context with all the methods we need
    mockContext = {
      fillText: jest.fn(),
      drawImage: jest.fn(),
      measureText: jest.fn().mockReturnValue({ width: 50 }),
      fillStyle: '',
      textAlign: 'center',
      font: ''
    };
    
    // Mock document.getElementById
    document.getElementById = jest.fn().mockReturnValue(mockCanvas);
    
    // Mock getContext
    mockCanvas.getContext = jest.fn().mockReturnValue(mockContext);
    
    // Create instance with mocked dependencies
    promptText = new PromptText(
      mockWidth,
      mockHeight,
      mockPuzzleData,
      mockLevelData,
      mockRightToLeft
    );
    
    // Replace Image with MockImage
    promptText.prompt_image = new MockImage() as unknown as HTMLImageElement;
    promptText.promptPlayButton = new MockImage() as unknown as HTMLImageElement;
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    
    // Mock other methods that might be called
    promptText.drawRTLLang = jest.fn();
    promptText.drawOthers = jest.fn();
    promptText.updateScaling = jest.fn();
    promptText.getPromptAudioUrl = jest.fn().mockReturnValue('test-audio.mp3');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('applyPromptImageResponsiveSizing', () => {
    it('should set correct dimensions for small screens (≤375px)', () => {
      // Set window.innerWidth
      window.innerWidth = 360;
      
      // Call the method
      promptText.applyPromptImageResponsiveSizing();
      
      // Check dimensions
      expect(promptText.promptImageWidth).toBe(mockWidth * 0.6);
      expect(promptText.promptImageHeight).toBe(mockHeight * 0.22);
    });
    
    it('should set correct dimensions for medium screens (≤480px)', () => {
      // Set window.innerWidth
      window.innerWidth = 480;
      
      // Call the method
      promptText.applyPromptImageResponsiveSizing();
      
      // Check dimensions
      expect(promptText.promptImageWidth).toBe(mockWidth * 0.6);
      expect(promptText.promptImageHeight).toBe(mockHeight * 0.28);
    });
    
    it('should set correct dimensions for large screens (>480px)', () => {
      // Set window.innerWidth
      window.innerWidth = 1024;
      
      // Call the method
      promptText.applyPromptImageResponsiveSizing();
      
      // Check dimensions
      expect(promptText.promptImageWidth).toBe(mockWidth * 0.65);
      expect(promptText.promptImageHeight).toBe(mockHeight * 0.3);
    });
  });

  describe('loadImages', () => {
    it('should load images and apply responsive sizing', async () => {
      // Spy on applyPromptImageResponsiveSizing
      const spy = jest.spyOn(promptText, 'applyPromptImageResponsiveSizing');
      
      // Start loading images
      const loadPromise = promptText.loadImages();
      
      // Simulate successful image loading
      (promptText.prompt_image as any).simulateLoad();
      (promptText.promptPlayButton as any).simulateLoad();
      
      // Wait for the promise to resolve
      await loadPromise;
      
      // Check if images were loaded with correct sources
      expect(promptText.prompt_image.src).toBe(PROMPT_TEXT_BG);
      expect(promptText.promptPlayButton.src).toBe(PROMPT_PLAY_BUTTON);
      
      // Check if imagesLoaded flag is set
      expect(promptText.imagesLoaded).toBe(true);
      
      // Check if applyPromptImageResponsiveSizing was called
      expect(spy).toHaveBeenCalled();
    });
    
    it('should handle image loading errors', async () => {
      // Create a promise for the loadImages method and catch the error
      const loadPromise = promptText.loadImages().catch(error => error);
      
      // Simulate error for one of the images
      (promptText.prompt_image as any).simulateError();
      
      // Wait for the promise to reject
      const error = await loadPromise;
      
      // Check if we got an error
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Image loading failed');
    });
  });

  describe('drawCenteredPlayButton', () => {
    it('should draw the play button centered at the specified position', () => {
      // Test parameters
      const testY = 300;
      const testScaledWidth = 400;
      const testScaledHeight = 200;
      
      // Expected values
      const buttonSize = Math.min(mockWidth, mockHeight) * 0.12;
      const expectedCenterX = mockWidth / 2 - buttonSize / 2;
      const expectedCenterY = testY - buttonSize / 2;
      
      // Call the method
      promptText.drawCenteredPlayButton(testY, testScaledWidth, testScaledHeight);
      
      // Check if drawImage was called with correct parameters
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        promptText.promptPlayButton,
        expectedCenterX,
        expectedCenterY,
        buttonSize,
        buttonSize
      );
    });
    
    it('should maintain square aspect ratio regardless of scaled dimensions', () => {
      // Test with different scaled dimensions
      const testY = 300;
      const testScaledWidth = 600;  // wider
      const testScaledHeight = 100; // shorter
      
      // Expected values (should be the same as before)
      const buttonSize = Math.min(mockWidth, mockHeight) * 0.12;
      
      // Call the method
      promptText.drawCenteredPlayButton(testY, testScaledWidth, testScaledHeight);
      
      // Get the last call arguments
      const callArgs = mockContext.drawImage.mock.calls[0];
      
      // Check if button dimensions are square (width === height)
      expect(callArgs[3]).toBe(buttonSize); // width
      expect(callArgs[4]).toBe(buttonSize); // height
    });
  });

  describe('draw', () => {
    it('should draw the prompt image with correct scaling and position', () => {
      // Mock scale
      promptText.scale = 1.05;
      
      // Set dimensions
      promptText.promptImageWidth = 400;
      promptText.promptImageHeight = 200;
      
      // Expected values
      const expectedScaledWidth = 400 * 1.05;
      const expectedScaledHeight = 200 * 1.05;
      const expectedOffsetX = (mockWidth - expectedScaledWidth) / 2;
      const expectedOffsetY = (mockHeight - expectedScaledHeight) / 4.2;
      
      // Call the method
      promptText.draw(16);
      
      // Check if drawImage was called with correct parameters for the prompt image
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        promptText.prompt_image,
        expectedOffsetX,
        expectedOffsetY,
        expectedScaledWidth,
        expectedScaledHeight
      );
    });
  });
});
