// Utility function to update the background element's class
const updateBackgroundClass = (newClassName: string) => {
  const background = document.getElementById("background");
  if (background) {
    background.className = ""; // Reset the class
    background.classList.add(newClassName); // Add the new class
  }
};

// Object that defines the available background options with their respective draw functions
export const BACKGROUND_HTML_LIST = {
  summer: { draw: () => updateBackgroundClass("summer-bg") },
  autumn: { draw: () => updateBackgroundClass("autumn-bg") },
  winter: { draw: () => updateBackgroundClass("winter-bg") },
};

// Function to load background based on level number
export const loadBackground = (
  levelNumber: number,
  assetsList: Record<string, { draw: () => void }>
): { draw: () => void } => {
  const backgroundTypes = Object.keys(assetsList);
  const backgroundIndex = Math.floor(levelNumber / 10) % backgroundTypes.length;

  // Wrap around first three types if the levelNumber exceeds 30
  const selectedBackgroundType = levelNumber >= 30 ? backgroundIndex % 3 : backgroundIndex;

  return assetsList[backgroundTypes[selectedBackgroundType]];
};
