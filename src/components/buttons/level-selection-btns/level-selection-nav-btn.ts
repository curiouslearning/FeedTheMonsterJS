import {
    BaseButtonComponent,
    ButtonOptions,
} from '@components/buttons/base-button-component/base-button-component';

interface LevelButtonConfig {
    index: number;
    options: Partial<ButtonOptions>;
    callback: () => void;
}

export default class LevelSelectionNavButtons extends BaseButtonComponent {
    public elementId: string; //CSS element ID.
    public btnElementIndex: number; //Unique index number from the list of created level buttons.

    constructor({
        index,
        options = {},
        callback
    }: LevelButtonConfig) {
        super({
            id: options.id,
            className: options.className,
            imageSrc: options.imageSrc,
            imageAlt: options.imageAlt,
            targetId: options.targetId,
            imageClass: options.imageClass,
            imageID: options.imageID,
            onClick: callback
        });
        this.elementId = options.id;
        this.btnElementIndex = index;
    }

    public updateBtnDisplay(shouldShow: boolean): void {
        this.element.style.display = shouldShow ? "block" : "none";
    }


}