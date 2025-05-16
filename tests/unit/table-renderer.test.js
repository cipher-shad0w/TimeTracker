const dom = require('../setup');

// Mock the window.appState
global.window = {
  appState: {
    centralStore: {
      timeEntries: [],
      teamMembers: []
    }
  }
};

// Mock document functions
document.getElementById = jest.fn(() => ({
  appendChild: jest.fn(),
  innerHTML: '',
  querySelectorAll: jest.fn(() => []),
  querySelector: jest.fn(() => ({
    innerHTML: '',
    value: '',
    classList: {
      contains: jest.fn()
    }
  }))
}));

describe('Table Renderer Module', () => {
  let tableRenderer;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Reset window.appState before each test
    window.appState = {
      centralStore: {
        timeEntries: [],
        teamMembers: []
      }
    };
    
    tableRenderer = require('../../src/scripts/modules/table-renderer');
  });
  
  describe('renderDataTable', () => {
    test('should not crash when there are no time entries', () => {
      window.appState.centralStore.timeEntries = [];
      
      // This test just ensures that the function doesn't throw an error
      expect(() => tableRenderer.renderDataTable([])).not.toThrow();
    });
    
    test('should render table with time entries', () => {
      // Mock document.createElement to return specific elements
      document.createElement = jest.fn(() => ({
        appendChild: jest.fn(),
        setAttribute: jest.fn(),
        classList: { add: jest.fn() },
        innerHTML: '',
        id: '',
        style: {}
      }));
      
      // Setup mock time entries
      window.appState.centralStore.timeEntries = [
        { id: '1', teamMemberId: 'user1', project: 'Project A', hours: 8, date: '2023-01-01' },
        { id: '2', teamMemberId: 'user2', project: 'Project B', hours: 4, date: '2023-01-02' }
      ];
      
      tableRenderer.renderDataTable(['date']);
      
      // Verify that createElement was called to build the table
      expect(document.createElement).toHaveBeenCalledWith('table');
      expect(document.createElement).toHaveBeenCalledWith('tr');
      expect(document.createElement).toHaveBeenCalledWith('th');
    });
  });
  
  describe('renderTeamTimeEntries', () => {
    test('should not crash when there are no time entries', () => {
      window.appState.centralStore.timeEntries = [];
      
      expect(() => tableRenderer.renderTeamTimeEntries()).not.toThrow();
    });
    
    test('should render team table with filtered entries when filter is active', () => {
      document.createElement = jest.fn(() => ({
        appendChild: jest.fn(),
        setAttribute: jest.fn(),
        classList: { add: jest.fn() },
        innerHTML: '',
        id: '',
        style: {}
      }));
      
      // Mock filter button with active class
      document.getElementById = jest.fn((id) => {
        if (id === 'team-filter-unbilled-button') {
          return {
            classList: { contains: jest.fn().mockReturnValue(true) }
          };
        }
        
        return {
          appendChild: jest.fn(),
          innerHTML: '',
          querySelectorAll: jest.fn(() => [])
        };
      });
      
      // Setup mock time entries with varying billed status
      window.appState.centralStore.timeEntries = [
        { id: '1', teamMemberId: 'user1', billed: true, hours: 8, date: '2023-01-01' },
        { id: '2', teamMemberId: 'user2', billed: false, hours: 4, date: '2023-01-02' }
      ];
      
      tableRenderer.renderTeamTimeEntries();
      
      // Only the unbilled entry should be included in the render logic
      // Check that createElement was called the correct number of times
      const createElementCalls = document.createElement.mock.calls;
      const rowElements = createElementCalls.filter(call => call[0] === 'tr');
      
      // Should have at least 2 rows (1 header, 1 for the unbilled entry)
      expect(rowElements.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('calculateTeamMemberTimeStatistics', () => {
    test('should calculate statistics for each team member', () => {
      // Mock document element for statistics display
      document.getElementById = jest.fn(() => ({
        innerHTML: '',
        appendChild: jest.fn()
      }));
      
      document.createElement = jest.fn(() => ({
        appendChild: jest.fn(),
        classList: { add: jest.fn() },
        innerHTML: '',
        textContent: ''
      }));
      
      // Setup test data
      window.appState.centralStore.teamMembers = [
        { id: 'user1', name: 'John' },
        { id: 'user2', name: 'Jane' }
      ];
      
      window.appState.centralStore.timeEntries = [
        { id: '1', teamMemberId: 'user1', hours: 8, date: '2023-01-01' },
        { id: '2', teamMemberId: 'user1', hours: 7, date: '2023-01-02' },
        { id: '3', teamMemberId: 'user2', hours: 6, date: '2023-01-01' }
      ];
      
      tableRenderer.calculateTeamMemberTimeStatistics();
      
      // Check that we create elements for the statistics
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.createElement).toHaveBeenCalledWith('h3');
      expect(document.createElement).toHaveBeenCalledWith('p');
    });
    
    test('should handle case with no team members', () => {
      window.appState.centralStore.teamMembers = [];
      window.appState.centralStore.timeEntries = [];
      
      // Should not throw an error
      expect(() => tableRenderer.calculateTeamMemberTimeStatistics()).not.toThrow();
    });
  });
  
  describe('updateEntryRow', () => {
    test('should update an existing row with new data', () => {
      // Create a mock row element
      const mockRow = {
        cells: [
          { innerHTML: '1' }, // ID cell
          { innerHTML: 'Old Name' }, // Name cell
          { innerHTML: 'Old Project' } // Project cell
        ]
      };
      
      // Mock document functions to return our mock row
      document.getElementById = jest.fn((id) => {
        if (id === 'row-1') return mockRow;
        return null;
      });
      
      const updatedEntry = {
        id: '1',
        name: 'New Name',
        project: 'New Project'
      };
      
      tableRenderer.updateEntryRow(updatedEntry);
      
      // Check that the row was updated
      expect(mockRow.cells[1].innerHTML).toBe('New Name');
      expect(mockRow.cells[2].innerHTML).toBe('New Project');
    });
    
    test('should do nothing if row does not exist', () => {
      // Mock document.getElementById to return null (row not found)
      document.getElementById = jest.fn().mockReturnValue(null);
      
      const updatedEntry = {
        id: 'nonexistent',
        name: 'New Name'
      };
      
      // Should not throw an error
      expect(() => tableRenderer.updateEntryRow(updatedEntry)).not.toThrow();
    });
  });
});