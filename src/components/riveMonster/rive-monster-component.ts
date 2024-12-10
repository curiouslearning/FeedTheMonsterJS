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
    private src: string = './assets/text_v1.riv';  // Define the .riv file path
    // private stateMachines: string = 'State Machine 1';  // Define the state machine

    // Static readonly properties for all monster animations
    public static readonly Animations = {
        OPENING_MOUTH_EAT: 'Opening Mouth Eat',
        EAT_HAPPY: 'Eat Happy',
        IDLE: 'Idle',
        EAT_DISGUST: 'Eat Disgust',
        SAD: 'Sad',
        STOMP2: 'Stomp 2', //Not working
        HAPPY2: 'Happy 2',
        SPIT: 'Spit/disgust',
        CHEW: 'Chew', //Not working
        MOUTHOPEN: 'Mouth Open',
        MOUTHCLOSED: 'Mouth Closed', //Not working
        STOMP_HAPPY: 'Happy', //Not working
    };


    constructor(props: RiveMonsterComponentProps) {
        this.props = props;

        
        // Initialize Rive
        this.riveInstance = new Rive({
            src: this.src,
            canvas: this.props.canvas,
            autoplay: this.props.autoplay,
            // stateMachines: this.stateMachines,
            layout: new Layout({
                fit: Fit[this.props.fit || "Contain"],
                alignment: Alignment[this.props.alignment || "TopCenter"],
            }),
            onLoad: () => {
                if (this.props.onLoad) {
                    this.props.onLoad();
                }
            },
        });
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

    // Check animation completion via a state machine listener need to have statemachines properly to test this
    onStateChange(callback: (stateName: string) => void) {
        this.riveInstance.stateMachine.inputs.forEach(input => {
            input.onStateChange((state) => {
                callback(state);
            });
        });
    }
}
