import { hideElement, lang } from "@common";
import { feedbackTextDefault, FONT_BASE_PATH } from "@constants";
import { feedbackCustomFonts } from "@data/feedback-fonts";

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

  public wrapText(text: string): void {
    if (!this.isFeedbackElementAvailable()) return;

    this.clearHideTimeout();

    this.feedbackTextElement.textContent = text;
    hideElement(false, this.feedbackTextElement);

    this.setHideTimeout();
  }

  private setHideTimeout(): void {
    this.hideTimeoutId = window.setTimeout(() => {
      hideElement(true, this.feedbackTextElement);
      this.hideTimeoutId = null;
    }, 4000);
  }

  private clearHideTimeout(): void {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
  }
}
