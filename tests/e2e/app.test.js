const { Application } = require('spectron');
const { expect } = require('chai');
const path = require('path');
const electronPath = require('electron');

describe('TimeTracker Application', function () {
  this.timeout(10000);

  beforeEach(function() {
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
    await this.app.client.waitForExist('table');
    
    const headers = await this.app.client.$$('th');
    expect(headers).to.exist;
    expect(headers.length).to.be.greaterThan(0);
    
    const rows = await this.app.client.$$('tr');
    expect(rows).to.exist;
    expect(rows.length).to.be.greaterThan(1);
  });

  it('filters table data when search is used', async function() {
    await this.app.client.waitForExist('input.search-input');
    
    const initialRows = await this.app.client.$$('tr:not([style*="display: none"])');
    const initialCount = initialRows.length - 1;
    
    await this.app.client.$('input.search-input').setValue('nonexistentvalue');
    
    await this.app.client.pause(500);
    
    const filteredRows = await this.app.client.$$('tr:not([style*="display: none"])');
    const filteredCount = filteredRows.length - 1;
    
    expect(filteredCount).to.be.lessThan(initialCount);
  });
  
  it('sorts table when clicking on column header', async function() {
    await this.app.client.waitForExist('th');
    
    const cellsBefore = await this.app.client.$$('td:first-child');
    const valuesBefore = [];
    
    for (const cell of cellsBefore) {
      const text = await cell.getText();
      valuesBefore.push(text);
    }
    
    await this.app.client.$('th:first-child').click();
    
    await this.app.client.pause(500);
    
    const cellsAfter = await this.app.client.$$('td:first-child');
    const valuesAfter = [];
    
    for (const cell of cellsAfter) {
      const text = await cell.getText();
      valuesAfter.push(text);
    }
    
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