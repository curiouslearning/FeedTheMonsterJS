export class BaseBackgroundComponent {
  protected element: HTMLElement | null;

  constructor(elementId: string) {
    this.element = document.getElementById(elementId);
  }

  // Method to set a class name on the element
  protected setClassName(className: string): void {
    if (this.element) {
      this.element.className = ""; // Clear existing classes
      this.element.classList.add(className);
    }
  }

  // Helper function to create an image element inside a wrapper div
  protected createElementWithImage(
    wrapperClassName: string,
    imageSrc: string,
    imageAlt: string,
    imageId: string
  ): HTMLDivElement {
    const wrapperDiv = document.createElement("div");
    wrapperDiv.className = wrapperClassName;

    const imgElement = document.createElement("img");
    imgElement.src = imageSrc;
    imgElement.alt = imageAlt;
    imgElement.id = imageId;

    wrapperDiv.appendChild(imgElement);

    return wrapperDiv;
  }
}
