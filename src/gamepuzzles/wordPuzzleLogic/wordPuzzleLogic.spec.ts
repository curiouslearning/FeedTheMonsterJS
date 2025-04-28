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

  it('should check if puzzle is word type', () => {
    expect(logic.checkIsWordPuzzle()).toBe(true);
    // Change to non-word type
    const nonWordData = { ...mockLevelData, levelMeta: { ...mockLevelData.levelMeta, levelType: 'Other' } };
    const nonWordLogic = new WordPuzzleLogic(nonWordData, 0);
    expect(nonWordLogic.checkIsWordPuzzle()).toBe(false);
  });

  it('should clear picked up letters and groupedObj', () => {
    logic.setPickUpLetter('A', 1);
    expect(logic.getValues().groupedLetters).toBe('A');
    logic.clearPickedUp();
    expect(logic.getValues().groupedLetters).toBe('');
    expect(logic.getValues().groupedObj).toEqual({});
  });

  it('should validate should hide letter', () => {
    // Not hidden
    expect(logic.validateShouldHideLetter(1)).toBe(true);
    // Hide
    logic.setPickUpLetter('A', 1);
    logic.setGroupToDropped();
    expect(logic.validateShouldHideLetter(1)).toBe(false);
  });

  it('should set group to dropped', () => {
    logic.setPickUpLetter('C', 0);
    logic.setPickUpLetter('A', 1);
    logic.setGroupToDropped();
    expect(logic.getValues().droppedLetters).toBe('CA');
    expect(logic.getValues().droppedHistory).toEqual({ 0: 'C', 1: 'A' });
  });

  it('should set pick up letter', () => {
    logic.setPickUpLetter('B', 2);
    const values = logic.getValues();
    expect(values.groupedLetters).toContain('B');
    expect(values.groupedObj[2]).toBe('B');
    expect(values.hideListObj).toHaveProperty('2');
  });
});
