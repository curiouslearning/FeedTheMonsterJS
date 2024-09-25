

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
    private currentHolding: string;

    constructor(levelData, puzzleNumber) {
        this.levelData = levelData;
        this.puzzleNumber = puzzleNumber;
        this.groupedLetters = [];
        this.hideLetters = [];
        this.droppedLetters = '';
        this.currentHolding = '';
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
        this.currentHolding = '';
        this.groupedLetters = [];
        this.hideLetters = [];
    }

    clearAllValues(){
        this.clearPickedUp();
        this.droppedLetters = '';
        this.puzzleNumber = 0;
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
        this.currentHolding = letter;
        this.hideLetters = [...this.groupedLetters]; //Hide the previous letters except the new one.
        this.groupedLetters.push(letter);
        console.log('this.groupedLetters ', this.groupedLetters)
    }


}