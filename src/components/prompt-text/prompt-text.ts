import { EventManager } from "@events";
import { Utils, font, VISIBILITY_CHANGE } from "@common";
import { AudioPlayer } from "@components";
import { PROMPT_PLAY_BUTTON, PROMPT_TEXT_BG } from "@constants";

/**
 * Represents a prompt text component.
 */
export class PromptText extends EventManager {
    public width: number;
    public height: number;
    public levelData: any;
    public currentPromptText: string;
    public currentPuzzleData: any;
    public canavsElement: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;
    public prompt_image: HTMLImageElement;
    public targetStones: string[];
    public rightToLeft: boolean;
    public imagesLoaded: boolean = false;
    public audioPlayer: AudioPlayer;
    public isStoneDropped: boolean = false;
    droppedStones: number = 0;
    private droppedStoneCount = 0;
    public time: number = 0;
    public promptImageWidth: number = 0;
    public isAppForeground: boolean = true;
    public scale: number = 1;
    public isScalingUp: boolean = true;
    public scaleFactor: number = 0.00050;
    public promptImageHeight: number = 0;
    public promptPlayButton: HTMLImageElement;

    /**
     * Configuration for text vertical positioning based on screen size breakpoints.
     * Each entry contains a breakpoint width and the corresponding vertical position factor.
     * The breakpoints should be ordered from smallest to largest.
     */
    private textPositionConfig = [
        { breakpoint: 376, position: 0.30 },  // Small mobile (≤376px)
        { breakpoint: 480, position: 0.26 },  // Large mobile (377-480px)
        { breakpoint: 820, position: 0.25 },  // Tablets (481-820px)
    ];

    /**
     * Configuration for prompt background sizing and positioning based on screen size.
     * Each entry contains a breakpoint width, size factor, and vertical position factor.
     * The breakpoints should be ordered from smallest to largest.
     */
    private backgroundConfig = [
        { breakpoint: 376, sizeFactor: 0.50, yPosition: 0.18 },  // Small mobile (≤376px)
        { breakpoint: 480, sizeFactor: 0.60, yPosition: 0.15 },  // Large mobile (377-480px)
        { breakpoint: 820, sizeFactor: 0.50, yPosition: 0.10 },  // Tablets (481-820px)
    ];

    /**
     * Initializes a new instance of the PromptText class.
     * @param width The width of the component.
     * @param height The height of the component.
     * @param currentPuzzleData The current puzzle data.
     * @param levelData The level data.
     * @param rightToLeft Whether the text is right-to-left.
     */
    constructor(width: number, height: number, currentPuzzleData: any, levelData: any, rightToLeft) {
        super({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        })

        this.width = width;
        this.height = height;
        this.levelData = levelData;
        this.rightToLeft = rightToLeft;
        this.currentPromptText = currentPuzzleData.prompt.promptText;
        this.currentPuzzleData = currentPuzzleData;
        this.targetStones = this.currentPuzzleData.targetStones;
        this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
        this.context = this.canavsElement.getContext("2d");
        this.audioPlayer = new AudioPlayer();
        this.audioPlayer.preloadPromptAudio(this.getPromptAudioUrl());
        this.prompt_image = new Image();
        this.promptPlayButton = new Image();
        this.loadImages()
        this.time = 0;
        this.promptImageWidth = this.width * 0.65;
        this.promptImageHeight = this.height * 0.3;
        document.addEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
    }

    /**
     * Handles mouse down events.
     * @param event The event.
     */
    handleMouseDown = (event) => {
        let self = this;
        const selfElement = <HTMLElement>document.getElementById("canvas");
        event.preventDefault();
        var rect = selfElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (self.onClick(x, y)) {
            this.playSound();
        }
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
            this.audioPlayer.playPromptAudio(Utils.getConvertedDevProdURL(this.currentPuzzleData.prompt.promptAudio));
        }
    }

    /**
     * Handles click events.
     * @param xClick The x-coordinate of the click.
     * @param yClick The y-coordinate of the click.
     * @returns Whether the click was handled.
     */
    onClick(xClick, yClick) {
        return Math.sqrt(xClick - this.width / 3) < 12 && Math.sqrt(yClick - this.height / 5.5) < 10
    }

    /**
     * Sets the current puzzle data.
     * @param data The new puzzle data.
     */
    setCurrrentPuzzleData(data) {
        this.currentPuzzleData = data;
        this.currentPromptText = data.prompt.promptText;
        this.targetStones = this.currentPuzzleData.targetStones;
    }

    /**
     * Calculates the vertical position for text based on screen size.
     * Uses the textPositionConfig to determine the appropriate position factor.
     * @returns The vertical position as a percentage of screen height.
     */
    calculateTextVerticalPosition(): number {
        const screenWidth = window.innerWidth;
        
        // Find the appropriate config based on screen width
        for (const config of this.textPositionConfig) {
            if (screenWidth <= config.breakpoint) {
                return this.height * config.position;
            }
        }
        
        // Fallback to the last config (should never reach here due to Infinity breakpoint)
        return this.height * this.textPositionConfig[this.textPositionConfig.length - 1].position;
    }

    /**
     * Calculates the background configuration based on screen size.
     * @returns The background configuration with size factor and vertical position.
     */
    calculateBackgroundConfig(): { sizeFactor: number, yPosition: number } {
        const screenWidth = window.innerWidth;
        
        // Find the appropriate config based on screen width
        for (const config of this.backgroundConfig) {
            if (screenWidth <= config.breakpoint) {
                return { 
                    sizeFactor: config.sizeFactor,
                    yPosition: config.yPosition
                };
            }
        }
        
        // Fallback to the last config
        const lastConfig = this.backgroundConfig[this.backgroundConfig.length - 1];
        return { 
            sizeFactor: lastConfig.sizeFactor,
            yPosition: lastConfig.yPosition
        };
    }

    /**
     * Draws the prompt text in right-to-left languages.
     */
    drawRTLLang() {
        var x = this.width / 2;
        // Get the vertical position based on screen size
        const y = this.calculateTextVerticalPosition();
        this.context.textAlign = "center";
        var fontSize = this.calculateFont();
        const scaledWidth = this.promptImageWidth;
        const scaledHeight = this.promptImageHeight;
        this.context.font = `${fontSize}px ${font}, monospace`;
        if (this.levelData.levelMeta.levelType == "LetterInWord") {
            if (this.levelData.levelMeta.protoType == "Visible") {
                var letterInWord = this.currentPromptText.replace(
                    new RegExp(this.currentPuzzleData.targetStones[0], "g"),
                    ""
                );
                this.context.fillStyle = "red";
                this.context.fillText(
                    this.targetStones[0],
                    x + this.context.measureText(letterInWord).width / 2,
                    y
                );
                this.context.fillStyle = "black";
                this.context.fillText(
                    letterInWord,
                    x - this.context.measureText(this.targetStones[0]).width / 2,
                    y
                );
            } else {
                this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
            }
        } else if (this.levelData.levelMeta.levelType == "Word") {
            if (this.levelData.levelMeta.protoType == "Visible") {
                x = x - this.context.measureText(this.currentPromptText).width * 0.5;
                for (let i = this.targetStones.length - 1; i >= 0; i--) {
                    if (this.droppedStones > i || this.droppedStones == undefined) {
                        this.context.fillStyle = "black";
                        this.context.fillText(this.targetStones[i], x, y);
                    } else {
                        this.context.fillStyle = "red";
                        this.context.fillText(this.targetStones[i], x, y);
                    }
                    x = x + this.context.measureText(this.targetStones[i]).width + 5;
                }
            } else {
                this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
            }
        } else if (this.levelData.levelMeta.levelType == "audioPlayerWord") {
            this.drawCenteredPlayButton(this.height * 0.4, scaledWidth, scaledHeight);
        } else {
            if (this.levelData.levelMeta.protoType == "Visible") {
                this.context.fillStyle = "black";
                this.context.fillText(this.currentPromptText, x, y);
            } else {
                this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
            }
        }
    }

    /**
     * Draws the prompt text in other languages.
     */
    drawOthers() {
        const promptTextLetters = this.currentPromptText.split("");
        const x = this.width / 2;
        // Get the vertical position based on screen size
        const y = this.calculateTextVerticalPosition();
        const scaledWidth = this.promptImageWidth;
        const scaledHeight = this.promptImageHeight;
        var fontSize = this.calculateFont();
        this.context.font = `${fontSize}px ${font}, monospace`;

        // Initialize starting position for text rendering
        let startPrompttextX = this.width / 2 - this.context.measureText(this.currentPromptText).width / 2;

        // Handle LetterInWord level type with visible prototype
        if (this.levelData.levelMeta.levelType === "LetterInWord" && this.levelData.levelMeta.protoType == "Visible") {
            var letterHighlight = this.currentPuzzleData.targetStones[0];
            var leftPromptText = this.currentPromptText.substring(0, this.currentPromptText.indexOf(letterHighlight));
            var rightPromptText = this.currentPromptText.substring(this.currentPromptText.indexOf(letterHighlight) + letterHighlight.length);

            // Draw left part of the text in black
            if (leftPromptText.length > 0) {
                this.context.fillStyle = "black";
                this.context.fillText(leftPromptText, startPrompttextX, y);

                // Move position for the highlighted letter
                let currentWordWidth = (this.context.measureText(leftPromptText).width +
                    this.context.measureText(letterHighlight).width) / 2;
                startPrompttextX += currentWordWidth;
            }

            // Draw the highlighted letter in red
            if (letterHighlight.length > 0) {
                this.context.fillStyle = "red";
                this.context.fillText(letterHighlight, startPrompttextX, y);

                // Move position for the right part of the text
                let currentWordWidth = (this.context.measureText(letterHighlight).width +
                    this.context.measureText(rightPromptText).width) / 2;
                startPrompttextX += currentWordWidth;
            }

            // Draw right part of the text in black
            if (rightPromptText.length > 0) {
                this.context.fillStyle = "black";
                this.context.fillText(rightPromptText, startPrompttextX, y);
            }
            return; // Exit early since we've handled this case
        }

        // Handle other level types
        switch (this.levelData.levelMeta.levelType) {
            case "Word": {
                if (this.levelData.levelMeta.protoType == "Visible") {
                    // Center align text for consistent positioning
                    this.context.textAlign = "center";

                    if (this.targetStones.length != this.currentPromptText.length) {
                        // For Word level type where target stones don't match prompt text length
                        // Draw each letter with proper spacing and highlighting
                        let totalWidth = 0;
                        const spacing = 0; // No extra spacing between letters

                        for (let j = 0; j < this.targetStones.length; j++) {
                            // Use black for letters that have been dropped, red for those that haven't
                            this.context.fillStyle = (this.droppedStones > j || this.droppedStones == undefined) ? "black" : "red";

                            // Calculate position for this letter
                            const letterWidth = this.context.measureText(this.targetStones[j]).width;
                            const letterX = x - (totalWidth / 2) + (letterWidth / 2);

                            // Draw the letter
                            this.context.fillText(this.targetStones[j], letterX, y);

                            // Update total width for next letter
                            totalWidth += letterWidth + spacing;
                        }
                    } else {
                        // For Word level type where target stones match prompt text length
                        // Draw the whole word with proper coloring based on dropped stones
                        if (this.droppedStones >= promptTextLetters.length) {
                            // All letters dropped - show the whole word in black
                            this.context.fillStyle = "black";
                            this.context.fillText(this.currentPromptText, x, y);
                        } else {
                            // Some letters still need to be dropped
                            // First draw the entire word in red
                            this.context.fillStyle = "red";
                            this.context.fillText(this.currentPromptText, x, y);

                            // Then overlay the dropped part in black
                            if (this.droppedStones > 0) {
                                const droppedPart = this.currentPromptText.substring(0, this.droppedStones);
                                const totalWidth = this.context.measureText(this.currentPromptText).width;
                                const startX = x - (totalWidth / 2);

                                this.context.fillStyle = "black";
                                this.context.textAlign = "left";
                                this.context.fillText(droppedPart, startX, y);
                            }
                        }
                    }
                } else {
                    // For Word level type with non-Visible prototype
                    // Position the play button at the standard text height
                    this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
                }
                break;
            }
            case "SoundWord": {
                // For SoundWord level type, position the play button at standard text height
                this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
                break;
            }
            default: {
                if (this.levelData.levelMeta.protoType == "Visible") {
                    // For default level types with Visible prototype
                    // Draw text centered on the screen
                    this.context.fillStyle = "black";
                    this.context.textAlign = "center";
                    this.context.fillText(this.currentPromptText, x, y);
                } else {
                    // For default level types with non-Visible prototype
                    // Position the play button at the standard text height
                    this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
                }
                break;
            }
        }
    }

    /**
     * Draws the centered play button.
     * @param y The y-coordinate of the button.
     * @param scaledWidth The scaled width of the button.
     * @param scaledHeight The scaled height of the button.
     */
    drawCenteredPlayButton(y: number, scaledWidth: number, scaledHeight: number) {
        // Use a fixed size for the button based on the screen size
        const buttonSize = Math.min(this.width, this.height) * 0.12;

        // Use a square dimension to preserve aspect ratio
        const buttonWidth = buttonSize;
        const buttonHeight = buttonSize;

        const centerX = this.width / 2 - buttonWidth / 2;
        const centerY = y - buttonHeight / 2;

        this.context.drawImage(
            this.promptPlayButton,
            centerX,
            centerY,
            buttonWidth,
            buttonHeight
        );
    }

    /**
     * Draws the prompt text.
     * @param deltaTime The delta time.
     */
    draw(deltaTime: number) {
        this.updateScaling();
        this.time = (deltaTime < 17) ? this.time + Math.floor(deltaTime) : this.time + 16;
        if (Math.floor(this.time) >= 1910 && Math.floor(this.time) <= 1926) {
            this.playSound();
        }
        if (!this.isStoneDropped) {
            // Apply the scaling effect to create the pulse animation
            const scaledWidth = this.promptImageWidth * this.scale;
            const scaledHeight = this.promptImageHeight * this.scale;
            
            // Get the background position from the configuration
            const config = this.calculateBackgroundConfig();
            
            // Center the image horizontally and position it according to the configuration
            const offsetX = (this.width - scaledWidth) / 2;
            const offsetY = this.height * config.yPosition;
            
            // Draw the prompt background with the scaling effect applied
            // and preserve aspect ratio
            this.context.drawImage(
                this.prompt_image,
                offsetX,
                offsetY,
                scaledWidth,
                scaledHeight
            );
            
            // Only draw the text if the stone hasn't been dropped
            this.rightToLeft
                ? this.drawRTLLang()
                : this.drawOthers();
        }
    }

    /**
     * Handles stone drop events.
     * @param event The event.
     */
    public handleStoneDrop(event) {
        this.isStoneDropped = true;
    }

    /**
     * Handles load puzzle events.
     * @param event The event.
     */
    public handleLoadPuzzle(event) {
        this.droppedStones = 0;
        this.droppedStoneCount = 0
        this.currentPuzzleData = this.levelData.puzzles[event.detail.counter]
        this.currentPromptText = this.currentPuzzleData.prompt.promptText;
        this.targetStones = this.currentPuzzleData.targetStones;
        this.audioPlayer.preloadPromptAudio(this.getPromptAudioUrl());
        this.isStoneDropped = false;
        this.time = 0;
    }

    /**
     * Disposes the component.
     */
    public dispose() {
        document.removeEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
        this.unregisterEventListener();
    }

    /**
     * Sets the dropped stone index.
     * @param index The index.
     */
    droppedStoneIndex(index: number) {
        this.droppedStones = index;
        this.droppedStoneCount++;
    }

    /**
     * Calculates the font size.
     * @returns The font size.
     */
    calculateFont(): number {
        return (this.promptImageWidth / this.currentPromptText.length > 35) ? 35 : this.width * 0.65 / this.currentPromptText.length
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
     * Handles visibility change events.
     */
    handleVisibilityChange = () => {
        if (document.visibilityState == "hidden") {
            this.audioPlayer.stopAllAudios();
            this.isAppForeground = false
        }
        if (document.visibilityState == "visible") {
            this.isAppForeground = true
        }
    }

    /**
     * Loads the images.
     */
    async loadImages() {
        const image1Promise = this.loadImage(this.prompt_image, PROMPT_TEXT_BG);
        const image2Promise = this.loadImage(this.promptPlayButton, PROMPT_PLAY_BUTTON);
        await Promise.all([image1Promise, image2Promise]);
        this.imagesLoaded = true;

        // Apply responsive sizing after images are loaded
        this.applyPromptImageResponsiveSizing();
    }

    /**
     * Applies responsive sizing to the prompt image based on screen width.
     * Ensures the image displays correctly across different device sizes
     * while maintaining proper aspect ratio.
     */
    applyPromptImageResponsiveSizing() {
        const config = this.calculateBackgroundConfig();
        const baseSize = Math.min(this.width, this.height) * config.sizeFactor;
        
        // Set the prompt image dimensions based on the configuration
        this.promptImageWidth = baseSize;
        this.promptImageHeight = baseSize; // Maintain aspect ratio
    }

    /**
     * Loads an image.
     * @param image The image.
     * @param src The source URL.
     * @returns A promise that resolves when the image is loaded.
     */
    loadImage(image: HTMLImageElement, src: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            image.onload = () => {
                resolve();
            };
            image.src = src;
            image.onerror = (error) => {
                reject(error);
            };
        });
    }
}