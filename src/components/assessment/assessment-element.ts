/**
 * AssessmentLoader - Component to dynamically load and manage the assessment web component
 * 
 * This component:
 * - Dynamically loads the assessment-webcomponent.js script
 * - Creates and manages the <assessment-survey> custom element
 * - Handles overlay/modal presentation
 * - Manages lifecycle and cleanup
 */
export class AssessmentLoader {
    private container: HTMLDivElement | null = null;
    private assessmentElement: any = null;
    private isLoaded: boolean = false;
    private scriptElement: HTMLScriptElement | null = null;

    constructor() {
        // Constructor intentionally empty - initialization happens in open()
    }

    /**
     * Opens the assessment in a modal overlay
     * @param dataUrl - URL to the assessment data file (optional if dataFile is provided)
     * @param dataFile - Local data file name (e.g., 'hindi-lettersounds.json')
     * @param basePath - Base path for local files (defaults to './')
     */
    public async open(dataUrl: string = '', dataFile: string = '', basePath: string = './'): Promise<void> {
        try {
            // Load the web component script if not already loaded
            if (!this.isLoaded) {
                await this.loadScript();
            }

            // Create overlay container
            this.createContainer();

            // Create assessment element
            this.assessmentElement = document.createElement('assessment-survey');

            // Set attributes based on what's provided
            if (dataUrl) {
                this.assessmentElement.setAttribute('data-url', dataUrl);
            } else if (dataFile) {
                this.assessmentElement.setAttribute('data-file', dataFile);
                this.assessmentElement.setAttribute('base-path', basePath);
            } else {
                console.warn('No data source provided. Assessment may not load correctly.');
            }

            // Listen for assessment events
            this.assessmentElement.addEventListener('assessment-complete', this.handleComplete.bind(this));
            this.assessmentElement.addEventListener('assessment-close', this.handleClose.bind(this));
            this.assessmentElement.addEventListener('assessment-error', this.handleError.bind(this));

            // Add to container
            if (this.container) {
                this.container.appendChild(this.assessmentElement);
            }

        } catch (error) {
            console.error('Failed to open assessment:', error);
            this.cleanup();
        }
    }

    /**
     * Closes the assessment and cleans up resources
     */
    public close(): void {
        this.cleanup();
    }

    /**
     * Dynamically loads the assessment web component script
     */
    private async loadScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.customElements && window.customElements.get('assessment-survey')) {
                this.isLoaded = true;
                resolve();
                return;
            }

            // Create script element
            this.scriptElement = document.createElement('script');
            this.scriptElement.src = './assessment-webcomponent.js';
            this.scriptElement.async = true;

            this.scriptElement.onload = () => {
                this.isLoaded = true;
                resolve();
            };

            this.scriptElement.onerror = () => {
                reject(new Error('Failed to load assessment script'));
            };

            document.head.appendChild(this.scriptElement);
        });
    }

    /**
     * Creates the modal overlay container
     */
    private createContainer(): void {
        this.container = document.createElement('div');
        this.container.id = 'assessment-overlay';
        this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
    `;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: #fff;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 24px;
      cursor: pointer;
      z-index: 10001;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
        closeButton.onclick = () => this.close();

        this.container.appendChild(closeButton);
        document.body.appendChild(this.container);
    }

    /**
     * Handles assessment completion event
     */
    private handleComplete(event: CustomEvent): void {
        console.log('Assessment completed:', event.detail);
        // You can dispatch a custom event here for FTM to listen to
        window.dispatchEvent(new CustomEvent('ftm-assessment-complete', {
            detail: event.detail
        }));

        // Auto-close after completion (optional)
        setTimeout(() => this.close(), 2000);
    }

    /**
     * Handles assessment close event
     */
    private handleClose(): void {
        this.close();
    }

    /**
     * Handles assessment error event
     */
    private handleError(event: CustomEvent): void {
        console.error('Assessment error:', event.detail);
        this.close();
    }

    /**
     * Cleans up resources
     */
    private cleanup(): void {
        // Remove event listeners
        if (this.assessmentElement) {
            this.assessmentElement.removeEventListener('assessment-complete', this.handleComplete);
            this.assessmentElement.removeEventListener('assessment-close', this.handleClose);
            this.assessmentElement.removeEventListener('assessment-error', this.handleError);

            // Call close method if available
            if (typeof this.assessmentElement.close === 'function') {
                this.assessmentElement.close();
            }

            this.assessmentElement = null;
        }

        // Remove container
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = null;
        }
    }
}
