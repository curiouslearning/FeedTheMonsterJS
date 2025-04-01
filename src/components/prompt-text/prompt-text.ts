import { EventManager } from "@events";
import { Utils, font, VISIBILITY_CHANGE } from "@common";
import { AudioPlayer } from "@components";
import { PROMPT_PLAY_BUTTON, PROMPT_TEXT_BG } from "@constants";
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
    private droppedStoneCount=0;
    public time: number = 0;
    public promptImageWidth: number = 0;
    public isAppForeground: boolean = true;
    public scale:number = 1;
    public isScalingUp:boolean = true;
    public scaleFactor:number = 0.00050;
    public promptImageHeight: number = 0;
    public promptPlayButton: HTMLImageElement;
    // Text positioning variables - calculated once
    private textVerticalPosition: number = 0;
    private textHorizontalPosition: number = 0; 
    private promptBgOffsetX: number = 0;
    private promptBgOffsetY: number = 0;
    private promptBgScaledWidth: number = 0;
    private promptBgScaledHeight: number = 0;
    
    // Vertical positioning factors for different device sizes
    private textVerticalFactorSmallDevice: number = 0.45; 
    private textVerticalFactorLargeDevice: number = 0.40; 
    private smallDeviceThreshold: number = 480; 
    
    // Horizontal positioning adjustment (positive moves right, negative moves left)
    private textHorizontalOffset: number = 0; 
    
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
        
        // Calculate initial text position
        this.calculateInitialTextPosition();
        
        document.addEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
    }
    
    /**
     * Calculates the initial text position when the component is initialized
     * This ensures the text position is set correctly from the start
     */
    calculateInitialTextPosition() {
        // Set initial background dimensions
        this.promptBgScaledWidth = this.promptImageWidth * this.scale;
        this.promptBgScaledHeight = this.promptImageHeight * this.scale;
        this.promptBgOffsetX = (this.width - this.promptBgScaledWidth) / 2;
        this.promptBgOffsetY = (this.height - this.promptBgScaledHeight) / 4.2;
        
        // Determine which vertical factor to use based on device size
        const screenWidth = window.innerWidth;
        const verticalFactor = screenWidth <= this.smallDeviceThreshold ? 
            this.textVerticalFactorSmallDevice : this.textVerticalFactorLargeDevice;
        
        // Position text within the yellow burst area of the prompt background
        // Using a percentage of the actual height based on device size
        this.textVerticalPosition = this.promptBgOffsetY + (this.promptBgScaledHeight * verticalFactor);
        
        // Calculate horizontal position with offset
        this.textHorizontalPosition = this.width / 2 + this.textHorizontalOffset;
    }
    
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
    public getPromptAudioUrl = (): string => {
        return Utils.getConvertedDevProdURL(this.currentPuzzleData.prompt.promptAudio);
    }
    playSound = () => {
        if (this.isAppForeground) {
            this.audioPlayer.playPromptAudio(Utils.getConvertedDevProdURL(this.currentPuzzleData.prompt.promptAudio));
        }
    }
    onClick(xClick, yClick) {
        return Math.sqrt(xClick - this.width / 3) < 12 && Math.sqrt(yClick - this.height / 5.5) < 10
    }
    setCurrrentPuzzleData(data) {
        this.currentPuzzleData = data;
        this.currentPromptText = data.prompt.promptText;
        this.targetStones = this.currentPuzzleData.targetStones;
        
        // Recalculate text position when puzzle data changes
        this.calculateInitialTextPosition();
    }
    drawRTLLang() {
        // Always center text horizontally
        var x = this.textHorizontalPosition;
        // Use the pre-calculated vertical position
        const y = this.textVerticalPosition;
        
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
            );}
                else{
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
        } else{
            // For Word level type with non-Visible prototype, use standard vertical position
            // This aligns the play button with where the text would normally appear
            this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
        }}
        else if (this.levelData.levelMeta.levelType == "audioPlayerWord") {
                    // For audioPlayerWord type, position the play button at the vertical center of prompt background
                    this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
        }
        else {
            if (this.levelData.levelMeta.protoType == "Visible") {
            this.context.fillStyle = "black";
            this.context.fillText(this.currentPromptText, x, y);
            }else{
                // For default level types with non-Visible prototype
                // Position the play button at the standard text position
                this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
            }
        }
    }
    drawOthers() {
        const promptTextLetters = this.currentPromptText.split("");
        const x = this.textHorizontalPosition;
        // Use the pre-calculated vertical position
        const y = this.textVerticalPosition;
        
        const scaledWidth = this.promptImageWidth;
        const scaledHeight = this.promptImageHeight;
        var fontSize = this.calculateFont();
        this.context.font = `${fontSize}px ${font}, monospace`;
        
        // For LetterInWord level type with visible prototype
        if (this.levelData.levelMeta.levelType === "LetterInWord" && this.levelData.levelMeta.protoType == "Visible") {
            // Always use center alignment for consistent positioning
            this.context.textAlign = "center";
            
            var letterHighlight = this.currentPuzzleData.targetStones[0];
            
            // Draw the entire word in black first (as background)
            this.context.fillStyle = "black";
            this.context.fillText(this.currentPromptText, x, y);
            
            // Then overlay the highlighted letter in red
            // We need to calculate its position within the word
            var letterIndex = this.currentPromptText.indexOf(letterHighlight);
            if (letterIndex >= 0) {
                // Get the width of the text before the highlighted letter
                const beforeText = this.currentPromptText.substring(0, letterIndex);
                const beforeWidth = this.context.measureText(beforeText).width;
                
                // Get the width of the highlighted letter
                const letterWidth = this.context.measureText(letterHighlight).width;
                
                // Get the width of the entire word
                const totalWidth = this.context.measureText(this.currentPromptText).width;
                
                // Calculate the position to place the highlighted letter
                // Start from the center position, go left by half the total width,
                // then go right by the width of the text before the highlighted letter,
                // plus half the width of the highlighted letter itself
                const highlightX = x - (totalWidth / 2) + beforeWidth + (letterWidth / 2);
                
                // Draw just the highlighted letter in red, positioned precisely
                this.context.fillStyle = "red";
                this.context.fillText(letterHighlight, highlightX, y);
            }
        } 
        // For Word level type with visible prototype
        else if (this.levelData.levelMeta.levelType === "Word" && this.levelData.levelMeta.protoType == "Visible") {
            // Always use center alignment for consistent positioning
            this.context.textAlign = "center";
            
            // For Word level type, handle differently based on whether the target stones match the prompt text length
            if (this.targetStones.length != this.currentPromptText.length) {
                // If target stones don't match prompt text length, draw each stone centered
                for (let i = 0; i < this.targetStones.length; i++) {
                    if (i < this.targetStones.length) {   
                        this.context.fillStyle = (this.droppedStoneCount > i || this.droppedStoneCount == undefined) ? "black" : "red";
                        this.context.fillText(this.targetStones[i], x, y);
                    }
                }
            } else {
                // If target stones match prompt text length, draw the full text centered
                // First draw the entire word in the appropriate color (black or red)
                const isDropped = (this.droppedStones >= promptTextLetters.length || this.droppedStones == undefined);
                this.context.fillStyle = isDropped ? "black" : "red";
                this.context.fillText(this.currentPromptText, x, y);
            }
        }
        // For SoundWord level type
        else if (this.levelData.levelMeta.levelType === "SoundWord") {
            // For SoundWord level type, position the play button at the vertical center of prompt background
            this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
        }
        // For default level types
        else {
            // Always use center alignment for consistent positioning
            this.context.textAlign = "center";
            
            if (this.levelData.levelMeta.protoType == "Visible") {
                this.context.fillStyle = "black";
                // Draw text centered at the horizontal position
                this.context.fillText(this.currentPromptText, x, y);
            } else {
                // For default level types with non-Visible prototype
                // Position the play button at the standard text position
                this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
            }
        }
    }
    
    drawCenteredPlayButton(y: number, scaledWidth: number, scaledHeight: number) {
        // Use a fixed size for the button based on the screen size
        const buttonSize = Math.min(this.width, this.height) * 0.12;
        
        // Use a square dimension to preserve aspect ratio
        const buttonWidth = buttonSize;
        const buttonHeight = buttonSize;
        
        const centerX = this.textHorizontalPosition - buttonWidth / 2;
        const centerY = y - buttonHeight / 2;
        
        this.context.drawImage(
            this.promptPlayButton,
            centerX,
            centerY,
            buttonWidth,
            buttonHeight
        );
    }
    
    draw(deltaTime: number) {
        this.updateScaling();
        this.time = (deltaTime<17)?this.time+Math.floor(deltaTime):this.time+16;
        if (Math.floor(this.time) >= 1910 && Math.floor(this.time) <= 1926) {
            this.playSound();
        }
        if (!this.isStoneDropped) {
            // Draw the prompt background
            this.context.drawImage(
                this.prompt_image,
                this.promptBgOffsetX,
                this.promptBgOffsetY,
                this.promptBgScaledWidth,
                this.promptBgScaledHeight
            );
            
            this.context.fillStyle = "black";
            this.rightToLeft
                ? this.drawRTLLang()
                : this.drawOthers();
        }
    }
    public handleStoneDrop(event) {
        this.isStoneDropped = true;
    }
    public handleLoadPuzzle(event) {
        this.droppedStones = 0;
        this.droppedStoneCount=0
        this.currentPuzzleData = this.levelData.puzzles[event.detail.counter]
        this.currentPromptText = this.currentPuzzleData.prompt.promptText;
        this.targetStones = this.currentPuzzleData.targetStones;
        this.audioPlayer.preloadPromptAudio(this.getPromptAudioUrl());
        this.isStoneDropped = false;
        this.time = 0;
        
        // Recalculate text position when loading a new puzzle
        this.calculateInitialTextPosition();
    }
    public dispose() {
        document.removeEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
        this.unregisterEventListener();
    }
    droppedStoneIndex(index:number){
        this.droppedStones = index;
        this.droppedStoneCount++;
    }
    calculateFont():number{
        return (this.promptImageWidth/this.currentPromptText.length>35)?35:this.width * 0.65/this.currentPromptText.length
    }
    updateScaling() {
        if (this.isScalingUp) {
          this.scale += this.scaleFactor;
          if (this.scale >= 1.05) {
            this.isScalingUp = false;
          }
        } else {
          this.scale -= this.scaleFactor;
          if (this.scale <= 1) {
            this.scale = 1;
            this.isScalingUp = true;
          }
        }
    }
    handleVisibilityChange = () => {
        if (document.visibilityState == "hidden") {
            this.audioPlayer.stopAllAudios();
            this.isAppForeground = false
        }
        if (document.visibilityState == "visible") {
            this.isAppForeground = true
        }
    }
    async loadImages() {
        const image1Promise = this.loadImage(this.prompt_image, PROMPT_TEXT_BG);
        const image2Promise = this.loadImage(this.promptPlayButton, PROMPT_PLAY_BUTTON);
        await Promise.all([image1Promise, image2Promise]);
        this.imagesLoaded = true;
        
        // Apply responsive sizing after images are loaded
        this.applyPromptImageResponsiveSizing();
        
        // Calculate text position once after images are loaded
        this.calculateInitialTextPosition();
      }
      
      /**
       * Applies responsive sizing to the prompt image based on screen width
       * Ensures the image displays correctly across different device sizes
       * 
       * - Mobile devices (≤480px): Scale down the image
       * - Very small screens (≤375px): 25% of original height
       * - Medium-small screens (376-480px): 30% of original height
       * - Larger screens: Use default values set in constructor
       */
      applyPromptImageResponsiveSizing() {
        const screenWidth = window.innerWidth;
        
        // For mobile devices (width ≤ 480px), we scale down the image
        // For larger screens, we keep the default values set in the constructor
        if (screenWidth <= 480) {
          // Apply mobile-specific scaling factors
          this.promptImageWidth = this.width * 0.6; // 60% of original width for all mobile devices
          
          // Height varies based on screen size:
          // - Very small screens (≤375px): 25% of original height
          // - Medium-small screens (376-480px): 30% of original height
          this.promptImageHeight = this.height * (screenWidth <= 375 ? 0.25 : 0.30);
        }
      }
      
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