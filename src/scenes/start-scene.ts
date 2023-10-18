import {
    FirebaseUserClicked,
    PWAInstallStatus,
    StartScene1,
    loadImages
} from "../common/common";
import { StoneConfig } from "../common/stone-config"

import { Monster } from "../components/monster";
import { DataModal } from "../data/data-modal";
import { Debugger, lang } from "../../global-variables";
import { Background } from "../components/background"
import { AudioPlayer } from "../components/audio-player";
import { FirebaseIntegration } from "../Firebase/firebase-integration";
import { Utils } from "../common/utils";
import { IgnorePlugin } from "webpack";
import PlayButton from "../components/play-button";
// var this: any;
let lastTime = 0;
let pwa_install_status: any;
const toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    pwa_install_status = e;
    localStorage.setItem(PWAInstallStatus, "false");
});

// let SceneName = StartScene1;
export class StartScene {
    public canvas: HTMLCanvasElement;
    public data: any;
    public width: number;
    public height: number;
    // public canvasStack: any;
    public monster: Monster;
    // public levelIndicator: LevelIndicators;
    // public promptText: PromptText;
    // public timerTicking: TimerTicking;
    // public pauseMenu: PausePopUp;
    // public stoneHandler: StoneHandler;
    public pickedStone: StoneConfig;
    // public stoneConfig: StoneConfig;
    public pwa_status: string;
    public firebase_analytics: { logEvent: any };
    public id: string;
    public canavsElement: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;
    public buttonContext: CanvasRenderingContext2D;
    public outcome: any;
    public playButton: PlayButton;
    public levelSelectionScene: any;
    public images: Object;
    public loadedImages: any;
    public imagesLoaded: boolean = false;
    public handler: any;
    public static SceneName: string;
    public switchSceneToLevelSelection: any;
    public titleFont: number;
    public background1: Background;
    audioPlayer: AudioPlayer;


    constructor(
        canvas: HTMLCanvasElement,
        data: DataModal,
        switchSceneToLevelSelection
    ) {
        // this = this;
        this.canvas = canvas;
        this.data = data;
        this.width = canvas.width;
        this.height = canvas.height;
        this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
        this.context = this.canavsElement.getContext("2d");
        this.monster = new Monster(this.canvas, 4);
        this.switchSceneToLevelSelection = switchSceneToLevelSelection;
        this.background1 = new Background(this.context, this.width, this.height, 1);
        this.audioPlayer = new AudioPlayer();
       

        this.pwa_status = localStorage.getItem(PWAInstallStatus);
        this.handler = document.getElementById("canvas");
        this.devToggle();
        this.createPlayButton();
        // this.firebase_analytics = firebase_analytics;
        StartScene.SceneName = StartScene1;
        
        // this.animation(0);
        this.images = {
            pillerImg: "./assets/images/Totem_v02_v01.png",
            bgImg: "./assets/images/bg_v01.jpg",
            hillImg: "./assets/images/hill_v01.png",
            grassImg: "./assets/images/FG_a_v01.png",
            fenchImg: "./assets/images/fence_v01.png",
            profileMonster: "./assets/images/idle4.png"
        }

        loadImages(this.images, (images) => {
            this.loadedImages = Object.assign({}, images);
            this.imagesLoaded = true;
        });

    }

    devToggle() {
        toggleBtn.addEventListener("click", () => {
            toggleBtn.classList.toggle("on");

            if (toggleBtn.classList.contains("on")) {
                Debugger.DebugMode = true;
                toggleBtn.innerText = "Dev";
            } else {
                Debugger.DebugMode = false;
                toggleBtn.innerText = "Dev";
            }
        });
    }

    animation = (deltaTime) => {
        this.titleFont = this.getFontWidthOfTitle();
       
        this.context.clearRect(0, 0, this.width, this.height);
        if (StartScene.SceneName == StartScene1) {
            
            if (this.imagesLoaded) {
                this.background1.draw();
                this.context.font = `${this.titleFont}px ${Utils.getLanguageSpecificFont(lang)}, monospace`;
                this.context.fillStyle = "white";
                this.context.textAlign = "center";
                this.context.fillText(this.data.title, this.width * 0.5, this.height / 10);
                this.monster.animation(deltaTime);
                this.playButton.draw();
            }
        }
    }

    draw() {
    }

    createPlayButton() {
        this.playButton = new PlayButton(
            this.context,
            this.canvas,
            this.canvas.width * 0.35,
            this.canvas.height / 7
        );
        // #1
        document.addEventListener("selectstart", function (e) {
            e.preventDefault();
        });
        // #2
        this.handler.addEventListener(
            "click",
            this.handleMouseClick,
            false
        );
    }

    handleMouseClick = (event) => {
        let self = this;
        const selfElement = <HTMLElement>document.getElementById("canvas");
        event.preventDefault();
        var rect = selfElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (self.playButton.onClick(x, y)) {
            FirebaseIntegration.getInstance().sendUserClickedOnPlayEvent();
            fbq("trackCustom", FirebaseUserClicked, {
                event: "click",
            });
            toggleBtn.style.display = "none";
            this.audioPlayer.playAudio(false, "./assets/audios/ButtonClick.mp3");
            self.switchSceneToLevelSelection('StartScene');
        }


    }

    dispose() {
        this.audioPlayer.stopAudio();
        this.handler.removeEventListener("click", this.handleMouseClick, false);
    }

    getFontWidthOfTitle(){
        return (this.width+200)/this.data.title.length;
    }
}
