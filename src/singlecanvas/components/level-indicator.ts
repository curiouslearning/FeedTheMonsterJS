import { loadImages } from "../../common/common";
import { EventManager } from "../events/EventManager";


export class LevelIndicators extends EventManager{
    public context: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;
    public activeIndicators: number;
    public images: Object;
    public loadedImages: any;
    public imagesLoaded: boolean = false;

    constructor(context, canvas, activeIndicators) {
        super({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        })
        this.context = context;
        this.canvas = canvas;
        this.activeIndicators = activeIndicators;
        // this.draw();

        // loading images
        this.images = {
            level_indicator: "./assets/images/levels_v01.png",
            bar_empty: "./assets/images/bar_empty_v01.png",
            bar_full: "./assets/images/bar_full_v01.png"
        }

        loadImages(this.images, (images) => {
            this.loadedImages = Object.assign({}, images);
            this.imagesLoaded = true;
        });
    }
    setIndicators(indicatorCount) {
        this.activeIndicators = indicatorCount;
        this.update(this);
    }

    addDropStoneEvent() {
        document.addEventListener('dropstone', (event) => {
            console.log("Yeee recived from level-indicator");
            this.setIndicators(2);

        });
    }
    draw() {
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.loadedImages.level_indicator,
                this.canvas.width * 0.15,
                0,
                this.canvas.width * 0.35,
                this.canvas.height * 0.09
            );
            for (var i = 0; i < 5; i++) {
                this.context.drawImage(
                    this.loadedImages.bar_empty,
                    ((this.canvas.width * 0.35) / 7) * (i + 1) +
                    this.canvas.width * 0.15,
                    (this.canvas.height * 0.09) / 2 - (this.canvas.height * 0.09) / 6,
                    (this.canvas.width * 0.35) / 10,
                    (this.canvas.height * 0.09) / 3
                );
            }
            for (var i = 0; i < this.activeIndicators; i++) {
                this.context.drawImage(
                    this.loadedImages.bar_full,
                    ((this.canvas.width * 0.35) / 7) * (i + 1) + this.canvas.width * 0.15,
                    (this.canvas.height * 0.09) / 2 - (this.canvas.height * 0.09) / 6,
                    (this.canvas.width * 0.35) / 10,
                    (this.canvas.height * 0.09) / 3
                );
            }
        }
    }
    update(deltaTime) {

    }

    public dispose() {
        this.unregisterEventListener();
    }

    public handleStoneDrop(event) {
        // this.isStoneDropped = true;
    }

    public handleLoadPuzzle(event) {
        this.setIndicators(event.detail.counter);
    }
}
