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
import { LevelIndicators } from "../components/level-indicator";
import { PromptText } from "../components/prompt-text"
// import { Tutorial } from "../components/tutorial";
import { TimerTicking } from "../components/timer-ticking";
// import PausePopUp from "../components/pause-popup"
import StoneHandler from "../components/stone-handler";
import { StoneConfig } from "../common/stone-config"
import Sound from "../../common/sound";
import InstallButton from "../../components/buttons/install_button";
import PlayButton from "../../singlecanvas/components/play-button";
import { Monster } from "../components/monster";
import { DataModal } from "../../data/data-modal";
// import { CanvasStack } from "../../utility/canvas-stack";
import { LevelSelectionScreen } from "../scenes/level-selection-scene";
import { Debugger, lang } from "../../../global-variables";
import { Tutorial } from "../components/tutorial";
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
export class TestGameplayScene {
    public canvas: HTMLCanvasElement;
    public data: any;
    public width: number;
    public height: number;
    // public canvasStack: any;
    public monster: Monster;
    // public monster2: Monster;
    public levelIndicator: LevelIndicators;
    public promptText: PromptText;
    public timerTicking: TimerTicking;
    // public pauseMenu: PausePopUp;
    public stoneHandler: StoneHandler;
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
    public counter: any = 0;
    tutorial: Tutorial;

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
        this.monster = new Monster(this.canvas, 0);
        // this.monster2 = new Monster(this.canvas);
        console.log(Date.now, " ::: ", performance.now);
        // this.monster2.x = 100;
        this.switchSceneToLevelSelection = switchSceneToLevelSelection;
        this.stoneHandler = new StoneHandler(this.context, this.canvas, 2, this.data.levels[92]);
        // var img = new Image();
        // img.src = "./assets/images/stone_pink_v02.png";
        // img.onload = (e) => {
        //     this.stoneConfig = new StoneConfig(this.context, this.height, this.width, "text", 100, 100, img);
        // }

        /// testing promptexr
        this.promptText = new PromptText(this.width, this.height, this.data.levels[92].puzzles[2], this.data.levels[92], false);
        this.timerTicking = new TimerTicking(this.width, this.height, this.timeOverCallback);
        // this.pauseMenu = new PausePopUp(this.canavsElement);
        //////////////////////end
        this.levelIndicator = new LevelIndicators(this.context, this.canvas, 0);
        this.tutorial = new Tutorial(this.context, this.width, this.height);
        this.levelIndicator.setIndicators(3);
        // this.tutorial = new Tutorial(this.context, this.width, this.height);
        this.tutorial.updateTargetStonePositions([100, 100]);


        this.pwa_status = localStorage.getItem(PWAInstallStatus);
        this.handler = document.getElementById("canvas");
        this.devToggle();
        this.createPlayButton();
        this.firebase_analytics = firebase_analytics;
        console.log(this.data);
        // StartScene.SceneName = StartScene1;

        this.animation(0);

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
            console.log(" thisisallloadedimages ", this.loadedImages);
            this.imagesLoaded = true;
        });
        console.log(this, "<--thiiiss");

    }

    timeOverCallback = () => {
        // time to load new puzzle
        console.log("timeOver");
        this.timerTicking.readyTimer();
        this.timerTicking.startTimer();
        this.timerTicking.isMyTimerOver = false;
        if (this.counter == 5)
            this.counter = 0;
        // this.counter += 1;
        this.levelIndicator.setIndicators(this.counter++);
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


    handleMouseUp = (event) => {
        console.log(" upping mouse like a pro ");
        let self = this;
        const selfElement = <HTMLElement>document.getElementById("canvas");
        var rect = selfElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        // event.preventDefault();
        if (
            Math.sqrt(
                (x - self.monster.x - self.canvas.width / 4) *
                (x - self.monster.x - self.canvas.width / 4) +
                (y - self.monster.y - self.canvas.height / 2.7) *
                (y - self.monster.y - self.canvas.height / 2.7)
            ) <= 60
        ) {
            // self.checkDraggedOption();
            console.log(" drooped iniside moooooonster");
        } else {
            self.monster.changeToIdleAnimation();
        }

        self.pickedStone = null;
        console.log(" self.pickedStone : ", self.pickedStone);

    }

    handleMouseDown = (event) => {

        let self = this;
        console.log(" downing mouse like a pro ");
        const selfElement = <HTMLElement>document.getElementById("canvas");
        var rect = selfElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        ///////// sending data to stone config
        for (let sc of self.stoneHandler.foilStones) {
            if (
                Math.sqrt((x - sc.x) * (x - sc.x) + (y - sc.y) * (y - sc.y)) <= 40
            ) {
                console.log(" clickkedon stone", sc);
                this.pickedStone = sc;
                // console.log("this.pickedStone : ", this.pickedStone);
            }
        }
        /////// end of stone data sending

    }

    handleMouseMove = (event) => {
        let self = this;
        console.log(" mmoving mouse like a pro ");
        // this.levelIndicator.setIndicators(1);
        const selfElement = <HTMLElement>document.getElementById("canvas");
        // event.preventDefault();
        var rect = selfElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (self.pickedStone) {
            self.monster.changeToDragAnimation();
            self.pickedStone.x = x;
            self.pickedStone.y = y;
        }
    }

    animation = (deltaTime) => {
        // let deltaTime = timeStamp - lastTime;
        // lastTime = timeStamp;
        // console.log(this.loadedImages, " <> ", this.imagesLoaded, " ffffggg ", StartScene.SceneName);

        // this.context.clearRect(0, 0, this.width, this.height);
        // if (StartScene.SceneName == StartScene1) {
        if (this.imagesLoaded) {
            this.context.drawImage(this.loadedImages.bgImg, 0, 0, this.width, this.height);
            this.context.drawImage(
                this.loadedImages.pillerImg,
                this.width * 0.6,
                this.height / 6,
                // this.height / 3,
                this.width,
                this.height / 2
            );
            this.context.drawImage(
                this.loadedImages.fenchImg,
                -this.width * 0.4,
                this.height / 3,
                this.width,
                this.height / 3
            );
            this.context.drawImage(
                this.loadedImages.hillImg,
                -this.width * 0.25,
                this.height / 2,
                this.width * 1.5,
                this.height / 2
            );
            this.context.drawImage(
                this.loadedImages.grassImg,
                -this.width * 0.25,
                this.height / 2 + (this.height / 2) * 0.1,
                this.width * 1.5,
                this.height / 2
            );

            this.context.font = "bold 40px Arial";
            this.context.fillStyle = "white";
            this.context.textAlign = "center";
            this.context.fillText("Testing Gameplay", this.width * 0.5, this.height / 10);
            // this.update(deltaTime);
            // this.context.scale(1.5, 1.5);
            this.monster.animation(deltaTime);
            // this.monster2.animation(deltaTime);
            // this.context.setTransform(1, 0, 0, 0, 0, 0);
            // this.playButton.draw();
            this.promptText.draw();
            this.stoneHandler.draw(deltaTime);
            // if (this.stoneConfig != undefined)
            //     this.stoneConfig.draw();
            //if(pause)

            this.levelIndicator.draw();
            // this.levelIndicator.update(deltaTime);
            // this.tutorial.draw(deltaTime);
            this.timerTicking.update(deltaTime);
            this.tutorial.draw(deltaTime);
            // this.pauseMenu.draw();
        }
        // }
        // else if (StartScene.SceneName == LevelSelection1) {
        //     // this.levelSelectionScene.draw(1);
        //     this.levelSelectionScene.testDraw();

        // }
        // else {
        // console.log(" rendering game scene", StartScene.SceneName);
        // render gameplay screen for now
        // }
        // requestAnimationFrame(this.animation);
    }

    draw() {
    }

    // switchSceneToLevelSelection() {
    //     console.log(" checkingthisobj ", this);
    //     // dispose previous scene
    //     this.dispose();
    //     // load in next scene
    //     this.levelSelectionScene = new LevelSelectionScreen(this.canvas, this.data, (arg1, arg2) => {
    //         StartScene.SceneName = arg2
    //         console.log(arg1, arg2, StartScene.SceneName);
    //     });
    //     StartScene.SceneName = LevelSelection1;
    // }

    createPlayButton = () => {
        this.playButton = new PlayButton(
            this.context,
            this.canvas,
            this.canvas.width * 0.35,
            this.canvas.height / 7
        );
        // #1
        // document.addEventListener("selectstart", function (e) {
        //     e.preventDefault();
        // });
        // // #2
        this.handler.addEventListener(
            "mouseup",
            this.handleMouseUp,
            false
        );
        this.handler.addEventListener(
            "mousemove",
            this.handleMouseMove,
            false
        );
        this.handler.addEventListener(
            "mousedown",
            this.handleMouseDown,
            false
        );

        this.handler.addEventListener(
            "touchstart",
      function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        document.getElementById("canvas").dispatchEvent(mouseEvent);
      },
      false
        );
        this.handler.addEventListener(
            "touchmove",
            function (e) {
                console.log(" itstouchmove ");
                var touch = e.touches[0];
                var mouseEvent = new MouseEvent("mousemove", {
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                });
                document.getElementById("canvas").dispatchEvent(mouseEvent);
              },
              false
        );
        this.handler.addEventListener(
            "touchend",
            function (e) {
                var touch = e.changedTouches[0];
                var mouseEvent = new MouseEvent("mouseup", {
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                });
                document.getElementById("canvas").dispatchEvent(mouseEvent);
              },
              false
        );
    }

    handleMouseClick = (event) => {
        let self = this;
        console.log(" startScene Listner ", this);
        // this.levelIndicator.setIndicators(1);
        const selfElement = <HTMLElement>document.getElementById("canvas");
        event.preventDefault();
        var rect = selfElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        // console.log(self, "thiiiss->>>", this);
        if (self.playButton.onClick(x, y)) {
            console.log(" booomer inside");
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
        console.log("Disposing current listner startscene1", this);
        this.handler.removeEventListener("click", this.handleMouseClick, false);
    }
}
