import { LevelIndicators } from '@components/level-indicator/level-indicator';
import LevelFieldComponent from '../level-field/level-field-component';
import gameStateService from '@gameStateService';

jest.mock('../level-field/level-field-component', () => {
  return jest.fn().mockImplementation(() => ({
    updateLevel: jest.fn(),
    destroy: jest.fn()
  }));
});

jest.mock('@gameStateService', () => ({
  EVENTS: {
    LOADPUZZLE: 'LOADPUZZLE'
  },
  subscribe: jest.fn()
}));

describe('LevelIndicators', () => {
  let levelIndicator: LevelIndicators;
  let mockLevelFieldComponent: jest.Mocked<LevelFieldComponent>;
  let subscribeCallback: Function;
  let unsubscribeMock: jest.Mock;

  beforeEach(() => {
    unsubscribeMock = jest.fn();

    (gameStateService.subscribe as jest.Mock).mockImplementation(
      (_event, callback) => {
        subscribeCallback = callback;
        return unsubscribeMock;
      }
    );

    levelIndicator = new LevelIndicators();
    mockLevelFieldComponent = levelIndicator['levelBarIndicator'] as jest.Mocked<LevelFieldComponent>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LOADPUZZLE subscription behavior', () => {
    it('should update level when LOADPUZZLE event is published', () => {
      const mockEventData = {
        detail: {
          counter: 5,
          levelSegmentResult: true
        }
      };

      // Simulate PubSub event
      subscribeCallback(mockEventData);

      expect(mockLevelFieldComponent.updateLevel).toHaveBeenCalledWith(5);
    });

    it('should NOT update level if levelSegmentResult is false', () => {
      const mockEventData = {
        detail: {
          counter: 5,
          levelSegmentResult: false
        }
      };

      subscribeCallback(mockEventData);

      expect(mockLevelFieldComponent.updateLevel).not.toHaveBeenCalled();
    });
  });

  describe('cleanup behavior', () => {
    it('should unsubscribe from LOADPUZZLE and destroy level indicator', () => {
      levelIndicator.dispose();

      expect(unsubscribeMock).toHaveBeenCalled();
      expect(mockLevelFieldComponent.destroy).toHaveBeenCalled();
    });
  });
});
