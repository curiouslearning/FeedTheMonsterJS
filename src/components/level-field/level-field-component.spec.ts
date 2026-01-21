import LevelFieldComponent from './level-field-component';
import { DEFAULT_SELECTORS } from './level-field-component';
import { STAR_FILLED, STAR_EMPTY } from "@constants";

describe('Level Field Component ', () => {
  let testLevelField;
  let localPath = 'http://localhost/';
  const { bars } = DEFAULT_SELECTORS;
  beforeEach(() => {
    document.body.innerHTML = '';
    const roolEl = document.createElement('div');
    roolEl.classList.add('game-control');
    document.body.appendChild(roolEl);
    testLevelField = new LevelFieldComponent();
  });

  describe('When Level Field Component is updating', () => {
    it('it should not update the images if the index received is 0.', () => {
      testLevelField.updateLevel(0);
      const barsEl = document.querySelectorAll(bars);

      barsEl.forEach((imgEl: any) => {
        const barImg = STAR_EMPTY.replace('./','');
        expect(imgEl?.src).toContain(`${localPath}${barImg}`);
      });
    });

    it('it should have three updated images when index is 3.', () => {
      testLevelField.updateLevel(1); //Adding since by logic this the index receives is incremental.
      testLevelField.updateLevel(2);
      testLevelField.updateLevel(3);
      const barsEl = document.querySelectorAll(bars);
      let updateImgCtr = 0;
      barsEl.forEach((imgEl: any, index) => {
        if (imgEl?.src.includes(STAR_FILLED.replace('./', ''))) {
          updateImgCtr++
        }
      });
      expect(updateImgCtr).toBe(3);
    });

    it('it should have updated all level images at end level.', () => {
      testLevelField.updateLevel(1); //Adding since by logic this the index receives is incremental.
      testLevelField.updateLevel(2);
      testLevelField.updateLevel(3);
      testLevelField.updateLevel(4);
      testLevelField.updateLevel(5);
      const barsEl = document.querySelectorAll(bars);
      let updateImgCtr = 0;
      barsEl.forEach((imgEl: any, index) => {
        if (imgEl?.src.includes(STAR_FILLED.replace('./', ''))) {
          updateImgCtr++
        }
      });
      expect(updateImgCtr).toBe(5);
    });
  });

  describe('When removing Level Field Component.', () => {
    it('Using destroy from base HTML, level field HTML should be removed. ', () => {
      testLevelField.destroy(); //Remove the HTML element.
      const levelFieldElement = document.getElementById('level-field');

      expect(levelFieldElement).toBeNull();
    });
  });

});