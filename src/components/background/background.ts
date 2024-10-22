import { BaseBackgroundComponent } from "@background/base-background/base-background-component";
import {
  DEFAULT_BG_GROUP_IMGS,
  AUTUMN_BG_GROUP_IMGS,
  WINTER_BG_GROUP_IMGS,
} from "@constants";

interface BackgroundAssets {
  hill: string;
  fence: string;
  totem: string;
}

type Season = "summer" | "autumn" | "winter";

export class BackgroundHtmlGenerator extends BaseBackgroundComponent {
  constructor() {
    super("background");
  }

  // Generates and appends the background section for a given season
  public generateBackground(season: Season): void {
    if (!this.element) return;

    const assets = this.getAssetsForSeason(season);
    this.clearBackgroundContent();
    const section = this.createBackgroundSection(season, assets);
    this.element.appendChild(section);
  }

  // Determines the background type based on the level number
  public static createBackgroundComponent(levelNumber: number): Season {
    const backgroundTypes: Season[] = ["summer", "autumn", "winter"];
    const index = Math.floor(levelNumber / 10) % backgroundTypes.length;
    const selectedBackground =
      levelNumber >= 30 ? backgroundTypes[index % 3] : backgroundTypes[index];

    this.updateBackgroundClass(selectedBackground);
    return selectedBackground;
  }

  // Retrieves assets based on the season
  private getAssetsForSeason(season: Season): BackgroundAssets {
    switch (season) {
      case "summer":
        return {
          hill: DEFAULT_BG_GROUP_IMGS.ASSETS_PATH_HILL,
          fence: DEFAULT_BG_GROUP_IMGS.ASSETS_PATH_FENCE,
          totem: DEFAULT_BG_GROUP_IMGS.ASSETS_PATH_TOTEM,
        };
      case "autumn":
        return {
          hill: AUTUMN_BG_GROUP_IMGS.AUTUMN_HILL_1,
          fence: AUTUMN_BG_GROUP_IMGS.AUTUMN_FENCE_1,
          totem: AUTUMN_BG_GROUP_IMGS.AUTUMN_SIGN_1,
        };
      case "winter":
        return {
          hill: WINTER_BG_GROUP_IMGS.WINTER_HILL_1,
          fence: WINTER_BG_GROUP_IMGS.WINTER_FENCE_1,
          totem: WINTER_BG_GROUP_IMGS.WINTER_SIGN_1,
        };
    }
  }

  // Clears the current background content
  private clearBackgroundContent(): void {
    if (this.element) {
      this.element.innerHTML = "";
    }
  }

  // Creates the background section using assets for a specific season
  private createBackgroundSection(
    season: string,
    assets: BackgroundAssets
  ): HTMLDivElement {
    const section = document.createElement("div");
    section.className = season;

    const mountainDiv = this.createElementWithImage(
      "ftm-mountain",
      assets.hill,
      "Hill",
      "hill-img"
    );
    const fenceDiv = this.createElementWithImage(
      "ftm-fence",
      assets.fence,
      "Fence",
      "fence-img"
    );
    const totemDiv = this.createElementWithImage(
      "ftm-totem",
      assets.totem,
      "Totem",
      "totem-img"
    );

    section.append(mountainDiv, fenceDiv, totemDiv);
    return section;
  }

  // Updates the background element's class based on the selected background type
  private static updateBackgroundClass(selectedBackground: Season): void {
    const backgroundElement = document.getElementById("background");
    if (backgroundElement) {
      backgroundElement.className = "";
      backgroundElement.classList.add(`${selectedBackground}-bg`);
    }
  }
}
