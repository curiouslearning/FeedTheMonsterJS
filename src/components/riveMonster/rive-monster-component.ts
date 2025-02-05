import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

interface RiveMonsterComponentProps {
  canvas: HTMLCanvasElement; // Canvas element where the animation will render
  autoplay: boolean;
  fit?: string; // Fit property (e.g contain, cover, etc.)
  alignment?: string; // Alignment property (e.g topCenter, bottomLeft, etc.)
  width?: number; // Optional width for the Rive animation
  height?: number; // Optional height for the Rive animation
  onLoad?: () => void; // Callback once Rive animation is loaded
  gameCanvas?: HTMLCanvasElement; // Main canvas element
}

export class RiveMonsterComponent {
  private props: RiveMonsterComponentProps;
  private riveInstance: any;
  private src: string = './assets/eggMonsterFTM.riv';  // Define the .riv file path eggMonsterFTM
  private stateMachineName: string = "State Machine 1"  // Define the state machine
  public game: any;
  public x: number;
  public y: number;
  private hitboxRangeX: {
    from: number;
    to: number;
  };
  private hitboxRangeY: {
    from: number;
    to: number;
  };
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
    this.moveCanvasUpOrDown(50); // Move down by 50px
    
    // Calculate monster dimensions based on canvas size
    const monsterWidth = props.canvas.width * 0.25; // Monster takes up 25% of canvas width
    const monsterHeight = props.canvas.height * 0.15; // Monster takes up 25% of canvas height
    
    // Position monster at bottom center
    const monsterCenterX = props.canvas.width / 2;
    const monsterBottomY = props.canvas.height * 0.80; // Position at 80% from top
    
    // Define hitbox dimensions (make it slightly larger than the egg)
    const hitboxWidth = monsterWidth * 1.2; // Hitbox is 20% wider than monster
    const hitboxHeight = monsterHeight * 1.2; // Hitbox is 20% taller than monster

    this.hitboxRangeX = {
      from: monsterCenterX - (hitboxWidth / 2),
      to: monsterCenterX + (hitboxWidth / 2),
    };
    
    this.hitboxRangeY = {
      from: monsterBottomY - hitboxHeight,
      to: monsterBottomY,
    };

    this.initializeRive();
  }

  private initializeRive() {
    this.riveInstance = new Rive({
      src: this.src,
      canvas: this.props.canvas,
      autoplay: this.props.autoplay,
      stateMachines: [this.stateMachineName],
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      onLoad: () => {
        this.handleLoad();
        // Start continuous hitbox drawing
        const drawLoop = () => {
          requestAnimationFrame(() => {
            this.drawHitbox();
            drawLoop();
          });
        };
        drawLoop();
      },
      useOffscreenRenderer: true,
    });
  }

  private drawHitbox() {
    // Draw on the monster's canvas
    const ctx = this.props.canvas.getContext('2d');
    if (!ctx) return;

    // Save current context state
    ctx.save();

    // Make the hitbox very visible
    ctx.strokeStyle = '#FF0000';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 4;

    // Draw hitbox rectangle
    const hitboxWidth = this.hitboxRangeX.to - this.hitboxRangeX.from;
    const hitboxHeight = this.hitboxRangeY.to - this.hitboxRangeY.from;
    
    // Draw the rectangle
    ctx.beginPath();
    ctx.rect(
      this.hitboxRangeX.from,
      this.hitboxRangeY.from,
      hitboxWidth,
      hitboxHeight
    );
    ctx.stroke();
    ctx.fill();

    // Add crosshair at center
    const centerX = this.hitboxRangeX.from + (hitboxWidth / 2);
    const centerY = this.hitboxRangeY.from + (hitboxHeight / 2);
    const crosshairSize = 20;
    
    ctx.beginPath();
    ctx.moveTo(centerX - crosshairSize, centerY);
    ctx.lineTo(centerX + crosshairSize, centerY);
    ctx.moveTo(centerX, centerY - crosshairSize);
    ctx.lineTo(centerX, centerY + crosshairSize);
    ctx.stroke();

    // Restore context state
    ctx.restore();
  }

  getInputs() {
    return this.riveInstance.stateMachineInputs(this.stateMachineName);
  }

  public moveCanvasUpOrDown(offsetY: number) {
    const canvas = this.props.canvas;
    const currentTop = parseFloat(window.getComputedStyle(canvas).top) || 0;
    if (currentTop === 0) {
      // Set the new top value based on the offset
      const newTop = currentTop + offsetY;

      // Apply the new position
      canvas.style.top = `${newTop}px`;
      canvas.style.position = 'absolute';
      canvas.style.zIndex = '5';         // Set z-index to a high value to bring it on top
    }
  }

  private handleLoad() {
    const inputs = this.getInputs();
    const requiredTriggers = [
      'backToIdle', 'isStomped', 'isMouthOpen', 'isMouthClosed',
      'isChewing', 'isHappy', 'isSpit', 'isSad',
    ];

    const missingTriggers = requiredTriggers.filter(
      (name) => !inputs.some((input) => input.name === name)
    );

    if (missingTriggers.length) {
      console.error(`Missing state machine inputs: ${missingTriggers.join(', ')}`);
    }

    if (this.props.onLoad) this.props.onLoad();
  }

  public triggerInput(inputName: string) {
    const stateMachineInput = this.getInputs().find(input => input.name === inputName);
    if (stateMachineInput) {
      stateMachineInput.fire(); // Trigger input
    } else {
      console.warn(`Input ${inputName} not found.`);
    }
  }

  play(animationName: string) {
    this.riveInstance?.play(animationName);
  }


  stop() {
    this.riveInstance?.stop();
  }

  checkHitboxDistance(event) {
    const rect = this.props.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Get canvas dimensions
    const canvasWidth = this.props.canvas.width;
    const canvasHeight = this.props.canvas.height;

    // Convert client coordinates to canvas coordinates
    const canvasX = (x / rect.width) * canvasWidth;
    const canvasY = (y / rect.height) * canvasHeight;

    return this.validateRange(canvasX, canvasY);
  }

  private validateRange(x, y) {
    // Add debug logging
    console.log('Mouse position:', x, y);
    console.log('Hitbox X range:', this.hitboxRangeX.from, this.hitboxRangeX.to);
    console.log('Hitbox Y range:', this.hitboxRangeY.from, this.hitboxRangeY.to);

    const isWithinHitboxX =
      x >= this.hitboxRangeX.from && x <= this.hitboxRangeX.to;
    const isWithinHitboxY =
      y >= this.hitboxRangeY.from && y <= this.hitboxRangeY.to;

    // Log the result
    console.log('Within hitbox:', isWithinHitboxX && isWithinHitboxY);

    return isWithinHitboxX && isWithinHitboxY;
  }

  // Example click handler
  onClick(xClick: number, yClick: number): boolean {

    return this.validateRange(xClick, yClick); // Explicitly return true or false
  }

  stopRiveMonster() {
    this.riveInstance?.stop();
  }


  public dispose() {
    this.riveInstance?.cleanup();
    this.riveInstance = null;
  }
}