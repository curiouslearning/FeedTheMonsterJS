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
    hideElement(false, this.feedbackTextElement);
  }

  public hideText(): void {
    if (!this.isFeedbackElementAvailable()) return;
    hideElement(true, this.feedbackTextElement);
  }
}
