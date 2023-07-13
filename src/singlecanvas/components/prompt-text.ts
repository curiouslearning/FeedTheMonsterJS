
import { Game } from "../../scenes/game";
import Sound from "../../common/sound";
import { PromptAudio } from "../../common/common"
import { EventManager } from "../events/EventManager";


var self;
export class PromptText extends EventManager {
    public width: number;
    public height: number;
    public levelData: any;
    public currentPromptText: any;
    public currentPuzzleData: any;
    public fntstOrGrtImgArr: any;
    public id: any;
    public canavsElement: any;
    public context: any;
    public prompt_image: any;
    public targetStones: any;
    public rightToLeft: boolean;
    public imagesLoaded: boolean = false;
    public handler: any;
    public sound: Sound;
    public isStoneDropped: boolean = false;

    constructor(width, height, currentPuzzleData, levelData, rightToLeft) {
        super({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        })
        this.width = width;
        this.height = height;
        this.levelData = levelData;
        this.rightToLeft = rightToLeft;
        this.sound = new Sound();
        self = this;
        this.currentPromptText = currentPuzzleData.prompt.promptText;
        this.currentPuzzleData = currentPuzzleData;
        this.targetStones = this.currentPuzzleData.targetStones;
        this.fntstOrGrtImgArr = [];
        this.canavsElement = document.getElementById("canvas");
        this.context = this.canavsElement.getContext("2d");


        this.prompt_image = new Image();
        this.prompt_image.src = "./assets/images/promptTextBg.png";
        this.prompt_image.onload = function (e) {
            this.imagesLoaded = true;
        };
        // this.handler = document.getElementById("canvas");
        // this.handler.addEventListener(
        //     "click",
        //     this.handleMouseDown,
        //     false
        // );
    }

    handleMouseDown = (event) => {
        let self = this;
        const selfElement = <HTMLElement>document.getElementById("canvas");
        event.preventDefault();
        var rect = selfElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (self.onClick(x, y)) {
            self.sound.playSound(
                self.currentPuzzleData.prompt.promptAudio,
                PromptAudio
            );
        }
    }

    playSound = () => {
        this.sound.playSound(
            this.currentPuzzleData.prompt.promptAudio,
            PromptAudio
        );
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

    showFantasticOrGreat(feedBackText) {
        this.context.font = "bold 24px Arial";
        this.context.fillStyle = "white";
        this.context.fillText(
            "feedBackText",
            this.width / 2 - this.context.measureText("feedBackText").width / 2,
            this.height * 0.25
        );
    }

    drawArabic(droppedStones = 0) {
        var x = this.width / 2;
        const y = this.height * 0.26;
        this.context.textAlign = "center";
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
            x = x - this.context.measureText(this.currentPromptText).width * 0.8;
            for (let i = this.targetStones.length - 1; i >= 0; i--) {
                x = x + this.context.measureText(this.targetStones[i]).width + 5;
                if (droppedStones > i || droppedStones == undefined) {
                    this.context.fillStyle = "black";
                    this.context.fillText(this.targetStones[i], x, y);
                } else {
                    this.context.fillStyle = "red";
                    this.context.fillText(this.targetStones[i], x, y);
                }
            }
        } else {
            this.context.fillStyle = "black";
            this.context.fillText(this.currentPromptText, x, y);
        }
    }
    drawOthers(droppedStones = 0) {
        const promptTextLetters = this.currentPromptText.split("");
        const x = this.width / 2;
        const y = this.height * 0.26;
        var fontSize = 20;
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
                    if (droppedStones > i || droppedStones == undefined) {
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
                default: {
                    this.context.fillStyle = "black";
                    this.context.fillText(
                        promptTextLetters[i],
                        startPrompttextX + currentWordWidth,
                        y
                    );
                }
            }
            currentWordWidth = this.context.measureText(
                this.currentPromptText.substring(0, i + 1)
            ).width;
        }
    }
    draw(droppedStones = 0) {
        if (!this.isStoneDropped) {
            this.context.drawImage(
                this.prompt_image,
                this.width / 2 - (this.width * 0.5) / 2,
                // this.width / 2 - (this.width * 0.5),
                this.height * 0.15,
                this.width * 0.5,
                this.height * 0.25
            );
            this.context.fillStyle = "black";
            this.context.font = 30 + "px Arial";
            this.rightToLeft
                ? this.drawArabic(droppedStones)
                : this.drawOthers(droppedStones);
        }
    }

    public handleStoneDrop(event) {
        this.isStoneDropped = true;
    }

    public handleLoadPuzzle(event) {
        this.currentPuzzleData = this.levelData.puzzles[event.detail.counter]
        this.currentPromptText = this.currentPuzzleData.prompt.promptText;
        this.targetStones = this.currentPuzzleData.targetStones;
        this.isStoneDropped = false;
    }

    public dispose() {
        this.unregisterEventListener();
    }

    update() {

    }
}
