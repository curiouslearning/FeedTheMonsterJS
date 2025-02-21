import gameSettingsService from '@gameSettingsService';
export default class TrailEffect {
    ctx: CanvasRenderingContext2D
    particles: any;
    mouse: {
        x: undefined | number,
        y: undefined | number
    };
    isDiamond: boolean;
    clickTrailToggle: boolean;
    private unsubscribeEvent: () => void;

    constructor(canvas) {
        this.ctx = canvas.getContext("2d");
        this.particles = [];
        this.mouse = {
            x: undefined,
            y: undefined
        };
        this.isDiamond = false;
        this.clickTrailToggle = false;
        this.init();
    }

    private init() {
        this.draw();
        this.unsubscribeEvent = gameSettingsService.subscribe(
            gameSettingsService.EVENTS.GAME_TRAIL_EFFECT_TOGGLE_EVENT,
            (isTrailEffectOn: boolean) => {
                this.clickTrailToggle = isTrailEffectOn;
            }
        );
    }

    draw() {
        this.drawTrail();

        let temp = [];
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].time <= this.particles[i].ttl) {
                temp.push(this.particles[i]);
            }
        }
        this.particles = temp;
    }

    private drawTrail(){
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
            this.isDiamond = !this.isDiamond;
            this.particles[i].draw(this.isDiamond);
        }
    }

    addTrailParticlesOnMove(x, y) {
        if(this.clickTrailToggle) {
            this.mouse.x = x;
            this.mouse.y = y;
            this.particles.push(
                new Particles(this.ctx, this.mouse)
            );
        }
    }

    resetParticles() {
        this.mouse.x = undefined;
        this.mouse.y = undefined;
    }

    clearTrailSubscription() {
        this.unsubscribeEvent();
    }
};

class Particles {
    ctx: CanvasRenderingContext2D;
    start: {
        x: number,
        y: number,
        size: number
    };
    end: {
        x: number,
        y: number,
    };
    size: number;
    style: string;
    time: number;
    ttl: number;
    x: number;
    y: number;
    rgb: string[];
    hyp: number;
    starX: number;
    starY: number;
    starAngle: number;

    constructor(ctx, mouse) {
        const startPosX = this.determineValueByScreenWidth(30, 15);
        const startPosY = this.determineValueByScreenWidth(30, 15);
        const endPosX = this.determineValueByScreenWidth(3, 0.5);
        const endPosY = this.determineValueByScreenWidth(2, 0.5);
        this.ctx = ctx;
         this.rgb = [
            "rgb(255,255,255)",
            "rgb(249,217,170)",
            "rgb(244,182,81)",
            "rgb(244,159,34)",
        ];
        this.start = {
            x: mouse.x + this.getRandomInt(-startPosX, startPosX),
            y: mouse.y + this.getRandomInt(-startPosY, startPosY),
            size:  this.determineValueByScreenWidth(3,2)
        }
        this.end = {
            x: this.start.x + this.getRandomInt(-endPosX, endPosX),
            y: this.start.y + this.getRandomInt(-endPosY, endPosY)
        }
        this.x = this.start.x;
        this.y = this.start.y;
        this.size = this.start.size;
        this.style = this.rgb[this.getRandomInt(0, this.rgb.length - 1)];
        this.time = 0;
        this.ttl = 75;
        this.hyp = 0;
        this.starX = 0;
        this.starY = 0;
        this.starAngle = 0;
    }

    private determineValueByScreenWidth(bgScreenVal, smallScreenVal) {
        /* 768 is the lowest width size of tablet */
        return window.screen.width > 768 ? bgScreenVal : smallScreenVal;
    }

    public update() {
        if (this.time <= this.ttl) {
            const progress = 1 - (this.ttl - this.time) / this.ttl;
            this.size = this.start.size * (1 - this.easeOutQuart(progress));
            this.x = this.x + (this.end.x - this.x) * 0.01;
            this.y = this.y + (this.end.y - this.y) * 0.01;
        }
        this.time++;
    }

    public draw(isDrawDiamond) {
        if (isDrawDiamond) {
            this.starParticle();
        } else {
            this.circleParticle();
        };
    }

    private circleParticle() {
        this.ctx.fillStyle = this.style;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    private starParticle() {
        this.ctx.fillStyle = this.style;
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y - this.size); // Top point
        this.ctx.lineTo(this.x + this.size, this.y); // Right point
        this.ctx.lineTo(this.x, this.y + this.size); // Bottom point
        this.ctx.lineTo(this.x - this.size, this.y); // Left point
        this.ctx.closePath();
        this.ctx.fill();
    }

    private getRandomInt(min, max) {
        return Math.round(Math.random() * (max - min)) + min;
    }

    private easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }
};
