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

jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'header1,header2\nvalue1,value2\nvalue3,value4'),
}));

jest.mock('path', () => ({
  join: jest.fn(() => '/mocked/path'),
}));

const fs = require('fs');
const path = require('path');

describe('filterTable', () => {
  let filterTable;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    filterTable = function(table, query) {
      const rows = table.querySelectorAll('tr');
      rows.forEach((row, index) => {
        if (index === 0) return;
        const cells = Array.from(row.querySelectorAll('td'));
        const matches = cells.some(cell => cell.textContent.toLowerCase().includes(query.toLowerCase()));
        row.style.display = matches ? '' : 'none';
      });
    };
  });
  
  test('should hide rows that do not match the query', () => {
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
        { querySelectorAll: jest.fn(() => []) },
        row1,
        row2
      ])
    };
    
    filterTable(mockTable, 'John');
    
    expect(row1.style.display).toBe('');
    expect(row2.style.display).toBe('none');
  });
  
  test('should show all rows when query is empty', () => {
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
        { querySelectorAll: jest.fn(() => []) },
        row1,
        row2
      ])
    };
    
    filterTable(mockTable, '');
    
    expect(row1.style.display).toBe('');
    expect(row2.style.display).toBe('');
  });
});

describe('sortTable', () => {
  let sortTable;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    sortTable = function(table, columnIndex) {
      const rowsArray = Array.from(table.querySelectorAll('tr')).slice(1);
      const sortedRows = rowsArray.sort((a, b) => {
        const aText = a.children[columnIndex].textContent;
        const bText = b.children[columnIndex].textContent;
        return aText.localeCompare(bText);
      });
      sortedRows.forEach(row => table.appendChild(row));
    };
  });
  
  test('should sort table rows based on column content', () => {
    const mockRows = [
      { children: [{ textContent: 'Header' }] },
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
    
    sortTable(mockTable, 0);
    
    expect(mockTable.appendChild).toHaveBeenCalledTimes(2);
    expect(mockTable.appendChild).toHaveBeenNthCalledWith(1, mockRows[2]);
    expect(mockTable.appendChild).toHaveBeenNthCalledWith(2, mockRows[1]);
  });
});