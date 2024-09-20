import { applyFontToElement, hideElement, lang } from "@common";
import { feedbackTextDefault, FONT_BASE_PATH } from "@constants";
import { feedbackCustomFonts } from "@data";

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
    this.loadFont();
  }

  private isFeedbackElementAvailable(): boolean {
    return !!this.feedbackTextElement;
  }

  private async loadFont() {
    const fontOptions = {
      customFonts: feedbackCustomFonts,
      defaultFont: feedbackTextDefault,
      lang: lang,
    };

    applyFontToElement(this.feedbackTextElement, fontOptions, FONT_BASE_PATH);
  }

  public wrapText(text: string): void {
    if (!this.isFeedbackElementAvailable()) return;

    // Set the text content
    this.feedbackTextElement.textContent = text;

    // Dynamically adjust the font size based on the length of the text
    if (text.length >= 12) {
      this.feedbackTextElement.style.fontSize = "30px";
    } else {
      this.feedbackTextElement.style.fontSize = ""; // Reset to default font size (or specify default if needed)
    }

    // Show the feedback element
    hideElement(false, this.feedbackTextElement);

    // Set the timeout to hide the feedback text after a delay
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
