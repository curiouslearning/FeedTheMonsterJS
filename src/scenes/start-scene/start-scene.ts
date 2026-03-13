
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
import { AnalyticsIntegration, AnalyticsEventType } from "../../analytics/analytics-integration";
import {
  SCENE_NAME_LEVEL_SELECT,
  FirebaseUserClicked,
  PWAInstallStatus,
  STARTSCREEN_MONSTER
} from "@constants";
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import './start-scene.scss';
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
  private assessmentOverlayElement: HTMLElement | null = null;
  private assessmentContainer: HTMLElement | null = null;
  private assessmentRemote: any = null;
  private assessmentControlContainer: HTMLElement | null = null;
  private openAssessmentButton: HTMLButtonElement | null = null;
  private closeAssessmentButton: HTMLButtonElement | null = null;

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
    this.createAssessmentButton();
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

  private createAssessmentContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'assessment-container';

    Object.assign(container.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '10',
      background: '#000',
    });

    // Attach to StartScene root (NOT document.body)
    document.getElementById('background')?.appendChild(container);

    this.assessmentContainer = container;
    return container;
  }



  /** Adds a second button to open the assessment app as a federated module. */
  createAssessmentButton() {
    const background = document.getElementById('background');
    if (!background) return;

    // Check if button already exists to prevent duplicates
    if (document.getElementById('assessment-controls')) {
      console.log('Assessment button already exists, skipping creation');
      return;
    }

    const controls = document.createElement('div');
    controls.id = 'assessment-controls';

    const openBtn = document.createElement('button');
    openBtn.id = 'open-assessment-btn';
    openBtn.className = 'assessment-toggle-btn open-assessment-btn';
    openBtn.innerText = 'Open Assessment';
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Open Assessment button clicked');
      this.openAssessment();
    });

    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-assessment-btn';
    closeBtn.className = 'assessment-toggle-btn close-assessment-btn';
    closeBtn.innerText = 'Close Assessment';
    closeBtn.style.display = 'none';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeAssessment();
    });

    controls.appendChild(openBtn);
    controls.appendChild(closeBtn);
    background.appendChild(controls);

    this.assessmentControlContainer = controls;
    this.openAssessmentButton = openBtn;
    this.closeAssessmentButton = closeBtn;
  }

  private async openAssessment() {
    if (this.assessmentContainer) return;

    const container = this.createAssessmentContainer();
    this.showAssessmentCloseButton();

    try {
      const remote = await import('assessment_survey_js/App');
      const mod = remote.default ?? remote;

      if (typeof mod.mount !== 'function') {
        throw new Error('mount() not found on assessment remote');
      }

      const baseUrl = this.getAssessmentBaseUrl();
      console.log('Assessment Module:', mod);
      console.log('Mounting assessment with baseUrl:', baseUrl);
      mod.mount(container, { baseUrl });
      this.assessmentRemote = mod;
    } catch (err) {
      console.error('Failed to open assessment', err);
      this.closeAssessment();
    }
  }

  private getAssessmentBaseUrl(): string {
    const configuredBaseUrl = (window as any).__ASSESSMENT_BASE_URL__;
    if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim().length > 0) {
      return configuredBaseUrl.endsWith('/') ? configuredBaseUrl : `${configuredBaseUrl}/`;
    }

    const configuredRemoteUrl = (window as any).__ASSESSMENT_REMOTE_URL__;
    const remoteUrl =
      typeof configuredRemoteUrl === 'string' && configuredRemoteUrl.trim().length > 0
        ? configuredRemoteUrl
        : new URL('./assessment-survey-js/remoteEntry.js', window.location.href).toString();

    try {
      const parsedRemoteUrl = new URL(remoteUrl, window.location.href);
      const remotePathWithoutFile = parsedRemoteUrl.pathname.replace(/remoteEntry\.js$/i, '');
      parsedRemoteUrl.pathname = remotePathWithoutFile.endsWith('/') ? remotePathWithoutFile : `${remotePathWithoutFile}/`;
      parsedRemoteUrl.search = '';
      parsedRemoteUrl.hash = '';
      return parsedRemoteUrl.toString();
    } catch (e) {
      return new URL('./assessment-survey-js/', window.location.href).toString();
    }
  }

  private closeAssessment() {
    if (!this.assessmentContainer) return;

    if (this.assessmentRemote?.unmount) {
      this.assessmentRemote.unmount();
    }

    this.assessmentContainer.remove();
    this.assessmentContainer = null;
    this.assessmentRemote = null;
    this.showAssessmentOpenButton();
  }

  private showAssessmentCloseButton() {
    if (this.openAssessmentButton) {
      this.openAssessmentButton.style.display = 'none';
    }
    if (this.closeAssessmentButton) {
      this.closeAssessmentButton.style.display = 'inline-flex';
    }
  }

  private showAssessmentOpenButton() {
    if (this.openAssessmentButton) {
      this.openAssessmentButton.style.display = 'inline-flex';
    }
    if (this.closeAssessmentButton) {
      this.closeAssessmentButton.style.display = 'none';
    }
  }

  handleMouseClick = (event) => {
    event.preventDefault();
    /** Keeping this for now, but we can remove it if we want in the future.
     * Caused confusion with tapped_start event in the past.
     */
    // AnalyticsIntegration.getInstance().track(
    //   AnalyticsEventType.USER_CLICKED, 
    //   { 
    //     json_version_number: !!this.data.majVersion && !!this.data.minVersion 
    //       ? `${this.data.majVersion}.${this.data.minVersion}` 
    //       : "",
    //     click: 'Click' 
    //   }
    // );
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
    // Ensure any assessment overlay is cleaned up
    // this.closeAssessmentOverlay();
    this.riveMonsterElement.style.zIndex = "-1"; //Originally in LevelSelectionConstructor, moving it here so no need to have Rive logic in that scene.
    this.riveMonster.dispose();
    this.backgroundGenerator && this.backgroundGenerator.clearBackgroundContent();
    this.assessmentControlContainer?.remove();
    this.assessmentControlContainer = null;
    this.openAssessmentButton = null;
    this.closeAssessmentButton = null;
  }

  handlerInstallPrompt = (event) => {
    event.preventDefault();
    this.pwa_install_status = event;
    localStorage.setItem(PWAInstallStatus, "false");
  };

  private logTappedStartFirebaseEvent() {
    const jsonVersionNumber = !!this.data.majVersion && !!this.data.minVersion
      ? `${this.data.majVersion}.${this.data.minVersion}`
      : "";

    AnalyticsIntegration.getInstance().track(
      AnalyticsEventType.TAPPED_START,
      {
        json_version_number: jsonVersionNumber,
      }
    );
  }
}
