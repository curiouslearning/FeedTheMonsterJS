import {
    CLICK,
    MOUSEDOWN,
    MOUSEMOVE,
    MOUSEUP,
    TOUCHEND,
    TOUCHMOVE,
    TOUCHSTART,
    StoneConfig,
} from "@common";
import { StoneHandler } from "@components";
import PuzzleHandler from "@gamepuzzles/puzzleHandler/puzzleHandler";
import gameStateService from '@gameStateService';
import { MonsterController } from "./monster-controller";

export class GameplayInputManager {
    // #region Event Names
    public static readonly INPUT_DRAG_START = "input_drag_start";
    public static readonly INPUT_MONSTER_CLICK = "input_monster_click";
    public static readonly INPUT_STONE_DROP_ON_TARGET = "input_stone_drop_on_target";
    public static readonly INPUT_STONE_DROP_MISSED = "input_stone_drop_missed";
    public static readonly INPUT_REQUEST_ANIMATION = "input_request_animation";
    // #endregion

    // #region Properties
    private lastClientX: number = 0;
    private lastClientY: number = 0;
    private animationFrameId: number | null = null;
    private isMonsterMouthOpen: boolean = false;
    private isDragging: boolean = false;
    private pickedStone: StoneConfig | null = null;
    private pickedStoneObject: StoneConfig | null = null;
    // #endregion

    constructor(
        private canvas: HTMLCanvasElement,
        private stoneHandler: StoneHandler,
        private puzzleHandler: PuzzleHandler,
        private monsterController: MonsterController
    ) { }

    // #region Public Methods
    public addEventListeners(element: HTMLElement): void {
        element.addEventListener(MOUSEUP, this.handleMouseUp, false);
        element.addEventListener(MOUSEMOVE, this.handleMouseMove, false);
        element.addEventListener(MOUSEDOWN, this.handleMouseDown, false);
        element.addEventListener(TOUCHSTART, this.handleTouchStart, false);
        element.addEventListener(TOUCHMOVE, this.handleTouchMove, false);
        element.addEventListener(TOUCHEND, this.handleTouchEnd, false);
        element.addEventListener(CLICK, this.handleMouseClick, false);
    }

    public removeEventListeners(element: HTMLElement): void {
        element.removeEventListener(CLICK, this.handleMouseClick, false);
        element.removeEventListener(MOUSEUP, this.handleMouseUp, false);
        element.removeEventListener(MOUSEMOVE, this.handleMouseMove, false);
        element.removeEventListener(MOUSEDOWN, this.handleMouseDown, false);
        element.removeEventListener(TOUCHSTART, this.handleTouchStart, false);
        element.removeEventListener(TOUCHMOVE, this.handleTouchMove, false);
        element.removeEventListener(TOUCHEND, this.handleTouchEnd, false);
    }

    public getPickedStone(): StoneConfig | null {
        return this.pickedStone;
    }

    public resetDragState(): void {
        this.pickedStone = null;
        this.pickedStoneObject = null;
        this.lastClientX = 0;
        this.lastClientY = 0;
        this.isMonsterMouthOpen = false;
        this.isDragging = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.puzzleHandler.clearPickedUp();
    }
    // #endregion

    // #region Event Handlers
    private handleMouseUp = (event: MouseEvent | any): void => {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.isMonsterMouthOpen = false;

        if (!this.pickedStone || this.pickedStone.frame <= 99) {
            this.puzzleHandler.clearPickedUp();
            this.isDragging = false;
            return;
        }

        let rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.monsterController.checkHitbox(x, y)) {
            this.dispatch(GameplayInputManager.INPUT_STONE_DROP_ON_TARGET, {
                stone: this.pickedStone,
                stoneObject: this.pickedStoneObject
            });
        } else if (this.pickedStoneObject) {
            this.dispatch(GameplayInputManager.INPUT_STONE_DROP_MISSED, {
                stone: this.pickedStone,
                stoneObject: this.pickedStoneObject
            });
        }

        this.resetDragState();
    }

    private handleMouseDown = (event: MouseEvent | any): void => {
        if (this.pickedStone && this.pickedStone.frame <= 99) {
            return;
        }

        let rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (!this.puzzleHandler.checkIsWordPuzzle()) {
            const picked = this.stoneHandler.handlePickStoneUp(x, y);
            if (picked) {
                this.pickedStoneObject = picked;
                this.pickedStone = picked;
                this.stoneHandler.playDragAudioIfNecessary(picked);
            }
        } else {
            this.setPickedUp(x, y);
        }
    }

    private handleMouseMove = (event: MouseEvent | any): void => {
        this.lastClientX = event.clientX;
        this.lastClientY = event.clientY;

        if (!this.pickedStone || this.pickedStone.frame <= 99) return;

        this.requestDragUpdate();
    }

    private handleMouseClick = (event: MouseEvent): void => {
        let rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.monsterController.onClick(x, y)) {
            this.dispatch(GameplayInputManager.INPUT_MONSTER_CLICK, { x, y });
        }
    }

    private handleTouchStart = (event: TouchEvent): void => {
        if (this.pickedStone && this.pickedStone.frame <= 99) {
            return;
        }
        const touch = event.touches[0];
        this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }

    private handleTouchMove = (event: TouchEvent): void => {
        if (!this.pickedStone) return;
        event.preventDefault();
        const touch = event.touches[0];
        this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    private handleTouchEnd = (event: TouchEvent): void => {
        const touch = event.changedTouches[0];
        this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
    }
    // #endregion

    // #region Drag & Physics Logic
    private setPickedUp(x: number, y: number): void {
        if (this.pickedStone && this.pickedStone.frame <= 99) {
            return;
        }

        const stoneLetter = this.stoneHandler.handlePickStoneUp(x, y);

        if (stoneLetter) {
            this.pickedStoneObject = stoneLetter;
            this.pickedStone = stoneLetter;
            this.stoneHandler.playDragAudioIfNecessary(stoneLetter);

             if (this.stoneHandler.levelData?.levelMeta?.levelType === 'Word') {
                 this.puzzleHandler.setPickUpLetter(
                   stoneLetter?.text,
                   stoneLetter?.foilStoneIndex
                 );
             }
        }
    }

    private requestDragUpdate(): void {
        if (this.animationFrameId === null) {
            this.animationFrameId = requestAnimationFrame(() => {
                this.animationFrameId = null;
                this.dispatchDragUpdate(this.lastClientX, this.lastClientY);
            });
        }
    }

    private dispatchDragUpdate(clientX: number, clientY: number): void {
        if (!this.isDragging) {
            this.dispatch(GameplayInputManager.INPUT_DRAG_START);
            this.isDragging = true;
        }

        if (!this.puzzleHandler.checkIsWordPuzzle()) {
            this.processSimpleDragMovement(clientX, clientY);
        } else {
            this.processWordPuzzleDragMovement(clientX, clientY);
        }
    }

    private processSimpleDragMovement(clientX: number, clientY: number): void {
        let newStoneCoordinates = this.stoneHandler.handleMovingStoneLetter(
            this.pickedStone,
            clientX,
            clientY
        );
        this.pickedStone = newStoneCoordinates;

        if (!this.isMonsterMouthOpen) {
            this.dispatch(GameplayInputManager.INPUT_REQUEST_ANIMATION, { 
                animationName: 'isMouthOpen' 
            });
            this.isMonsterMouthOpen = true;
        }
    }

    private processWordPuzzleDragMovement(clientX: number, clientY: number): void {
        const { trailX, trailY } = this.updateDraggedStonePosition(clientX, clientY);
        const newStoneLetter = this.checkStoneHovering(trailX, trailY);

        if (newStoneLetter) {
            this.handleLetterPickup(newStoneLetter);
        }

        this.ensureMonsterMouthOpen();
    }

    private updateDraggedStonePosition(clientX: number, clientY: number): { trailX: number, trailY: number } {
        const newStoneCoordinates = this.stoneHandler.handleMovingStoneLetter(
            this.pickedStone,
            clientX,
            clientY
        );
        this.pickedStone = newStoneCoordinates;

        return {
            trailX: newStoneCoordinates.x,
            trailY: newStoneCoordinates.y
        };
    }

    private checkStoneHovering(trailX: number, trailY: number): any {
        return this.stoneHandler.handleHoveringToAnotherStone(
            trailX,
            trailY,
            (foilStoneText, foilStoneIndex) => {
                return this.puzzleHandler.handleCheckHoveredLetter(foilStoneText, foilStoneIndex);
            }
        );
    }

    private handleLetterPickup(newStoneLetter: any): void {
        this.puzzleHandler.setPickUpLetter(
            newStoneLetter.text,
            newStoneLetter.foilStoneIndex
        );

        this.pickedStone = this.stoneHandler.resetStonePosition(
            this.canvas.width,
            this.pickedStone,
            this.pickedStoneObject
        );

        this.pickedStoneObject = newStoneLetter;
        this.pickedStone = newStoneLetter;
    }
    // #endregion

    // #region Helper Methods
    private dispatch(eventName: string, detail: any = {}): void {
        gameStateService.publish(eventName, detail);
    }

    private ensureMonsterMouthOpen(): void {
        if (!this.isMonsterMouthOpen) {
            this.dispatch(GameplayInputManager.INPUT_REQUEST_ANIMATION, { 
                animationName: 'isMouthOpen' 
            });
            this.isMonsterMouthOpen = true;
        }
    }
    // #endregion
}
