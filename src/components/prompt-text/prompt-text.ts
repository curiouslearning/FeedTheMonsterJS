import { EventManager } from "@events";
import { Utils, VISIBILITY_CHANGE, isGameTypeAudio } from "@common";
import { AudioPlayer } from "@components";
import { PROMPT_TEXT_BG, AUDIO_PLAY_BUTTON } from "@constants";
import { BaseHTML, BaseHtmlOptions } from "../baseHTML/base-html";
import './prompt-text.scss';

// Default selectors for the prompt text component
export const DEFAULT_SELECTORS = {
    root: '#background', // The background element to append the prompt to
    promptText: '.prompt-text',
    promptBackground: '.prompt-background',
    promptPlayButton: '.prompt-play-button'
};

// HTML template for the prompt text component
export const PROMPT_TEXT_LAYOUT = (id: string, isLevelHaveTutorial: boolean) => {
    return (`
        <div id="${id}" class="prompt-container">
            <div id="prompt-background" class="prompt-background" style="background-image: url(${PROMPT_TEXT_BG})">
                <div id="prompt-text-button-container">
                    <div id="prompt-text" class="prompt-text"></div>
                    <div id="prompt-play-button"
                        class="prompt-play-button ${isLevelHaveTutorial ? 'pulsing' : ''}"
                        style="background-image: url(${AUDIO_PLAY_BUTTON}); pointer-events: auto;">
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
    public height: number;
    public levelData: any;
    public currentPromptText: string;
    public currentPuzzleData: any;
    public targetStones: (string | { StoneText: string })[];
    public rightToLeft: boolean;
    public audioPlayer: AudioPlayer;
    public isStoneDropped: boolean = false;
    droppedStones: number = 0;
    private droppedStoneCount = 0;
    public time: number = 0;
    public isAppForeground: boolean = true;
    public scale: number = 1;
    public isScalingUp: boolean = true;
    public scaleFactor: number = 0.00050;
    public translateY: number = 0;
    public isTranslatingUp: boolean = true;
    public translateFactor: number = 0.05;
    public AUTO_PROMPT_ACTIVE_WINDOW_START: number;
    private AUTO_PROMPT_ACTIVE_WINDOW_END: number = 9300;
    private isAutoPromptPlaying: boolean = false;
    private isLevelHaveTutorial: boolean = false;

    // HTML elements for the prompt
    public promptContainer: HTMLDivElement;
    public promptBackground: HTMLDivElement;
    public promptTextElement: HTMLDivElement;
    public promptPlayButtonElement: HTMLDivElement;
    private animationFrameId: number;
    private eventManager: EventManager;
    private containerId: string;
    private onClickCallback?: () => void;

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
        height: number, 
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
            (id: string) => PROMPT_TEXT_LAYOUT(id, isLevelHaveTutorial)
        );

        // Store id for later use
        this.containerId = id;

        // Create event manager for handling events
        this.eventManager = new EventManager({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        });

        this.width = width;
        this.height = height;
        this.levelData = levelData;
        this.rightToLeft = rightToLeft;
        this.currentPromptText = currentPuzzleData.prompt.promptText;
        this.currentPuzzleData = currentPuzzleData;
        this.targetStones = this.currentPuzzleData.targetStones;
        this.isLevelHaveTutorial = isLevelHaveTutorial;
        this.audioPlayer = new AudioPlayer();
        this.audioPlayer.preloadPromptAudio(this.getPromptAudioUrl());
        document.addEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
        //Set initial auto audio play timing.
        this.setPromptInitialAudioDelayValues(isLevelHaveTutorial);

        // Initialize HTML elements
        this.initializeHtmlElements();
        
        // Start animation loop
        this.startAnimationLoop();
        this.onClickCallback = onClickCallback;
    }

    // This improves on the nested callbacks introduced in FM-484.
    // While prompt-text.ts is still a tangled mess, this method offers a cleaner and more readable approach.
    // Long-term: the entire module needs refactoring for maintainability.
    private setPromptInitialAudioDelayValues(isTutorialOn: boolean = false) {
        this.AUTO_PROMPT_ACTIVE_WINDOW_START = isTutorialOn ? 3000 : 1910;
    }

    private removePulseClassIfSpellMatchTutorial() {
        if (this.isSpellSoundMatchTutorial()) {
            const playButton = document.getElementById("prompt-play-button");
            if (playButton?.classList.contains("pulsing")) {
                playButton.classList.remove("pulsing");
            }
        }
    }

    /**
     * Initializes the HTML elements for the prompt text component.
     */
    public initializeHtmlElements() {
        // Get references to the created elements
        this.promptContainer = document.getElementById(this.containerId) as HTMLDivElement;
        this.promptBackground = this.promptContainer.querySelector('#prompt-background') as HTMLDivElement;
        this.promptTextElement = this.promptContainer.querySelector('#prompt-text') as HTMLDivElement;
        this.promptPlayButtonElement = this.promptContainer.querySelector('#prompt-play-button') as HTMLDivElement;

        // Update event listeners to include the callback
        const handleClick = (e: Event) => {
            this.stopAutoPromptReplay();
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
        
        // Make sure all elements are clickable
        this.promptBackground.style.pointerEvents = 'auto';
        this.promptTextElement.style.pointerEvents = 'auto';
        
        // Set initial font size
        this.promptTextElement.style.fontSize = `${this.calculateFont()}px`;
        
        // Update the text display
        this.updateTextDisplay();
    }

    /**
     * Gets the prompt audio URL.
     * @returns The prompt audio URL.
     */
    public getPromptAudioUrl = (): string => {
        return Utils.getConvertedDevProdURL(this.currentPuzzleData.prompt.promptAudio);
    }

    /**
     * Plays the sound.
     */
    playSound = () => {
        if (this.isAppForeground) {
            console.log('Playing prompt audio:', this.getPromptAudioUrl());
            
            this.audioPlayer.handlePlayPromptAudioClickEvent();
        }
    }

    /**
     * Helper method to render letters with pulsating effect on the first incomplete letter
     * @param stones Array of target stones to render
     * @returns HTML string with rendered letters
     */
    private renderLettersWithPulsation(stones: any[]): string {
        let html = '';
        let foundFirstIncomplete = false;
        
        stones.forEach((stone, i) => {
            // Get stone text and check completion status
            const stoneText = typeof stone === 'string' ? stone : stone.StoneText;
            const isCompleted = i < this.droppedStones;
            
            // Build class string with conditionals
            const pulseClass = (!isCompleted && !foundFirstIncomplete) ? ' text-red-pulse-letter' : '';
            const baseClass = isCompleted ? 'text-black' : 'text-red';
            
            // Update flag if we found our first incomplete letter
            if (pulseClass) foundFirstIncomplete = true;
            
            // Add the span to our HTML
            html += `<span class="${baseClass}${pulseClass}">${stoneText}</span>`;
        });
        
        return html;
    }

    /**
     * Updates the HTML prompt text for right-to-left languages.
     */
    updateRTLText() {
        // Clear previous content
        this.promptTextElement.innerHTML = '';
        
        // Set RTL direction for the text element while keeping text centered
        this.promptTextElement.style.direction = 'rtl';
        this.promptTextElement.setAttribute('dir', 'rtl');
        this.promptTextElement.style.textAlign = 'center'; // Ensure text is always centered
        
        if (this.levelData.levelMeta.levelType == "LetterInWord") {
            if (this.levelData.levelMeta.protoType == "Visible") {
                // For RTL, we need to ensure the text flows right to left
                const wrapper = document.createElement('span');
                wrapper.style.direction = 'rtl';
                wrapper.style.unicodeBidi = 'embed'; // Critical for RTL rendering
                wrapper.style.textAlign = 'center';
                wrapper.style.width = '100%';
                wrapper.style.display = 'inline-block';
                
                // In RTL, we need to highlight the target letter
                const targetStone = this.targetStones[0];
                const targetLetterText = typeof targetStone === 'string' 
                    ? targetStone 
                    : (targetStone as { StoneText: string }).StoneText;
                const parts = this.currentPromptText.split(targetLetterText);
                
                // Add the text with the highlighted letter
                if (parts.length > 1) {
                    // Create the text with the highlighted letter with pulsating effect for LetterInWord
                    wrapper.innerHTML = parts.join(`<span class="text-red-pulse-letter">${targetLetterText}</span>`);
                } else {
                    // Just show the text as is
                    wrapper.textContent = this.currentPromptText;
                }
                
                this.promptTextElement.appendChild(wrapper);
                
                // Show text element, hide play button
                this.promptTextElement.style.display = 'block';
                this.promptPlayButtonElement.style.display = 'none';
            } else {
                // Show play button instead of text
                this.updateCenteredPlayButton();
            }
        } else if (this.levelData.levelMeta.levelType == "Word") {
            if (this.levelData.levelMeta.protoType == "Visible") {
                // For Word level type in RTL
                const wrapper = document.createElement('span');
                wrapper.style.direction = 'rtl';
                wrapper.style.unicodeBidi = 'embed'; // Critical for RTL rendering
                wrapper.style.textAlign = 'center';
                wrapper.style.width = '100%';
                wrapper.style.display = 'inline-block';
                
                // Use the helper method to render letters with pulsation
                wrapper.innerHTML = this.renderLettersWithPulsation(this.targetStones);
                
                this.promptTextElement.appendChild(wrapper);
                
                // Show text element, hide play button
                this.promptTextElement.style.display = 'block';
                this.promptPlayButtonElement.style.display = 'none';
            } else {
                // Show play button instead of text
                this.updateCenteredPlayButton();
            }
        } else if (this.levelData.levelMeta.levelType == "audioPlayerWord") {
            // Show play button for audio word
            this.updateCenteredPlayButton();
        } else {
            if (this.levelData.levelMeta.protoType == "Visible") {
                // Simple text display for RTL
                const wrapper = document.createElement('span');
                wrapper.className = 'text-black';
                wrapper.style.direction = 'rtl';
                wrapper.style.unicodeBidi = 'embed'; // Critical for RTL rendering
                wrapper.style.textAlign = 'center';
                wrapper.style.width = '100%';
                wrapper.style.display = 'inline-block';
                wrapper.textContent = this.currentPromptText;
                
                this.promptTextElement.appendChild(wrapper);
                
                // Show text element, hide play button
                this.promptTextElement.style.display = 'block';
                this.promptPlayButtonElement.style.display = 'none';
            } else {
                // Show play button instead of text
                this.updateCenteredPlayButton();
            }
        }
    }

    /**
     * Updates the HTML prompt text for left-to-right languages.
     */
    updateLTRText() {
        // Clear previous content
        this.promptTextElement.innerHTML = '';
        
        // Set LTR direction for the text element while keeping text centered
        this.promptTextElement.style.direction = 'ltr';
        this.promptTextElement.setAttribute('dir', 'ltr');
        this.promptTextElement.style.textAlign = 'center'; // Ensure text is always centered
        
        // Handle LetterInWord level type with visible prototype
        if (this.levelData.levelMeta.levelType === "LetterInWord" && this.levelData.levelMeta.protoType == "Visible") {
            const wrapper = document.createElement('span');
            wrapper.style.direction = 'ltr';
            wrapper.style.textAlign = 'center';
            wrapper.style.width = '100%';
            wrapper.style.display = 'inline-block';
            wrapper.style.letterSpacing = '4px'; // Reduced spacing for better alignment
            
            // Get the target letter
            const targetStone = this.targetStones[0];
            const targetLetterText = typeof targetStone === 'string' 
                ? targetStone 
                : (targetStone as { StoneText: string }).StoneText;
            
            // Create formatted text with only the specific target letter highlighted
            let formattedPromptText = '';
            let foundTarget = false;
            let i = 0;
            
            // Single loop to build formatted text and highlight the target letter
            while (i < this.currentPromptText.length) {
                // If we haven't found the target yet and we're past the dropped stones,
                // check if this position starts with the target letter
                if (!foundTarget && i >= this.droppedStones) {
                    const substringToCheck = this.currentPromptText.substring(i, i + targetLetterText.length);
                    if (substringToCheck === targetLetterText) {
                        // Found the target - highlight it with pulsating effect for LetterInWord
                        formattedPromptText += `<span class="text-red-pulse-letter">${targetLetterText}</span>`;
                        i += targetLetterText.length; // Move past the target letter
                        foundTarget = true; // Mark that we found the target (only highlight first occurrence)
                        continue; // Skip to next iteration
                    }
                }
                
                // Regular character, not highlighted
                formattedPromptText += this.currentPromptText[i];
                i++;
            }
            
            wrapper.innerHTML = formattedPromptText;
            
            this.promptTextElement.appendChild(wrapper);
            
            // Show text element, hide play button
            this.promptTextElement.style.display = 'block';
            this.promptPlayButtonElement.style.display = 'none';
            return;
        }

        // Handle other level types
        switch (this.levelData.levelMeta.levelType) {
            case "Word": {
                if (this.levelData.levelMeta.protoType == "Visible") {
                    // For Word level type in LTR
                    const wrapper = document.createElement('span');
                    wrapper.style.direction = 'ltr';
                    wrapper.style.textAlign = 'center';
                    wrapper.style.width = '100%';
                    wrapper.style.display = 'inline-block';
                    
                    let html = '';
                    
                    if (this.targetStones.length != this.currentPromptText.length) {
                        // For Word level type where target stones don't match prompt text length
                        html = this.renderLettersWithPulsation(this.targetStones);
                    } else {
                        // For Word level type where target stones match prompt text length
                        if (this.droppedStones >= this.targetStones.length) {
                            // All letters dropped - show the whole word in black
                            html = `<span class="text-black">${this.currentPromptText}</span>`;
                        } else {
                            // Some letters still need to be dropped
                            // Matching the original canvas implementation
                            html = this.renderLettersWithPulsation(this.targetStones);
                        }
                    }
                    
                    wrapper.innerHTML = html;
                    this.promptTextElement.appendChild(wrapper);
                    
                    // Show text element, hide play button
                    this.promptTextElement.style.display = 'block';
                    this.promptPlayButtonElement.style.display = 'none';
                } else {
                    // Show play button instead of text
                    this.updateCenteredPlayButton();
                }
                break;
            }
            case "SoundWord": {
                // Show play button for sound word
                this.updateCenteredPlayButton();
                break;
            }
            default: {
                if (this.levelData.levelMeta.protoType == "Visible") {
                    // Simple text display for LTR
                    const wrapper = document.createElement('span');
                    wrapper.className = 'text-black';
                    wrapper.style.direction = 'ltr';
                    wrapper.style.textAlign = 'center';
                    wrapper.style.width = '100%';
                    wrapper.style.display = 'inline-block';
                    wrapper.textContent = this.currentPromptText;
                    
                    this.promptTextElement.appendChild(wrapper);
                    
                    // Show text element, hide play button
                    this.promptTextElement.style.display = 'block';
                    this.promptPlayButtonElement.style.display = 'none';
                } else {
                    // Show play button instead of text
                    this.updateCenteredPlayButton();
                }
                break;
            }
        }
    }

    /**
     * Updates the centered play button position and visibility.
     */
    updateCenteredPlayButton() {
        // Show the button, hide the text
        this.promptPlayButtonElement.style.display = 'block';
        this.promptTextElement.style.display = 'none';
        
        // Make sure the play button is clickable
        this.promptPlayButtonElement.style.pointerEvents = 'auto';
    }

    /**
     * Updates the text display based on language direction.
     */
    updateTextDisplay() {
        // Calculate font size
        const fontSize = this.calculateFont();
        this.promptTextElement.style.fontSize = `${fontSize}px`;
        
        // Update the text content based on language direction
        if (this.rightToLeft) {
            this.updateRTLText();
        } else {
            this.updateLTRText();
        }
    }

    private isSpellSoundMatchTutorial(): boolean {
        return (
            this.isLevelHaveTutorial &&
            this.levelData?.levelMeta?.levelType === "LetterOnly" &&
            this.levelData?.levelMeta?.protoType === "Hidden"
        );
    }

    private stopAutoPromptReplay(): void {
        this.isAutoPromptPlaying = true;
        this.AUTO_PROMPT_ACTIVE_WINDOW_END = this.AUTO_PROMPT_ACTIVE_WINDOW_START; //Closes the time window gap that triggers the auto replay.
    }

    private handleAutoPromptPlay(time) {
        if (
            !this.isAutoPromptPlaying &&
            Math.floor(time) >= this.AUTO_PROMPT_ACTIVE_WINDOW_START // If time is greater than AUTO_PROMPT_ACTIVE_WINDOW_START (e.g., 3000 for tutorial, 1910 otherwise)
        ) {
            this.isAutoPromptPlaying = true; // Flag to true to prevent double-triggering of initial auto audio or firing setTimeout callback.

            // We use handlePlayPromptAudioClickEvent so both user-triggered clicks and auto replays
            // go through the same debounce check. If audio is still playing, it prevents overlap.
            // Relating to FM-555: debounce covers click events, but auto replay here in FM-577 needs setTimeout to
            // further control spacing and avoid audio playing too close together.
            this.audioPlayer.handlePlayPromptAudioClickEvent(
                () => {
                    if (
                        this.isSpellSoundMatchTutorial() &&
                        time <= this.AUTO_PROMPT_ACTIVE_WINDOW_END // Ensures auto audio replay only happens within the range of 3000–9300ms.
                    ) {
                        // Trigger a 1-second delay before allowing another auto replay.
                        // This controls spacing specifically for auto replays, separate from click debounce.
                        setTimeout(() => {
                            this.isAutoPromptPlaying = false; // Ready for another auto replay.
                        }, 1000);
                    }
                }
            );
        }
    }

    /**
    ** Starts the animation loop for the prompt background.
    ** NOTE: This method should be deprecated and refactored out.
    *
    ** Reasons:
    ** - Redundant requestAnimationFrame loop — the application already uses a main centralized animation loop.
    ** - Mixes multiple responsibilities: audio triggering, visual scaling, DOM updates, and time tracking.
    ** - No clear cleanup or stop mechanism — leads to unnecessary processing and potential conflicts with global loop.
    ** - UI transformations like scaling and translation are better handled using CSS transitions or keyframe animations.
    *
    ** Recommended:
    ** - Remove this loop entirely and migrate its responsibilities to the main animation loop or event-driven hooks.
    ** - Offload prompt scaling and translation to CSS where possible.
    ** - Handle audio timing logic in a dedicated, reusable method.
    */
    startAnimationLoop() {
        let lastTime = 0;
        
        const animate = (timestamp) => {
            if (!lastTime) lastTime = timestamp;
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            
            this.time += deltaTime;

            this.handleAutoPromptPlay(this.time);

            //Note: !isGameTypeAudio(this.levelData.levelMeta.protoType) is needed to make sure the audio play button won't pulsate.
            if (!this.isStoneDropped && !isGameTypeAudio(this.levelData.levelMeta.protoType)) {
                // Update scaling
                this.updateScaling();
                
                // Update translation
                this.updateTranslation();
                
                // Apply transformations - preserve translateX(-50%) for horizontal centering
                this.promptBackground.style.transform = `translateX(-50%) scale(${this.scale}) translateY(${this.translateY}px)`;
                
                // Show the prompt container
                this.promptContainer.style.display = 'block';
            }
            
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        this.animationFrameId = requestAnimationFrame(animate);
    }

    /**
     * Handles stone drop events.
     * @param event The event.
     */
    public handleStoneDrop(event) {
        this.isStoneDropped = true;
        this.promptContainer.style.display = 'none';
    }

    /**
     * Handles load puzzle events.
     * @param event The event.
     */
    public handleLoadPuzzle(event) {
        this.setPromptInitialAudioDelayValues(false); //Always false so we can use the default time triggers in puzzle segment 2 to 5..
        this.droppedStones = 0;
        this.droppedStoneCount = 0;
        this.currentPuzzleData = this.levelData.puzzles[event.detail.counter];
        this.currentPromptText = this.currentPuzzleData.prompt.promptText;
        this.targetStones = this.currentPuzzleData.targetStones;
        this.audioPlayer.preloadPromptAudio(this.getPromptAudioUrl());
        this.isStoneDropped = false;
        this.time = 0;
        this.isAutoPromptPlaying = false; //Reset the flag for initial auto audio prompt play.
        // Update font size for new text
        this.promptTextElement.style.fontSize = `${this.calculateFont()}px`;
        
        // Update text display
        this.updateTextDisplay();
        
        // Show the prompt container again
        this.promptContainer.style.display = 'block';
    }

    /**
     * Disposes the component.
     */
    public dispose() {
        document.removeEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
        this.eventManager.unregisterEventListener();
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Use BaseHTML's destroy method to remove the element
        super.destroy();
    }

    /**
     * Sets the dropped letter index.
     * @param index The index.
     */
    droppedLetterIndex(index: number) {
        this.droppedStones = index;
        this.droppedStoneCount++;
        
        // Update the text display to reflect the dropped letter
        if (!this.isStoneDropped) {
            this.updateTextDisplay();
        }
    }

    /**
     * Calculates the font size.
     * @returns The font size.
     */
    calculateFont(): number {
        return (this.width * 0.65 / this.currentPromptText.length > 35) ? 25 : this.width * 0.65 / this.currentPromptText.length;
    }

    /**
     * Updates the scaling.
     */
    updateScaling() {
        if (this.isScalingUp) {
            this.scale += this.scaleFactor;
            if (this.scale >= 1.05) {
                this.isScalingUp = false;
            }
        } else {
            this.scale -= this.scaleFactor;
            if (this.scale <= 0.95) {
                this.scale = 0.95;
                this.isScalingUp = true;
            }
        }
    }

    /**
     * Updates the vertical translation for floating animation.
     */
    updateTranslation() {
        if (this.isTranslatingUp) {
            this.translateY -= this.translateFactor;
            if (this.translateY <= -5) {
                this.isTranslatingUp = false;
            }
        } else {
            this.translateY += this.translateFactor;
            if (this.translateY >= 5) {
                this.translateY = 5;
                this.isTranslatingUp = true;
            }
        }
    }

    /**
     * Handles visibility change events.
     */
    handleVisibilityChange = () => {
        if (document.visibilityState == "hidden") {
            this.audioPlayer.stopAllAudios();
            this.isAppForeground = false;
        }
        if (document.visibilityState == "visible") {
            this.isAppForeground = true;
        }
    }
}