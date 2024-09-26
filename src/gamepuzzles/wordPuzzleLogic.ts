

export default class WordPuzzleLogic {
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
    public groupedLetters: string[];
    public hideLetters: string[];
    public droppedLetters: string;

    constructor(levelData, puzzleNumber) {
        this.levelData = levelData;
        this.puzzleNumber = puzzleNumber;
        this.groupedLetters = [];
        this.hideLetters = [];
        this.droppedLetters = '';
    }

    private getTargetWord(){
        return this.levelData.puzzles[this.puzzleNumber]?.prompt?.promptText;
    }

    getCombinedLetters() {
        return this.groupedLetters.length ? this.groupedLetters.join('') : '';
    }

    checkIsWordPuzzle() {
        return this.levelData?.levelMeta?.levelType === 'Word';
    }

    updatePuzzleLevel(puzzleNumber: number) {
        this.clearAllValues();
        this.puzzleNumber = puzzleNumber;
    }

    clearPickedUp(){
        this.groupedLetters = [];
        this.hideLetters = [ ...this.droppedLetters.split('')];
    }

    clearAllValues(){
        this.groupedLetters = [];
        this.hideLetters = [];
        this.droppedLetters = '';
        this.puzzleNumber = 0;
    }

    handleCheckHoveredStone(foilStoneText:string) {
        const combinedLetters = this.getCombinedLetters();
        const targetWord = this.getTargetWord();

        /* Goes inside here if there are no previous letter(s) were dropped
        and grouping of letters starts in a incorrect letter. */
        if (!this.droppedLetters.length //
            && targetWord[0] !== combinedLetters[0]) {
            return false;
        }

        return !combinedLetters.includes(foilStoneText) && targetWord.includes(`${combinedLetters}${foilStoneText}`);
    }

    validateFedLetters() {
        const targetWord = this.getTargetWord();
        return this.droppedLetters === targetWord.substring(0, this.droppedLetters.length);
    }

    validateWordPuzzle() {
        const targetWord = this.getTargetWord();
        return this.droppedLetters === targetWord;
    }

    setDroppedLetters(letters: string) {
        this.droppedLetters = `${this.droppedLetters}${letters}`;
    }

    setPickUpLetter(letter: string) {
        this.hideLetters = [...this.groupedLetters]; //Hide the previous letters except the new one.
        this.groupedLetters.push(letter);
        console.log('this.groupedLetters ', this.groupedLetters)
        console.log('this.hideLetters ', this.hideLetters)
    }


}