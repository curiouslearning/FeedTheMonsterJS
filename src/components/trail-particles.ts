export default class TrailEffect {
    canvas: any;
    ctx: any
    particles: any;
    mouse: {
        x: undefined | number,
        y: undefined | number
    };

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.particles = [];
        this.mouse = {
            x: undefined,
            y: undefined
        };
    }

     init() {
        this.draw();
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
            this.particles[i].draw();
        }
    }

    addTrailParticles(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
        this.particles.push(
            new Particles(
                this.ctx,
                this.mouse
            )
        );
    }

    resetParticles() {
        this.mouse.x = undefined;
        this.mouse.y = undefined;
    }
}

class Particles {
    ctx: any;
    start: any;
    end: any
    size: any
    style: any
    time: any
    ttl: any
    x: any
    y: any
    rgb: any

    constructor(ctx, mouse) {
        this.ctx = ctx;
        this.rgb = [
            "rgb(255,255,255,255)",
           "rgb(243,208,144,255)",
           "rgb(229,170,100,255)"
        ];
        this.start = {
            x: mouse.x + this.getRandomInt(-5, 5),
            y: mouse.y + this.getRandomInt(-5, 5),
            size: 1
        }
        this.end = {
            x: this.start.x + this.getRandomInt(-10, 10),
            y: this.start.y + this.getRandomInt(-20, 20)
        }
        this.x = this.start.x;
        this.y = this.start.y;
        this.size = this.start.size;
        this.style = this.rgb[this.getRandomInt(0, this.rgb.length - 1)];
        //this.style = "rgb(243,208,144,255)";
        this.time = 0;
        this.ttl = 45;
    }

    draw() {
        this.ctx.fillStyle = this.style;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 1);
        this.ctx.closePath();
        this.ctx.fill();
    }

    update() {
        if (this.time <= this.ttl) {
            const progress = 1 - (this.ttl - this.time) / this.ttl;
            this.size = this.start.size * (1 - this.easeOutQuart(progress));
            this.x = this.x + (this.end.x - this.x) * 0.001;
            this.y = this.y + (this.end.y - this.y) * 0.001;
        }
        this.time++;
    }

    private getRandomInt(min, max) {
        return Math.round(Math.random() * (max - min)) + min;
    }

    private easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }
}