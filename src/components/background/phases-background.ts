import { BaseBackgroundComponent } from "@components/background/base-background/base-background-component";
import { PHASES_BG } from '@constants';

interface BackgroundAssets {
  placeholder: string;
}
// 0 = Egg monster state | 1 = Hatched monster state | 2 = grown up monster state
type PhaseNumber = 0 | 1 | 2;

export class PhasesBackground extends BaseBackgroundComponent {
  constructor() {
    super("background");
  }

  private getBackgroundElement() {
    return document.getElementById("background-elements");
  }

  // Generates and appends the background section for a given phase number.
  public generateBackground(phase: PhaseNumber): void {
    const backgroundElementsContainer = this.getBackgroundElement();

    if (!backgroundElementsContainer) return;

    const assets = this.getAssetsForPhase(phase);
    this.clearBackgroundContent();

    const section = this.createBackgroundSection(assets);
    backgroundElementsContainer.appendChild(section);
  }

  // Retrieves assets based on the phase of monster.
  private getAssetsForPhase(phase: PhaseNumber): BackgroundAssets {
    //Note: The phase background is currently one image, but it will soon be split. Returning an object with the asset path remains valid.
    switch (phase) {
      case 2:
        return {
          placeholder: PHASES_BG[phase],
        };
      case 1:
        return {
          placeholder: PHASES_BG[phase],
        };
      case 0:
      default:
        return {
          placeholder: PHASES_BG[phase] ,
        };
    }
  }

  // Creates the background section using assets for a specific phase
  private createBackgroundSection(
    assets: BackgroundAssets
  ): HTMLDivElement {
    const section = document.createElement("div");
    section.className = 'evolution-phase-bg';

    //Note: Replace this when the background images are no longer in one image.
    const backgroundImg = this.createElementWithImage(
      "phase-bg-img",
      assets.placeholder,
      "PHASE BG",
      "phasebg-img"
    );

    section.append(backgroundImg);
    return section;
  }

  // Clears only the content within the #background-elements container
  public clearBackgroundContent(): void {
    const backgroundElementsContainer = this.getBackgroundElement();
    if (backgroundElementsContainer) {
      backgroundElementsContainer.innerHTML = ""; // Clear only dynamic background elements
    }
  }
}