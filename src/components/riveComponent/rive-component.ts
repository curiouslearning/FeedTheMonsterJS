import { Alignment, EventType, Fit, Layout, Rive, RiveEventPayload, RuntimeLoader, StateMachineInput } from '@rive-app/canvas';
import { PubSub } from '../../events/pub-sub-events';
import { CACHED_RIVE_WASM } from '@constants';

RuntimeLoader.setWasmUrl(CACHED_RIVE_WASM);

export interface RiveComponentConfig {
  canvas: HTMLCanvasElement;
  src: string;
  autoplay: boolean;
  stateMachine: string; // Made configurable, defaults to "State Machine 1"
  fit?: Fit;
  alignment?: Alignment;
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
  onLoad?: () => void;
}

export class RiveComponent extends PubSub {

  protected riveInstance: Rive;
  protected config: RiveComponentConfig;

  constructor(protected readonly canvas: HTMLCanvasElement) {
    super();
  }

  protected init(): void {
    this.config = this.createRiveConfig();
    this.initializeRive();
  }

  protected createRiveConfig(): RiveComponentConfig {
    // This method should be overridden by subclasses to modify the Rive configuration before initialization.
    throw new Error('Method not implemented.');
  }

  protected initializeRive(): void {
    this.riveInstance = new Rive({
      src: this.config.src,
      canvas: this.config.canvas,
      autoplay: this.config.autoplay,
      layout: new Layout({
        fit: this.config.fit || Fit.Contain,
        alignment: this.config.alignment || Alignment.Center,
        minX: this.config.minX || 0,
        minY: this.config.minY || 0,
        maxX: this.config.maxX || this.config.canvas.width,
        maxY: this.config.maxY || this.config.canvas.height,
      }),
      stateMachines: [this.config.stateMachine],
      useOffscreenRenderer: true,
      onLoad: () => {
        this.riveOnLoadCallback();
      }
    });
  }

  protected riveOnLoadCallback(): void {
    this.riveInstance.on(EventType.RiveEvent, (event) => {
      const eventName = (event.data as RiveEventPayload).name;
      this.publish(eventName, event.data);
    });

    if (this.config.onLoad) {
      this.config.onLoad();
    }
  }

  /**
   * Helper to retrieve a specific input from the state machine.
   */
  protected getInput(name: string): StateMachineInput | undefined {
    if (!this.riveInstance) return undefined;
    const inputs = this.riveInstance.stateMachineInputs(this.config.stateMachine);
    return inputs?.find(i => i.name === name);
  }

  /**
   * Sets a number input value (e.g., for progress bars or scores).
   */
  public setNumberInput(name: string, value: number): void {
    const input = this.getInput(name);
    if (input) {
      input.value = value;
      input.fire();
    }
  }

  /**
   * Sets a boolean input value (e.g., for toggling states).
   */
  public setBooleanInput(name: string, value: boolean): void {
    const input = this.getInput(name);
    if (input) {
      input.value = value;
      input.fire();
    }
  }

  /**
   * Fires a trigger input (e.g., to start an action).
   */
  public triggerInput(name: string): void {
    const input = this.getInput(name);
    if (input) {
      input.fire();
    }
  }

  public play(animationName: string) {
    this.riveInstance?.play(animationName);
  }

  public stop() {
    this.riveInstance?.stop();
  }

  private cleanupRiveInstance() {
    this.riveInstance?.cleanup();
    this.riveInstance = null;
  }

  public dispose() {
    this.unsubscribeAll();
    if (!this.riveInstance) return;
    this.cleanupRiveInstance();
  }
}
