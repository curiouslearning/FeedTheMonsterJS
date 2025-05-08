export interface BaseHtmlOptions {
  selectors: {
    root: string;
    [key: string]: string;
  }
}

export interface HtmlTemplate {
  (id: string): string;
}

/*
* BaseHTML class used as a base for creating classes that needs to create and append new HTML elements.
* This class also serves a an ease to easily manipulate the created HTML element by passing a template and
* adding a method for ease of removing it.
*/
export class BaseHTML {
  private isRendered: boolean = false;
  private id: string;
  private template: HtmlTemplate;
  private shouldSanitize: boolean;

  constructor(
    protected options: BaseHtmlOptions,
    id: string,
    htmlTemplate: HtmlTemplate,
    //Pass true if we want to always clean up before creating a new unique element.
    onSanitize: boolean = false //Default false as GamePlay Elements doesn't require clean up not until the end of game play.
  ) {
    this.id = id;
    this.template = htmlTemplate;
    this.shouldSanitize = onSanitize;
    this._init();
  }

  private _init() {
    this.shouldSanitize && this.sanitizeElement(); //Performs sanitize if onSanitize is true.
    this.render();
    //Add more logic here if needed.
  }

  public render() {
    if (this.isRendered) return;
    const { root } = this.options.selectors;
    const rootEl = document.querySelector(root);
    const templateString = this.template(this.id);
    rootEl && rootEl.insertAdjacentHTML('beforeend', templateString);
    this.isRendered = true;
  }

  public getElements(className) {
    return document.querySelectorAll(className) as NodeListOf<HTMLImageElement>
  }

  private sanitizeElement() {
    const existingElements = document.querySelectorAll(`#${this.id}`);
    //If element witht he same is already existing it will be removed to properly create the element.
    if (existingElements.length) {
      existingElements.forEach((element) => {
        element.remove();
      });
    }
  }

  public destroy() {
    const element = document.getElementById(this.id)
    if(element) element.remove();
    this.isRendered = false;
  }

}