import WordPuzzleTutorial from './WordPuzzleTutorial';

// Don't mock the base component, instead mock specific methods we need to test
jest.mock('../base-tutorial/base-tutorial-component', () => {
  // Create a mock constructor function
  const MockTutorialComponent = jest.fn().mockImplementation(function() {
    // 'this' will be the instance being created
    this.context = {};
    this.width = 800;
    this.height = 600;
    this.stoneImg = {};
    this.animateStoneDrag = jest.fn();
    this.updateTargetStonePositions = jest.fn().mockReturnValue({
      startX: 100,
      startY: 100,
      endX: 200,
      endY: 200,
      monsterStoneDifference: 100,
      animateImagePosVal: {
        dx: 1,
        dy: 1,
        absdx: 1,
        absdy: 1,
        x: 100,
        y: 100
      }
    });
  });
  
  // Return the mock constructor
  return MockTutorialComponent;
});

// Mock performance.now
const mockPerformanceNow = jest.spyOn(performance, 'now');

describe('WordPuzzleTutorial', () => {
  let tutorial: WordPuzzleTutorial;
  let mockContext: CanvasRenderingContext2D;
  let mockStoneImg: HTMLImageElement;
  
  const canvasWidth = 800;
  const canvasHeight = 600;
  const sampleStonePositions = [[100, 200], [300, 400]];
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock time
    let mockTime = 0;
    mockPerformanceNow.mockImplementation(() => {
      mockTime += 16; // ~60fps
      return mockTime;
    });
    
    // Create mock canvas context
    mockContext = {
      drawImage: jest.fn(),
      clearRect: jest.fn()
    } as unknown as CanvasRenderingContext2D;
    
    // Create mock stone image
    mockStoneImg = {} as HTMLImageElement;
    
    // Create tutorial instance
    tutorial = new WordPuzzleTutorial({
      context: mockContext,
      width: canvasWidth,
      height: canvasHeight,
      stoneImg: mockStoneImg,
      stonePositions: [...sampleStonePositions]
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('constructor', () => {
    it('should create an instance with proper initialization', () => {
      // Instead of checking instanceof, check for expected methods and properties
      expect(tutorial.drawTutorial).toBeDefined();
      expect(tutorial.dispose).toBeDefined();
      expect(tutorial.initializeStoneAnimation).toBeDefined();
      expect(tutorial['isInitialized']).toBe(true);
      expect(tutorial['stonePositions'].length).toBe(sampleStonePositions.length);
      expect(tutorial['currentStoneIndex']).toBe(0);
    });
    
    it('should initialize with empty stone positions', () => {
      const emptyTutorial = new WordPuzzleTutorial({
        context: mockContext,
        width: canvasWidth,
        height: canvasHeight,
        stoneImg: mockStoneImg,
        stonePositions: []
      });
      
      expect(emptyTutorial['isInitialized']).toBe(true);
      expect(emptyTutorial['stonePositions'].length).toBe(0);
    });
  });
  
  describe('drawTutorial', () => {
    it('should not draw if not initialized', () => {
      // Force tutorial to be uninitialized
      tutorial['isInitialized'] = false;
      
      tutorial.drawTutorial(0.016);
      expect(mockContext.drawImage).not.toHaveBeenCalled();
    });
    
    it('should update frame and eventually call animateStoneDrag', () => {
      // Set up the necessary state for animation
      (tutorial as any).stonePosDetailsType = {
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
        monsterStoneDifference: 100,
        animateImagePosVal: {
          dx: 1,
          dy: 1,
          absdx: 1,
          absdy: 1,
          x: 100,
          y: 100
        }
      };
      
      // Initial state
      expect(tutorial['frame']).toBe(0);
      expect(tutorial['animationStartTime']).toBe(0);
      
      // First draw call
      tutorial.drawTutorial(0.016);
      
      // Manually set the animation state to trigger animateWordPuzzleStoneDrag
      (tutorial as any).frame = 100;
      (tutorial as any).animationStartDelay = performance.now() - 600; // More than 500ms delay
      
      // Set up the mock for animateWordPuzzleStoneDrag
      const animateWordPuzzleStoneDragMock = jest.fn();
      (tutorial as any).animateWordPuzzleStoneDrag = animateWordPuzzleStoneDragMock;
      
      // This call should trigger animateWordPuzzleStoneDrag
      tutorial.drawTutorial(0.016);
      
      // Verify animateWordPuzzleStoneDrag was called
      expect(animateWordPuzzleStoneDragMock).toHaveBeenCalled();
    });
  });
  
  describe('initializeStoneAnimation', () => {
    it('should set up animation properties for the current stone', () => {
      tutorial.initializeStoneAnimation(1);
      expect(tutorial['currentStoneIndex']).toBe(1);
      expect(tutorial['frame']).toBe(0);
      expect(tutorial['animationStartTime']).toBe(0);
      expect(tutorial['animationCompleted']).toBe(false);
    });
    
    it('should handle invalid stone indices gracefully', () => {
      const originalIndex = tutorial['currentStoneIndex'];
      
      // Try to initialize with invalid index
      tutorial.initializeStoneAnimation(-1);
      expect(tutorial['currentStoneIndex']).toBe(originalIndex);
      
      tutorial.initializeStoneAnimation(999);
      expect(tutorial['currentStoneIndex']).toBe(originalIndex);
    });
  });
  
  describe('dispose', () => {
    it('should reset state on dispose', () => {
      // Set some state
      tutorial['frame'] = 50;
      tutorial['animationStartTime'] = 1000;
      tutorial['isInitialized'] = true;
      
      // Dispose
      tutorial.dispose();
      
      // Check state is reset
      expect(tutorial['isInitialized']).toBe(false);
      expect(tutorial['frame']).toBe(0);
      expect(tutorial['animationStartTime']).toBe(0);
      expect(tutorial['currentStoneIndex']).toBe(0);
    });
  });
});
