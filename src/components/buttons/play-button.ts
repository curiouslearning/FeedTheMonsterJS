import { TappedStart } from "../../Firebase/firebase-event-interface";
import { loadImages } from "../../common";
import { FirebaseIntegration } from "../../Firebase/firebase-integration";
import { lang, pseudoId } from "../../../global-variables";
import { getData } from "@data/api-data";
import { drawImageOnCanvas } from "@common/index";
import {
  ButtonImage,
  ButtonInterface,
  Canvas,
  ImagesLoaded,
  LoadedImages,
  PosX,
  PosY,
} from "@interfaces/buttons";
export default class PlayButton implements ButtonInterface {
  public posX: PosX;
  public posY: PosY;
  public context: CanvasRenderingContext2D;
  public canvas: Canvas;
  public button_image: ButtonImage;
  public loadedImages: LoadedImages;
  public imagesLoaded: ImagesLoaded = false;
  private majVersion: string;
  private minVersion: string;
  private firebaseIntegration: FirebaseIntegration;
  constructor(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    posX: number,
    posY: number
  ) {
    this.posX = posX;
    this.posY = posY;
    this.context = context;
    this.canvas = canvas;
    this.firebaseIntegration = new FirebaseIntegration();
    this.init();

    loadImages(
      {
        button_image: "./assets/images/Play_button.png",
      },
      (images) => {
        this.button_image = images["button_image"];
        this.imagesLoaded = true;
      }
    );
  }
  private async init() {
    const data = await getData();
    this.majVersion = data.majversion;
    this.minVersion = data.minversion;
  }
  draw() {
    if (this.imagesLoaded) {
      drawImageOnCanvas(
        this.context,
        this.button_image,
        this.posX,
        this.posY,
        this.canvas.width / 3,
        this.canvas.width / 3
      );
    }
  }

  onClick(xClick: number, yClick: number): boolean {
    const distance = Math.sqrt(
      (xClick - this.posX - this.canvas.width / 6) *
        (xClick - this.posX - this.canvas.width / 6) +
        (yClick - this.posY - this.canvas.width / 6) *
          (yClick - this.posY - this.canvas.width / 6)
    );
    this.logTappedStartFirebaseEvent();
    if (distance < this.canvas.width / 8) {
      return true;
    }
  }
  public logTappedStartFirebaseEvent() {
    let endTime = Date.now();
    const tappedStartData: TappedStart = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number:
        !!this.majVersion && !!this.minVersion
          ? this.majVersion.toString() + "." + this.minVersion.toString()
          : "",
    };
    this.firebaseIntegration.sendTappedStartEvent(tappedStartData);
  }
}
