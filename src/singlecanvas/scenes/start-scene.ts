import {
    ButtonClick,
    FirebaseUserClicked,
    FirebaseUserInstall,
    loadingScreen,
    MonsterLayer,
    PlayButtonLayer,
    PWAInstallStatus,
    StartSceneLayer,
    UserCancelled,
    StartScene1,
    LevelSelection1,
    GameScene1,
    loadImages
} from "../../common/common";
// import { LevelIndicators } from "../components/level-indicator";
// import { PromptText } from "../components/prompt-text"
// import { Tutorial } from "../components/tutorial";
// import { TimerTicking } from "../components/timer-ticking";
// import PausePopUp from "../components/pause-popup"
// import StoneHandler from "../components/stone-handler";
import { StoneConfig } from "../common/stone-config"
import Sound from "../../common/sound";
import InstallButton from "../../components/buttons/install_button";
import PlayButton from "../../singlecanvas/components/play-button";
import { Monster } from "../components/monster";
import { DataModal } from "../../data/data-modal";
// import { CanvasStack } from "../../utility/canvas-stack";
import { LevelSelectionScreen } from "../scenes/level-selection-scene";
import { Debugger, lang } from "../../../global-variables";
import { Background } from "../components/background"
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
    public playButton: PlayButton | InstallButton;
    public levelSelectionScene: any;
    public images: Object;
    public loadedImages: any;
    public imagesLoaded: boolean = false;
    public handler: any;
    public static SceneName: string;
    public switchSceneToLevelSelection: any;

    public background1: Background;

    // public tutorial: Tutorial;

    constructor(
        canvas: HTMLCanvasElement,
        data: DataModal,
        firebase_analytics: { logEvent: any },
        switchSceneToLevelSelection
    ) {
        // this = this;
        this.canvas = canvas;
        this.data = data;
        this.width = canvas.width;
        this.height = canvas.height;
        this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
        this.context = this.canavsElement.getContext("2d");
        // this.canvasStack = new CanvasStack("canvas");
        this.monster = new Monster(this.canvas, 4);
        this.switchSceneToLevelSelection = switchSceneToLevelSelection;
        // passing level as 1 bcz here its fixed (assumption)
        this.background1 = new Background(this.context, this.width, this.height, 1);
        // this.stoneHandler = new StoneHandler(this.context, this.canvas, 2, this.data.levels[0]);
        // var img = new Image();
        // img.src = "./assets/images/stone_pink_v02.png";
        // img.onload = (e) => {
        //     this.stoneConfig = new StoneConfig(this.context, this.height, this.width, "text", 100, 100, img);
        // }

        /// testing promptexr
        // this.promptText = new PromptText(this.width, this.height, this.data.levels[0].puzzles[2], this.data.levels[0], false);
        // this.timerTicking = new TimerTicking(this.width, this.height, this.timeOverCallback);
        // this.pauseMenu = new PausePopUp(this.canavsElement);
        //////////////////////end
        // this.levelIndicator = new LevelIndicators(this.context, this.canvas, 0);
        // this.levelIndicator.setIndicators(2);
        // this.tutorial = new Tutorial(this.context, this.width, this.height);
        // this.tutorial.updateTargetStonePositions([100, 100]);


        this.pwa_status = localStorage.getItem(PWAInstallStatus);
        this.handler = document.getElementById("canvas");
        this.devToggle();
        this.createPlayButton();
        this.firebase_analytics = firebase_analytics;
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

    // timeOverCallback() {
    //     // time to load new puzz
    // }
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
        // let deltaTime = timeStamp - lastTime;
        // lastTime = timeStamp;

        // console.log("this is startscene");

        this.context.clearRect(0, 0, this.width, this.height);
        if (StartScene.SceneName == StartScene1) {
            if (this.imagesLoaded) {
                // this.context.drawImage(this.loadedImages.bgImg, 0, 0, this.width, this.height);
                // this.context.drawImage(
                //     this.loadedImages.pillerImg,
                //     this.width * 0.6,
                //     this.height / 6,
                //     // this.height / 3,
                //     this.width,
                //     this.height / 2
                // );
                // this.context.drawImage(
                //     this.loadedImages.fenchImg,
                //     -this.width * 0.4,
                //     this.height / 3,
                //     this.width,
                //     this.height / 3
                // );
                // this.context.drawImage(
                //     this.loadedImages.hillImg,
                //     -this.width * 0.25,
                //     this.height / 2,
                //     this.width * 1.5,
                //     this.height / 2
                // );
                // this.context.drawImage(
                //     this.loadedImages.grassImg,
                //     -this.width * 0.25,
                //     this.height / 2 + (this.height / 2) * 0.1,
                //     this.width * 1.5,
                //     this.height / 2
                // );
                this.background1.draw();

                this.context.font = "bold 40px Arial";
                this.context.fillStyle = "white";
                this.context.textAlign = "center";
                this.context.fillText(this.data.title, this.width * 0.5, this.height / 10);
                // this.update(deltaTime);
                // this.context.scale(1.5, 1.5);
                this.monster.animation(deltaTime);
                // this.context.setTransform(1, 0, 0, 0, 0, 0);
                this.playButton.draw();
                // this.stoneHandler.draw();
                // if (this.stoneConfig != undefined)
                //     this.stoneConfig.draw();
                //if(pause)
                // this.promptText.draw();
                // this.levelIndicator.draw();
                // this.levelIndicator.update(deltaTime);
                // this.tutorial.draw(deltaTime);
                // this.timerTicking.update(deltaTime);
                // this.pauseMenu.draw();
            }
        }
        // else if (StartScene.SceneName == LevelSelection1) {
        //     // this.levelSelectionScene.draw(1);
        //     this.levelSelectionScene.testDraw();

        // }
        // else {
        // render gameplay screen for now
        // }
        // requestAnimationFrame(this.animation);
    }

    draw() {
    }

    // switchSceneToLevelSelection() {
    //     // dispose previous scene
    //     this.dispose();
    //     // load in next scene
    //     this.levelSelectionScene = new LevelSelectionScreen(this.canvas, this.data, (arg1, arg2) => {
    //         StartScene.SceneName = arg2
    //     });
    //     StartScene.SceneName = LevelSelection1;
    // }

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
        // this.levelIndicator.setIndicators(1);
        const selfElement = <HTMLElement>document.getElementById("canvas");
        event.preventDefault();
        var rect = selfElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (self.playButton.onClick(x, y)) {
            self.firebase_analytics
                ? self.firebase_analytics.logEvent(FirebaseUserClicked, "click")
                : null;
            // @ts-ignore
            fbq("trackCustom", FirebaseUserClicked, {
                event: "click",
            });
            toggleBtn.style.display = "none";
            new Sound().playSound("./assets/audios/ButtonClick.mp3", ButtonClick);
            self.switchSceneToLevelSelection();
        }


    }

    dispose() {
        this.handler.removeEventListener("click", this.handleMouseClick, false);
    }
}
