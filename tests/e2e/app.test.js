const { Application } = require('spectron');
const { expect } = require('chai');
const path = require('path');
const electronPath = require('electron');

describe('TimeTracker Application', function () {
  // Set timeout for tests
  this.timeout(10000);

  // Before each test, start the app
  beforeEach(function() {
    // Ensure electron path is properly resolved
    const electronBinaryPath = typeof electronPath === 'string' 
      ? electronPath 
      : electronPath.toString();
      
    this.app = new Application({
      path: electronBinaryPath,
      args: [path.join(__dirname, '../../src/main.js')],
      env: { ELECTRON_ENABLE_LOGGING: true },
      startTimeout: 10000
    });
    return this.app.start();
  });

  // After each test, stop the app
  afterEach(function() {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('shows the main window', async function() {
    const windowCount = await this.app.client.getWindowCount();
    expect(windowCount).to.equal(1);
  });

  it('has the correct title', async function() {
    const title = await this.app.client.getTitle();
    expect(title).to.include('TimeTracker');
  });

  it('loads CSV data and displays a table', async function() {
    // Wait for the table to be loaded
    await this.app.client.waitForExist('table');
    
    // Check if the table headers exist
    const headers = await this.app.client.$$('th');
    expect(headers).to.exist;
    expect(headers.length).to.be.greaterThan(0);
    
    // Check if table rows exist
    const rows = await this.app.client.$$('tr');
    expect(rows).to.exist;
    expect(rows.length).to.be.greaterThan(1); // At least header row + 1 data row
  });

  it('filters table data when search is used', async function() {
    // Wait for the search input to exist
    await this.app.client.waitForExist('input.search-input');
    
    // Get initial row count
    const initialRows = await this.app.client.$$('tr:not([style*="display: none"])');
    const initialCount = initialRows.length - 1; // Subtract header row
    
    // Type into search field
    await this.app.client.$('input.search-input').setValue('nonexistentvalue');
    
    // Wait for filtering to apply
    await this.app.client.pause(500);
    
    // Check filtered rows
    const filteredRows = await this.app.client.$$('tr:not([style*="display: none"])');
    const filteredCount = filteredRows.length - 1; // Subtract header row
    
    // Should have fewer rows after filtering
    expect(filteredCount).to.be.lessThan(initialCount);
  });
  
  it('sorts table when clicking on column header', async function() {
    // Wait for table headers to exist
    await this.app.client.waitForExist('th');
    
    // Get first column cells before sorting
    const cellsBefore = await this.app.client.$$('td:first-child');
    const valuesBefore = [];
    
    for (const cell of cellsBefore) {
      const text = await cell.getText();
      valuesBefore.push(text);
    }
    
    // Click the first column header to sort
    await this.app.client.$('th:first-child').click();
    
    // Wait for sorting to apply
    await this.app.client.pause(500);
    
    // Get first column cells after sorting
    const cellsAfter = await this.app.client.$$('td:first-child');
    const valuesAfter = [];
    
    for (const cell of cellsAfter) {
      const text = await cell.getText();
      valuesAfter.push(text);
    }
    
    // Check if arrays are different (sorting happened)
    let isSorted = false;
    for (let i = 0; i < valuesBefore.length; i++) {
      if (valuesBefore[i] !== valuesAfter[i]) {
        isSorted = true;
        break;
      }
    }
    
    expect(isSorted).to.be.true;
  });
});