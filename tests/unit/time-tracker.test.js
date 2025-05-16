const dom = require('../setup');

// Mock UUID generation
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}));

// Mock window.appState
global.window = {
  appState: {
    centralStore: {
      timeEntries: [],
      teamMembers: [],
      categories: [],
      projects: []
    }
  }
};

// Setup common global mocks
document.getElementById = jest.fn(() => ({
  value: '',
  addEventListener: jest.fn(),
  appendChild: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  querySelector: jest.fn(() => ({
    value: '',
    addEventListener: jest.fn()
  }))
}));

describe('Time Tracker Module', () => {
  let timeTracker;
  let dataManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Reset window.appState before each test
    window.appState = {
      centralStore: {
        timeEntries: [],
        teamMembers: [
          { id: 'user1', name: 'John Doe' },
          { id: 'user2', name: 'Jane Smith' }
        ],
        categories: ['Development', 'Meetings', 'Planning'],
        projects: ['Project A', 'Project B', 'Project C']
      }
    };
    
    // Mock dataManager
    dataManager = {
      addTimeEntry: jest.fn(),
      updateTimeEntry: jest.fn(),
      deleteTimeEntry: jest.fn(),
      saveCsvData: jest.fn()
    };
    
    jest.mock('../../src/scripts/modules/data-manager', () => dataManager);
    
    timeTracker = require('../../src/scripts/modules/time-tracker');
  });
  
  describe('setupTimeTracker', () => {
    test('should set up event listeners', () => {
      const startButton = { addEventListener: jest.fn() };
      const stopButton = { addEventListener: jest.fn() };
      const saveButton = { addEventListener: jest.fn() };
      const deleteButton = { addEventListener: jest.fn() };
      
      document.getElementById = jest.fn((id) => {
        switch (id) {
          case 'tt-start-button':
            return startButton;
          case 'tt-stop-button':
            return stopButton;
          case 'tt-save-button':
            return saveButton;
          case 'tt-delete-button':
            return deleteButton;
          default:
            return {
              addEventListener: jest.fn(),
              value: '',
              appendChild: jest.fn(),
              querySelectorAll: jest.fn(() => [])
            };
        }
      });
      
      timeTracker.setupTimeTracker();
      
      expect(startButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(stopButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(saveButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(deleteButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });
  
  describe('populateCategoryDropdowns', () => {
    test('should create option elements for each category', () => {
      const mockSelect = {
        appendChild: jest.fn(),
        options: { length: 0 }
      };
      
      document.getElementById = jest.fn(() => mockSelect);
      
      document.createElement = jest.fn(() => ({
        value: '',
        textContent: '',
        appendChild: jest.fn()
      }));
      
      timeTracker.populateCategoryDropdowns();
      
      // Should create an option for each category plus possibly default options
      expect(document.createElement).toHaveBeenCalledTimes(
        window.appState.centralStore.categories.length + 
        window.appState.centralStore.projects.length + 
        window.appState.centralStore.teamMembers.length
      );
      
      expect(document.createElement).toHaveBeenCalledWith('option');
    });
    
    test('should handle empty categories array', () => {
      window.appState.centralStore.categories = [];
      window.appState.centralStore.projects = [];
      
      const mockSelect = {
        appendChild: jest.fn(),
        options: { length: 0 }
      };
      
      document.getElementById = jest.fn(() => mockSelect);
      
      // Should not throw an error
      expect(() => timeTracker.populateCategoryDropdowns()).not.toThrow();
    });
  });
  
  describe('startTimeTracking', () => {
    test('should update UI and store start time', () => {
      // Mock date
      const mockDate = new Date('2023-05-20T10:00:00Z');
      global.Date = jest.fn(() => mockDate);
      Date.now = jest.fn(() => mockDate.getTime());
      
      // Mock timer display element
      const mockTimerDisplay = { textContent: '' };
      document.getElementById = jest.fn((id) => {
        if (id === 'tt-timer-display') return mockTimerDisplay;
        return { addEventListener: jest.fn(), value: '', appendChild: jest.fn() };
      });
      
      timeTracker.startTimeTracking();
      
      // Check that the timer was started
      expect(mockTimerDisplay.textContent).toMatch(/00:00:00/);
      expect(global.timeTrackingInterval).toBeDefined();
    });
  });
  
  describe('stopTimeTracking', () => {
    test('should clear interval and update UI', () => {
      // Setup tracking state
      global.timeTrackingInterval = setInterval(() => {}, 1000);
      global.timeTrackingStartTime = Date.now() - 3600000; // 1 hour ago
      
      // Mock timer display element
      const mockTimerDisplay = { textContent: '01:00:00' };
      document.getElementById = jest.fn((id) => {
        if (id === 'tt-timer-display') return mockTimerDisplay;
        return { addEventListener: jest.fn(), value: '', appendChild: jest.fn() };
      });
      
      // Mock clearInterval
      global.clearInterval = jest.fn();
      
      timeTracker.stopTimeTracking();
      
      // Interval should be cleared
      expect(clearInterval).toHaveBeenCalledWith(global.timeTrackingInterval);
      expect(global.timeTrackingInterval).toBeUndefined();
      expect(global.timeTrackingEndTime).toBeDefined();
    });
  });
  
  describe('saveTimeEntry', () => {
    test('should save time entry with data from form', () => {
      // Mock form elements
      document.getElementById = jest.fn((id) => {
        switch (id) {
          case 'tt-team-member':
            return { value: 'user1' };
          case 'tt-project':
            return { value: 'Project A' };
          case 'tt-category':
            return { value: 'Development' };
          case 'tt-description':
            return { value: 'Test description' };
          case 'tt-timer-display':
            return { textContent: '01:30:00' }; // 1.5 hours
          default:
            return { addEventListener: jest.fn(), value: '', appendChild: jest.fn() };
        }
      });
      
      // Setup tracking state
      global.timeTrackingStartTime = new Date('2023-05-20T10:00:00Z');
      global.timeTrackingEndTime = new Date('2023-05-20T11:30:00Z');
      
      // Require the module to make sure the mocks are used
      const timeTracker = require('../../src/scripts/modules/time-tracker');
      timeTracker.saveTimeEntry();
      
      // Check data manager was called to add entry
      expect(dataManager.addTimeEntry).toHaveBeenCalledWith(expect.objectContaining({
        teamMemberId: 'user1',
        project: 'Project A',
        category: 'Development',
        description: 'Test description',
        hours: 1.5,
        id: 'mock-uuid',
        startDate: global.timeTrackingStartTime.toISOString().split('T')[0],
        endDate: global.timeTrackingEndTime.toISOString().split('T')[0]
      }));
      
      // Check that data was saved to CSV
      expect(dataManager.saveCsvData).toHaveBeenCalled();
    });
    
    test('should not save if tracking never started', () => {
      // Clear tracking state
      global.timeTrackingStartTime = undefined;
      global.timeTrackingEndTime = undefined;
      
      timeTracker.saveTimeEntry();
      
      // Data manager should not be called
      expect(dataManager.addTimeEntry).not.toHaveBeenCalled();
    });
  });
  
  describe('updateTimerDisplay', () => {
    test('should format time correctly', () => {
      // Mock timer display
      const mockTimerDisplay = { textContent: '' };
      document.getElementById = jest.fn(() => mockTimerDisplay);
      
      // Setup tracking state - 1 hour, 30 minutes, 45 seconds ago
      const timeElapsed = 1 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000;
      global.timeTrackingStartTime = Date.now() - timeElapsed;
      
      timeTracker.updateTimerDisplay();
      
      // Check that timer displays correct format
      expect(mockTimerDisplay.textContent).toBe('01:30:45');
    });
    
    test('should handle multiple hours correctly', () => {
      // Mock timer display
      const mockTimerDisplay = { textContent: '' };
      document.getElementById = jest.fn(() => mockTimerDisplay);
      
      // Setup tracking state - 12 hours, 5 minutes, 30 seconds ago
      const timeElapsed = 12 * 60 * 60 * 1000 + 5 * 60 * 1000 + 30 * 1000;
      global.timeTrackingStartTime = Date.now() - timeElapsed;
      
      timeTracker.updateTimerDisplay();
      
      // Check that timer displays correct format
      expect(mockTimerDisplay.textContent).toBe('12:05:30');
    });
  });
});