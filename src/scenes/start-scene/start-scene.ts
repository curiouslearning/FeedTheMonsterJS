
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
import { AnalyticsIntegration } from "../../analytics/analytics-integration";
import { TappedStart } from "../../analytics/analytics-event-interface";
import {
  SCENE_NAME_LEVEL_SELECT,
  FirebaseUserClicked,
  PWAInstallStatus,
  STARTSCREEN_MONSTER
} from "@constants";
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import './start-scene.scss';
import { TreasureChestAnimation } from '@components/treasureChestAnimation/treasureChestAnimation';
export class StartScene {
  public data: DataModal;
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
  audioPlayer: AudioPlayer;
  private toggleBtn: HTMLElement;
  private pwa_install_status: Event;
  private titleTextElement: HTMLElement | null;
  public riveMonster: RiveMonsterComponent;
  private analyticsIntegration: AnalyticsIntegration;
  private loadingElement: HTMLElement;
  private onClickArea: BaseHTML;
  private hasBGLoaded: boolean = false;
  private hasRiveLoaded: boolean = false;
  private titleElement: BaseHTML;
  private backgroundGenerator: BackgroundHtmlGenerator;

  constructor() {
    this.data = gameStateService.getFTMData();
    this.riveMonsterElement = gameSettingsService.getRiveCanvasValue();
    this.toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
    this.loadingElement = document.getElementById("loading-screen") as HTMLElement;
    this.riveMonster = new RiveMonsterComponent({
      canvas: this.riveMonsterElement,
      autoplay: true,
      fit: "contain",
      alignment: "bottomCenter",
      width: this.riveMonsterElement.width, // Example width and height, adjust as needed
      height: this.riveMonsterElement.height,
      src: STARTSCREEN_MONSTER,
      onLoad: () => {
        //Sets if Rive file flag has been loaded to true and trigger to remove the initial loading.
        this.hasRiveLoaded = true;
        this.hideInitialLoading();
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

    /** 
     * Initialize the title element in the title-and-play-button container
     * Creates a div with the game title that supports long text handling
     */
    this.titleElement = new BaseHTML(
      {
        selectors: {
          root: '#title-and-play-button'
        }
      },
      'title',
      (id) => (`<div id="${id}">${this.data.title}</div>`),
      true
    );
    this.onClickArea = new BaseHTML(
      {
        selectors: {
          root: '#background'
        }
      },
      'start-scene-click-area',
      (id) => (`<div id="${id}"></div>`),
      true
    );
    this.audioPlayer = new AudioPlayer();
    this.pwa_status = localStorage.getItem(PWAInstallStatus);
    this.handler = document.getElementById('start-scene-click-area') as HTMLBodyElement;
    this.devToggle();
    this.createPlayButton();
    window.addEventListener("beforeinstallprompt", this.handlerInstallPrompt);
    this.setupBg();
    this.titleTextElement = document.getElementById("title");
    this.generateGameTitle();
    this.riveMonsterElement.style.zIndex = '4';
    this.analyticsIntegration = AnalyticsIntegration.getInstance();
    this.setOnClicknAreaStyle();
  }

  private setupBg = async () => {
    // Determine the background type based on the level number using the static method.
    //Level 1 will be used as a default background for Start Scene.
    const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(1);

    // Apply the logic to update the HTML or visual representation of the background
    this.backgroundGenerator = new BackgroundHtmlGenerator();

    // Dynamically update the background based on the selected type
    this.backgroundGenerator.generateBackground(selectedBackgroundType);

    //Sets if BG flag has been loaded to true and trigger to remove the initial loading.
    this.hasBGLoaded = true;
    this.hideInitialLoading();
  };

  private setOnClicknAreaStyle = () => {
    this.handler.style.width = 'inherit'; //inherit the full width.
    this.handler.style.height = 'inherit'; //inherit the full height.
    this.handler.style.position = 'absolute';
    this.handler.style.zIndex = '5'; //on top of rive but below the play button.
  }

  private hideInitialLoading = () => {
    if (this.hasBGLoaded && this.hasRiveLoaded) {
      setTimeout(() => {
        this.loadingElement.style.zIndex = "-1";
        this.loadingElement.style.display = "none";
      }, 750);
    }
  }

  devToggle = () => {
    this.toggleBtn.addEventListener("click", () =>
      toggleDebugMode(this.toggleBtn)
    );
  };

  generateGameTitle = () => {
    if (this.titleTextElement) {
      this.titleTextElement.textContent = this.data.title;

      // Check if current language needs long title treatment
      if (this.data.title && this.data.title.length > 20) {
        this.titleTextElement.classList.add('title-long');
      } else {
        this.titleTextElement.classList.remove('title-long');
      }
    }
  };

  createPlayButton() {
    this.playButton = new PlayButtonHtml({ targetId: 'title-and-play-button' });
    this.playButton.onClick(() => {
      this.toggleBtn.style.display = "none";
      this.logTappedStartFirebaseEvent();
      this.audioPlayer.playButtonClickSound();
      gameStateService.publish(gameStateService.EVENTS.START_GAME, true);
    });
    document.addEventListener("selectstart", function (e) {
      e.preventDefault();
    });
    this.handler.addEventListener("click", this.handleMouseClick, false);
  }

  handleMouseClick = (event) => {
    event.preventDefault();
    AnalyticsIntegration.getInstance().sendUserClickedOnPlayEvent();
    // @ts-ignore
    fbq("trackCustom", FirebaseUserClicked, {
      event: "click",
    });
    this.toggleBtn.style.display = "none";
    this.audioPlayer.playButtonClickSound();
    gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_LEVEL_SELECT);
  };

  dispose() {
    this.audioPlayer.stopAllAudios();
    this.handler.removeEventListener("click", this.handleMouseClick, false);
    this.playButton.dispose();
    this.playButton.destroy();
    this.playButton = null;
    this.onClickArea.destroy();
    this.titleElement.destroy();
    window.removeEventListener(
      "beforeinstallprompt",
      this.handlerInstallPrompt,
      false
    );
    this.riveMonsterElement.style.zIndex = "-1"; //Originally in LevelSelectionConstructor, moving it here so no need to have Rive logic in that scene.
    this.riveMonster.dispose();
    this.backgroundGenerator && this.backgroundGenerator.clearBackgroundContent();
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
    this.analyticsIntegration.sendTappedStartEvent(tappedStartData);
  }
}
