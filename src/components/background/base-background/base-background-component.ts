export abstract class BaseBackground {
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
  
    public abstract draw(): void;
  }
  