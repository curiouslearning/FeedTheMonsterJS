import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

interface RiveMonsterComponentProps {
    src: string;  // Path to the .riv file
    canvas: HTMLCanvasElement;  // Canvas element where the animation will render
    autoplay: boolean;
    stateMachines?: string;  // Optional, state machine for animation control
    fit?: string;  // Fit property (e.g contain, cover, etc.)
    alignment?: string;  // Alignment property (e.g topCenter, bottomLeft, etc.)
    width?: number;  // Optional width for the Rive animation
    height?: number;  // Optional height for the Rive animation
    onLoad?: () => void;  // Callback once Rive animation is loaded
}

export class RiveMonsterComponent {
    private props: RiveMonsterComponentProps;
    private riveInstance: any;
  
    constructor(props: RiveMonsterComponentProps) {
      this.props = props;
      
      // Initialize Rive
      this.riveInstance = new Rive({
        src: this.props.src,
        canvas: this.props.canvas,
        autoplay: this.props.autoplay,
        stateMachines: this.props.stateMachines || "",
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
  }
