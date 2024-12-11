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
    private src: string = './assets/EggMonsterFinal.riv';  // Define the .riv file path
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
            onLoad: () => {
                console.log(`Rive file loaded successfully.`);
                console.log(`State Machine: ${this.stateMachineName}`);
                console.log(`Available Inputs:`, this.getInputs());
                if (this.props.onLoad) this.props.onLoad();
            },
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

    setInput(inputName: string, value: any) {
        const inputs = this.getInputs();
        console.log("New Input ===>", inputs);
        
        const input = inputs.find((input) => input.name === inputName);
        if (input) {
            input.value = value;
            console.log(`Input "${inputName}" set to:`, value);
        } else {
            console.error(`Input "${inputName}" not found.`);
        }
    }

    onStateChange(callback: (stateName: string) => void) {
        this.getInputs().forEach((input) => {
            input.onStateChange((state) => {
                console.log(`State changed to: ${state.name}`);
                callback(state.name);
            });
        });
    }
}
