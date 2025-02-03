import { AudioPlayer, BackgroundHtmlGenerator } from "@components";
import { PlayButtonHtml } from '@components/buttons';
import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';
import { BaseHTML } from '@components/baseHTML/base-html';
import { RiveMonsterComponent } from "@components/riveMonster/rive-monster-component";
import { DataModal } from "@data";
import {
  toggleDebugMode,
  pseudoId,
  lang
} from "@common";
import { FirebaseIntegration } from "../../Firebase/firebase-integration";
import { TappedStart } from "../../Firebase/firebase-event-interface";
import {
  FirebaseUserClicked,
  PWAInstallStatus,
} from "@constants";
import gameStateService from '@gameStateService';

export class StartScene {
  public data: any;
  public pwa_status: string;
  public firebase_analytics: { logEvent: any };
  public id: string;
  public canavsElement: HTMLCanvasElement;
  public riveMonsterElement: HTMLCanvasElement;
  public buttonContext: CanvasRenderingContext2D;
  public playButton: BaseButtonComponent;
  public images: Object;
  public loadedImages: any;
  public imagesLoaded: boolean = false;
  public handler: HTMLBodyElement;
  public static SceneName: string;
  public switchSceneToLevelSelection: Function;
  audioPlayer: AudioPlayer;
  private toggleBtn: HTMLElement;
  private toggleSVG: HTMLElement;
  private togglecanvasBtn: HTMLElement;
  private pwa_install_status: Event;
  private titleTextElement: HTMLElement | null;
  public riveMonster: RiveMonsterComponent;
  private firebaseIntegration: FirebaseIntegration;
  private loadingElement: HTMLElement;
  private onClickArea: BaseHTML;

  constructor(
    data: DataModal,
    switchSceneToLevelSelection: Function
  ) {
    this.data = data;
    this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.riveMonsterElement = document.getElementById("rivecanvas") as HTMLCanvasElement;
    this.toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
    this.toggleSVG = document.getElementById("toggleSVG") as HTMLElement;
    this.togglecanvasBtn = document.getElementById("toggleCanvas") as HTMLElement;
    this.loadingElement = document.getElementById("loading-screen") as HTMLElement;
    this.riveMonster = new RiveMonsterComponent({
      canvas: this.riveMonsterElement,
      autoplay: true,
      fit: "contain",
      alignment: "bottomCenter",
      width: this.riveMonsterElement.width, // Example width and height, adjust as needed
      height: this.riveMonsterElement.height,
      onLoad: () => {
        // this.riveMonster.play(RiveMonsterComponent.Animations.MOUTHOPEN); // Start with the "Idle" animation
        // Trigger a "Happy" animation
        // Set initial state inputs
        //  this.riveMonster.setInput(RiveMonsterComponent.Animations.IDLE,true);

        // Listen for state changes
        //  this.riveMonster.onStateChange((stateName) => {
        //      console.log('New State:', stateName);
        //  });

        // Example: Trigger "Sad" state after 2 seconds
        setTimeout(() => {
          //  this.riveMonster.setInput(RiveMonsterComponent.Animations.STOMP,true);
        }, 2000);
      }
    });
    this.onClickArea = new BaseHTML(
      {
        selectors: {
          root: '#background'
        }
      },
      'start-scene-click-area',
      (id) => (`<div id="${id}"></div>`), true
    );
    this.switchSceneToLevelSelection = switchSceneToLevelSelection;
    this.audioPlayer = new AudioPlayer();
    this.pwa_status = localStorage.getItem(PWAInstallStatus);
    this.handler = document.getElementById('start-scene-click-area') as HTMLBodyElement;
    this.devToggle();
    this.toggleSvg();
    this.toggleCanvas();
    this.createPlayButton();
    window.addEventListener("beforeinstallprompt", this.handlerInstallPrompt);
    this.setupBg();
    this.titleTextElement = document.getElementById("title");
    this.generateGameTitle();
    this.riveMonsterElement.style.zIndex = '4';
    this.firebaseIntegration = new FirebaseIntegration();
    this.hideInitialLoading();
    this.setOnClicknAreaStyle();
  }

  private setupBg = async () => {
    // Determine the background type based on the level number using the static method.
    //Level 1 will be used as a default background for Start Scene.
    const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(1);

    // Apply the logic to update the HTML or visual representation of the background
    const backgroundGenerator = new BackgroundHtmlGenerator();

    // Dynamically update the background based on the selected type
    backgroundGenerator.generateBackground(selectedBackgroundType);
  };

  private setOnClicknAreaStyle = () => {
    this.handler.style.width = 'inherit'; //inherit the full width.
    this.handler.style.height = 'inherit'; //inherit the full height.
    this.handler.style.position = 'absolute';
    this.handler.style.zIndex = '5'; //on top of rive but below the play button.
  }

  private hideInitialLoading = () => {
    setTimeout(() => {
      this.loadingElement.style.zIndex = "-1";
      this.loadingElement.style.display = "none";
    }, 750);
  }

  devToggle = () => {
    this.toggleBtn.addEventListener("click", () =>
      toggleDebugMode(this.toggleBtn)
    );
  };

  toggleCanvas= () =>{
    this.togglecanvasBtn.addEventListener("click", ()=>{
      const element = document.getElementById('svgcanvas');
      if (element) {
        // Toggle the display style between 'none' and 'block'
        if (element.style.display === "none" || element.style.display === "") {
          element.style.display = "block"; // Show the element
          this.riveMonsterElement.style.display = "none";
        } else {
          element.style.display = "none"; // Hide the element
          this.riveMonsterElement.style.display = "block";
        }
      } else {
        console.warn(`Element with ID "${element}" not found.`);
      }
    })
  }

  toggleSvg = () => {
    this.toggleSVG.addEventListener("click", () => {
      const element = document.getElementById('svg-img');
      const elementtwo = document.getElementById('cloudpng');
      const elementthree = document.getElementById('pinstar');
      if (element) {
        // Toggle the display style between 'none' and 'block'
        if (element.style.display === "none" || element.style.display === "") {
          element.style.display = "block"; // Show the element
          this.riveMonsterElement.style.display = "none";
          elementtwo.style.display = "block"
          elementthree.style.display = "block"
        } else {
          element.style.display = "none"; // Hide the element
          this.riveMonsterElement.style.display = "block";
          elementtwo.style.display = "none"
          elementthree.style.display = "none"
        }
      } else {
        console.warn(`Element with ID "${element}" not found.`);
      }

    })
  }

  generateGameTitle = () => {
    this.titleTextElement.textContent = this.data.title;
  };

  createPlayButton() {
    this.playButton = new PlayButtonHtml({ targetId: 'background' });
    this.playButton.onClick(() => {
      this.toggleBtn.style.display = "none";
      this.logTappedStartFirebaseEvent();
      this.audioPlayer.playButtonClickSound();
      gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true);
      this.switchSceneToLevelSelection();
    });
    document.addEventListener("selectstart", function (e) {
      e.preventDefault();
    });
    this.handler.addEventListener("click", this.handleMouseClick, false); 
  }

  handleMouseClick = (event) => {
    event.preventDefault();
    FirebaseIntegration.getInstance().sendUserClickedOnPlayEvent();
    // @ts-ignore
    fbq("trackCustom", FirebaseUserClicked, {
      event: "click",
    });
    this.toggleBtn.style.display = "none";
    this.audioPlayer.playButtonClickSound();
    gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true);
    this.switchSceneToLevelSelection();
  };

  dispose() {
    this.audioPlayer.stopAllAudios();
    //this.handler.removeEventListener("click", this.handleMouseClick, false);
    this.playButton.dispose();
    this.playButton.destroy();
    this.onClickArea.destroy();
    window.removeEventListener(
      "beforeinstallprompt",
      this.handlerInstallPrompt,
      false
    );
  }

  handlerInstallPrompt = (event) => {
    event.preventDefault();
    this.pwa_install_status = event;
    localStorage.setItem(PWAInstallStatus, "false");
  };

  private logTappedStartFirebaseEvent() {
    const tappedStartData: TappedStart = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number: !!this.data.majVersion && !!this.data.minVersion ? this.data.majVersion.toString() + "." + this.data.minVersion.toString() : "",
    };
    this.firebaseIntegration.sendTappedStartEvent(tappedStartData);
  }
}
