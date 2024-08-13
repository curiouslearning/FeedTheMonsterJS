import * as rive from "@rive-app/canvas";

export class RiveMonster {
  public zindex: number;
  public width: number;
  public height: number;
  public frameX: number;
  public frameY: number;
  public maxFrame: number;
  public x: number;
  public y: number;
  public fps: number;
  public countFrame: number;
  public frameInterval: number;
  public frameTimer: number;
  public monsterContext: CanvasRenderingContext2D;
  public canvasElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public images: Object;
  public loadedImages: any;
  public monsterPhase: number;

  constructor() {
    this.canvasElement = document.getElementById("newcanvas") as HTMLCanvasElement;
  }

  update() {
    this.draw();
  }

  draw() {
    this.initialiseRiveMonster();
  }

  initialiseRiveMonster() {
    const riveMonster = new rive.Rive({
      src: "./assets/chimplenew.riv",
      canvas: this.canvasElement,
      autoplay: false,
      animations:'idle_1',
      stateMachines: "State Machine 1",
      layout: new rive.Layout({ fit: rive.Fit.Cover, alignment: rive.Alignment.Center }),
      onLoad: () => {
        // Define the animations
        // const animations = ['idle_1', 'idle_2', 'talking','win','lose']; // Replace with your animation names
        //   console.log(animations);

        // Mapping of button IDs to animation names
        const animationMapping: { [key: string]: string } = {
          'animation1': 'idle_1',
          'animation2': 'idle_2',
          'animation3': 'talking',
          'animation4': 'win',
          'animation5': 'lose',
        };

        let currentAnimation: string = null;

        // Function to play the specific animation
        const playAnimation = (animationName: string) => {
          if (animationName !== currentAnimation) {
            // Trigger custom event for animation change
            const event = new CustomEvent('animationchange', {
              detail: { previousAnimation: currentAnimation, newAnimation: animationName }
            });
            this.canvasElement.dispatchEvent(event);

            // Play the new animation
            riveMonster.play(animationName);
            currentAnimation = animationName;
          }
        };

        // Common function to handle button clicks and play animations
        const handleAnimationPlay = (event: Event) => {
          const target = event.target as HTMLElement;
          const animationName = animationMapping[target.id];
          if (animationName) {
            playAnimation(animationName);
          } else {
            console.error(`No animation mapped for button ID: ${target.id}`);
          }
        };
        // Add event listeners to all buttons
        const addEventListeners = () => {
          Object.keys(animationMapping).forEach(buttonId => {
            document.getElementById(buttonId)?.addEventListener('click', handleAnimationPlay);
          });
        };

        // Remove event listeners from all buttons
        const removeEventListeners = () => {
          Object.keys(animationMapping).forEach(buttonId => {
            document.getElementById(buttonId)?.removeEventListener('click', handleAnimationPlay);
          });
        };

        // Add custom event listener for animation change
        const handleAnimationChange = (event: CustomEvent) => {
          console.log(`Animation changed from ${event.detail.previousAnimation} to ${event.detail.newAnimation}`);
          // Add your custom logic here
        };

        // Add custom event listener for animation change
        const addCustomEventListener = () => {
          this.canvasElement.addEventListener('animationchange', handleAnimationChange);
        };

        // Remove custom event listener for animation change
        const removeCustomEventListener = () => {
          this.canvasElement.removeEventListener('animationchange', handleAnimationChange);
        };

        // Initialize event listeners
        addEventListeners();
        addCustomEventListener();

        // const states = riveMonster.stateMachineInputs('State Machine 1');
        // const trigger = states.find(i=> i.name === "Tail")
        // const buttonEl = document.getElementById("newcanvas");
        // buttonEl.onclick = function() {
        // trigger.fire();
        // };

      },
      onStateChange: (event) => {
        console.log(event);
        const stateName = document.getElementById("statecheck");
        stateName.innerHTML = event.data[0];
      }
    });
  }

  public unregisterEventListener() {

  }


  public dispose() {
    this.unregisterEventListener();
  }

}
