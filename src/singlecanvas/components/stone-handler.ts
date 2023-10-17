import { lang, pseudoId } from "../../../global-variables";
// import { FeedbackAudio, GameFields, PhraseAudio } from "../common/common.js";
import Sound from "../../common/sound";
import { StoneConfig } from "../common/stone-config";
import { getDatafromStorage } from "../../data/profile-data";
import { FirebaseIntegration } from "../../firebase/firebase_integration";
import { EventManager } from "../events/EventManager";
import { Tutorial } from "./tutorial";
import { AudioPlayer } from "./audio-player";
import { VISIBILITY_CHANGE } from "../common/event-names";
import { Utils } from "../common/utils";
import { TimerTicking } from "./timer-ticking";
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
    public audioPlayer: AudioPlayer;
    public feedbackAudios: any;
    public timerTickingInstance: TimerTicking;
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
        feedbackAudios,
        timerTickingInstance
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
        this.feedbackAudios = this.convertFeedBackAudiosToList(feedbackAudios);
        this.puzzleStartTime = new Date();
        this.tutorial = new Tutorial(context,canvas.width,canvas.height,puzzleNumber)
        this.stonebg = new Image();
        this.stonebg.src = "./assets/images/stone_pink_v02.png";
        this.audioPlayer = new AudioPlayer();
        this.stonebg.onload = (e) => {
            this.createStones(this.stonebg)
            // this.stoneConfig = new StoneConfig(this.context, this.height, this.width, "text", 100, 100, img);
        }
        this.audioPlayer = new AudioPlayer();
        this.timerTickingInstance = timerTickingInstance;
        document.addEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
    }

    createStones(img) {
        const foilStones=this.getFoilStones();
        for (var i = 0; i < foilStones.length; i++) {
            if(foilStones[i]==this.correctTargetStone)
        {
            this.tutorial.updateTargetStonePositions(this.stonePos[i]);
        }

            this.foilStones.push(
                
                new StoneConfig(
                    this.context,
                    this.canvas.width,
                    this.canvas.height,
                    foilStones[i],
                    this.stonePos[i][0],
                    this.stonePos[i][1],
                    img,
                    this.timerTickingInstance,
                    (i==foilStones.length-1)?this.tutorial:null,
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
        this.tutorial.setPuzzleNumber(event.detail.counter);
        this.puzzleNumber = event.detail.counter;
        this.setTargetStone(this.puzzleNumber);
        this.initializeStonePos();
        this.createStones(this.stonebg);
    }

    public dispose() {
        document.removeEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange, false);
        this.unregisterEventListener();
    }

    public isStoneDroppedCorrectForLetterOnly(droppedStone: string,feedBackIndex:number): boolean {
        if(droppedStone == this.correctTargetStone)
        {
            this.audioPlayer.playFeedbackAudios(false, "./assets/audios/Eat.mp3","./assets/audios/Cheering-02.mp3", Utils.getConvertedDevProdURL(this.feedbackAudios[feedBackIndex]));
            return true;
        }
        else{
            this.audioPlayer.playFeedbackAudios(false, "./assets/audios/MonsterSpit.mp3");
            return false;
        }
    }

    public isStoneDroppedCorrectForLetterInWord(droppedStone: string,feedBackIndex:number): boolean {
        if(droppedStone == this.correctTargetStone)
        {
            this.audioPlayer.playFeedbackAudios(false, "./assets/audios/Eat.mp3","./assets/audios/Cheering-02.mp3", Utils.getConvertedDevProdURL(this.feedbackAudios[feedBackIndex]));
           
            return true;
        }
        else{
            this.audioPlayer.playFeedbackAudios(false, "./assets/audios/MonsterSpit.mp3");
            return false;
        }
    }

    public isStonDroppedCorrectForWord(droppedStone: string,feedBackIndex:number): boolean {
        if (droppedStone == this.correctTargetStone.substring(0, droppedStone.length)) {
            if(droppedStone== this.getCorrectTargetStone()){
                this.audioPlayer.playFeedbackAudios(false, "./assets/audios/Eat.mp3","./assets/audios/Cheering-02.mp3", Utils.getConvertedDevProdURL(this.feedbackAudios[feedBackIndex]));
            }else{
                this.audioPlayer.playFeedbackAudios(false, "./assets/audios/Eat.mp3","./assets/audios/Cheering-02.mp3");
            }
            return true;
        } else {
            return false;
        }
    }

    public getCorrectTargetStone(): string {
        return this.correctTargetStone;
    }

    public getFoilStones(){
       
    this.currentPuzzleData.targetStones.forEach((e) => {
    const index = this.currentPuzzleData.foilStones.indexOf(e);
    if (index !== -1) {
    this.currentPuzzleData.foilStones.splice(index, 1);
  }
});


const totalStonesCount =
  this.currentPuzzleData.targetStones.length +
  this.currentPuzzleData.foilStones.length;

if (totalStonesCount > 8) {
  
  const extraStonesCount = totalStonesCount - 8;

  
  this.currentPuzzleData.foilStones.splice(0, extraStonesCount);
}


this.currentPuzzleData.targetStones.forEach((e) => {
  this.currentPuzzleData.foilStones.push(e);
});
  return this.currentPuzzleData.foilStones.sort(() => Math.random() - 0.5);
    }

    handleVisibilityChange = () => {
        this.audioPlayer.stopAllAudios();
    }

 
  convertFeedBackAudiosToList(feedbackAudios){
    let feedBackAudioArray = [];
    feedBackAudioArray.push(feedbackAudios['fantastic'],feedbackAudios['great']);
    return feedBackAudioArray;
    }   

 }