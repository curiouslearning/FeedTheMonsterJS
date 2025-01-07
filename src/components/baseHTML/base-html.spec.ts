import { BaseHTML } from './base-html';

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
    it('It should sanitize if there is a similar existing HTML element with same ID if we turn on shouldSanitized.', () => {
      //Create and append a mock element with same ID.
      const testDuplicate = document.createElement('div');
      testDuplicate.id = 'test-id';
      const rootBody = document.getElementsByClassName('game-scene')[0];

      rootBody.appendChild(testDuplicate);
      let elementsWithSameID = document.querySelectorAll('#test-id');

      /* Since we created another mock div with same id and we are using beforeEach
         there should be two div element with same ID.
         This will mimic the scenario or an edge case scenario where the div element was not properly cleaned up.
      */
      expect(elementsWithSameID.length).toEqual(2);

      /* We will initialize a new BaseHTML to test if it will sanitize the similar existing div with same ID
      to ensure what element it will create will be unique. */
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
        },
        true
      );
      //There should only be one div element with test-id
      elementsWithSameID = document.querySelectorAll('#test-id');

      expect(elementsWithSameID.length).toEqual(1);
    });

    it('it should create and append the HTML template as part of init.', () => {
      expect(document.getElementById('test-id')).not.toBeNull();
    });
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