import LevelSelectionNavButtons from './level-selection-nav-btn';

jest.mock('@components/buttons/base-button-component/base-button-component', () => {
  return {
    BaseButtonComponent: jest.fn().mockImplementation((options) => {
      const el = document.createElement('button');
      el.id = options.id;
      el.style.display = 'block';

      // Attach the onClick callback if provided
      if (options.onClick) {
        el.addEventListener('click', options.onClick);
      }

      return {
        getElement: () => el,
        onClick: jest.fn(),
      };
    }),
  };
});

describe('LevelSelectionNavButtons', () => {
  let navButton: LevelSelectionNavButtons;
  const mockCallback = jest.fn();

  beforeEach(() => {
    document.body.innerHTML = `<div id="root"></div>`;
    mockCallback.mockClear();
  });

  it('should create button with correct id and index', () => {
    navButton = new LevelSelectionNavButtons({
      index: 0,
      options: { id: 'nav-btn-0', targetId: 'root', className: 'nav-btn' },
      callback: mockCallback,
    });

    expect(navButton.elementId).toBe('nav-btn-0');
    expect(navButton.btnElementIndex).toBe(0);
    expect(navButton.getElement()).toBeDefined();
  });


  it('should call the callback when clicked', () => {
    navButton = new LevelSelectionNavButtons({
      index: 3,
      options: { id: 'nav-btn-3', targetId: 'root', className: 'nav-btn' },
      callback: mockCallback,
    });

    // Simulate click
    navButton.getElement().click();
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
