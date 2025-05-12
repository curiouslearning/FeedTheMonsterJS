import { EventManager } from "@events";
import { Utils, VISIBILITY_CHANGE } from "@common";
import { AudioPlayer } from "@components";
import { PROMPT_PLAY_BUTTON, PROMPT_TEXT_BG } from "@constants";
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
export const PROMPT_TEXT_LAYOUT = (id: string) => {
    return (`
        <div id="${id}" class="prompt-container">
            <div id="prompt-background" class="prompt-background" style="background-image: url(${PROMPT_TEXT_BG})">
                <div id="prompt-text-button-container">
                    <div id="prompt-text" class="prompt-text"></div>
                    <div id="prompt-play-button" class="prompt-play-button" style="background-image: url(${PROMPT_PLAY_BUTTON}); pointer-events: auto;"></div>
                </div>
            </div>
        </div>
    `);
};

/**
 * Represents a prompt text component.
 */
export class PromptText extends BaseHTML {
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
    
    // HTML elements for the prompt
    public promptContainer: HTMLDivElement;
    public promptBackground: HTMLDivElement;
    public promptTextElement: HTMLDivElement;
    public promptPlayButtonElement: HTMLDivElement;
    private animationFrameId: number;
    private eventManager: EventManager;
    private containerId: string;

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
        options: BaseHtmlOptions = { selectors: DEFAULT_SELECTORS }
    ) {
        super(
            options,
            id,
            PROMPT_TEXT_LAYOUT
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
        
        // Initialize HTML elements
        this.initializeHtmlElements();
        
        // Start animation loop
        this.startAnimationLoop();
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
        
        // Add event listeners to all prompt elements
        this.promptPlayButtonElement.addEventListener('click', this.playSound);
        this.promptBackground.addEventListener('click', this.playSound);
        this.promptTextElement.addEventListener('click', this.playSound);
        
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
            this.audioPlayer.playPromptAudio(this.getPromptAudioUrl());
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
                const parts = this.currentPromptText.split(targetLetterText);
                
                // Add the text with the highlighted letter
                if (parts.length > 1) {
                    // Create the text with the highlighted letter
                    wrapper.innerHTML = parts.join(`<span class="text-red">${targetLetterText}</span>`);
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
            
            // In LTR, we need to highlight the target letter
            const targetStone = this.targetStones[0];
            const targetLetterText = typeof targetStone === 'string' 
                ? targetStone 
                : (targetStone as { StoneText: string }).StoneText;
            
            // Create HTML with only the specific target letter highlighted
            let html = '';
            const promptChars = this.currentPromptText.split('');
            
            // Find the first occurrence of the target letter that hasn't been dropped yet
            // This ensures we only highlight the current target letter, not all instances
            let targetIndex = -1;
            for (let i = 0; i < this.currentPromptText.length; i++) {
                // For multi-character targets (like digraphs "ts"), check if the substring matches
                const substringToCheck = this.currentPromptText.substring(i, i + targetLetterText.length);
                if (substringToCheck === targetLetterText && i >= this.droppedStones) {
                    targetIndex = i;
                    break;
                }
            }
            
            // Build the HTML with the correct highlighting
            for (let i = 0; i < this.currentPromptText.length; i++) {
                // Check if this position is the start of the target letter
                if (i === targetIndex) {
                    // Add the highlighted target letter (which might be multiple characters)
                    html += `<span class="text-red">${targetLetterText}</span>`;
                    // Skip the rest of the characters in the target letter
                    i += targetLetterText.length - 1;
                } else {
                    // Regular character, not highlighted
                    html += this.currentPromptText[i];
                }
            }
            
            wrapper.innerHTML = html;
            
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
            if (Math.floor(this.time) >= 1910 && Math.floor(this.time) <= 1926) {
                this.playSound();
            }
            
            if (!this.isStoneDropped) {
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
        this.droppedStones = 0;
        this.droppedStoneCount = 0;
        this.currentPuzzleData = this.levelData.puzzles[event.detail.counter];
        this.currentPromptText = this.currentPuzzleData.prompt.promptText;
        this.targetStones = this.currentPuzzleData.targetStones;
        this.audioPlayer.preloadPromptAudio(this.getPromptAudioUrl());
        this.isStoneDropped = false;
        this.time = 0;
        
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