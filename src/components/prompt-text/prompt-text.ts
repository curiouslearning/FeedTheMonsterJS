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
export const PROMPT_TEXT_LAYOUT = (id: string, levelData: any) => {
    /*
        Note: hidePromptBG is a dirty fix to easily implement the new AUDIO_PLAY_BUTTON.
        AUDIO_PLAY_BUTTON is a new asset that is similar to start-scene play button.
        So rendering this asset requires removing the prompt background entirely.
        However due to how coupled and tied the logic in this class. It is not easy to
        handle the AUDIO_PLAY_BUTTON only without breaking the tightly connected logic.
    */
    const hidePromptBG = isGameTypeAudio(levelData.levelMeta.protoType);

    return (`
        <div id="${id}" class="prompt-container">
            <div id="prompt-background" class="prompt-background" style="background-image: url(${hidePromptBG ? null :PROMPT_TEXT_BG})">
                <div id="prompt-text-button-container">
                    <div id="prompt-text" class="prompt-text"></div>
                    <div id="prompt-play-button" class="prompt-play-button" style="background-image: url(${AUDIO_PLAY_BUTTON}); pointer-events: auto;"></div>
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
    public triggerStart: number;
    public triggerEnd: number;
    private hasInitialAudioPlayed: boolean = false;

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
            (id: string) => PROMPT_TEXT_LAYOUT(id, levelData)
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
        this.audioPlayer = new AudioPlayer();
        this.audioPlayer.preloadPromptAudio(this.getPromptAudioUrl());
        document.addEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
        this.hasInitialAudioPlayed = false;
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
        this.triggerStart = isTutorialOn ? 3000 : 1910;
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
                const index = this.currentPromptText.indexOf(targetLetterText);
                const parts =
                    index !== -1
                        ? [
                            this.currentPromptText.slice(0, index),
                            this.currentPromptText.slice(index + targetLetterText.length),
                        ]
                        : [this.currentPromptText];
                
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
                
                let html = '';
                
                // For RTL, add the stones in the correct order
                for (let i = 0; i < this.targetStones.length; i++) {
                    // Handle both string and object formats for target stones
                    const stoneText = typeof this.targetStones[i] === 'string' 
                        ? this.targetStones[i] 
                        : (this.targetStones[i] as { StoneText: string }).StoneText;
                    
                    const letterClass = (i < this.droppedStones) 
                        ? "text-black" 
                        : "text-red";
                    
                    html += `<span class="${letterClass}">${stoneText}</span>`;
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
                        for (let j = 0; j < this.targetStones.length; j++) {
                            // Handle both string and object formats for target stones
                            const stoneText = typeof this.targetStones[j] === 'string' 
                                ? this.targetStones[j] 
                                : (this.targetStones[j] as { StoneText: string }).StoneText;
                            
                            const letterClass = (j < this.droppedStones) 
                                ? "text-black" 
                                : "text-red";
                            
                            const spacing = j > 0 ? " letter-spacing" : "";
                            html += `<span class="${letterClass}${spacing}">${stoneText}</span>`;
                        }
                    } else {
                        // For Word level type where target stones match prompt text length
                        if (this.droppedStones >= this.targetStones.length) {
                            // All letters dropped - show the whole word in black
                            html = `<span class="text-black">${this.currentPromptText}</span>`;
                        } else {
                            // Some letters still need to be dropped
                            // Matching the original canvas implementation
                            for (let i = 0; i < this.targetStones.length; i++) {
                                // Handle both string and object formats for target stones
                                const stoneText = typeof this.targetStones[i] === 'string' 
                                    ? this.targetStones[i] 
                                    : (this.targetStones[i] as { StoneText: string }).StoneText;
                                    
                                const letterClass = i < this.droppedStones ? "text-black" : "text-red";
                                html += `<span class="${letterClass}">${stoneText}</span>`;
                            }
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

    /**
     * Starts the animation loop for the prompt background.
     */
    startAnimationLoop() {
        let lastTime = 0;
        
        const animate = (timestamp) => {
            if (!lastTime) lastTime = timestamp;
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            
            this.time += deltaTime;
            

            // Play sound at specific time
            if (
                !this.hasInitialAudioPlayed &&
                Math.floor(this.time) >= this.triggerStart
            ) {
                this.hasInitialAudioPlayed = true; //Flag to true to prevent double triggering of initial auto audio.
                this.audioPlayer.playPromptAudio();
            }

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
        this.hasInitialAudioPlayed = false; //Reset the flag for initial auto audio prompt play.
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