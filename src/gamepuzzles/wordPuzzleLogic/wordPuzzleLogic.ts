/**
 * Handles all logic for Word and SoundWord puzzles.
 * Maintains state for grouped letters, dropped letters, and various tracking objects.
 */
export default class WordPuzzleLogic {
    /**
     * State tracking for Word puzzles:
     * - puzzleNumber: Current puzzle stage level (up to 5 stages per game level)
     * - groupedLetters: String sequence of letters when performing multi-letter selection
     * - droppedLetters: String sequence of letters fed to the monster
     * - groupedObj: Object with letter indices for validating duplicate letters while hovering
     * - droppedHistory: Object with letter indices that were fed to the monster
     * - hideListObj: Object with letter indices to hide (part of group or already fed)
     */
    private levelData: {
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
                foilLetters: string[];
                prompt: {
                    promptAudio: string;
                    promptText: string;
                };
                segmentNumber: number;
                targetLetters: string[];
            }
        ];
    }
    private puzzleNumber: number;
    private groupedLetters: string;
    private droppedLetters: string;
    private groupedObj: {} | { [key:number]: string };
    private droppedHistory: {} | { [key:number]: string };
    private hideListObj: {} | { [key:number]: string };

    /**
     * Creates a new WordPuzzleLogic instance
     * 
     * @param levelData The level data containing puzzle information
     * @param puzzleNumber The current puzzle number within the level
     */
    constructor(levelData, puzzleNumber) {
        this.levelData = levelData;
        this.puzzleNumber = puzzleNumber;
        this.groupedLetters = '';
        this.droppedLetters = '';
        this.groupedObj = {};
        this.droppedHistory = {};
        this.hideListObj = {};
    }

    /**
     * Gets the target word from the current puzzle
     */
    private getTargetWord(): string {
        return this.levelData.puzzles[this.puzzleNumber]?.prompt?.promptText;
    }

    /**
     * Returns all current state values
     */
    getValues(): {
        groupedLetters: string;
        droppedLetters: string;
        groupedObj: { [key:number]: string },
        droppedHistory: { [key:number]: string },
        hideListObj: { [key:number]: string },
    } {
        return {
            groupedLetters: this.groupedLetters,
            droppedLetters: this.droppedLetters,
            groupedObj: { ...this.groupedObj },
            droppedHistory: { ...this.droppedHistory },
            hideListObj: { ...this.hideListObj },
        }
    }

    /**
     * Checks if the current puzzle is a Word puzzle
     */
    checkIsWordPuzzle(): boolean {
        return this.levelData?.levelMeta?.levelType === 'Word';
    }

    /**
     * Updates the puzzle level and resets all values
     */
    updatePuzzleLevel(puzzleNumber: number): void {
        this.clearAllValues();
        this.puzzleNumber = puzzleNumber;
    }

    /**
     * Clears the currently picked up letters
     */
    clearPickedUp(): void {
        this.groupedLetters = '';
        this.groupedObj = {};
        this.hideListObj = { ...this.droppedHistory };
    }

    /**
     * Resets all state values
     */
    private clearAllValues(): void {
        this.groupedLetters = '';
        this.droppedLetters = '';
        this.groupedObj = {};
        this.droppedHistory = {};
        this.hideListObj = {};
        this.puzzleNumber = 0;
    }

    /**
     * Determines if a letter should be hidden
     * 
     * @param letterIndex The index of the letter to check
     * @returns false if the letter should be hidden, true otherwise
     */
    validateShouldHideLetter(letterIndex: number): boolean {
        // If letter key index is listed in hideListObj it should not be drawn
        return !this.hideListObj[letterIndex];
    }

    /**
     * Checks if a hovered letter can be added to the current group
     * 
     * @param letterText The text of the hovered letter
     * @param letterIndex The index of the hovered letter
     * @returns true if the letter can be added to the current group, false otherwise
     */
    handleCheckHoveredLetter(letterText: string, letterIndex: number): boolean {
        const combinedLetters = this.groupedLetters;
        const targetWord = this.getTargetWord();

        // If no letters were dropped yet and grouping starts with incorrect letter, reject
        if (!this.droppedLetters.length && targetWord[0] !== combinedLetters[0]) {
            return false;
        }

        // Validation checks:
        // 1. Is the letter already added to the group?
        const isLetterAlreadyAdded = !combinedLetters.includes(letterText);
        // 2. If same letter exists in group, is this instance unique by index?
        const isSameLetterUnique = !this.groupedObj[letterIndex];
        // 3. Does adding this letter still match the target word?
        const isMatchTargetWord = targetWord.includes(
            `${this.droppedLetters}${combinedLetters}${letterText}`
        );

        return isMatchTargetWord && (isLetterAlreadyAdded || isSameLetterUnique);
    }

    /**
     * Validates if the dropped letters match the beginning of the target word
     */
    validateFedLetters(): boolean {
        const targetWord = this.getTargetWord();
        return this.droppedLetters === targetWord.substring(0, this.droppedLetters.length);
    }

    /**
     * Validates if the puzzle is complete (all letters dropped correctly)
     */
    validateWordPuzzle(): boolean {
        const targetWord = this.getTargetWord();
        return this.droppedLetters === targetWord;
    }

    /**
     * Moves grouped letters to dropped letters
     */
    setGroupToDropped(): void {
        this.droppedLetters = `${this.droppedLetters}${this.groupedLetters}`;
        this.droppedHistory = {
            ...this.droppedHistory,
            ...this.groupedObj
        };
    }

    /**
     * Adds a letter to the current group
     * 
     * @param letter The letter to add
     * @param letterIndex The index of the letter
     */
    setPickUpLetter(letter: string, letterIndex: number): void {
        // Hide previous letters except the new one
        this.hideListObj = {
            ...this.hideListObj,
            ...this.groupedObj
        };
        
        // Add the new letter to the group
        this.groupedLetters = `${this.groupedLetters}${letter}`;
        this.groupedObj[letterIndex] = letter;
    }
}