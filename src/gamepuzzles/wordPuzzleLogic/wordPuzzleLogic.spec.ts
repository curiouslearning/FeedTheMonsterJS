import WordPuzzleLogic from './wordPuzzleLogic';

describe('WordPuzzleLogic', () => {
  let logic: WordPuzzleLogic;
  const mockLevelData = { puzzles: [{}, {}, {}], levelMeta: { levelNumber: 1, levelType: 'Word' } };
  beforeEach(() => {
    logic = new WordPuzzleLogic(mockLevelData, 0);
  });

  it('should instantiate with correct initial state', () => {
    expect(logic).toBeDefined();
    expect(typeof logic.updatePuzzleLevel).toBe('function');
  });

  it('should update puzzle level', () => {
    logic.updatePuzzleLevel(2);
    // WordPuzzleLogic does not expose currentPuzzleIndex, so check via getValues (indirectly)
    // We expect that after update, getTargetWord() will use the new puzzleNumber (private),
    // so we can check that groupedObj is reset (empty) as a proxy for reset state.
    expect(logic.getValues().groupedObj).toEqual({});
  });

  it('should return values from getValues()', () => {
    const values = logic.getValues();
    expect(values).toHaveProperty('groupedObj');
    expect(values).toHaveProperty('droppedLetters');
  });
});
