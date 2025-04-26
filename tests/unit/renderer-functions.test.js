/**
 * Additional unit tests for TimeTracker renderer functionality
 */

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};

// Mock document elements and functions
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

// Test theme switch functionality
describe('Theme Switch Functionality', () => {
  let setupThemeSwitch;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset checked state of mockElement
    mockElement.checked = false;
    
    // Mock implementation of localStorage
    global.localStorage.getItem.mockImplementation((key) => {
      if (key === 'theme') return null; // Default to no stored theme
      return null;
    });
    
    // Define the setupThemeSwitch function for testing
    setupThemeSwitch = function() {
      const themeSwitch = document.getElementById('checkbox');
      
      // Check if user preference exists in localStorage
      const currentTheme = localStorage.getItem('theme');
      if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        // If theme is light, check the checkbox
        if (currentTheme === 'light') {
          themeSwitch.checked = true;
        }
      }
      
      // Add event listener to toggle theme
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
    // Execute
    setupThemeSwitch();
    
    // Assert
    expect(document.documentElement.setAttribute).not.toHaveBeenCalled();
    expect(mockElement.checked).toBe(false);
  });
  
  test('should load light theme from localStorage', () => {
    // Setup - mock localStorage to return light theme
    global.localStorage.getItem.mockReturnValue('light');
    
    // Execute
    setupThemeSwitch();
    
    // Assert
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    expect(mockElement.checked).toBe(true);
  });
  
  test('should change to light theme when checkbox is checked', () => {
    // Execute
    setupThemeSwitch();
    
    // Get the change event handler
    const changeHandler = mockElement.addEventListener.mock.calls[0][1];
    
    // Simulate checkbox being checked
    mockElement.checked = true;
    changeHandler.call(mockElement);
    
    // Assert
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });
  
  test('should change to dark theme when checkbox is unchecked', () => {
    // Execute
    setupThemeSwitch();
    
    // Get the change event handler
    const changeHandler = mockElement.addEventListener.mock.calls[0][1];
    
    // Simulate checkbox being unchecked (it's already false by default)
    mockElement.checked = false;
    changeHandler.call(mockElement);
    
    // Assert
    expect(document.documentElement.removeAttribute).toHaveBeenCalledWith('data-theme');
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
});

// Test tab functionality
describe('Tab Functionality', () => {
  let setupTabs;
  let mockTabButtons;
  let mockTabContents;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock tab buttons and contents
    mockTabButtons = [
      { 
        getAttribute: jest.fn(() => 'tab1'),
        classList: { add: jest.fn(), remove: jest.fn() },
        addEventListener: jest.fn((event, handler) => {
          // Store the handler for later execution in tests
          mockTabButtons[0].clickHandler = handler;
        })
      },
      { 
        getAttribute: jest.fn(() => 'tab2'),
        classList: { add: jest.fn(), remove: jest.fn() },
        addEventListener: jest.fn((event, handler) => {
          // Store the handler for later execution in tests
          mockTabButtons[1].clickHandler = handler;
        })
      }
    ];
    
    mockTabContents = [
      { classList: { add: jest.fn(), remove: jest.fn() } },
      { classList: { add: jest.fn(), remove: jest.fn() } }
    ];
    
    // Mock querySelector/querySelectorAll
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
    
    // Define the setupTabs function for testing
    setupTabs = function() {
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabContents = document.querySelectorAll('.tab-content');
  
      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Deactivate all tabs
          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          
          // Activate clicked tab
          const tabId = button.getAttribute('data-tab');
          button.classList.add('active');
          document.getElementById(tabId).classList.add('active');
        });
      });
    };
  });
  
  test('should add click handlers to tab buttons', () => {
    // Execute
    setupTabs();
    
    // Assert
    expect(mockTabButtons[0].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockTabButtons[1].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
  
  test('should switch tabs when clicked', () => {
    // Execute
    setupTabs();
    
    // Execute the click handler for the first tab
    mockTabButtons[0].clickHandler();
    
    // Assert - should remove active class from all tabs
    expect(mockTabButtons[0].classList.remove).toHaveBeenCalledWith('active');
    expect(mockTabButtons[1].classList.remove).toHaveBeenCalledWith('active');
    expect(mockTabContents[0].classList.remove).toHaveBeenCalledWith('active');
    expect(mockTabContents[1].classList.remove).toHaveBeenCalledWith('active');
    
    // Assert - should add active class to clicked tab
    expect(mockTabButtons[0].classList.add).toHaveBeenCalledWith('active');
    expect(mockTabContents[0].classList.add).toHaveBeenCalledWith('active');
  });
});