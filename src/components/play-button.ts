import { TappedStart } from "../Firebase/firebase-event-interface";
import { loadImages } from "../common/common";
import { FirebaseIntegration } from "../Firebase/firebase-integration";
import { lang, pseudoId } from "../../global-variables";
import { getData } from "../data/api-data";
import { Canvas, PosX, PosY, ImagesLoaded } from "src/types/buttons";

interface LoadedImages {
  pause_button_image: HTMLImageElement;
}

export default class PlayButton {
  public posX: PosX;
  public posY: PosY;
  public context: CanvasRenderingContext2D;
  public canvas: Canvas;
  public images: { pause_button_image: string };
  public loadedImages: LoadedImages;
  public imagesLoaded: ImagesLoaded = false;
  private majVersion: string;
  private minVersion: string;
  private firebaseIntegration: FirebaseIntegration;

  constructor(
    context: CanvasRenderingContext2D,
    canvas: Canvas,
    posX: PosX,
    posY: PosY
  ) {
    this.posX = posX;
    this.posY = posY;
    this.context = context;
    this.canvas = canvas;
    this.firebaseIntegration = new FirebaseIntegration();
    this.images = {
      pause_button_image: "./assets/images/Play_button.png",
    };
    this.loadImages();
    this.init();
  }

  private async init() {
    try {
      const data = await getData();
      this.majVersion = data.majversion;
      this.minVersion = data.minversion;
    } catch (error) {
      console.error("Failed to fetch version data", error);
    }
  }

  private loadImages() {
    loadImages(this.images, (images) => {
      this.loadedImages = images as LoadedImages;
      this.imagesLoaded = true;
    });
  }

  public draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.loadedImages.pause_button_image,
        this.posX,
        this.posY,
        this.canvas.width / 3,
        this.canvas.width / 3
      );
    }
  }

  // not being used...
  public onClick(xClick: number, yClick: number): boolean {
    console.log("play button clicked");
    const distance = Math.sqrt(
      (xClick - this.posX - this.canvas.width / 6) ** 2 +
        (yClick - this.posY - this.canvas.width / 6) ** 2
    );

    if (distance < this.canvas.width / 8) {
      this.logTappedStartFirebaseEvent();
      return true;
    }
    return false;
  }

  // not being used...
  private logTappedStartFirebaseEvent() {
    const endTime = Date.now();
    const tappedStartData: TappedStart = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number:
        document.getElementById("version-info-id")?.innerHTML || "",
      json_version_number:
        this.majVersion && this.minVersion
          ? `${this.majVersion}.${this.minVersion}`
          : "",
    };

    this.firebaseIntegration.sendTappedStartEvent(tappedStartData);
  }
}
