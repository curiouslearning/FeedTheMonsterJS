
import { EventManager } from "../events/EventManager";
import { Utils } from "../common/utils";
import { AudioPlayer } from "./audio-player";
import { VISIBILITY_CHANGE } from "../common/event-names";
import { PromptAudio } from "../common/common";
import { lang } from "../../global-variables";


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

        this.loadImages().then(()=>{
            console.log('Images loaded');
        });

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
            console.log('Clicked on Play prompt audio');
            this.playSound();
        }
    }

    public getPromptAudioUrl = (): string => {
        return Utils.getConvertedDevProdURL(this.currentPuzzleData.prompt.promptAudio);
    }

    playSound = () => {
        console.log('PromptAudio',  Utils.getConvertedDevProdURL(this.currentPuzzleData.prompt.promptAudio));
        if (this.isAppForeground) {
            this.audioPlayer.playPromptAudio(Utils.getConvertedDevProdURL(this.currentPuzzleData.prompt.promptAudio));
        }
    }

    onClick(xClick, yClick) {
        if (
            Math.sqrt(xClick - this.width / 3) < 12 &&
            Math.sqrt(yClick - this.height / 5.5) < 10
        ) {
            return true;
        }
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
        this.context.font = `${fontSize}px ${Utils.getLanguageSpecificFont(lang)}, monospace`;
        if (this.levelData.levelMeta.levelType == "LetterInWord") {
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
        } else if (this.levelData.levelMeta.levelType == "Word") {
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
        } 
        else if (this.levelData.levelMeta.levelType == "audioPlayerWord") {
            const scaledWidth = this.promptImageWidth * this.scale;
                    const scaledHeight = this.promptImageHeight * this.scale;
                    // const offsetX = (this.width - scaledWidth) / 2;
                    // const offsetY = (this.height - scaledHeight) / 5;
                    const offsetX = (this.width - scaledWidth) *1.25;
                    const offsetY = (this.height - scaledHeight) *0.33;
                    this.context.drawImage(
                        this.promptPlayButton,
                        offsetX,
                        offsetY,
                        scaledWidth/4,
                        scaledHeight/4
                    );
        }
        else {
            this.context.fillStyle = "black";
            this.context.fillText(this.currentPromptText, x, y);
        }
    }
    drawOthers() {
        const promptTextLetters = this.currentPromptText.split("");
        const x = this.width / 2;
        const y = this.height * 0.28;
        
        var fontSize = this.calculateFont();
        this.context.font = `${fontSize}px ${Utils.getLanguageSpecificFont(lang)}, monospace`;
        const startPrompttextX =
            this.width / 2 -
            this.context.measureText(this.currentPromptText).width / 2;
        let currentWordWidth = 0;
        var letterHighlight: Array<string> =
            this.currentPuzzleData.targetStones[0].split("");
        for (let i = 0; i < promptTextLetters.length; i++) {
            switch (this.levelData.levelMeta.levelType) {
                case "LetterInWord": {
                    if (letterHighlight.includes(promptTextLetters[i])) {
                        letterHighlight = letterHighlight.slice(1, letterHighlight.length);
                        this.context.fillStyle = "red";
                        this.context.fillText(
                            promptTextLetters[i],
                            startPrompttextX + currentWordWidth,
                            y
                        );
                    } else {
                        this.context.fillStyle = "black";
                        this.context.fillText(
                            promptTextLetters[i],
                            startPrompttextX + currentWordWidth,
                            y
                        );
                    }
                    break;
                }
                case "Word": {
                    if (this.droppedStones > i || this.droppedStones == undefined) {
                        this.context.fillStyle = "black";
                        this.context.fillText(
                            promptTextLetters[i],
                            startPrompttextX + currentWordWidth,
                            y
                        );
                    } else {
                        this.context.fillStyle = "red";
                        this.context.fillText(
                            promptTextLetters[i],
                            startPrompttextX + currentWordWidth,
                            y
                        );
                    }
                    break;
                }
                case "audioPlayerWord": {
                    const scaledWidth = this.promptImageWidth;
                    const scaledHeight = this.promptImageHeight;
                    const offsetX = (this.width - scaledWidth) *1.25;
                    const offsetY = (this.height - scaledHeight) *0.33;
                    this.context.drawImage(
                        this.promptPlayButton,
                        offsetX,
                        offsetY,
                        scaledWidth/4,
                        scaledHeight/4
                    );
                  break;
                }
                default: {
                    this.context.fillStyle = "black";
                    this.context.fillText(
                        this.currentPromptText,
                        startPrompttextX,
                        y
                    );
                }
            }
            currentWordWidth = this.context.measureText(
                this.currentPromptText.substring(0, i + 1)
            ).width;
        }
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
            const offsetY = (this.height - scaledHeight) / 5;
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

    update() {

    }
    droppedStoneIndex(index:number){
        this.droppedStones = index;
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
        const image1Promise = this.loadImage(this.prompt_image, "./assets/images/promptTextBg.png");
        const image2Promise = this.loadImage(this.promptPlayButton, "./assets/images/promptPlayButton.png");
    
        await Promise.all([image1Promise, image2Promise]);
    
        this.imagesLoaded = true;
        // You can do additional actions here after both images are loaded.
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
