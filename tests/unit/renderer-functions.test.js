global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};

const mockElement = {
  addEventListener: jest.fn(),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  checked: false,
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  value: '',
  options: [],
  style: {},
};

document.getElementById = jest.fn(() => mockElement);
document.documentElement = {
  setAttribute: jest.fn(),
  removeAttribute: jest.fn()
};

describe('Theme Switch Functionality', () => {
  let setupThemeSwitch;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockElement.checked = false;
    
    global.localStorage.getItem.mockImplementation((key) => {
      if (key === 'theme') return null;
      return null;
    });
    
    setupThemeSwitch = function() {
      const themeSwitch = document.getElementById('checkbox');
      
      const currentTheme = localStorage.getItem('theme');
      if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'light') {
          themeSwitch.checked = true;
        }
      }
      
      themeSwitch.addEventListener('change', function(e) {
        if (this.checked) {
          document.documentElement.setAttribute('data-theme', 'light');
          localStorage.setItem('theme', 'light');
        } else {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('theme', 'dark');
        }
      });
    };
  });
  
  test('should load dark theme by default', () => {
    setupThemeSwitch();
    
    expect(document.documentElement.setAttribute).not.toHaveBeenCalled();
    expect(mockElement.checked).toBe(false);
  });
  
  test('should load light theme from localStorage', () => {
    global.localStorage.getItem.mockReturnValue('light');
    
    setupThemeSwitch();
    
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    expect(mockElement.checked).toBe(true);
  });
  
  test('should change to light theme when checkbox is checked', () => {
    setupThemeSwitch();
    
    const changeHandler = mockElement.addEventListener.mock.calls[0][1];
    
    mockElement.checked = true;
    changeHandler.call(mockElement);
    
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });
  
  test('should change to dark theme when checkbox is unchecked', () => {
    setupThemeSwitch();
    
    const changeHandler = mockElement.addEventListener.mock.calls[0][1];
    
    mockElement.checked = false;
    changeHandler.call(mockElement);
    
    expect(document.documentElement.removeAttribute).toHaveBeenCalledWith('data-theme');
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
});

describe('Tab Functionality', () => {
  let setupTabs;
  let mockTabButtons;
  let mockTabContents;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTabButtons = [
      { 
        getAttribute: jest.fn(() => 'tab1'),
        classList: { add: jest.fn(), remove: jest.fn() },
        addEventListener: jest.fn((event, handler) => {
          mockTabButtons[0].clickHandler = handler;
        })
      },
      { 
        getAttribute: jest.fn(() => 'tab2'),
        classList: { add: jest.fn(), remove: jest.fn() },
        addEventListener: jest.fn((event, handler) => {
          mockTabButtons[1].clickHandler = handler;
        })
      }
    ];
    
    mockTabContents = [
      { classList: { add: jest.fn(), remove: jest.fn() } },
      { classList: { add: jest.fn(), remove: jest.fn() } }
    ];
    
    document.querySelectorAll = jest.fn((selector) => {
      if (selector === '.tab-button') return mockTabButtons;
      if (selector === '.tab-content') return mockTabContents;
      return [];
    });
    
    document.getElementById = jest.fn((id) => {
      if (id === 'tab1') return mockTabContents[0];
      if (id === 'tab2') return mockTabContents[1];
      return null;
    });
    
    setupTabs = function() {
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabContents = document.querySelectorAll('.tab-content');
  
      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          
          const tabId = button.getAttribute('data-tab');
          button.classList.add('active');
          document.getElementById(tabId).classList.add('active');
        });
      });
    };
  });
  
  test('should add click handlers to tab buttons', () => {
    setupTabs();
    
    expect(mockTabButtons[0].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockTabButtons[1].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
  
  test('should switch tabs when clicked', () => {
    setupTabs();
    
    mockTabButtons[0].clickHandler();
    
    expect(mockTabButtons[0].classList.remove).toHaveBeenCalledWith('active');
    expect(mockTabButtons[1].classList.remove).toHaveBeenCalledWith('active');
    expect(mockTabContents[0].classList.remove).toHaveBeenCalledWith('active');
    expect(mockTabContents[1].classList.remove).toHaveBeenCalledWith('active');
    
    expect(mockTabButtons[0].classList.add).toHaveBeenCalledWith('active');
    expect(mockTabContents[0].classList.add).toHaveBeenCalledWith('active');
  });
});