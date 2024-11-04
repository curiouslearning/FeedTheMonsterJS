import {CLICK, loadImages} from '@common';
import {AudioPlayer} from '@components';
import {YesButton, NoButton} from '@buttons';
import {POPUP_BG_IMG} from '@constants';

export default class AreYouSurePopUp {
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public imagesLoaded: boolean = false;
  public pop_up_image: HTMLImageElement;
  public yesCallback: Function;
  public noCallback: Function;
  audioPlayer: AudioPlayer;

  constructor(canvas, yesCallback, noCallback) {
    this.canvas = canvas;
    this.yesCallback = yesCallback;
    this.noCallback = noCallback;
    this.context = this.canvas.getContext('2d');
    this.audioPlayer = new AudioPlayer();

    loadImages({pop_up_image: POPUP_BG_IMG}, images => {
      this.pop_up_image = images['pop_up_image'];
      this.imagesLoaded = true;
    });
  }

  addListner = () => {
    this.canvas.addEventListener(CLICK, this.handleMouseClick, false);

    // Remove existing buttons before adding new ones
    document.getElementById('yes-button')?.remove();
    document.getElementById('no-button')?.remove();

    new YesButton(() => {
      this.dispose();
      this.yesCallback();
    });

    new NoButton(() => {
      this.dispose();
      this.noCallback();
    });
  };

  handleMouseClick = event => {
    const selfElement = document.getElementById('canvas') as HTMLElement;
    event.preventDefault();
    const rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
  };

  draw() {
    if (this.imagesLoaded) {
      this.context.fillStyle = 'rgba(0,0,0,0.5)';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(
        this.pop_up_image,
        this.canvas.width * 0.1,
        this.canvas.height * 0.2,
        this.canvas.width * 0.8,
        this.canvas.width * 0.8,
      );

      const textY = this.canvas.height * 0.2 + 80;
      this.context.fillStyle = 'white';
      this.context.font = '24px Arial';
      this.context.fillText(
        'Are you sure?',
        this.canvas.width / 2,
        this.canvas.height / 2.8,
      );
    }
  }

  playClickSound = () => {
    this.audioPlayer.playButtonClickSound();
  };

  dispose = () => {
    this.canvas.removeEventListener(CLICK, this.handleMouseClick, false);
  };
}
