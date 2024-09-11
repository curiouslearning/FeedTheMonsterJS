import { hideShowElement, lang, Utils } from "@common";
import { feedbackTextDefault, FONT_BASE_PATH } from "@constants";
import { feedbackCustomFonts } from "@data/feedback-fonts";

export class FeedbackTextEffects {
  private feedbackTextElement: HTMLElement | null;
  private hideTimeoutId: number | null = null;

  constructor() {
    this.feedbackTextElement = document.getElementById("feedback-text");
    this.initialize();
  }

  /**
   * Initializes the feedback text effects, loading the font if the element is found.
   */
  private initialize() {
    if (!this.isFeedbackElementAvailable()) return;
    this.loadFont();
  }

  /**
   * Checks if the feedback text element is available and logs an error if not.
   * @returns A boolean indicating whether the element is available.
   */
  private isFeedbackElementAvailable(): boolean {
    if (!this.feedbackTextElement) {
      console.error("Feedback text element not found!");
      return false;
    }
    return true;
  }

  /**
   * Loads the appropriate font based on the current language.
   */
  private async loadFont() {
    const fontName = feedbackCustomFonts[lang] || feedbackTextDefault;
    const fontPath = `${FONT_BASE_PATH}${fontName}.ttf`;
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

    if (this.isFeedbackElementAvailable()) {
      this.feedbackTextElement!.style.fontFamily = `${fontName}, sans-serif`;
    }
  }

  /**
   * Updates the feedback text with an animation.
   * @param text - The text to display in the feedback element.
   */
  public wrapText(text: string): void {
    if (!this.isFeedbackElementAvailable()) return;

    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }

    this.feedbackTextElement.textContent = text;
    hideShowElement(false, this.feedbackTextElement);

    this.hideTimeoutId = window.setTimeout(() => {
      hideShowElement(true, this.feedbackTextElement);
      this.hideTimeoutId = null;
    }, 4000);
  }
}
