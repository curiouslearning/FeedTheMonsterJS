import { hideShowElement, lang, Utils } from "@common";
import { feedbackTextDefault, FONT_BASE_PATH } from "@constants";
import { feedbackCustomFonts } from "@data/feedback-fonts";

export class FeedbackTextEffects {
  private feedbackTextElement: HTMLElement | null;
  private hideTimeoutId: number | null = null; // Store the timeout ID

  constructor() {
    this.feedbackTextElement = document.getElementById("feedback-text");

    // Call an initialization method to handle further logic
    this.initialize();
  }

  /**
   * Initializes the feedback text effects, loading the font if the element is found.
   */
  private initialize() {
    if (!this.feedbackTextElement) {
      console.error("Feedback text element not found!");
      return;
    }

    this.loadFont();
  }

  /**
   * Loads the appropriate font based on the current language.
   */
  private async loadFont() {
    const fontName = feedbackCustomFonts[lang] || feedbackTextDefault; // Determine the final font to use
    const fontPath = `${FONT_BASE_PATH}${fontName}.ttf`; // Construct the font path

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

    // Clear any existing timeout to prevent memory leaks
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }

    this.feedbackTextElement.textContent = text;
    hideShowElement(false, this.feedbackTextElement);

    // Set a new timeout and store its ID
    this.hideTimeoutId = window.setTimeout(() => {
      hideShowElement(true, this.feedbackTextElement);
      this.hideTimeoutId = null; // Reset the timeout ID once the callback is executed
    }, 4000);
  }
}
