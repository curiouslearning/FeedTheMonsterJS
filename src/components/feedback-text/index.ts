import { hideElement } from "@common";

export class FeedbackTextEffects {
  private feedbackTextElement: HTMLElement | null;
  private hideTimeoutId: number | null;

  constructor() {
    this.feedbackTextElement = document.getElementById("feedback-text");
    this.hideTimeoutId = null;
    this.initialize();
  }

  private initialize() {
    if (!this.isFeedbackElementAvailable()) return;
  }

  private isFeedbackElementAvailable(): boolean {
    return !!this.feedbackTextElement;
  }

  public wrapText(text: string): void {
    if (!this.isFeedbackElementAvailable()) return;
    this.feedbackTextElement.textContent = text;

    // Dynamically adjust the font size based on the length of the text
    this.feedbackTextElement.style.fontSize = text.length >= 12 ? "30px" : "";

    hideElement(false, this.feedbackTextElement);

    this.setHideTimeout();
  }

  private setHideTimeout(): void {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
    }

    this.hideTimeoutId = window.setTimeout(() => {
      hideElement(true, this.feedbackTextElement);
      this.hideTimeoutId = null;
    }, 4000);
  }
}
