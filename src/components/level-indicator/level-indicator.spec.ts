import { LevelIndicators } from '@components/level-indicator/level-indicator';
import LevelFieldComponent from '../level-field/level-field-component';

jest.mock('../level-field/level-field-component', () => {
  return jest.fn().mockImplementation(() => ({
    updateLevel: jest.fn(),
    destroy: jest.fn()
  }));
});

describe('Level Indicator Test', () => {
  let levelIndicator;
  let mockLevelFieldComponent;

  beforeEach(() => {
    levelIndicator = new LevelIndicators();
    mockLevelFieldComponent = new LevelFieldComponent();

    //Create mock LevelFieldComponent instance for levelIndicator.
    levelIndicator.levelBarIndicator = mockLevelFieldComponent;

    //Mock and spy on drop events during game play.
    jest.spyOn(levelIndicator, 'handleStoneDrop');
    jest.spyOn(levelIndicator, 'handleLoadPuzzle');
  });

  describe('Level indicators during game play.', () => {
    it('it should update game level every on after load puzzle.', () => {
      //Mock the event for the game play event.
      const mockEvent = new CustomEvent('loadpuzzle', { detail: { counter: 5, levelSegmentResult: true }});

      //Pass the sample mock data from the mock event to simualte the game play behavior after playing the level.
      levelIndicator.handleLoadPuzzle(mockEvent);

      // Ensure handleLoadPuzzle was called with the event
      expect(levelIndicator.handleLoadPuzzle).toHaveBeenCalledWith(mockEvent);

      // Ensure updateLevel was called with the counter value (5)
      expect(mockLevelFieldComponent.updateLevel).toHaveBeenCalledWith(5);
    });
  });

  describe('Level indicators during clean up', () => {
    it('should destroy the level field component ', () => {
      //Call the dispose for level indicator.
      levelIndicator.dispose();

      // Verify that the destroy method was called
      expect(mockLevelFieldComponent.destroy).toHaveBeenCalled();
    });
  });
});