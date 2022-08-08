import { Monster } from './monster.js'
import { LevelScene } from './src/scenes/level-scene.js';
import { preloadImages } from './utility.js'

window.addEventListener('load', function() {
    const canvas = document.getElementById("canvas");
    const changeAnimEat = document.getElementById("change-anim-eat");
    const changeAnimIdle = document.getElementById("change-anim-idle");
    const context = canvas.getContext("2d");

    canvas.height = window.innerHeight;
    canvas.width = window.screen.width > 420 ? 420 : window.innerWidth;

    var self;

    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            self = this;
            this.scene = new LevelScene(this);
        }

        update(deltaTime) {
            // this.monster.update(deltaTime);
        }

        render() {
            this.scene.createBackgroud();
        }

    }

    const game = new Game(canvas.width, canvas.height);
    game.render();

    let lastTime = 0;

    function animation(timeStamp) {
        let deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        context.clearRect(0, 0, canvas.width, canvas.height);
        game.scene.monster.update(deltaTime)
        // game.render();
        requestAnimationFrame(animation)
        
    }

    animation(0);

    changeAnimEat.addEventListener("click", function(e) {
        self.monster.changeImage("./assets/images/eat.png");
        e.preventDefault();
    });

    changeAnimIdle.addEventListener("click", function(e) {
        self.monster.changeImage("./assets/images/sprite.png");
        e.preventDefault();
    });
})