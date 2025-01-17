import { BaseHTML } from '@components/baseHTML/base-html';
import { BaseBackgroundComponent } from '../base-background/base-background-component';
import { theme_config } from './themes-config';
import gameStateService from '@gameStateService/index';
import './themes-background.scss'


export class ThemeBackground {
  private background: BaseHTML;
  private testBaseBG: any
  constructor() {
    this.background = new BaseHTML(
      {
        selectors: {
          root: '#background-elements'
        }
      },
      'theme-bg-container',
      (id) => (`
        <div id="${id}">
        <div id="grid-layout"></div>
        </div>
      `),
      true //ensures the element will always be sanitized during creation.
    )
    this.testBaseBG = new BaseBackgroundComponent("grid-layout")
    this.setupBg()
  }

  private setupBg = async () => {
    const themeElement = document.getElementById('theme-bg-container');
    const gridContainer = document.getElementById('grid-layout');

    const themeName = gameStateService.getThemes(); //Get the theme names from game service/game settings


    // Set the background color dynamically
    themeElement.classList.add(theme_config[themeName].name);  // Add theme-specific class for background color


    gridContainer.classList.add(theme_config[themeName].className)

    //Generate the grid areas based on the config.
    theme_config[themeName].gridAreas.forEach((areaConfig, index) => {
      const newGridArea = this.testBaseBG.createElementWithImage(
        areaConfig.className,
        areaConfig.img.path,
        areaConfig.img.alt,
        areaConfig.img.id,
        areaConfig.id
      );
      gridContainer.append(newGridArea)
    });
  }

  private cleanup() {
    //Add clean ups here.
  }

}