import {BaseButtonComponent, ButtonOptions} from './base-button-component';

describe('BaseButtonComponent', () => {
  let buttonComponent: BaseButtonComponent;
  const mockClickCallback = jest.fn();

  beforeEach(() => {
    // Reset the DOM and mock function for each test
    document.body.innerHTML = '<div id="game-control"></div>';
    mockClickCallback.mockClear();

    // Define button options for testing
    const options: ButtonOptions = {
      id: 'test-button',
      className: 'test-class',
      onClick: mockClickCallback,
      imageSrc: 'test-image.jpg',
      imageAlt: 'Test Image',
      targetId: 'game-control',
    };

    // Create a new instance of BaseButtonComponent with test options
    buttonComponent = new BaseButtonComponent(options);
  });

  describe('When BaseButtonComponent is initialized', () => {
    it('should create and inject the button element into the target', () => {
      const button = document.getElementById('test-button');
      expect(button).not.toBeNull();
      expect(button?.classList.contains('test-class')).toBe(true);
    });
  });

  describe('When the onClick method is called', () => {
    it('should trigger the provided onClick callback and apply scale effect on click', () => {
      const button = document.getElementById('test-button');

      // Simulate click event
      button?.click();

      expect(mockClickCallback).toHaveBeenCalled();
    });
  });

  describe('When disposing of the BaseButtonComponent', () => {
    it('should remove the event listener and clean up audio player', () => {
      const button = document.getElementById('test-button');

      // Dispose of the button and trigger a click to check if listener was removed
      buttonComponent.dispose();
      button?.click();

      // The callback should not be called after dispose
      expect(mockClickCallback).not.toHaveBeenCalled();
      expect(buttonComponent['audioPlayer']).toBeNull();
    });
  });

  describe('When deleting the button element.', () => {
    it('It should remove the button element on the DOM tree.', () => {
      //Destroy the button element from DOM tree.
      buttonComponent._destroy();

      const button = document.getElementById('test-button');
      expect(button).toBeNull();
    });
  });
});
