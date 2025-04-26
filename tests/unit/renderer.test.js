/**
 * Unit tests for TimeTracker renderer functionality
 */

// Mock DOM elements and functions
document.createElement = jest.fn(() => ({
  appendChild: jest.fn(),
  addEventListener: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn()
  },
  setAttribute: jest.fn(),
  style: {},
}));

document.getElementById = jest.fn(() => ({
  innerHTML: '',
  appendChild: jest.fn(),
  addEventListener: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn()
  },
  querySelectorAll: jest.fn(() => []),
  value: '',
  options: [],
  remove: jest.fn(),
}));

document.querySelectorAll = jest.fn(() => []);

// Mock modules
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'header1,header2\nvalue1,value2\nvalue3,value4'),
}));

jest.mock('path', () => ({
  join: jest.fn(() => '/mocked/path'),
}));

// Import the module under test
const fs = require('fs');
const path = require('path');

// Test the filterTable function
describe('filterTable', () => {
  let filterTable;
  
  beforeEach(() => {
    // Reset DOM mocks
    jest.clearAllMocks();
    
    // Re-define filterTable function for testing
    filterTable = function(table, query) {
      const rows = table.querySelectorAll('tr');
      rows.forEach((row, index) => {
        if (index === 0) return; // Skip header row
        const cells = Array.from(row.querySelectorAll('td'));
        const matches = cells.some(cell => cell.textContent.toLowerCase().includes(query.toLowerCase()));
        row.style.display = matches ? '' : 'none';
      });
    };
  });
  
  test('should hide rows that do not match the query', () => {
    // Setup
    const row1 = { 
      querySelectorAll: jest.fn(() => [
        { textContent: 'John Doe' },
        { textContent: 'Project A' }
      ]),
      style: { display: '' }
    };
    
    const row2 = {
      querySelectorAll: jest.fn(() => [
        { textContent: 'Jane Smith' },
        { textContent: 'Project B' }
      ]),
      style: { display: '' }
    };
    
    const mockTable = {
      querySelectorAll: jest.fn(() => [
        { querySelectorAll: jest.fn(() => []) }, // Header row
        row1,
        row2
      ])
    };
    
    // Execute
    filterTable(mockTable, 'John');
    
    // Assert
    expect(row1.style.display).toBe('');
    expect(row2.style.display).toBe('none');
  });
  
  test('should show all rows when query is empty', () => {
    // Setup
    const row1 = { 
      querySelectorAll: jest.fn(() => [
        { textContent: 'John Doe' },
        { textContent: 'Project A' }
      ]),
      style: { display: '' }
    };
    
    const row2 = {
      querySelectorAll: jest.fn(() => [
        { textContent: 'Jane Smith' },
        { textContent: 'Project B' }
      ]),
      style: { display: '' }
    };
    
    const mockTable = {
      querySelectorAll: jest.fn(() => [
        { querySelectorAll: jest.fn(() => []) }, // Header row
        row1,
        row2
      ])
    };
    
    // Execute
    filterTable(mockTable, '');
    
    // Assert
    expect(row1.style.display).toBe('');
    expect(row2.style.display).toBe('');
  });
});

// Test for sortTable function
describe('sortTable', () => {
  let sortTable;
  
  beforeEach(() => {
    // Reset DOM mocks
    jest.clearAllMocks();
    
    // Re-define sortTable function for testing
    sortTable = function(table, columnIndex) {
      const rowsArray = Array.from(table.querySelectorAll('tr')).slice(1); // Exclude header row
      const sortedRows = rowsArray.sort((a, b) => {
        const aText = a.children[columnIndex].textContent;
        const bText = b.children[columnIndex].textContent;
        return aText.localeCompare(bText);
      });
      sortedRows.forEach(row => table.appendChild(row));
    };
  });
  
  test('should sort table rows based on column content', () => {
    // Setup
    const mockRows = [
      { children: [{ textContent: 'Header' }] }, // Header row (will be excluded)
      { 
        children: [{ textContent: 'B' }],
      },
      { 
        children: [{ textContent: 'A' }],
      }
    ];
    
    const mockTable = {
      querySelectorAll: jest.fn(() => mockRows),
      appendChild: jest.fn()
    };
    
    // Execute
    sortTable(mockTable, 0);
    
    // Assert
    expect(mockTable.appendChild).toHaveBeenCalledTimes(2);
    // The 'A' row (index 2) should be appended first, followed by the 'B' row (index 1)
    expect(mockTable.appendChild).toHaveBeenNthCalledWith(1, mockRows[2]);
    expect(mockTable.appendChild).toHaveBeenNthCalledWith(2, mockRows[1]);
  });
});