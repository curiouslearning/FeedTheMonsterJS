import { BaseHTML } from './BaseHTML';

describe('Base HTML ', () => {
  let testBase;
  beforeEach(() => {
    document.body.innerHTML = '';
    const roolEl = document.createElement('div');
    roolEl.classList.add('game-scene');
    document.body.appendChild(roolEl);

    testBase = new BaseHTML({
      selectors: {
          root: '.game-scene'
        }
      },
      'test-id',
      (id) => {
        return (`<div id="${id}">
            <div class="test-item"> Test Item 1 </div>
            <div class="test-item"> Test Item 2 </div>
            <div class="test-item"> Test Item 3 </div>
           </div>`);
      }
    )
  });

  describe('When Base HTML is initialized', () => {
    it('it should create and append the HTML template as part of init.', () => {
      expect(document.getElementById('test-id')).not.toBeNull();
    })
  });

  describe('When using its getElements method ', () => {
    it('It should return an array when retrieving an exisiting element.', () => {
      const elements = testBase.getElements('.test-item');
      expect(elements).toHaveLength(3);
    });

    it('It should return an empty array when retrieving an non-exisiting element.', () => {
      const elements = testBase.getElements('.items-test');
      expect(elements).toHaveLength(0);
    });
  });

  describe('When using the destroy method to clear the created template element.', () => {
    it('It should clear/delete the HTML element created during init.', () => {
      testBase.destroy();
      expect(document.getElementById('test-id')).toBeNull();
    })
  })
})