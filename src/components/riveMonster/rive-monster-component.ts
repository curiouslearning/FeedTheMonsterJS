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
    private src: string = './assets/eggRiveMonsterFinal.riv';  // Define the .riv file path
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
                console.log(`Animation Names:`,this.riveInstance.animationNames);
                // Retrieve state machine inputs
                const inputs = this.riveInstance.stateMachineInputs(this.stateMachineName);
                inputs.forEach(input => {
                    console.log(input);
                    console.log('Trigger Input:', input.name);
                    console.log(`Input Name: ${input.name}, Type: ${input.type}`);
                });

                // Find specific inputs
                const isIdle = inputs.find(input => input.name === 'backToIdle'); //stomp trigger
                const isStompStone = inputs.find(input => input.name === 'isStomped'); //stomp trigger
                if (!isStompStone || typeof isStompStone.fire !== 'function') {
                    console.error('Trigger input "isStomped" not found or is invalid.');
                    return;
                }
                const isMouthOpened = inputs.find(input => input.name === 'isMouthOpen'); //drag
                const isMouthClosed = inputs.find(input => input.name === 'isMouthClosed'); //mouth close
                const isChewing = inputs.find(input => input.name === 'isChewing'); //chew
                const isHappy = inputs.find(input => input.name === 'isHappy'); //happy
                const isSpit = inputs.find(input => input.name === 'isSpit'); //spit
                const isSad = inputs.find(input => input.name === 'isSad'); //sad
                

                if (!isIdle || !isMouthOpened || !isStompStone || !isMouthClosed || !isChewing || !isHappy || !isSpit || !isSad) {
                    console.error('One or more inputs are missing from the state machine.');
                    return;
                }

                // Simulate  to stomp
                document.getElementById('IdleBtn').addEventListener('click', () => {
                    console.log('Egg Idle');
                    isIdle.fire();
                })

                // Simulate  to stomp
                document.getElementById('stompStoneBtn').addEventListener('click', () => {
                    console.log('Egg Stomped');
                    isStompStone.fire();
                })

                // Simulate  open the mouth
                document.getElementById('dragStoneBtn').addEventListener('click', () => {
                    console.log('Egg Mouth opened');
                    isMouthOpened.fire();
                });

                // Simulate to mouth closed
                document.getElementById('feedStoneBtn').addEventListener('click', () => {
                    console.log('Egg Mouth Closed');
                    isMouthClosed.fire();
                });

                // Simulate  to Chewing
                document.getElementById('checkStoneBtn').addEventListener('click', () => {
                    console.log('Egg Chewed');
                    isChewing.fire();
                });

                // Simulate  to happy stone
                document.getElementById('happyStoneBtn').addEventListener('click', () => {
                    console.log('Egg Happy');
                    isHappy.fire();
                });

                // Simulate  to Spit
                document.getElementById('spitStoneBtn').addEventListener('click', () => {
                    console.log('Egg Spit');
                    isSpit.fire();
                });

                // Simulate  to Sad
                document.getElementById('sadStoneBtn').addEventListener('click', () => {
                    console.log('Egg Sad');
                    isSad.fire();
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
