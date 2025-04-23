/**
 * Base class for all game puzzle logic
 * Provides common functionality and interface for different puzzle types
 */
export default abstract class BasePuzzleLogic {
  protected levelData: {
    levelNumber: number;
    levelMeta: {
      letterGroup: number;
      levelNumber: number;
      levelType: string;
      promptFadeOut: number;
      protoType: string;
    };
    puzzles: [
      {
        foilStones: string[];
        prompt: {
          promptAudio: string;
          promptText: string;
        };
        segmentNumber: number;
        targetStones: string[];
      }
    ];
  };
  protected puzzleNumber: number;

  constructor(levelData, puzzleNumber) {
    this.levelData = levelData;
    this.puzzleNumber = puzzleNumber;
  }

  /**
   * Updates the current puzzle level
   * @param puzzleNumber - The new puzzle number
   */
  updatePuzzleLevel(puzzleNumber: number): void {
    this.puzzleNumber = puzzleNumber;
  }

  /**
   * Gets the target text for the current puzzle
   * @returns The target text
   */
  protected getTargetText(): string {
    return this.levelData.puzzles[this.puzzleNumber]?.prompt?.promptText;
  }

  /**
   * Gets the puzzle type
   * @returns The puzzle type (e.g., "Word", "LetterOnly")
   */
  getPuzzleType(): string {
    return this.levelData?.levelMeta?.levelType;
  }

  /**
   * Checks if the puzzle is a word puzzle
   * @returns boolean indicating if this is a word puzzle
   */
  checkIsWordPuzzle(): boolean {
    return this.getPuzzleType() === 'Word';
  }

  /**
   * Gets values needed for rendering and game logic
   * Default implementation returns empty objects
   * Override in subclasses as needed
   */
  getValues(): any {
    return {
      groupedLetters: '',
      droppedLetters: '',
      groupedObj: {},
      droppedHistory: {},
      hideListObj: {}
    };
  }

  /**
   * Validates if a stone letter should be hidden
   * @param foilStoneIndex - The index of the foil stone
   * @returns boolean indicating if the stone should be hidden
   */
  validateShouldHideLetter(foilStoneIndex: number): boolean {
    return true; // Default implementation shows all stones
  }

  /**
   * Handles checking if a hovered stone should be added to the group
   * @param foilStoneText - The text of the hovered stone
   * @param foilStoneIndex - The index of the hovered stone
   * @returns boolean indicating if the stone should be added to the group
   */
  handleCheckHoveredStone(foilStoneText: string, foilStoneIndex: number): boolean {
    return false; // Default implementation doesn't allow hovering
  }

  /**
   * Sets a picked up letter
   * Default implementation does nothing
   * Override in subclasses as needed
   */
  setPickUpLetter(letter: string, arrFoilStoneIndex: number): void {
    // Default implementation does nothing
  }

  /**
   * Clears picked up letters
   * Default implementation does nothing
   * Override in subclasses as needed
   */
  clearPickedUp(): void {
    // Default implementation does nothing
  }

  /**
   * Sets grouped letters to dropped
   * Default implementation does nothing
   * Override in subclasses as needed
   */
  setGroupToDropped(): void {
    // Default implementation does nothing
  }

  /**
   * Validates if fed letters are correct
   * Default implementation returns false
   * Override in subclasses as needed
   */
  validateFedLetters(): boolean {
    return false;
  }

  /**
   * Validates if word puzzle is completed
   * Default implementation returns false
   * Override in subclasses as needed
   */
  validateWordPuzzle(): boolean {
    return this.validatePuzzleCompletion();
  }

  /**
   * Checks if the dropped stone letter is correct
   * @param droppedStone - The letter or word that was dropped
   * @param isWord - Whether this is a word puzzle
   * @returns boolean indicating if the dropped letter/word is correct
   */
  abstract isLetterDropCorrect(droppedStone: string, isWord?: boolean): boolean;

  /**
   * Gets the correct target stone/word
   * @returns string - The correct target stone/word
   */
  abstract getCorrectTargetStone(): string;

  /**
   * Checks if the puzzle is completed
   * @returns boolean indicating if the puzzle is completed
   */
  abstract validatePuzzleCompletion(): boolean;

  /**
   * Handles picking up a stone. Should be overridden by subclasses for puzzle-specific logic.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param stoneHandler - The stone handler instance
   * @returns The picked stone object or null
   */
  handlePickStoneUp(x: number, y: number, stoneHandler: any): any {
    // Default implementation for non-word puzzles (LetterOnly/LetterInWord)
    return stoneHandler.handlePickStoneUp(x, y);
  }

  /**
   * Handles moving a picked stone. Should be overridden by subclasses for puzzle-specific logic.
   * @param event - The mouse or touch event
   * @param pickedStone - The currently picked stone
   * @param pickedStoneObject - The original picked stone object
   * @param stoneHandler - The stone handler instance
   * @param sceneWidth - The width of the scene (for reset logic)
   * @returns { pickedStone, pickedStoneObject, trailX, trailY }
   */
  handleStoneMove(event: any, pickedStone: any, pickedStoneObject: any, stoneHandler: any, sceneWidth: number) {
    // Default: Letter puzzles - update coordinates directly
    let rect = stoneHandler.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pickedStone.x = x;
    pickedStone.y = y;
    return {
      pickedStone,
      pickedStoneObject,
      trailX: x,
      trailY: y
    };
  }

  /**
   * Handles drawing stones for the puzzle. Override in subclasses for custom drawing logic.
   * @param deltaTime - Animation delta time
   * @param stoneHandler - The stone handler instance
   */
  drawStones(deltaTime: number, stoneHandler: any): void {
    // Default: Letter puzzles, just call stoneHandler.draw
    stoneHandler.draw(deltaTime);
  }
}
