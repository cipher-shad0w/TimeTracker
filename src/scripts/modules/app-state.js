/**
 * Application state management module
 * Manages global application state
 */

// Exported application state object
const appState = {
  csvData: {
    headers: [],
    rows: []
  },
  // New centralized data store
  centralStore: {
    timeEntries: [],
    lastImport: null
  },
  filters: {
    teamMember: '',
    project: '',
    customer: ''
  },
  sidebarCollapsed: false
};

module.exports = appState;