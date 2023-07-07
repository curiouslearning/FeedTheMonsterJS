import {
    ButtonClick,
    FirebaseUserClicked,
    PWAInstallStatus,
    StartScene1,
    LevelSelection1,
    GameScene1,
    loadImages
} from "../../common/common";
import { StoneConfig } from "../common/stone-config"
import Sound from "../../common/sound";
import InstallButton from "../../components/buttons/install_button";
import PlayButton from "../../singlecanvas/components/play-button";
import { Monster } from "../components/monster";
import { StartScene } from "../scenes/start-scene";
import { DataModal } from "../../data/data-modal";
import { LevelSelectionScreen } from "../scenes/level-selection-scene";
import { Debugger, lang } from "../../../global-variables";
import { GameplayScene } from "../scenes/gameplay-scene"
let lastTime = 0;
let pwa_install_status: any;
const toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    pwa_install_status = e;
    localStorage.setItem(PWAInstallStatus, "false");
});

export class SceneHandler {
    public canvas: HTMLCanvasElement;
    public data: any;
    public width: number;
    public height: number;
    public startScene: StartScene;
    public levelSelectionScene: any;
    public gameplayScene: any;
    // public monster: Monster;
    // public pickedStone: StoneConfig;
    // public pwa_status: string;
    // public firebase_analytics: { logEvent: any };
    // public id: string;
    public canavsElement: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;
    // public buttonContext: CanvasRenderingContext2D;
    // public outcome: any;
    // public playButton: PlayButton | InstallButton;
    // public levelSelectionScene: any;
    // public images: Object;
    // public loadedImages: any;
    // public imagesLoaded: boolean = false;
    // public handler: any;
    public static SceneName: string;

    constructor(
        canvas: HTMLCanvasElement,
        data: DataModal,
        firebase_analytics: { logEvent: any }
    ) {
        this.canvas = canvas;
        this.data = data;
        this.width = canvas.width;
        this.height = canvas.height;
        this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
        this.context = this.canavsElement.getContext("2d");
        this.startScene = new StartScene(canvas, data, firebase_analytics, this.switchSceneToLevelSelection);
        // this.gameplayScene = new GameplayScene(this.canvas, this.context, this.data.levels[0], 1, "text", false);
        // this.monster = new Monster(this.canvas);
        // this.pwa_status = localStorage.getItem(PWAInstallStatus);
        // this.handler = document.getElementById("canvas");
        // this.devToggle();
        // this.createPlayButton();
        // this.firebase_analytics = firebase_analytics;
        SceneHandler.SceneName = StartScene1;

        this.animation(0);

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


    animation = (timeStamp) => {
        let deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;

        this.context.clearRect(0, 0, this.width, this.height);
        if (SceneHandler.SceneName == StartScene1) {
            this.startScene.animation(deltaTime);
        }
        else if (SceneHandler.SceneName == LevelSelection1) {
            // this.levelSelectionScene.draw(1);
            this.levelSelectionScene.testDraw();

        }
        else if (SceneHandler.SceneName == GameScene1) {
            // render gameplay screen for now
            this.gameplayScene.draw();
        }
        requestAnimationFrame(this.animation);
    }

    // draw() {
    // }

    switchSceneToGameplay = () => {
        // dispose previous scene
        this.levelSelectionScene.dispose();
        // load in next scene --- gameplaqyscene

        SceneHandler.SceneName = GameScene1;
    }

    switchSceneToLevelSelection = () => {
        // dispose previous scene
        this.startScene.dispose();
        // load in next scene
        this.levelSelectionScene = new LevelSelectionScreen(this.canvas, this.data, (arg1, arg2) => {
            SceneHandler.SceneName = arg2;
        });
        SceneHandler.SceneName = LevelSelection1;
    }

}
