import { Debugger } from "@common";
import { languageFontMapping } from "@data/i18-font-mapping";
export class Utils {
  public static UrlSubstring: string = "/feedthemonster";

  public static getConvertedDevProdURL(url: string): string {
    return Debugger.DevelopmentLink
      ? url.slice(
          0,
          url.indexOf(this.UrlSubstring) + this.UrlSubstring.length
        ) +
          "dev" +
          url.slice(url.indexOf(this.UrlSubstring) + this.UrlSubstring.length)
      : url;
  }

  public static getLanguageSpecificFont(language: string): string {
    const lowerCaseLanguage = language.toLowerCase();

    for (const key in languageFontMapping) {
      if (key.toLowerCase() === lowerCaseLanguage) {
        return languageFontMapping[key];
      }
    }

    console.log(`Font not found for language: ${language}`);
    return "NotoSans-Regular";
  }

  public static getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  public static getExcludedCoordinates(
    canvas: HTMLCanvasElement,
    exclusionPercentage: number
  ): { excludeX: number; excludeY: number } {
    const excludedAreaWidth = canvas.width * (exclusionPercentage / 100);
    const excludedAreaHeight = canvas.height * (exclusionPercentage / 100);

    return { excludeX: excludedAreaWidth, excludeY: excludedAreaHeight };
  }
}

export function createRippleEffect(
  context: CanvasRenderingContext2D
): (x: number, y: number, restart?: boolean) => void {
  const ctx = context as unknown as CanvasRenderingContext2D;
  if (!ctx) {
    throw new Error("Canvas context is null");
  }

  let centerX: number = 0;
  let centerY: number = 0;

  const initialOuterRadius: number = 10;
  const initialInnerRadius: number = 10;
  const maxRadius: number = 60;
  let increment: number = 0.5;
  let outerRadius: number = initialOuterRadius;
  let innerRadius: number = initialInnerRadius;

  function drawRipple(x: number, y: number, restart?: boolean): void {
    if (restart) {
      outerRadius = 0;
      innerRadius = 0;
    }
    centerX = x;
    centerY = y;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    outerRadius += increment;
    innerRadius += increment;

    if (outerRadius >= maxRadius || innerRadius >= maxRadius) {
      outerRadius = initialOuterRadius;
      innerRadius = initialInnerRadius;
    }
  }

  return drawRipple;
}

export function loadImages(sources: any, callback: any) {
  const images = {};
  let loadedImages = 0;
  const numImages = Object.keys(sources).length;

  for (let src in sources) {
    images[src] = new Image();
    images[src].onload = function () {
      if (++loadedImages >= numImages) {
        callback(images);
      }
    };
    images[src].src = sources[src];
  }
}

const createImg = async (image) => {
  const newImage = new Image();

  return new Promise((resolve) => {
    newImage.onload = () => resolve(newImage);
    newImage.src = image;
  });
};

export const syncLoadingImages = async (images: object) => {
  const loadImgPromises = Object.keys(images).map(async (arrKey) => {
    const img = await createImg(images[arrKey]);
    return { [arrKey]: img };
  });

  const resolvedImage = await Promise.all(loadImgPromises);
  const loadedImages = resolvedImage.reduce((accumulator, current) => {
    return { ...accumulator, ...current };
  }, {});

  return loadedImages;
};
