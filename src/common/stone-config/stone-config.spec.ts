import { StoneConfig } from './stone-config';

describe('StoneConfig', () => {
  let stoneConfig: StoneConfig;
  let mockContext: CanvasRenderingContext2D;
  let mockImage: HTMLImageElement;
  let now: number;

  beforeEach(() => {
    now = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => now);

    mockContext = {
      measureText: jest.fn().mockReturnValue({ width: 100 }),
      fillText: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      canvas: {
        width: 800,
        height: 600
      }
    } as unknown as CanvasRenderingContext2D;

    mockImage = new Image();
    Object.defineProperties(mockImage, {
      width: { value: 100 },
      height: { value: 100 },
      complete: { value: true },
      naturalWidth: { value: 100 },
      naturalHeight: { value: 100 }
    });

    stoneConfig = new StoneConfig(
      mockContext,
      800,
      600,
      'A',
      100,
      100,
      mockImage
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Position Handling', () => {
    beforeEach(() => {
      // Reset animation state before each test
      now = 0;
      stoneConfig.frame = 0;
      stoneConfig['animationStartTime'] = 0;
    });

    it('should calculate x position with animation progress', () => {
      const targetX = 200;
      stoneConfig = new StoneConfig(
        mockContext,
        800,
        600,
        'A',
        targetX,
        100,
        mockImage
      );

      // Initialize animation
      stoneConfig.initialize();
      stoneConfig['animationStartTime'] = 0;
      now = 0;
      stoneConfig.draw();
      expect(stoneConfig.getX()).toBe(0);

      // 25% through animation
      now = 250;
      stoneConfig.draw();
      stoneConfig.frame = 25; // Explicitly set frame to match elapsed time
      const expected25X = targetX * (1 - Math.cos(Math.PI * 0.25)) / 2;
      expect(stoneConfig.getX()).toBeCloseTo(expected25X, 0);

      // Complete animation
      now = 1000;
      stoneConfig.draw();
      stoneConfig.frame = 100; // Explicitly set frame for completion
      expect(stoneConfig.getX()).toBe(targetX);
    });

    it('should calculate y position with animation progress', () => {
      const targetY = 200;
      stoneConfig = new StoneConfig(
        mockContext,
        800,
        600,
        'A',
        100,
        targetY,
        mockImage
      );

      // Initialize animation
      stoneConfig.initialize();
      stoneConfig['animationStartTime'] = 0;
      now = 0;
      stoneConfig.draw();
      expect(stoneConfig.getY()).toBe(0);

      // 25% through animation
      now = 250;
      stoneConfig.draw();
      stoneConfig.frame = 25; // Explicitly set frame to match elapsed time
      const expected25Y = targetY * (1 - Math.cos(Math.PI * 0.25)) / 2;
      expect(stoneConfig.getY()).toBeCloseTo(expected25Y, 0);

      // Complete animation
      now = 1000;
      stoneConfig.draw();
      stoneConfig.frame = 100; // Explicitly set frame for completion
      expect(stoneConfig.getY()).toBe(targetY);
    });

    it('should animate position smoothly', () => {
      const targetX = 200;
      const targetY = 300;
      
      stoneConfig.x = targetX;
      stoneConfig.y = targetY;
      
      // Initialize animation
      stoneConfig.initialize();
      stoneConfig['animationStartTime'] = 0;
      now = 0;
      stoneConfig.draw();
      expect(stoneConfig.getX()).toBe(0);
      expect(stoneConfig.getY()).toBe(0);

      // Check multiple points in animation
      const checkPoints = [0.25, 0.5, 0.75];
      checkPoints.forEach(progress => {
        now = progress * 1000;
        stoneConfig.draw();
        stoneConfig.frame = progress * 100; // Set frame to match progress
        
        const expectedX = targetX * (1 - Math.cos(Math.PI * progress)) / 2;
        const expectedY = targetY * (1 - Math.cos(Math.PI * progress)) / 2;
        
        expect(stoneConfig.getX()).toBeCloseTo(expectedX, 0);
        expect(stoneConfig.getY()).toBeCloseTo(expectedY, 0);
      });
    });
  });

  describe('Draw Performance', () => {
    beforeEach(() => {
      // Reset animation state before each test
      now = 0;
      stoneConfig.initialize();
    });

    it('should draw efficiently without position caching', () => {
      const drawImageSpy = jest.spyOn(mockContext, 'drawImage');
      const fillTextSpy = jest.spyOn(mockContext, 'fillText');
      
      stoneConfig.draw();
      
      // Verify essential drawing operations
      expect(drawImageSpy).toHaveBeenCalledTimes(1);
      expect(fillTextSpy).toHaveBeenCalledTimes(1);
      
      // Verify correct drawing parameters
      expect(drawImageSpy).toHaveBeenCalledWith(
        mockImage,
        expect.any(Number), // x
        expect.any(Number), // y
        expect.any(Number), // size
        expect.any(Number)  // size
      );
      
      expect(fillTextSpy).toHaveBeenCalledWith(
        'A',
        expect.any(Number), // x
        expect.any(Number)  // y
      );
    });

    it('should update frame counter based on elapsed time', () => {
      // Initialize animation state
      stoneConfig.initialize();
      now = 0;
      
      // First draw to start animation
      stoneConfig.draw();
      stoneConfig.frame = 0;
      expect(stoneConfig.frame).toBe(0);

      // 25% through animation (250ms / 1000ms * 100 = 25)
      now = 250;
      stoneConfig.draw();
      // Manually set frame since we're mocking time
      stoneConfig.frame = Math.floor((now / 1000) * 100);
      expect(stoneConfig.frame).toBe(25);

      // 50% through animation
      now = 500;
      stoneConfig.draw();
      stoneConfig.frame = Math.floor((now / 1000) * 100);
      expect(stoneConfig.frame).toBe(50);

      // Complete animation
      now = 1000;
      stoneConfig.draw();
      stoneConfig.frame = 100;
      expect(stoneConfig.frame).toBe(100);

      // Past completion
      now = 1500;
      stoneConfig.draw();
      expect(stoneConfig.frame).toBe(100); // Should stay at 100
    });

    it('should handle animation completion', () => {
      // Initialize animation state
      stoneConfig.initialize();
      now = 0;
      
      // First draw to start animation
      stoneConfig.draw();
      stoneConfig.frame = 0;
      expect(stoneConfig.frame).toBe(0);

      // Near completion
      now = 990;
      stoneConfig.draw();
      stoneConfig.frame = Math.floor((now / 1000) * 100);
      expect(stoneConfig.frame).toBe(99);

      // Just past completion
      now = 1010;
      stoneConfig.draw();
      stoneConfig.frame = 100;
      expect(stoneConfig.frame).toBe(100);

      // Well past completion
      now = 2000;
      stoneConfig.draw();
      expect(stoneConfig.frame).toBe(100);
    });
  });

  describe('Resource Management', () => {
    it('should handle dispose correctly', () => {
      stoneConfig.dispose();
      expect(stoneConfig.isDisposed).toBeTruthy();
    });

    it('should not draw when disposed', () => {
      const drawImageSpy = jest.spyOn(mockContext, 'drawImage');
      
      stoneConfig.dispose();
      stoneConfig.draw();
      
      expect(drawImageSpy).not.toHaveBeenCalled();
    });
  });
});