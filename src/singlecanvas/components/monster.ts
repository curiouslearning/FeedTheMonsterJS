import { Debugger, lang } from "../../../global-variables";
import { MonsterLayer, StoreMonsterPhaseNumber, loadImages } from "../../common/common";
import { CanvasStack } from "../../utility/canvas-stack";
var lastTime = 0;
var self;
var animationFrame;
var monsterPhaseNumber = Debugger.DebugMode
    ? localStorage.getItem(StoreMonsterPhaseNumber + lang + "Debug") || 1
    : localStorage.getItem(StoreMonsterPhaseNumber + lang) || 1;

export class Monster {
    public zindex: number;
    public width: number;
    public height: number;
    public image: HTMLImageElement;
    public frameX: number;
    public frameY: number;
    public maxFrame: number;
    public x: number;
    public y: number;
    public fps: number;
    public countFrame: number;
    public frameInterval: number;
    public frameTimer: number;
    public canvasStack: any;
    public id: any;
    public canavsElement: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;
    public game: any;
    public images: Object;
    public loadedImages: any;
    public imagesLoaded: boolean = false;

    constructor(game, zindex?) {
        this.game = game;
        self = this;
        this.zindex = zindex;
        this.width = this.game.width;
        this.height = this.game.height;
        this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
        this.context = this.canavsElement.getContext("2d");
        this.image = document.getElementById("monster") as HTMLImageElement;
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 6;
        this.x = this.game.width / 2 - this.game.width * 0.243;
        this.y = this.game.width / 3;
        this.fps = 10;
        this.countFrame = 0;
        this.frameInterval = 1000 / this.fps;
        this.frameTimer = 0;
        this.canvasStack = new CanvasStack("canvas");

        //////////loading images
        this.images = {
            eatImg: "./assets/images/eat1" + monsterPhaseNumber + ".png",
            idleImg: "./assets/images/idle1" + monsterPhaseNumber + ".png",
            spitImg: "./assets/images/spit1" + monsterPhaseNumber + ".png",
            dragImg: "./assets/images/drag1" + monsterPhaseNumber + ".png"
        }

        loadImages(this.images, (images) => {
            this.loadedImages = Object.assign({}, images);
            this.imagesLoaded = true;
        });
    }

    createCanvas() {
    }

    changeZindex(index) {
        // this.canavsElement.style.zIndex = index;
    }

    deleteCanvas() {
        cancelAnimationFrame(animationFrame);
        this.canvasStack.deleteLayer(this.id);
    }

    update(deltaTime) {
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            if (this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                this.frameX = 0;
            }
        } else {
            this.frameTimer += deltaTime;
        }

        this.draw();
    }

    draw() {
        // this.context.clearRect(0, 0, 100, 100);
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.image,
                770 * this.frameX,
                1386 * this.frameY,
                768,
                1386,
                this.x,
                this.y * 0.8,
                this.width / 2,
                this.height / 1.5
            );
        }
    }

    changeImage(src) {
        this.animation(0);
        // if (this.frameY == 1) {
        //   this.frameY = 0;
        // } else {
        //   this.frameY = 1;
        // }
        this.image.src = src;
    }
    changePhaseNumber(monsterPhaseNum) {
        // eatImg = new Image();
        // eatImg.src = "./assets/images/eat1" + monsterPhaseNum + ".png";
        // idleImg = new Image();
        // idleImg.src = "./assets/images/idle1" + monsterPhaseNum + ".png";
        // spitImg = new Image();
        // spitImg.src = "./assets/images/spit1" + monsterPhaseNum + ".png";
        // dragImg = new Image();
        // dragImg.src = "./assets/images/drag1" + monsterPhaseNum + ".png";
        // console.log(eatImg.src);
        // console.log(idleImg.src);
        // console.log(spitImg.src);
        // console.log(monsterPhaseNumber);
    }

    changeToDragAnimation() {
        this.image = this.loadedImages.dragImg;
    }

    changeToEatAnimation() {
        this.image = this.loadedImages.eatImg;
        setTimeout(() => {
            this.changeToIdleAnimation();
        }, 2000);
    }

    changeToIdleAnimation() {
        this.image = this.loadedImages.idleImg;
    }

    changeToSpitAnimation() {
        this.image = this.loadedImages.spitImg;
        setTimeout(() => {
            this.changeToIdleAnimation();
        }, 2000);
    }
    animation(timeStamp) {
        let deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        self.update(deltaTime);
        animationFrame = requestAnimationFrame(self.animation);
    }
}
