/**
 * TimeTracker - Main renderer process
 * Handles CSV data loading, UI setup and user interactions
 */

// Import modules
const appInit = require('./scripts/modules/app-init');
const timeTracker = require('./scripts/modules/time-tracker');

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  appInit.initializeApp();
  timeTracker.setupTimeTracker(); // Initialize the time tracker functionality
});
