import { GameScore } from '@data';
import { AssessmentLevelState } from './assessment-level-state';

jest.mock('@data', () => ({
  GameScore: {
    getAllGameLevelInfo: jest.fn(),
  },
}));

describe('AssessmentLevelState', () => {
  beforeEach(() => {
    localStorage.clear();
    (GameScore.getAllGameLevelInfo as jest.Mock).mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not show when level is already completed in game progression', () => {
    (GameScore.getAllGameLevelInfo as jest.Mock).mockReturnValue([
      { levelNumber: 2, starCount: 1 },
    ]);

    const state = new AssessmentLevelState({ language: 'english' });

    expect(state.shouldShowForLevel(2)).toBe(false);
  });

  it('should not show when assessment is already completed for level', () => {
    const state = new AssessmentLevelState({ language: 'english' });

    state.markAssessmentCompletedForLevel(3);

    expect(state.isAssessmentCompletedForLevel(3)).toBe(true);
    expect(state.shouldShowForLevel(3)).toBe(false);
  });

  it('should show when assessment is not completed and level is not completed', () => {
    const state = new AssessmentLevelState({ language: 'english' });

    expect(state.shouldShowForLevel(4)).toBe(true);
  });

  it('should keep completion state language-scoped', () => {
    const englishState = new AssessmentLevelState({ language: 'english' });
    const zuluState = new AssessmentLevelState({ language: 'zulu' });

    englishState.markAssessmentCompletedForLevel(1);

    expect(englishState.isAssessmentCompletedForLevel(1)).toBe(true);
    expect(zuluState.isAssessmentCompletedForLevel(1)).toBe(false);
  });
});
