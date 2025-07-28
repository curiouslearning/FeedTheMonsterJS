import { EventManager } from "@events";
import { Utils, VISIBILITY_CHANGE, isGameTypeAudio } from "@common";
import { AudioPlayer } from "@components";
import { PROMPT_TEXT_BG, AUDIO_PLAY_BUTTON } from "@constants";
import { BaseHTML, BaseHtmlOptions } from "../baseHTML/base-html";
import './prompt-text.scss';
import gameStateService from '@gameStateService';

// Default selectors for the prompt text component
export const DEFAULT_SELECTORS = {
    root: '#background', // The background element to append the prompt to
    promptText: '.prompt-text',
    promptBackground: '.prompt-background',
    promptPlayButton: '.prompt-play-button'
};

// HTML template for the prompt text component
export const PROMPT_TEXT_LAYOUT = (
    {   id,
        isLevelHaveTutorial,
        gamePrototype
    }: {
        id: string,
        isLevelHaveTutorial: boolean,
        gamePrototype: 'Hidden' | 'Visible';
    }) => {
    //If the game type is audio puzzle (audio button displayed instead of word or letter), we won't apply the bubble pulsate effect.
    const bubblePulsateStyle = isGameTypeAudio(gamePrototype) ? '' : 'floating-pulse';

    //If the game type is audio and it is the audio tutorial level then we apply the button pulsate effect for the button.
    const audioBtnPulsateStyle = isLevelHaveTutorial && isGameTypeAudio(gamePrototype) ? 'pulsing' : '';

    return (`
        <div id="${id}" class="prompt-container ">
            <div
                id="prompt-background"
                class="prompt-background ${bubblePulsateStyle} "
                style="background-image: url(${PROMPT_TEXT_BG})"
            >
                <div id="prompt-text-button-container">
                    <div id="prompt-text" class="prompt-text"></div>

                    <!-- Wrap button and slots vertically -->
                    <div class="prompt-button-slots-wrapper">
                        <div id="prompt-play-button"
                            class="prompt-play-button ${audioBtnPulsateStyle}"
                            style="background-image: url(${AUDIO_PLAY_BUTTON}); pointer-events: auto;">
                        </div>
                        <div id="prompt-slots" class="prompt-slots"></div>
                    </div>
                </div>
            </div>
        </div>
    `);
};

/**
 * Represents a prompt text component.
 */
export class PromptText extends BaseHTML {
    // ...
    public width: number;
    public levelData: any;
    public currentPromptText: string;
    public currentPuzzleData: any;
    public targetStones: (string | { StoneText: string })[];
    public rightToLeft: boolean;
    public audioPlayer: AudioPlayer;
    public currentActiveLetterIndex : number = 0;
    public isAppForeground: boolean = true;
    public AUTO_PROMPT_INITIAL_DELAY_MS: number;
    private isAutoPromptPlaying: boolean = false;
    private isLevelHaveTutorial: boolean = false;

    // HTML elements for the prompt
    public promptContainer: HTMLDivElement;
    public promptBackground: HTMLDivElement;
    public promptTextElement: HTMLDivElement;
    public promptPlayButtonElement: HTMLDivElement;
    public promptSlotElement: HTMLDivElement;
    private eventManager: EventManager;

    private onClickCallback?: () => void;
    private unsubscribeSubmittedLettersEvent: () => void;

    /**
     * Initializes a new instance of the PromptText class.
     * @param width The width of the component.
     * @param height The height of the component.
     * @param currentPuzzleData The current puzzle data.
     * @param levelData The level data.
     * @param rightToLeft Whether the text is right-to-left.
     */
    constructor(
        width: number,
        currentPuzzleData: any,
        levelData: any,
        rightToLeft: boolean,
        id: string = 'prompt-container',
        options: BaseHtmlOptions = { selectors: DEFAULT_SELECTORS },
        isLevelHaveTutorial: boolean,
        onClickCallback?: () => void,
    ) {
        super(
            options,
            id,
            (id: string) => PROMPT_TEXT_LAYOUT({
                id,
                isLevelHaveTutorial,
                gamePrototype: levelData.levelMeta.protoType //Determines if the game is audio puzzle type or not.
            })
        );

        // Create event manager for handling events
        this.eventManager = new EventManager({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        });

        this.width = width;
        this.levelData = levelData;
        this.rightToLeft = rightToLeft;
        this.currentPromptText = currentPuzzleData.prompt.promptText;
        this.currentPuzzleData = currentPuzzleData;
        this.targetStones = this.currentPuzzleData.targetStones;
        this.isLevelHaveTutorial = isLevelHaveTutorial;
        this.audioPlayer = new AudioPlayer();
        this.audioPlayer.preloadPromptAudio(this.getPromptAudioUrl());
        document.addEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
        this.setPromptInitialAudioDelayValues(isLevelHaveTutorial); //Set initial auto audio play timing.
        this.initializeHtmlElements(id); // Initialize HTML elements
        this.handleAutoPromptPlay();
        this.onClickCallback = onClickCallback;
        this.autoRemoveButtonPulse();

        // Subscribe to submitted letters count updates.
        // droppedLetterCount represents the number of letters already solved,
        // so we assign it to currentActiveLetterIndex to reflect the next letter
        // that should be styled as active in the prompt display.
        this.unsubscribeSubmittedLettersEvent = gameStateService.subscribe(
            gameStateService.EVENTS.WORD_PUZZLE_SUBMITTED_LETTERS_COUNT,
            (droppedLetterCount: number) => {
                this.currentActiveLetterIndex = droppedLetterCount;
                //Update the prompt text that reflects the next active letter.
                this.generateTextMarkup();
            }
        );
    }

    private setPromptInitialAudioDelayValues(isTutorialOn: boolean = false) {
        //Delay the initial auto prompt play; For any level with tutorial, 3 seconds delay and 1.9 for normal.
        this.AUTO_PROMPT_INITIAL_DELAY_MS = isTutorialOn ? 3000 : 1910;
    }

    private removePulseClassIfSpellMatchTutorial() {
        if (this.isLetterSoundMatchTutorial() || this.isSpellSoundMatchTutorial()) {
            const playButton = document.getElementById("prompt-play-button");
            if (playButton?.classList.contains("pulsing")) {
                playButton.classList.remove("pulsing");
            }
        }
    }

    private autoRemoveButtonPulse() {
        if (this.isLetterSoundMatchTutorial() || this.isSpellSoundMatchTutorial()) {
            //Audio tutorial duration is 6 seconds to interact with the prompt.
            const totalAudioTutorialDuration = this.AUTO_PROMPT_INITIAL_DELAY_MS + 3000;
            setTimeout(() => {
                this.removePulseClassIfSpellMatchTutorial();
            }, totalAudioTutorialDuration);
        }
    }

    //Adjust font size based on current prompt value.
    private updatePromptFontSize() {
        this.promptTextElement.style.fontSize = `${this.calculateFont()}px`;
    }

    /**
     * Initializes the HTML elements for the prompt text component.
     */
    public initializeHtmlElements(containerId: string) {
        // Get references to the created elements
        this.promptContainer = document.getElementById(containerId) as HTMLDivElement;
        this.promptBackground = this.promptContainer.querySelector('#prompt-background') as HTMLDivElement;
        this.promptTextElement = this.promptContainer.querySelector('#prompt-text') as HTMLDivElement;
        this.promptPlayButtonElement = this.promptContainer.querySelector('#prompt-play-button') as HTMLDivElement;
        this.promptSlotElement = this.promptContainer.querySelector('#prompt-slots') as HTMLDivElement;

        if (this.isSpellSoundMatchTutorial()) {
            // Patch fix: Apply 'prompt-bubble-custom' to override prompt background dimensions
            // for Spell Sound tutorial layout. This ensures the audio button and slot text
            // fit properly inside the bubble. Not a scalable solution — revisit if reused elsewhere.
            this.promptBackground.classList.add('prompt-bubble-custom');
        }

        // Update event listeners to include the callback
        const handleClick = (e: Event) => {
            this.isAutoPromptPlaying = true; //stop auto prompt replay
            this.removePulseClassIfSpellMatchTutorial();

            this.audioPlayer.handlePlayPromptAudioClickEvent();
            if (this.onClickCallback) {
                this.onClickCallback();
            }
            e.stopPropagation();
        };

        // Add event listeners to all prompt elements
        this.promptPlayButtonElement.addEventListener('click', handleClick);
        this.promptBackground.addEventListener('click', handleClick);
        this.promptTextElement.addEventListener('click', handleClick);

        this.updatePromptFontSize();// Set initial font size
        this.generateTextMarkup();
    }

    /**
     * Gets the prompt audio URL.
     * @returns The prompt audio URL.
     */
    public getPromptAudioUrl = (): string => {
        return Utils.getConvertedDevProdURL(this.currentPuzzleData.prompt.promptAudio);
    }

    private cleanPromptText() {
        // Clear previous content
        if(this.promptTextElement) {
            this.promptTextElement.innerHTML = '';
        };
    }

    /**
     * Updates the visibility of the prompt play button and text element.
     * @param showButton Whether to show the play button (and hide the text).
     */
    setPromptButtonVisible(showButton: boolean) {
        this.promptPlayButtonElement.style.display = showButton ? 'block' : 'none';
        this.promptTextElement.style.display = showButton ? 'none' : 'block';
    }

    generatePromptSlots() {
        if (!this.promptSlotElement) return;

        this.promptSlotElement.innerHTML = ""; // Clear any previous slots

        //Create slots based on number of target letters.
        [...this.targetStones].forEach((letter, index) => {
            const slot: any = document.createElement("div");
            slot.classList.add("slot");

            //If index of the char is less than the active letter index. It means letter should be revealed.
            if (index < this.currentActiveLetterIndex) {
                const isRevealed: (string | { StoneText: string }) = this.targetStones?.[index];

                slot.textContent = isRevealed; // Show the letter
                slot.classList.add("revealed-letter");
            } else {
                slot.textContent = "_"; // Show underscore
            }

            this.promptSlotElement.appendChild(slot);
        });
    }


    /**
     * Generates HTML markup for a prompt word with dynamic letter styling.
     *
     * Behavior:
     * - activeLetter (at activeLetterIndex) always gets pulsing style across both puzzle types.
     * - For spelling puzzles:
     *   - All letters are wrapped in spans.
     *   - Letters before/at activeLetterIndex show as black (solved).
     *   - Letters after activeLetterIndex show as red (unsolved).
     * - For letter-only puzzles:
     *   - Only activeLetter is styled; other letters remain unwrapped.
     */
    createWordText({
        promptWord,
        activeLetter,
        isSpellingPuzzle = false,
        activeLetterIndex
    }: {
        promptWord: string, // Full word or single letter.
        isSpellingPuzzle: boolean,
        activeLetter: string,
        activeLetterIndex: number // Typically starts at 0.
    }): string {
        // Wraps a letter in a styled span element.
        const generateSpanMarkup = (letter: string, styleClass: string) => {
            return `<span class="${styleClass}">${letter}</span>`;
        }

        const wordCharArray = [...promptWord].map(
            (letter, index) => {
                let styleClass: string | null = null;

                if (letter === activeLetter && index === activeLetterIndex) {
                    styleClass = 'text-red-pulse-letter';
                } else if (isSpellingPuzzle){
                    styleClass = activeLetterIndex < index ? 'text-red' : "text-black";
                }

                //If styleClass is null, generate letter only text. But for any word puzzle or target letter generate span markup.
                return styleClass ? generateSpanMarkup(letter, styleClass) : letter;
        });
        const wordTextMarkup = wordCharArray.join('');
        return wordTextMarkup;
    }

    /**
     * Extracts the target letter from a stone reference.
     *
     * Accepts either:
     * - A plain string (already representing the letter).
     * - An object with a StoneText property (from structured stone data).
     *
     * @param targetStone - Either a letter string or an object containing StoneText.
     * @returns The target letter as a string.
     */
    private getTargetLetter(targetStone: string | { StoneText: string }): string {
        // If targetStone is already a string, return it directly.
        if (typeof targetStone === 'string') {
            return targetStone;
        }

        // Otherwise, extract the StoneText property from the object.
        return targetStone.StoneText;
    }

    /**
     * Creates a span wrapper with layout styles for prompt display.
     * @param direction - CSS text direction: 'rtl' (right-to-left) or 'ltr' (left-to-right).
     * @returns Configured span element.
     */
    private createWrapper(cssDirection: string) {
        const wrapper = document.createElement('span');
        wrapper.className = 'text-black';
        wrapper.style.direction = cssDirection;
        wrapper.style.textAlign = 'center';
        wrapper.style.width = '100%';
        wrapper.style.display = 'inline-block';

        return wrapper;
    }

    /**
    * Generates and updates the prompt text markup with appropriate styling and layout.
    */
    private generateTextMarkup() {
        const cssDirection = this.rightToLeft ? 'rtl' : 'ltr'; //Determines the CSS direction style.
        const { levelType, protoType } = this.levelData.levelMeta;
        this.cleanPromptText();
        this.promptTextElement.style.direction = cssDirection;
        this.promptTextElement.setAttribute('dir', cssDirection);

        // Handle special types where only the play button is shown
        if (protoType === "Hidden") {
            // Show play button instead of text for audioPlayerWord levelType or hidden prototypes
            this.setPromptButtonVisible(true);
            this.isSpellSoundMatchTutorial() && this.generatePromptSlots();
            return;
        }

        const wrapper = this.createWrapper(cssDirection);
        const targetLetterText = this.getTargetLetter(this.targetStones[this.currentActiveLetterIndex]);
        const isSpellingPuzzle = levelType === "Word";

        if (levelType === "LetterInWord" || levelType === "Word") {
            if (cssDirection === 'ltr' && levelType === "LetterInWord") {
                wrapper.style.letterSpacing = '4px'; // Specific tweak for LTR LetterInWord
            }

            wrapper.innerHTML = this.createWordText({
                promptWord: this.currentPromptText,
                activeLetter: targetLetterText,
                isSpellingPuzzle,
                activeLetterIndex: this.currentActiveLetterIndex
            });
        } else {
            // Fallback for any other level types, just plain text
            wrapper.textContent = this.currentPromptText;
        }

        this.promptTextElement.appendChild(wrapper);
        this.setPromptButtonVisible(false);
    }

    private isLetterSoundMatchTutorial(): boolean {
        return (
            this.isLevelHaveTutorial &&
            this.levelData?.levelMeta?.levelType === "LetterOnly" &&
            this.levelData?.levelMeta?.protoType === "Hidden"
        );
    }

    private isSpellSoundMatchTutorial(): boolean {
        return (
            this.isLevelHaveTutorial &&
            this.levelData?.levelMeta?.levelType === "Word" &&
            this.levelData?.levelMeta?.protoType === "Hidden"
        );
    }

    private handleAutoPromptPlay() {
        setTimeout(() => {
            if (!this.isAutoPromptPlaying) {
                this.audioPlayer.handlePlayPromptAudioClickEvent();
            }

        }, this.AUTO_PROMPT_INITIAL_DELAY_MS);
    }

    /**
     * Handles stone drop events.
     * @param event The event.
     */
    public handleStoneDrop(event) {
        this.promptContainer.style.display = 'none';
    }

    /**
     * Handles load puzzle events.
     * @param event The event.
     */
    public handleLoadPuzzle(event) {
        this.setPromptInitialAudioDelayValues(false); //Always false so we can use the default time triggers in puzzle segment 2 to 5..
        this.currentActiveLetterIndex  = 0;
        this.currentPuzzleData = this.levelData.puzzles[event.detail.counter];
        this.currentPromptText = this.currentPuzzleData.prompt.promptText;
        this.targetStones = this.currentPuzzleData.targetStones;
        this.audioPlayer.preloadPromptAudio(this.getPromptAudioUrl());
        this.handleAutoPromptPlay();
        this.isAutoPromptPlaying = false; //Reset the flag for initial auto audio prompt play.
        this.updatePromptFontSize(); // Update font size for new text
        this.generateTextMarkup();
        this.promptContainer.style.display = 'block'; // Show the prompt container again
    }

    /**
     * Disposes the component.
     */
    public dispose() {
        document.removeEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
        this.eventManager.unregisterEventListener();
        //unsubscribe to gameStateService event.
        this.unsubscribeSubmittedLettersEvent();
        // Use BaseHTML's destroy method to remove the element
        super.destroy();
    }

    /**
     * Calculates the font size.
     * @returns The font size.
     */
    calculateFont(): number {
        const size = this.width * 0.65 / this.currentPromptText.length;
        return size > 35 ? 25 : size;
    }

    /**
     * Handles visibility change events.
     * Pauses all audio when app goes to background, resumes foreground state flag when visible.
     */
    handleVisibilityChange = () => {
        const isVisible = document.visibilityState === "visible";
        this.isAppForeground = isVisible;

        if (!isVisible) {
            this.audioPlayer.stopAllAudios();
        }
    }
}