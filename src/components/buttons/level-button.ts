import {
    Debugger,
    font,
} from "@common";
import {
    MAP_LOCK_IMG,
    STAR_IMG
} from '@constants';
import {
    BaseButtonComponent,
    ButtonOptions,
} from '@components/buttons/base-button-component/base-button-component';

const PULSING_EFFECT_STYLE = "pulsing";
const SPECIAL_LEVELS_INDEX = 4;
interface LevelButtonConfig {
    index: number;
    options: Partial<ButtonOptions>;
    isNavBtn: boolean;
    isCurrentLevel: boolean;
    gameLevel: number;
    isLevelLock: boolean;
    starsCount: number;
    isDebuggerOn: boolean;
    levelTypeText: string;
    callback: () => void;
}

export default class LevelSelectionButtons extends BaseButtonComponent {
    public elementId: string; //CSS element ID.
    public btnElementIndex: number; //Unique index number from the list of created level buttons.
    public gameLevel: number; //Game level number.
    public textIndex: number; //Index number for displaying.
    public isGameDone: boolean = false;
    private isButtonLock: boolean = false;
    private btnSpan: HTMLSpanElement;
    private textLevelType: HTMLSpanElement;
    private btnImage: HTMLImageElement;
    private isNavBtn: boolean = false;
    private starsCount: number = 0;
    private buttonImageId: string = '';
    private onClickCallback: (gameLevel?: number) => void;

    constructor({
        index,
        options = {},
        isNavBtn,
        isCurrentLevel,
        gameLevel,
        isLevelLock,
        starsCount,
        isDebuggerOn = false,
        levelTypeText = '',
        callback
    }: LevelButtonConfig) {
        super({
            id: options.id,
            className: options.className,
            imageSrc: options.imageSrc,
            imageAlt: options.imageAlt,
            targetId: options.targetId,
            imageClass: options.imageClass,
            imageID: options.imageID
        });
        this.elementId = options.id;
        this.btnElementIndex = index;
        this.isNavBtn = isNavBtn;
        this.gameLevel = gameLevel;
        this.isButtonLock = isLevelLock;
        this.onClickCallback = callback;
        this.starsCount = starsCount;
        this.buttonImageId = options.imageID;
        super.onClick(this.handleOnClick.bind(this));
        this.renderGameBtnAssets(
            isCurrentLevel,
            starsCount,
            isDebuggerOn,
            levelTypeText
        );
    }

    private renderGameBtnAssets(
        isCurrentLevel: boolean,
        starsCount: number,
        isDebuggerOn: boolean,
        levelTypeText: string
    ): void {
        if (this.isNavBtn) return;
        this.textIndex = this.gameLevel;
        this.createTextSpan(this.gameLevel);
        this.enablePulseEffect(isCurrentLevel);
        this.createLockDisplay();
        this.createStars(starsCount);
        this.createLevelTypeText(isDebuggerOn, levelTypeText)
    }

    private createLockDisplay(): void {
        if (!this.isButtonLock) return;

        this.btnImage = this.createImageElement(MAP_LOCK_IMG, 'btn-lock-img', 'btn-lock-img');

        // Add the img element to the button
        this.element.append(this.btnImage);
    }

    private createStars(starsCount: number):void {
        if (this.isButtonLock && starsCount === 0) return;
        for (let i = 0; i < starsCount; i++) {
            const keyName = `star-${i}`;
            const newStar = this.createImageElement(
                STAR_IMG,
                'level-stars',
                'level-stars',
                `star-${i}`
            );

            this[keyName] = newStar;

            this.element.append(newStar);
        }
    }

    private createImageElement(
        src: string,
        className: string,
        alt: string = "",
        id: string = ""
    ): HTMLImageElement {
        const image = document.createElement("img");
        image.src = src;
        image.alt = alt;
        image.id = id;

        if (className) {
            image.classList.add(className);
        }

        return image;
    }

    private handleOnClick(): void {
        if (!this.isButtonLock) {
            this.isNavBtn
                ? this.onClickCallback()
                : this.onClickCallback(this.gameLevel);
        }
    }

    private createLevelTypeText(isDebuggerOn: boolean = false, text: string): void {
        if (!isDebuggerOn) return;

        this.textLevelType = document.createElement("span");
        this.textLevelType.className = `level-type-text`;
        this.textLevelType.textContent = text;

        //Add text span to the button element.
        this.element.append(this.textLevelType);
    }

    public updateLevelTypeText(updatedTextValue: string): void {
        if (this.textLevelType) {
            this.textLevelType.textContent = updatedTextValue;
        }
    }

    private createTextSpan(text: number | string): void {
        this.btnSpan = document.createElement("span");
        this.btnSpan.className = this.btnElementIndex === SPECIAL_LEVELS_INDEX
        ? 'special-btn-level-span'
        : 'btn-level-span';
        this.updateButtonSpanText(text);

        //Add span to the button element.
        this.element.append(this.btnSpan);
    }

    private updateButtonSpanText(textValue: number | string): void {
        this.btnSpan.textContent = `${textValue}`;
    }

    public updateBtn(gameLevel: number, isBtnLock: boolean, newStarsCount: number): void {
        this.updateBtnDisplay(true);
        if (this.isNavBtn) return; //If the button is nav; Do not run this method.
        this.gameLevel = gameLevel;
        this.textIndex = gameLevel;
        this.updateButtonSpanText(gameLevel);
        this.updateLockDisplay(isBtnLock);
        this.updateStarDisplay(newStarsCount);
    }

    private updateLockDisplay(isBtnLock: boolean): void {
        this.isButtonLock = isBtnLock;
        if (this.btnImage) {
            this.btnImage.style.display = !isBtnLock ? 'none' : 'block';
        } else if (!this.btnImage && isBtnLock) {
            this.createLockDisplay();
        }
    }

    public updateBtnDisplay(shouldShow: boolean): void {
        this.element.style.display = shouldShow ? "block" : "none";
    }

    public enablePulseEffect(isCurrentLevel: boolean): void {
        if (isCurrentLevel) {
            this.element.classList.add(PULSING_EFFECT_STYLE);
        } else {
            this.element.classList.remove(PULSING_EFFECT_STYLE);
        }
    }

    private updateStarDisplay(newStarsCount: number): void {
        if (newStarsCount === 0 && this.starsCount === 0) return;
        const oldStars = this.starsCount;
        const maxStars = Math.max(oldStars, newStarsCount);

        for (let i = 0; i < maxStars; i++) {
            const keyName = `star-${i}`;
            const starEl = this[keyName];

            if ( i < newStarsCount) {
                //star should be visible.
                if (starEl) {
                    //Already exists -> ensure visible.
                    starEl.style.display = "block";
                } else {
                    //Create new star
                    const newStar = this.createImageElement(
                        STAR_IMG,
                        'level-stars',
                        'level-stars',
                        keyName
                    );

                    this[keyName] = newStar;
                    this.element.append(newStar);
                }
            } else {
                // STAR SHOULD BE HIDDEN (or removed)
                if (starEl) {
                    starEl.style.display = "none";
                }
            }
        }

        //Update star count.
        this.starsCount = newStarsCount;
    }

    public updateButtonImage(newImageSrc: string): void {
        const image = document.getElementById(this.buttonImageId);
        if (image && image instanceof HTMLImageElement) {
            image.src = newImageSrc;
        }
    }

}