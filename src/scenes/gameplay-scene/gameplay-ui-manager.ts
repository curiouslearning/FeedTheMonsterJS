import {
    TimerTicking,
    PromptText,
    PauseButton,
    LevelIndicators,
    TrailEffectsHandler,
} from "@components";
import {
    PausePopupComponent,
    PAUSE_POPUP_EVENT_DATA
} from '@components/popups/pause-popup/pause-popup-component';
import { DEFAULT_SELECTORS } from '@components/prompt-text/prompt-text';
import gameStateService from '@gameStateService';

export class GameplayUIManager {
    // Events specific to UI interactions
    static readonly UI_TIMER_ENDED = 'ui_timer_ended';
    static readonly UI_PAUSE_CLICK = 'ui_pause_click';
    static readonly UI_PROMPT_CLICK = 'ui_prompt_click';
    static readonly UI_POPUP_RESTART = 'ui_popup_restart';
    static readonly UI_POPUP_SELECT_LEVEL = 'ui_popup_select_level';
    static readonly UI_POPUP_RESUME = 'ui_popup_resume';

    public timerTicking: TimerTicking;
    public promptText: PromptText;
    public pauseButton: PauseButton;
    public levelIndicators: LevelIndicators;
    public pausePopupComponent: PausePopupComponent;
    public trailEffectHandler: TrailEffectsHandler;
    
    private context: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private width: number;
    private height: number;
    
    constructor(
        context: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        gamePlayData: any
    ) {
        this.context = context;
        this.canvas = canvas;
        this.width = width;
        this.height = height;

        this.initializeComponents(gamePlayData);
    }

    private initializeComponents(gamePlayData: any) {
        this.trailEffectHandler = new TrailEffectsHandler(this.canvas);
        
        this.pauseButton = new PauseButton();
        this.pauseButton.onClick(() => {
            gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
            gameStateService.publish(GameplayUIManager.UI_PAUSE_CLICK, true);
        });

        this.timerTicking = new TimerTicking(
            this.width,
            this.height,
            (isMyTimerOver: boolean) => {
                gameStateService.publish(GameplayUIManager.UI_TIMER_ENDED, isMyTimerOver);
            }
        );

        const currentPuzzleIndex = 0;
        this.promptText = new PromptText(
            this.width,
            gamePlayData.levelData.puzzles[currentPuzzleIndex],
            gamePlayData.levelData,
            gamePlayData.rightToLeft,
            'prompt-container',
            { selectors: DEFAULT_SELECTORS },
            !gamePlayData.isTutorialCleared && gamePlayData.tutorialOn && currentPuzzleIndex === 0,
            () => {
                gameStateService.publish(GameplayUIManager.UI_PROMPT_CLICK, null);
            }
        );

        this.levelIndicators = new LevelIndicators();
        this.pausePopupComponent = new PausePopupComponent();
        
        // Setup popup listeners
        this.pausePopupComponent.onClose((event) => {
            const { data } = event;
            switch (data) {
                case PAUSE_POPUP_EVENT_DATA.RESTART_LEVEL:
                    gameStateService.publish(GameplayUIManager.UI_POPUP_RESTART, {});
                    break;
                case PAUSE_POPUP_EVENT_DATA.SELECT_LEVEL:
                    gameStateService.publish(GameplayUIManager.UI_POPUP_SELECT_LEVEL, {});
                    break;
                default:
                    gameStateService.publish(GameplayUIManager.UI_POPUP_RESUME, {});
            }
        });
    }

    public update(deltaTime: number, isGameStarted: boolean, isPaused: boolean, shouldStartTimer: boolean = true) {
        this.trailEffectHandler.draw();
        
        if (isGameStarted && !isPaused && shouldStartTimer) {
             this.timerTicking.update(deltaTime);
        }
    }

    public dispose() {
        this.timerTicking?.destroy();
        this.trailEffectHandler?.dispose();
        this.levelIndicators?.dispose();
        this.promptText?.dispose();
        this.pauseButton?.dispose();
        this.pausePopupComponent?.destroy();
    }

    public updateStars(currentPuzzleIndex: number, isCorrect: boolean) {
        this.levelIndicators.setIndicators(currentPuzzleIndex, isCorrect);
    }

    public openPausePopup() {
        this.pausePopupComponent.open();
    }

    public setGameHasStarted(hasStarted: boolean) {
        this.trailEffectHandler.setGameHasStarted(hasStarted);
    }

    public startTimer() {
        this.timerTicking.startTimer();
    }

    public applyTimerRotation(shouldRotate: boolean) {
        this.timerTicking.applyRotation(shouldRotate);
    }
}
