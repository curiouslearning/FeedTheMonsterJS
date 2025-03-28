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
    }
    drawRTLLang() {
        var x = this.width / 2;
        const y = this.height * 0.26;
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
            this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
        }}
        else if (this.levelData.levelMeta.levelType == "audioPlayerWord") {
                    this.drawCenteredPlayButton(this.height * 0.4, scaledWidth, scaledHeight);
        }
        else {
            if (this.levelData.levelMeta.protoType == "Visible") {
            this.context.fillStyle = "black";
            this.context.fillText(this.currentPromptText, x, y);
            }else{
                this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
            }
        }
    }
    drawOthers() {
        const promptTextLetters = this.currentPromptText.split("");
        const x = this.width / 2;
        const y = this.height * 0.28;
        const scaledWidth = this.promptImageWidth;
        const scaledHeight = this.promptImageHeight;
        var fontSize = this.calculateFont();
        this.context.font = `${fontSize}px ${font}, monospace`;
        let startPrompttextX =
            this.width / 2 -
            this.context.measureText(this.currentPromptText).width / 2;
        let currentWordWidth = 0;
        var letterHighlight=this.currentPuzzleData.targetStones[0];
        var leftPromptText = 
            this.currentPromptText.substring
            (0,this.currentPromptText.indexOf(letterHighlight));
        var rightPromptText = 
            this.currentPromptText.substring
            (this.currentPromptText.indexOf(letterHighlight)+letterHighlight.length);
        if (this.levelData.levelMeta.levelType === "LetterInWord" && this.levelData.levelMeta.protoType == "Visible" ) {
            if (leftPromptText.length>0) {
                this.context.fillStyle = "black";
                this.context.fillText(
                    leftPromptText,
                    startPrompttextX,
                    y
                );         
                currentWordWidth = (this.context.measureText(
                    leftPromptText
                ).width + this.context.measureText(
                    letterHighlight
                ).width) / 2;
                startPrompttextX += currentWordWidth;
            }
            if(letterHighlight.length>0){
                this.context.fillStyle = "red";
                this.context.fillText(
                    letterHighlight,
                    startPrompttextX,
                    y
                );
                currentWordWidth = (this.context.measureText(
                    letterHighlight
                ).width + this.context.measureText(
                    rightPromptText
                ).width) / 2;
                startPrompttextX += currentWordWidth;
            }
            if(rightPromptText.length>0) {
                this.context.fillStyle = "black";
                this.context.fillText(
                    rightPromptText,
                    startPrompttextX,
                    y
                );
            }
        }
        for (let i = 0; i < promptTextLetters.length; i++) {
            switch (this.levelData.levelMeta.levelType) {
                case "LetterInWord": {
                    break;
                }
                case "Word": {
                    if (this.levelData.levelMeta.protoType == "Visible") {
                    if(this.targetStones.length!=this.currentPromptText.length){
                    if(this.targetStones.length>i){   
                        this.context.fillStyle = (this.droppedStoneCount>i || this.droppedStoneCount==undefined)?"black":"red";
                        this.context.fillText(
                            this.targetStones[i],
                            startPrompttextX+startPrompttextX/10,
                            y
                        );    
                }
                break;
                }else{
                      this.context.fillStyle = (this.droppedStones > i || this.droppedStones == undefined)?"black":"red";
                        this.context.fillText(
                            promptTextLetters[i],
                            startPrompttextX,
                            y
                        );
                    
                    break;
                }}
                else{
                    this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
            }}
                case "SoundWord": {
                    this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
                  break;
                }
                default: {
                    if (this.levelData.levelMeta.protoType == "Visible") {
                    this.context.fillStyle = "black";
                    this.context.fillText(
                        this.currentPromptText,
                        this.width/2.1,
                        y
                    );
                    break;
                }else{
                    this.drawCenteredPlayButton(y, scaledWidth, scaledHeight);
                }}
            }
            currentWordWidth = (this.context.measureText(
                promptTextLetters[i]
            ).width + this.context.measureText(
                promptTextLetters[i + 1]
            ).width) / 2;
            startPrompttextX += currentWordWidth;
        }
    }
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
    draw(deltaTime: number) {
    this.updateScaling();
    this.time = (deltaTime<17)?this.time+Math.floor(deltaTime):this.time+16;
      if (Math.floor(this.time) >= 1910 && Math.floor(this.time) <= 1926) {
        this.playSound();
      }
        if (!this.isStoneDropped) {
            const scaledWidth = this.promptImageWidth * this.scale;
            const scaledHeight = this.promptImageHeight * this.scale;
            const offsetX = (this.width - scaledWidth) / 2;
            const offsetY = (this.height - scaledHeight) / 4.2;
            this.context.drawImage(
                this.prompt_image,
                offsetX,
                offsetY,
                scaledWidth,
                scaledHeight
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
      }
      
      /**
       * Applies responsive sizing to the prompt image based on screen width
       */
      applyPromptImageResponsiveSizing() {
        const screenWidth = window.innerWidth;
        
        // Adjust prompt image dimensions for smaller screens
        if (screenWidth <= 375) {
          // Small mobile devices
          this.promptImageWidth = this.width * 0.6;
          this.promptImageHeight = this.height * 0.25;
        } else if (screenWidth <= 480) {
          // Medium mobile devices
          this.promptImageWidth = this.width * 0.6;
          this.promptImageHeight = this.height * 0.30;
        } else {
          // Default for larger screens
          this.promptImageWidth = this.width * 0.65;
          this.promptImageHeight = this.height * 0.3;
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