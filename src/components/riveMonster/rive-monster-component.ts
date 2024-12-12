import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

interface RiveMonsterComponentProps {
    canvas: HTMLCanvasElement;  // Canvas element where the animation will render
    autoplay: boolean;
    fit?: string;  // Fit property (e.g contain, cover, etc.)
    alignment?: string;  // Alignment property (e.g topCenter, bottomLeft, etc.)
    width?: number;  // Optional width for the Rive animation
    height?: number;  // Optional height for the Rive animation
    onLoad?: () => void;  // Callback once Rive animation is loaded
}

export class RiveMonsterComponent {
    private props: RiveMonsterComponentProps;
    private riveInstance: any;
    private src: string = './assets/eggMonstermain.riv';  // Define the .riv file path
    private stateMachineName: string = "State Machine 1"  // Define the state machine

    // Static readonly properties for all monster animations
    public static readonly Animations = {
        //new animation
        IDLE: "Idle",
        SAD: "Sad",
        STOMP: "Stomp", //Not working
        STOMPHAPPY: "StompHappy",
        SPIT: "Spit",
        CHEW: "Chew", //Not working
        MOUTHOPEN: "MouthOpen",
        MOUTHCLOSED: "MouthClosed", //Not working
        HAPPY: "Happy", //Not working
    };


    constructor(props: RiveMonsterComponentProps) {
        this.props = props;


        // Initialize Rive
        this.riveInstance = new Rive({
            src: this.src,
            canvas: this.props.canvas,
            autoplay: this.props.autoplay,
            stateMachines: [this.stateMachineName],
            layout: new Layout({
                fit: Fit[this.props.fit || "Contain"],
                alignment: Alignment[this.props.alignment || "TopCenter"],
            }),
            onStateChange: (event) => {
                console.log('State changed:', event);
            },
            onLoad: () => {
                // Retrieve state machine inputs
                const inputs = this.riveInstance.stateMachineInputs(this.stateMachineName);
                inputs.forEach(triggers => {
                    console.log(triggers.name);
                    
                });

                // Find specific inputs
                const isStompStone = inputs.find(input => input.name === 'Trigger 1'); //stomp trigger
                const stoneDragged = inputs.find(input => input.name === 'Boolean 1'); //drag
                const stoneFed = inputs.find(input => input.name === 'Boolean 2'); //mouth close
                const isCorrectStone = inputs.find(input => input.name === 'Boolean 3'); //chew
            
                if (!stoneDragged || !stoneFed || !isCorrectStone || !isStompStone) {
                    console.error('One or more inputs are missing from the state machine.');
                    return;
                }

                // Simulate dragging the stone to open the mouth
                document.getElementById('stompStoneBtn').addEventListener('click', () => {
                    console.log('Egg Stomped. Transitioning to Stomp');
                    console.log(isStompStone);
                    
                    isStompStone.fire();
                })
            
                // Simulate dragging the stone to open the mouth
                document.getElementById('dragStoneBtn').addEventListener('click', () => {
                    console.log('Stone dragged. Transitioning to MOUTH OPEN.');
                    this.riveInstance.play(RiveMonsterComponent.Animations.MOUTHOPEN);
                });
            
                // Simulate feeding the stone to transition to CHEWING
                document.getElementById('feedStoneBtn').addEventListener('click', () => {
                    console.log('Stone fed. Transitioning to MOUTH CLOSE.');
                    this.riveInstance.play(RiveMonsterComponent.Animations.MOUTHCLOSED);
            
                    // Set isCorrectStone dynamically (true for correct, false for incorrect)
                    const isCorrect = Math.random() > 0.5; // Example logic, replace with your own
                    isCorrectStone.value = isCorrect;
            
                    console.log(`Fed stone is ${isCorrect ? 'correct' : 'incorrect'}.`);
                });

                // Simulate dragging the stone to open the mouth
                document.getElementById('checkStoneBtn').addEventListener('click', () => {
                    console.log('Mouth Closed. Transitioning to MOUTH Closed.');
                    this.riveInstance.play(RiveMonsterComponent.Animations.CHEW);
                });
            
                // Callback to handle state changes (optional debugging)
                this.riveInstance.onStateChange = (state) => {
                    console.log('Current state:', state);
                };
            
                if (this.props.onLoad) this.props.onLoad();
            }
        });
    }

    getInputs() {
        return this.riveInstance.stateMachineInputs(this.stateMachineName);
    }

    play(animationName: string) {
        if (this.riveInstance) {
            this.riveInstance.play(animationName);
        }
    }

    stop() {
        if (this.riveInstance) {
            this.riveInstance.stop();
        }
    }

    // onStateChange(callback: (stateName: string) => void) {
    //     this.getInputs().forEach((input) => {
    //         input.onStateChange((state) => {
    //             console.log(`State changed to: ${state.name}`);
    //             callback(state.name);
    //         });
    //     });
    // }
}
