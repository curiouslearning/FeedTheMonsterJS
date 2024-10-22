
export interface IBackgroundComponent {
  draw(): void; 
}
export abstract class BaseBackgroundComponent implements IBackgroundComponent {
  protected backgroundElement: HTMLElement | null;

  constructor() {
    this.backgroundElement = document.getElementById("background");
  }

  protected setBackgroundClass(className: string): void {
    if (this.backgroundElement) {
      this.backgroundElement.className = ""; // Reset the class
      this.backgroundElement.classList.add(className); // Add the new class
    }
  }

  // Enforce the implementation of draw method in derived classes
  public abstract draw(): void;
}
