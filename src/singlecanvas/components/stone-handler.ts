import { lang, pseudoId } from "../../../global-variables";
// import { FeedbackAudio, GameFields, PhraseAudio } from "../common/common.js";
import Sound from "../../common/sound";
import { StoneConfig } from "../common/stone-config";
import { getDatafromStorage } from "../../data/profile-data";
import { FirebaseIntegration } from "../../firebase/firebase_integration";
import { EventManager } from "../events/EventManager";
import { Tutorial } from "./tutorial";
// import { LevelIndicators } from "./level-indicators.js";
// import { Tutorial } from "./tutorial.js";
// import Monster from "./animation/monster.js";
// import { TextEffects } from "./animation/text_effects.js";
// import PromptText from "./prompt_text.js";
var self;
var frameCount: number = 0;
var audioUrl = {
    phraseAudios: [
        "./lang/" + lang + "/audios/fantastic.mp3",
        "./lang/" + lang + "/audios/great.mp3",
    ],
    monsterSplit: "./assets/audios/Monster Spits wrong stones-01.mp3",
    monsterEat: "./assets/audios/Eat.mp3",
    monsterHappy: "./assets/audios/Cheering-02.mp3",
    monsterSad: "./assets/audios/Disapointed-05.mp3",
    ondragStart: "./assets/audios/onDrag.mp3",
};
export default class StoneHandler extends EventManager {
    public context: CanvasRenderingContext2D;
    public canvas: { width: any; height?: number };
    public currentPuzzleData: any;
    public targetStones: any;
    public stonePos: Array<any>;
    public pickedStone: StoneConfig;
    public stoneHtmlElement: any;
    public foilStones: Array<StoneConfig> = new Array<StoneConfig>();
    // public monster: Monster;
    public answer: string = "";
    // public callbackFuntion: any;
    // public levelIndicators: LevelIndicators;
    public puzzleNumber: number;
    public levelData: any;
    // public promptButton: PromptText;
    public correctAnswer: string;
    // public feedbackEffects: TextEffects;
    public tutorialPosition: Array<any>;
    public audio: Sound;
    public puzzleStartTime: Date;
    // public tutorial: Tutorial;
    public showTutorial: boolean = getDatafromStorage().length == undefined ? true : false;
    // feedbackTextCanvasElement: any;
    public feedBackTexts: any;
    public image: any;
    public tutorial: Tutorial;
    correctTargetStone: any;
    stonebg: HTMLImageElement;
    constructor(
        context: CanvasRenderingContext2D,
        canvas: { width: number; height?: number },
        // stoneHtmlElement,
        puzzleNumber,
        levelData,
        // monster,
        // levelIndicators,
        // promptButton,
        // feedbackEffects,
        // feedBackTexts,
        // audio,
        // feedbackTextCanvasElement
        // callbackFuntion
    ) {
        super({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        })
        self = this;
        this.context = context;
        this.canvas = canvas;
        // this.stoneHtmlElement = stoneHtmlElement;
        this.puzzleNumber = puzzleNumber;
        this.levelData = levelData;
        // this.feedBackTexts = feedBackTexts;
        this.setTargetStone(this.puzzleNumber)
        // this.monster = monster;
        // this.levelIndicators = levelIndicators;
        // this.callbackFuntion = callbackFuntion;
        // this.correctAnswer = this.targetStones.join("");
        this.initializeStonePos();
        // this.feedbackEffects = feedbackEffects;
        // this.feedbackTextCanvasElement = feedbackTextCanvasElement;
        // this.promptButton = promptButton;
        // this.audio = audio;
        // this.tutorial = new Tutorial(context, canvas);
        // this.createStones();
        // this.draw(0);
        // this.eventListners();
        this.puzzleStartTime = new Date();
        this.tutorial = new Tutorial(context,canvas.width,canvas.height)
        this.stonebg = new Image();
        this.stonebg.src = "./assets/images/stone_pink_v02.png";
        this.stonebg.onload = (e) => {
            this.createStones(this.stonebg)
            // this.stoneConfig = new StoneConfig(this.context, this.height, this.width, "text", 100, 100, img);
        }
    }

    createStones(img) {
        for (var i = 0; i < this.currentPuzzleData.foilStones.length; i++) {
            if(this.currentPuzzleData.foilStones[i]==this.correctTargetStone)
        {
            this.tutorial.updateTargetStonePositions(this.stonePos[i]);
        }

            this.foilStones.push(
                
                new StoneConfig(
                    this.context,
                    this.canvas.width,
                    this.canvas.height,
                    this.currentPuzzleData.foilStones[i],
                    this.stonePos[i][0],
                    this.stonePos[i][1],
                    img,
                    (i==this.currentPuzzleData.foilStones.length-1)?this.tutorial:null,
                )
            );

        }
        
        
       
        // this.foilStones.forEach((stone) => {
        //     if (stone.text == this.targetStones[0]) {
        //         // this.tutorialPosition = [stone.targetX, stone.targetY];
        //         // this.tutorial.updateTargetStonePositions(this.tutorialPosition);
        //         // this.tutorial.animateImage();
        //     }
        // });
    }
    displayTutorial() {
        // if (!GameFields.showTutorial) {
        //     GameFields.setTimeOuts.timerShowTutorial = setTimeout(() => {
        //         GameFields.showTutorial = true;
        //         clearTimeout(GameFields.setTimeOuts.timerShowTutorial);
        //     }, 2000);
        // }
    }

    draw(deltaTime) {
        for (var i = 0; i < this.foilStones.length; i++) {
            this.foilStones[i].draw(deltaTime);
        }
        
    }


    initializeStonePos() {
        var offsetCoordinateValue = 32;
        this.stonePos = [
            [
                this.canvas.width / 5 - offsetCoordinateValue,
                this.canvas.height / 1.9 - offsetCoordinateValue,
            ],
            [
                this.canvas.width / 2 - offsetCoordinateValue,
                this.canvas.height / 1.15 - offsetCoordinateValue,
            ],
            [
                this.canvas.width / 3.5 + this.canvas.width / 2 - offsetCoordinateValue,
                this.canvas.height / 1.2 - offsetCoordinateValue,
            ],
            [
                this.canvas.width / 4 - offsetCoordinateValue,
                this.canvas.height / 1.28 - offsetCoordinateValue,
            ],
            [
                this.canvas.width / 7 - offsetCoordinateValue,
                this.canvas.height / 1.5 - offsetCoordinateValue,
            ],
            [
                this.canvas.width / 2.3 +
                this.canvas.width / 2.1 -
                offsetCoordinateValue,
                this.canvas.height / 1.9 - offsetCoordinateValue,
            ],
            [
                this.canvas.width / 2.3 +
                this.canvas.width / 2.1 -
                offsetCoordinateValue,
                this.canvas.height / 1.42 - offsetCoordinateValue,
            ],
            [
                this.canvas.width / 6 - offsetCoordinateValue,
                this.canvas.height / 1.15 - offsetCoordinateValue,
            ],
        ];
        this.stonePos = this.stonePos.sort(() => Math.random() - 0.5);
    }

    update(deltaTime) {

    }
    puzzleEndFirebaseEvents(
        success_or_failure,
        puzzle_number,
        item_selected,
        target,
        foils,
        response_time
    ) {
        var puzzleEndTime = new Date();
        FirebaseIntegration.customEvents("puzzle_completed", {
            cr_user_id: pseudoId,
            success_or_failure: success_or_failure,
            level_number: this.levelData.levelNumber,
            puzzle_number: puzzle_number,
            item_selected: item_selected,
            target: target,
            foils: foils,
            profile_number: 0,
            ftm_language: lang,
            version_number: document.getElementById("version-info-id").innerHTML,
            response_time: (puzzleEndTime.getTime() - response_time) / 1000,
        });
    }

    public setTargetStone(puzzleNumber) {
        this.currentPuzzleData = this.levelData.puzzles[puzzleNumber];
        this.targetStones = [...this.currentPuzzleData.targetStones];
        this.correctTargetStone = this.targetStones.join("");
    }
    public isDroppedStoneCorrect(droppedStone: string){
        if(droppedStone == this.correctTargetStone)
        {
            return true;
        }
        else{
            return false;
        }

    }

    public handleStoneDrop(event) {
        // this.isStoneDropped = true;
        this.foilStones = []
        
    }
    public handleLoadPuzzle(event) {
        this.foilStones = []
        this.puzzleNumber = event.detail.counter;
        this.setTargetStone(this.puzzleNumber);
        this.initializeStonePos();
        this.createStones(this.stonebg);
    }

    public dispose() {
        this.unregisterEventListener();
    }

    public isStoneDroppedCorrectForLetterOnly(droppedStone: string): boolean {
        if(droppedStone == this.correctTargetStone)
        {
            return true;
        }
        else{
            return false;
        }
    }

    public isStoneDroppedCorrectForLetterInWord(droppedStone: string): boolean {
        if(droppedStone == this.correctTargetStone)
        {
            return true;
        }
        else{
            return false;
        }
    }

    public isStonDroppedCorrectForWord(droppedStone: string): boolean {
        console.log(this.correctTargetStone.substring(0, droppedStone.length))
        if (droppedStone == this.correctTargetStone.substring(0, droppedStone.length)) {
            return true;
        } else {
            return false;
        }
    }

    public getCorrectTargetStone(): string {
        console.log(this.correctTargetStone, "<------------------");
        return this.correctTargetStone;
    }
 }