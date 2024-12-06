import { BackgroundHtmlGenerator } from '../background';

describe('Background HTML Generator Test', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const bg = document.createElement('div');
    bg.setAttribute("id", "background");
    const roolEl = document.createElement('div');
    roolEl.classList.add('game-scene');
    roolEl.appendChild(bg)
    document.body.appendChild(roolEl);
  });

  describe('It should select a season theme and create background using the selected season based on game level. ', () => {
    it('It should select summer background on first 0-9 levels as a theme.', () => {
      const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(0);
      expect(selectedBackgroundType).toEqual("summer");
    });

    it('It should create summer background on first 10 levels as a theme.', () => {
      const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(9);
      const backgroundGenerator = new BackgroundHtmlGenerator();
      backgroundGenerator.generateBackground(selectedBackgroundType);
      const testSummer = document.getElementsByClassName('summer-bg')
      expect(testSummer).toHaveLength(1);
    });

    it('It should select autumn background on levels 10-19 as a theme.', () => {
      const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(10);
      expect(selectedBackgroundType).toEqual("autumn");
    });

    it('It should create autumn background on levels 10-19 as a theme.', () => {
      const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(19);
      const backgroundGenerator = new BackgroundHtmlGenerator();
      backgroundGenerator.generateBackground(selectedBackgroundType);
      const testAutumn = document.getElementsByClassName('autumn-bg')
      expect(testAutumn).toHaveLength(1);
    });

    it('It should select winter background on levels 20-29 as a theme.', () => {
      const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(20);
      expect(selectedBackgroundType).toEqual("winter");
    });

    it('It should create winter background on levels 20-29 as a theme.', () => {
      const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(29);
      const backgroundGenerator = new BackgroundHtmlGenerator();
      backgroundGenerator.generateBackground(selectedBackgroundType);
      const testWinter = document.getElementsByClassName('winter-bg')
      expect(testWinter).toHaveLength(1);
    });
  });

});