import BasePuzzleLogic from '../basePuzzleLogic/basePuzzleLogic';

export default class WordPuzzleLogic extends BasePuzzleLogic {
    /**
        puzzleNumber - Puzzle stage level of current (Up to 5 stage levels) game level.
        groupedLetters - String sequence of letters when performing the multi-letter seleciton.
        droppedLetters - String sequence of letters when group of letters was fed to the monster.
        groupedObj - Object with key properties of stone letter index, used for validating duplicate letters while hovering.
        droppedHistory - Object with key properties of stone letter index that was fed to the monster.
                        Used to preserve the list for hiding the stone letters.
        hideListObj - Object with key properties of stone letter index.
                    Used to hide stones that is part of the group or stones that was already fed to the monster.
    **/
    private groupedLetters: string;
    private droppedLetters: string;
    private groupedObj: {} | { [key:number]: string };
    private droppedHistory: {} | { [key:number]: string };
    private hideListObj: {} | { [key:number]: string };

    constructor(levelData, puzzleNumber) {
        super(levelData, puzzleNumber);
        this.groupedLetters = '';
        this.droppedLetters = '';
        this.groupedObj = {};
        this.droppedHistory = {};
        this.hideListObj = {};
    }

    override getValues(): {
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

    override updatePuzzleLevel(puzzleNumber: number):void {
        this.clearAllValues();
        super.updatePuzzleLevel(puzzleNumber);
    }

    override clearPickedUp():void {
        this.groupedLetters = '';
        this.groupedObj = {};
        this.hideListObj = { ...this.droppedHistory };
    }

    private clearAllValues():void {
        this.groupedLetters = '';
        this.droppedLetters = '';
        this.groupedObj = {};
        this.droppedHistory = {};
        this.hideListObj = {};
    }

    override validateShouldHideLetter(foilStoneIndex):boolean {
        //If stone key index is listed in hideListObj it should not be drawn.
        return this.hideListObj[foilStoneIndex] === undefined;
    }

    override handleCheckHoveredStone(foilStoneText:string, foilStoneIndex:number):boolean {
        const combinedLetters = this.groupedLetters;
        const targetWord = this.getTargetText();

        /* Goes inside here if there are no previous letter(s) were dropped
        and grouping of letters starts in a incorrect letter. */
        if ((!this.droppedLetters.length && targetWord[0] !== combinedLetters[0])) {
            return false;
        }

        /*
        isLetterAlreadyAdded - If the new stone text is NOT already included
        isSameLetterUnique -If there is already of the same letter exist in group, validate using uniqe identifier which is the array index key in group object.
        */
        const isLetterAlreadyAdded = !combinedLetters.includes(foilStoneText);
        const isSameLetterUnique = !this.groupedObj[foilStoneIndex];
        const isMatchTargetWord = targetWord.includes(`${this.droppedLetters}${combinedLetters}${foilStoneText}`);

        return isMatchTargetWord && (isLetterAlreadyAdded || isSameLetterUnique);
    }

    validateFedLetters():boolean {
        const targetWord = this.getTargetText();
        return targetWord.startsWith(this.droppedLetters);
    }

    override validatePuzzleCompletion():boolean {
        const targetWord = this.getTargetText();
        return this.droppedLetters === targetWord;
    }

    override setGroupToDropped():void {
        // Update dropped letters with the current grouped letters
        this.droppedLetters += this.groupedLetters;
        
        // Update dropped history with the current grouped object
        this.droppedHistory = {
            ...this.droppedHistory,
            ...this.groupedObj
        };
        
        // Clear the grouped letters after dropping
        this.groupedLetters = '';
        this.groupedObj = {};
    }

    override setPickUpLetter(letter: string, arrFoilStoneIndex: number):void {
        this.hideListObj = {
            ...this.hideListObj,
            ...this.groupedObj
        }; //Hide the previous letters except the new one.
        this.groupedLetters = `${this.groupedLetters}${letter}`;
        this.groupedObj[arrFoilStoneIndex] = letter;
    }

    /**
     * Checks if the dropped stone letter is correct
     * @param droppedStone - The letter or word that was dropped
     * @param isWord - Whether this is a word puzzle
     * @returns boolean indicating if the dropped letter/word is correct
     */
    override isLetterDropCorrect(droppedStone: string, isWord: boolean = false): boolean {
        const targetWord = this.getTargetText();
        if (isWord) {
            return droppedStone === targetWord.substring(0, droppedStone.length);
        } else {
            // For single letter puzzles - not typically used in Word puzzles
            return targetWord.includes(droppedStone);
        }
    }

    /**
     * Gets the correct target stone/word
     * @returns string - The correct target stone/word
     */
    override getCorrectTargetStone(): string {
        return this.getTargetText();
    }

    /**
     * Handles picking up a stone in a word puzzle (multi-letter/grouping logic).
     * @param x - X coordinate
     * @param y - Y coordinate
     * @param stoneHandler - The stone handler instance
     * @returns The picked stone object or null
     */
    override handlePickStoneUp(x: number, y: number, stoneHandler: any): any {
        // For word puzzles, use the same logic as before but allow for multi-letter grouping if needed.
        // This can be extended for advanced word puzzle logic as required.
        return stoneHandler.handlePickStoneUp(x, y);
    }

    /**
     * Handles moving a picked stone in a word puzzle (multi-letter/grouping logic).
     * @param event - The mouse or touch event
     * @param pickedStone - The currently picked stone
     * @param pickedStoneObject - The original picked stone object
     * @param stoneHandler - The stone handler instance
     * @param sceneWidth - The width of the scene (for reset logic)
     * @returns { pickedStone, pickedStoneObject, trailX, trailY }
     */
    override handleStoneMove(event: any, pickedStone: any, pickedStoneObject: any, stoneHandler: any, sceneWidth: number) {
        // Move the stone visually
        const newStoneCoordinates = stoneHandler.handleMovingStoneLetter(
            pickedStone,
            event.clientX,
            event.clientY
        );
        let trailX = newStoneCoordinates.x;
        let trailY = newStoneCoordinates.y;
        let newPickedStone = newStoneCoordinates;
        let newPickedStoneObject = pickedStoneObject;

        // Handle hovering/grouping logic for word puzzles
        const newStoneLetter = stoneHandler.handleHoveringToAnotherStone(
            trailX,
            trailY,
            (foilStoneText, foilStoneIndex) => {
                return this.handleCheckHoveredStone(foilStoneText, foilStoneIndex);
            }
        );

        if (newStoneLetter) {
            this.setPickUpLetter(
                newStoneLetter?.text,
                newStoneLetter?.foilStoneIndex
            );

            newPickedStone = stoneHandler.resetStonePosition(
                sceneWidth,
                newPickedStone,
                newPickedStoneObject
            );

            // After resetting its original position replace it with the new letter.
            newPickedStoneObject = newStoneLetter;
            newPickedStone = newStoneLetter;
        }

        return {
            pickedStone: newPickedStone,
            pickedStoneObject: newPickedStoneObject,
            trailX,
            trailY
        };
    }

    /**
     * Handles drawing stones for word puzzles (multi-letter/grouping logic).
     * @param deltaTime - Animation delta time
     * @param stoneHandler - The stone handler instance
     */
    override drawStones(deltaTime: number, stoneHandler: any): void {
        const { groupedObj } = this.getValues();
        stoneHandler.drawWordPuzzleLetters(
            deltaTime,
            (foilStoneIndex) => {
                return this.validateShouldHideLetter(foilStoneIndex);
            },
            groupedObj
        );
    }
}
