export default class WordPuzzleLogic {
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
                foilStones: string[];
                prompt: {
                    promptAudio: string;
                    promptText: string;
                };
                segmentNumber: number;
                targetStones: string[];
            }
        ];
    }
    private puzzleNumber: number;
    private groupedLetters: string;
    private droppedLetters: string;
    private groupedObj: {} | { [key:number]: string };
    private droppedHistory: {} | { [key:number]: string };
    private hideListObj: {} | { [key:number]: string };

    constructor(levelData, puzzleNumber) {
        this.levelData = levelData;
        this.puzzleNumber = puzzleNumber;
        this.groupedLetters = '';
        this.droppedLetters = '';
        this.groupedObj = {};
        this.droppedHistory = {};
        this.hideListObj = {};
    }

    private getTargetWord():string {
        return this.levelData.puzzles[this.puzzleNumber]?.prompt?.promptText;
    }

    getValues(): {
        groupedLetters: string;
        droppedLetters: string;
        groupedObj: { [key:number]: string },
        droppedHistory: { [key:number]: string },
        hideListObj: { [key:number]: string },
    } {
        return {
            groupedLetters: `${this.groupedLetters}`,
            droppedLetters: `${this.droppedLetters}`,
            groupedObj: { ...this.groupedObj },
            droppedHistory: { ...this.droppedHistory },
            hideListObj: { ...this.hideListObj },
        }
    }

    checkIsWordPuzzle():boolean {
        return this.levelData?.levelMeta?.levelType === 'Word';
    }

    updatePuzzleLevel(puzzleNumber: number):void {
        this.clearAllValues();
        this.puzzleNumber = puzzleNumber;
    }

    clearPickedUp():void {
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
        this.puzzleNumber = 0;
    }

    validateShouldHideLetter(foilStoneIndex):boolean {
        //If stone key index is listed in hideListObj it should not be drawn.
        return !this.hideListObj[foilStoneIndex];
    }

    handleCheckHoveredStone(foilStoneText:string, foilStoneIndex: number):boolean {
        const combinedLetters = this.groupedLetters;
        const targetWord = this.getTargetWord();

        /* Goes inside here if there are no previous letter(s) were dropped
        and grouping of letters starts in a incorrect letter. */
        if ((!this.droppedLetters.length && targetWord[0] !== combinedLetters[0])) {
            return false;
        }

        /*
        isLetterAlreadyAdded - If the new stone text is NOT already included and stone text is part of targeted word.
        isSameLetterUnique -If there is already of the same letter exist in group, validate using uniqe identifier which is the array index key in group object.
        */
        const isLetterAlreadyAdded = !combinedLetters.includes(foilStoneText) && targetWord.includes(`${combinedLetters}${foilStoneText}`);
        const isSameLetterUnique = !this.groupedObj[foilStoneIndex]
        return  isLetterAlreadyAdded|| isSameLetterUnique;
    }

    validateFedLetters():boolean {
        const targetWord = this.getTargetWord();
        return this.droppedLetters === targetWord.substring(0, this.droppedLetters.length);
    }

    validateWordPuzzle():boolean {
        const targetWord = this.getTargetWord();
        return this.droppedLetters === targetWord;
    }

    setGroupToDropped():void {
        this.droppedLetters = `${this.droppedLetters}${this.groupedLetters}`;
        this.droppedHistory = {
            ...this.droppedHistory,
            ...this.groupedObj
        };
    }

    setPickUpLetter(letter: string, arrFoilStoneIndex: number):void {
        this.hideListObj = {
            ...this.hideListObj,
            ...this.groupedObj
        }; //Hide the previous letters except the new one.
        this.groupedLetters = `${this.groupedLetters}${letter}`;
        this.groupedObj[arrFoilStoneIndex] = letter;
    }
}