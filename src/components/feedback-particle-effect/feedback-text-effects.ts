import { hideShowElement, lang, Utils } from "@common";
import { feedbackTextDefault } from "@constants";
import { feedbackCustomFonts } from "@data/feedback-fonts";

export class FeedbackTextEffects {
  private feedbackTextElement: HTMLElement | null;

  constructor() {
    this.feedbackTextElement = document.getElementById("feedback-text");

    if (!this.feedbackTextElement) {
      console.error("Feedback text element not found!");
      return;
    }

    this.loadFont();
  }

  private async loadFont() {
    const fontName = feedbackCustomFonts[lang] || feedbackTextDefault; // Determine the final font to use
    const fontPath = `./assets/fonts/${fontName}.ttf`; // Construct the font path

    this.applyFontToElement(fontName, fontPath);
  }

  /**
   * Applies the specified font to the feedback text element and adds the necessary @font-face rule.
   * @param fontName - The name of the font to apply.
   * @param fontPath - The path to the font file.
   */
  private applyFontToElement(fontName: string, fontPath: string) {
    if (fontPath) {
      const style = document.createElement("style");
      style.textContent = `
        @font-face {
          font-family: '${fontName}';
          src: url('${fontPath}') format('truetype');
        }
      `;
      document.head.appendChild(style);
    }

    if (this.feedbackTextElement) {
      this.feedbackTextElement.style.fontFamily = `${fontName}, sans-serif`;
    }
  }

  /**
   * Updates the feedback text with an animation.
   * @param text - The text to display in the feedback element.
   */
  public wrapText(text: string): void {
    if (!this.feedbackTextElement) {
      console.error("Feedback text element not found!");
      return;
    }

    this.feedbackTextElement.textContent = text;
    hideShowElement(false, this.feedbackTextElement);

    setTimeout(() => hideShowElement(true, this.feedbackTextElement), 3000);
  }
}