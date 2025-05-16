/**
 * Application initialization module for TimeTracker
 * Coordinates initialization of all application components
 */

const dataManager = require('./data-manager');
const uiManager = require('./ui-manager');
const tableRenderer = require('./table-renderer');
const fibuManager = require('./fibu-manager');
const timeTracker = require('./time-tracker');

/**
 * Main application initialization function
 * Sets up all UI elements and loads data
 */
function initializeApp() {
  // Setup UI components
  uiManager.setupTabs();
  uiManager.setupSidebarToggle();
  uiManager.setupEditableCells();
  
  // Initialize central data store with existing entries
  dataManager.initCentralStore();
  
  // Load data
  const success = dataManager.loadCsvData();
  if (success) {
    // Setup data dependent features
    const dateColumns = dataManager.findDateColumns();
    tableRenderer.renderDataTable(dateColumns);
    
    uiManager.setupFilterEvents();
    uiManager.setupSearchFunction();
    
    // Calculate statistics
    tableRenderer.calculateTeamMemberTimeStatistics();
    
    // Setup financial calculations
    fibuManager.populateFibuTimesRow();
    fibuManager.calculateAverageHourlyWage();
    
    // Setup CSV import functionality
    uiManager.setupCsvImport();
    
    // Populate category dropdowns for time tracker
    timeTracker.populateCategoryDropdowns();
    
    // Setup team tab table functionality
    setupTeamTabTable();
  }
  
  // Uncomment to enable theme switching
  // uiManager.setupThemeSwitch();
}

/**
 * Set up the team tab table functionality
 */
function setupTeamTabTable() {
  // Render time entries in the team tab
  tableRenderer.renderTeamTimeEntries();
  
  // Event handlers for sort buttons and filters
  const sortDateButton = document.getElementById('team-sort-date-button');
  const filterUnbilledButton = document.getElementById('team-filter-unbilled-button');
  
  if (sortDateButton) {
    sortDateButton.addEventListener('click', () => {
      // Sort entries by date (newest first)
      if (window.appState && window.appState.centralStore && window.appState.centralStore.timeEntries) {
        window.appState.centralStore.timeEntries.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        tableRenderer.renderTeamTimeEntries();
      }
    });
  }
  
  if (filterUnbilledButton) {
    filterUnbilledButton.addEventListener('click', () => {
      filterUnbilledButton.classList.toggle('active');
      tableRenderer.renderTeamTimeEntries();
    });
  }
}

module.exports = {
  initializeApp
};