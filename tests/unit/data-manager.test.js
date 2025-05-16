const fs = require('fs');
const path = require('path');

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn()
}));

// Mock CSV parser
jest.mock('csv-parser', () => jest.fn(() => ({
  on: jest.fn()
})));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((_, file) => file)
}));

// Mock window.appState
global.window = {
  appState: {
    centralStore: {
      timeEntries: [],
      teamMembers: []
    }
  }
};

describe('Data Manager Module', () => {
  let dataManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Reset appState before each test
    window.appState = {
      centralStore: {
        timeEntries: [],
        teamMembers: []
      }
    };
    
    dataManager = require('../../src/scripts/modules/data-manager');
  });
  
  describe('initCentralStore', () => {
    test('should initialize central store in window.appState', () => {
      dataManager.initCentralStore();
      
      expect(window.appState).toBeDefined();
      expect(window.appState.centralStore).toBeDefined();
      expect(window.appState.centralStore.timeEntries).toEqual([]);
      expect(window.appState.centralStore.teamMembers).toEqual([]);
    });
  });
  
  describe('loadCsvData', () => {
    test('should return false when CSV file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = dataManager.loadCsvData();
      
      expect(result).toBe(false);
      expect(fs.existsSync).toHaveBeenCalled();
    });
    
    test('should handle empty CSV content', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('');
      
      const result = dataManager.loadCsvData();
      
      expect(result).toBe(true);
    });
    
    test('should parse CSV data and populate store when CSV exists', () => {
      const mockCsvData = 'id,name,date,hours\n1,John,2023-01-01,8\n2,Jane,2023-01-02,7.5';
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(mockCsvData);
      
      // Mock the processCsvData function
      dataManager.processCsvData = jest.fn();
      
      const result = dataManager.loadCsvData();
      
      expect(result).toBe(true);
      expect(dataManager.processCsvData).toHaveBeenCalled();
    });
  });
  
  describe('findDateColumns', () => {
    test('should return empty array when no entries exist', () => {
      const result = dataManager.findDateColumns();
      
      expect(result).toEqual([]);
    });
    
    test('should identify date columns from entries', () => {
      window.appState.centralStore.timeEntries = [
        { startDate: '2023-01-01', endDate: '2023-01-01', randomField: 'test' }
      ];
      
      const result = dataManager.findDateColumns();
      
      expect(result).toContain('startDate');
      expect(result).toContain('endDate');
      expect(result).not.toContain('randomField');
    });
  });
  
  describe('saveCsvData', () => {
    test('should call saveCsvData with correct data', () => {
      // Mock the internal saveToFile function
      dataManager.saveToFile = jest.fn();
      
      window.appState.centralStore.timeEntries = [
        { id: 1, name: 'John', date: '2023-01-01' }
      ];
      
      dataManager.saveCsvData();
      
      expect(dataManager.saveToFile).toHaveBeenCalled();
    });
  });
  
  describe('addTimeEntry', () => {
    test('should add new time entry to the central store', () => {
      const newEntry = { id: 'test123', name: 'Test User', hours: 8 };
      
      dataManager.addTimeEntry(newEntry);
      
      expect(window.appState.centralStore.timeEntries).toContain(newEntry);
    });
  });
  
  describe('updateTimeEntry', () => {
    test('should update existing time entry', () => {
      const initialEntry = { id: 'test123', name: 'Original', hours: 8 };
      const updatedEntry = { id: 'test123', name: 'Updated', hours: 9 };
      
      window.appState.centralStore.timeEntries = [initialEntry];
      
      dataManager.updateTimeEntry(updatedEntry);
      
      expect(window.appState.centralStore.timeEntries.length).toBe(1);
      expect(window.appState.centralStore.timeEntries[0].name).toBe('Updated');
      expect(window.appState.centralStore.timeEntries[0].hours).toBe(9);
    });
    
    test('should do nothing when entry with given ID does not exist', () => {
      const initialEntry = { id: 'test123', name: 'Original', hours: 8 };
      const updatedEntry = { id: 'nonexistent', name: 'Updated', hours: 9 };
      
      window.appState.centralStore.timeEntries = [initialEntry];
      
      dataManager.updateTimeEntry(updatedEntry);
      
      expect(window.appState.centralStore.timeEntries.length).toBe(1);
      expect(window.appState.centralStore.timeEntries[0].name).toBe('Original');
    });
  });
  
  describe('deleteTimeEntry', () => {
    test('should delete time entry with matching ID', () => {
      const entry1 = { id: 'test123', name: 'Entry 1' };
      const entry2 = { id: 'test456', name: 'Entry 2' };
      
      window.appState.centralStore.timeEntries = [entry1, entry2];
      
      dataManager.deleteTimeEntry('test123');
      
      expect(window.appState.centralStore.timeEntries.length).toBe(1);
      expect(window.appState.centralStore.timeEntries[0].id).toBe('test456');
    });
    
    test('should not change timeEntries when ID does not exist', () => {
      const entry1 = { id: 'test123', name: 'Entry 1' };
      
      window.appState.centralStore.timeEntries = [entry1];
      
      dataManager.deleteTimeEntry('nonexistent');
      
      expect(window.appState.centralStore.timeEntries.length).toBe(1);
      expect(window.appState.centralStore.timeEntries[0].id).toBe('test123');
    });
  });
  
  describe('getTimeEntriesByTeamMember', () => {
    test('should return entries filtered by team member ID', () => {
      window.appState.centralStore.timeEntries = [
        { id: '1', teamMemberId: 'user1', hours: 8 },
        { id: '2', teamMemberId: 'user1', hours: 7 },
        { id: '3', teamMemberId: 'user2', hours: 6 }
      ];
      
      const result = dataManager.getTimeEntriesByTeamMember('user1');
      
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });
    
    test('should return empty array when no entries match', () => {
      window.appState.centralStore.timeEntries = [
        { id: '1', teamMemberId: 'user1', hours: 8 }
      ];
      
      const result = dataManager.getTimeEntriesByTeamMember('nonexistent');
      
      expect(result.length).toBe(0);
    });
  });
});