import {
    BaseButtonComponent,
    ButtonOptions,
} from '../base-button-component/base-button-component';
import './assessment-button.scss';

// You can add a custom icon/image for the assessment button
// For now, using a text-based button
const ASSESSMENT_BTN_TEXT = 'Assessment';

export default class AssessmentButton extends BaseButtonComponent {
    constructor(options: Partial<ButtonOptions> = {}) {
        super({
            id: options.id || 'assessment-button',
            className: options.className || 'assessment-button',
            targetId: options.targetId || 'title-and-play-button',
            ...options,
        });

        // Override to create a text button instead of image button
        this.createTextButton();
    }

    private createTextButton(): void {
        // Clear the default image button content
        if (this.element) {
            this.element.innerHTML = '';
            this.element.textContent = ASSESSMENT_BTN_TEXT;
            this.element.classList.add('text-button');
        }
    }
}
