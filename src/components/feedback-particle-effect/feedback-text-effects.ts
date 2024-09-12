import { hideElement, lang } from "@common";
import { feedbackTextDefault, FONT_BASE_PATH } from "@constants";
import { feedbackCustomFonts } from "@data/feedback-fonts";
import anime from "animejs/lib/anime.es.js";

export class FeedbackTextEffects {
  private feedbackTextElement: HTMLElement | null;
  private hideTimeoutId: number | null;
  private animation: anime;

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

    this.feedbackTextElement.textContent = text;

    console.log(
      this.feedbackTextElement.textContent.replace(
        /\S/g,
        "<span class='letter'>$&</span>"
      )
    );

    this.feedbackTextElement.innerHTML =
      this.feedbackTextElement.textContent.replace(
        /\S/g,
        "<span class='letter'>$&</span>"
      );

    anime
      .timeline
      // { loop: true }
      ()
      .add({
        targets: "#feedback-text .letter",
        scale: [0, 1],
        duration: 1500,
        elasticity: 600,
        delay: (el, i) => 45 * (i + 1),
      })
      .add({
        targets: "#feedback-text",
        // opacity: 0,
        duration: 1000,
        easing: "easeOutExpo",
        delay: 1000,
      });

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
