import { BaseBackgroundComponent } from "@components/background/base-background/base-background-component";
import {
  DEFAULT_BG_GROUP_IMGS,
  AUTUMN_BG_GROUP_IMGS,
  WINTER_BG_GROUP_IMGS,
  NEW_BACKGROUNDS_IMGS
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
    const backgroundElementsContainer = document.getElementById(
      "background-elements"
    );
    if (!backgroundElementsContainer) return;

    const assets = this.getAssetsForSeason(season);
    this.clearBackgroundContent();
    const section = this.createSeasonBackgroundSection(season, assets);
    backgroundElementsContainer.appendChild(section);
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

  // Injects the background elements into the "#background-elements" container for gameplay
  public createBackgroundGameplay(season: Season): void {
    // Find the container for background elements
    const backgroundElementsContainer = document.getElementById(
      "background-elements"
    );
    if (!backgroundElementsContainer) return;

    // Get the assets for the specified season
    const assets = this.getAssetsForSeason(season);

    // Create a new section div for the elements
    const section = document.createElement("div");
    section.className = `${season}-section`; // Optional class to differentiate sections

    // Create and append the hill, fence, and totem elements using reusable helper method
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

    // Append the new section inside the background elements container
    backgroundElementsContainer.appendChild(section);
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
      default:
        throw new Error("Unknown season: " + season);
    }
  }

  // Clears only the content within the #background-elements container
  private clearBackgroundContent(): void {
    const backgroundElementsContainer = document.getElementById(
      "background-elements"
    );
    if (backgroundElementsContainer) {
      backgroundElementsContainer.innerHTML = ""; // Clear only dynamic background elements
    }
  }

  // Creates the season background section using assets for a specific season
  private createSeasonBackgroundSection(
    season: Season,
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
    const newClass = `${selectedBackground}-bg`;

    if (backgroundElement && backgroundElement.className !== newClass) {
      // Directly update the class only if it has changed
      backgroundElement.className = newClass;
    }
  }

  // Generates and appends the background section for a given season
  public generateGameBackground(assetName: string): void {
    const backgroundElementsContainer = document.getElementById(
      "background-elements"
    );
    if (!backgroundElementsContainer) return;

    //const assets = this.createGameBackgroundSection(assetName season);
    this.clearBackgroundContent();
    const section = this.createGameBackgroundSection(assetName, NEW_BACKGROUNDS_IMGS[assetName]);
    backgroundElementsContainer.appendChild(section);
  }

  // Creates the game background section using assets for a specific season
  private createGameBackgroundSection(
    bgName: string,
    assets: any
  ): HTMLDivElement {
    const section = document.createElement("div");
    section.className = bgName;

    const cloudDiv = this.createElementWithImage(
      "ftm-clouds grid-area",
      assets.cloud,
      "Clouds",
      "cloud-img"
    );
    const treeDiv = this.createElementWithImage(
      "ftm-tree grid-area",
      assets.tree,
      "Tree",
      "tree-img"
    );

    const landDiv = this.createElementWithImage(
      "ftm-land grid-area",
      assets.land,
      "Land",
      "land-img"
    );

    const houseDiv = this.createElementWithImage(
      "ftm-house grid-area",
      assets.house,
      "House",
      "house-img"
    );

    section.append(cloudDiv, treeDiv, landDiv, houseDiv);
    return section;
  }


}
