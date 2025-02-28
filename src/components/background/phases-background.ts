import { BaseBackgroundComponent } from "@components/background/base-background/base-background-component";
import { PHASE_1_BG, PHASE_2_BG, PHASE_3_BG } from '@constants';

interface BackgroundAssets {
  placeholder: string;
}

export class PhasesBackground extends BaseBackgroundComponent {
  constructor() {
    super("background");
  }

  // Generates and appends the background section for a given phase number.
  public generateBackground(phase: number): void {
    const backgroundElementsContainer = document.getElementById(
      "background-elements"
    );

    if (!backgroundElementsContainer) return;

    const assets = this.getAssetsForSeason(phase);
    this.clearBackgroundContent();

    const section = this.createBackgroundSection(assets);
    backgroundElementsContainer.appendChild(section);
  }

  // Retrieves assets based on the phase of monster.
  private getAssetsForSeason(phase: number): BackgroundAssets {
    //Note: The phase background is currently one image, but it will soon be split. Returning an object with the asset path remains valid.
    switch (phase) {
      case 2:
        return {
          placeholder: PHASE_3_BG,
        };
      case 1:
        return {
          placeholder: PHASE_2_BG,
        };
      case 0:
      default:
        return {
          placeholder: PHASE_1_BG ,
        };
    }
  }

  // Creates the background section using assets for a specific season
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
    const backgroundElementsContainer = document.getElementById(
      "background-elements"
    );
    if (backgroundElementsContainer) {
      backgroundElementsContainer.innerHTML = ""; // Clear only dynamic background elements
    }
  }
}