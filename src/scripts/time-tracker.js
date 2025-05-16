/**
 * TimeTracker - Core functionality for time tracking
 * This file contains the complete logic for the timer while maintaining the visual design
 */

// Import data manager to access the central store
const dataManager = require('./scripts/modules/data-manager');
const appState = require('./scripts/modules/app-state');

class TimeTracker {
  /**
   * Initialize the TimeTracker
   */
  constructor() {
    // Timer status variables
    this.isRunning = false;
    this.startTime = 0;
    this.elapsedSeconds = 0;
    this.timerInterval = null;
    this.currentEntryId = null;
    
    // Verbose logging (set to false in production)
    this.debug = false;
    
    // Log initialization
    this.debugLog('TimeTracker is being initialized');
    
    // Use entries from central store
    this.timeEntries = appState.centralStore.timeEntries;
    
    // Reference DOM elements
    this.initDomElements();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Render time entries table
    this.renderTimeEntries();
  }
  
  /**
   * Reference all required DOM elements
   */
  initDomElements() {
    this.debugLog('Initializing DOM elements');
    
    // Timer elements
    this.timerDisplay = document.querySelector('.timer-display');
    this.timerHours = document.querySelector('.timer-hours');
    this.timerMinutes = document.querySelector('.timer-minutes');
    this.timerSeconds = document.querySelector('.timer-seconds');
    this.timerStatus = document.getElementById('timer-status');
    this.timerStartBtn = document.getElementById('timer-start-btn');
    this.timerStopBtn = document.getElementById('timer-stop-btn');
    this.timerResetBtn = document.getElementById('timer-reset-btn');
    
    // Form elements
    this.teamSelect = document.getElementById('team-select');
    this.customerSelect = document.getElementById('customer-select');
    this.projectSelect = document.getElementById('project-select');
    this.assignmentInput = document.getElementById('assignment-input');
    this.notesTextarea = document.getElementById('time-entry-notes');
    
    // Action buttons
    this.saveEntryBtn = document.getElementById('save-entry-btn');
    this.resetEntryBtn = document.getElementById('reset-entry-btn') || document.getElementById('reset-form-btn');
    this.deleteEntryBtn = document.getElementById('delete-entry-btn');
    
    // Table and filters
    this.timeTrackerTable = document.querySelector('#time-entries-table-body') || 
                           document.querySelector('#time-tracker-table tbody');
    this.sortDateBtn = document.getElementById('sort-date-button') || document.getElementById('sort-date-btn');
    this.filterUnbilledBtn = document.getElementById('filter-unbilled-button') || document.getElementById('filter-unbilled-btn');
    this.searchInput = document.getElementById('table-search-input');
    // Team filter
    this.teamFilter = document.getElementById('team-filter');
    
    // Hidden fields
    this.entryIdInput = document.getElementById('entry-id-input');
    this.selectedTeamInput = document.getElementById('selected-team');
    this.selectedCustomerInput = document.getElementById('selected-customer');
    this.selectedProjectInput = document.getElementById('selected-project');
    
    // If standard timer buttons are not found, try alternative selectors
    if (!this.timerStartBtn || !this.timerStopBtn) {
      this.findAndAttachTimerButtons();
    }
  }
  
  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    this.debugLog('Setting up event listeners');
    
    // Timer control
    if (this.timerStartBtn) {
      this.timerStartBtn.addEventListener('click', () => this.startTimer());
    }
    
    if (this.timerStopBtn) {
      this.timerStopBtn.addEventListener('click', () => this.stopTimer());
    }
    
    if (this.timerResetBtn) {
      this.timerResetBtn.addEventListener('click', () => this.resetTimer());
    }
    
    // Form actions
    if (this.saveEntryBtn) {
      this.saveEntryBtn.addEventListener('click', () => this.saveTimeEntry());
    }
    
    if (this.resetEntryBtn) {
      this.resetEntryBtn.addEventListener('click', () => this.resetForm());
    }
    
    if (this.deleteEntryBtn) {
      this.deleteEntryBtn.addEventListener('click', () => {
        if (this.entryIdInput && this.entryIdInput.value) {
          if (confirm('Are you sure you want to delete this entry?')) {
            this.deleteTimeEntry(this.entryIdInput.value);
            this.resetForm();
          }
        } else {
          this.resetForm();
        }
      });
    }
    
    // Table filters
    if (this.sortDateBtn) {
      this.sortDateBtn.addEventListener('click', () => {
        this.timeEntries.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        this.renderTimeEntries();
      });
    }
    
    if (this.filterUnbilledBtn) {
      this.filterUnbilledBtn.addEventListener('click', () => {
        this.filterUnbilledBtn.classList.toggle('active');
        this.renderTimeEntries();
      });
    }
    
    if (this.searchInput) {
      this.searchInput.addEventListener('input', e => {
        this.filterBySearch(e.target.value);
      });
    }
    // Team filter
    if (this.teamFilter) {
      this.teamFilter.addEventListener('change', e => {
        this.selectedTeamFilter = e.target.value;
        this.renderTimeEntries();
      });
    }
  }
  
  /**
   * Tries to find timer buttons in the DOM and attach event listeners
   */
  findAndAttachTimerButtons() {
    this.debugLog('Looking for timer buttons using alternative selectors');
    
    // Common selectors for start/stop buttons
    const buttonSelectors = {
      start: ['.timer-start-btn', '.start-btn', 'button:contains("Start")', '.fa-play'],
      stop: ['.timer-stop-btn', '.stop-btn', 'button:contains("Stop")', '.fa-stop']
    };
    
    // Try to find start button
    if (!this.timerStartBtn) {
      for (const selector of buttonSelectors.start) {
        const btn = this.findElementBySelector(selector);
        if (btn) {
          this.timerStartBtn = btn;
          this.timerStartBtn.addEventListener('click', () => this.startTimer());
          this.debugLog(`Found start button with selector: ${selector}`);
          break;
        }
      }
    }
    
    // Try to find stop button
    if (!this.timerStopBtn) {
      for (const selector of buttonSelectors.stop) {
        const btn = this.findElementBySelector(selector);
        if (btn) {
          this.timerStopBtn = btn;
          this.timerStopBtn.addEventListener('click', () => this.stopTimer());
          this.debugLog(`Found stop button with selector: ${selector}`);
          break;
        }
      }
    }
  }
  
  /**
   * Helper method to find elements by selector, including text content
   */
  findElementBySelector(selector) {
    try {
      if (selector.includes(':contains(')) {
        // Handle text-content selector
        const containsText = selector.match(/:contains\("(.+?)"\)/)[1];
        const allButtons = document.querySelectorAll('button');
        return Array.from(allButtons).find(btn => 
          btn.textContent.includes(containsText)
        );
      } else if (selector.startsWith('.fa-')) {
        // Handle icon selector
        const iconClass = selector;
        const icons = document.querySelectorAll(iconClass);
        for (const icon of icons) {
          if (icon.parentElement && icon.parentElement.tagName === 'BUTTON') {
            return icon.parentElement;
          }
        }
        return null;
      } else {
        // Standard CSS selector
        return document.querySelector(selector);
      }
    } catch (error) {
      this.debugLog(`Error finding element with selector ${selector}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Start the timer
   */
  startTimer() {
    // Already running? Do nothing
    if (this.isRunning) return;
    
    this.debugLog('Starting timer');
    
    // Set timer status
    this.isRunning = true;
    
    // Calculate start time (consider existing seconds)
    this.startTime = Date.now() - (this.elapsedSeconds * 1000);
    
    // Start timer interval (updates every second)
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    
    // Update UI
    if (this.timerStartBtn) this.timerStartBtn.style.display = 'none';
    if (this.timerStopBtn) this.timerStopBtn.style.display = 'inline-flex';
    if (this.timerStatus) {
      this.timerStatus.textContent = 'Running...';
      this.timerStatus.style.color = '#4CAF50'; // Green
    }
    
    // Immediate first update of the timer
    this.updateTimer();
  }
  
  /**
   * Stop the timer
   */
  stopTimer() {
    // Not running? Do nothing
    if (!this.isRunning) return;
    
    this.debugLog('Stopping timer');
    
    // Set timer status
    this.isRunning = false;
    
    // Clear interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Update UI
    if (this.timerStartBtn) this.timerStartBtn.style.display = 'inline-flex';
    if (this.timerStopBtn) this.timerStopBtn.style.display = 'none';
    if (this.timerStatus) {
      this.timerStatus.textContent = 'Stopped';
      this.timerStatus.style.color = '#F44336'; // Red
    }
  }
  
  /**
   * Reset the timer to 00:00:00
   */
  resetTimer() {
    // Stop timer if it's running
    if (this.isRunning) {
      this.stopTimer();
    }
    
    // Reset timer values
    this.elapsedSeconds = 0;
    
    // Update display
    this.updateTimerDisplay(0, 0, 0);
    
    // Update status
    if (this.timerStatus) {
      this.timerStatus.textContent = 'Ready';
      this.timerStatus.style.color = '';
    }
  }
  
  /**
   * Update the timer display (called by interval)
   */
  updateTimer() {
    // Calculate elapsed time
    const now = Date.now();
    this.elapsedSeconds = Math.floor((now - this.startTime) / 1000);
    
    // Convert to hours, minutes, seconds
    const hours = Math.floor(this.elapsedSeconds / 3600);
    const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
    const seconds = this.elapsedSeconds % 60;
    
    // Update display
    this.updateTimerDisplay(hours, minutes, seconds);
  }
  
  /**
   * Update timer display with given values
   */
  updateTimerDisplay(hours, minutes, seconds) {
    // Format with leading zeros
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    // Update individual elements if they exist
    if (this.timerHours) this.timerHours.textContent = formattedHours;
    if (this.timerMinutes) this.timerMinutes.textContent = formattedMinutes;
    if (this.timerSeconds) this.timerSeconds.textContent = formattedSeconds;
    
    // Store complete time as attribute (for other functions)
    const formattedTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    if (this.timerDisplay) {
      this.timerDisplay.setAttribute('data-duration', formattedTime);
    }
  }
  
  /**
   * Save a time entry
   */
  saveTimeEntry() {
    // Validate required fields
    if (!this.validateForm()) {
      return;
    }
    
    const now = new Date();
    const entryData = {
      id: this.entryIdInput?.value || this.generateUniqueId(),
      teamMember: this.getFormValue('team'),
      customer: this.getFormValue('customer'),
      project: this.getFormValue('project'),
      assignment: this.assignmentInput?.value || '',
      notes: this.notesTextarea?.value || '',
      startDate: this.formatDateForIso(now),
      endDate: this.formatDateForIso(now),
      duration: this.getTimerDurationText(),
      billed: false,
      timestamp: now.getTime(),
      source: 'manual_entry' // Mark as manually entered
    };
    
    // Add new entry or update existing one
    if (this.entryIdInput?.value) {
      // Update existing entry
      const index = this.timeEntries.findIndex(entry => entry.id === this.entryIdInput.value);
      if (index !== -1) {
        // Preserve billing status of existing entry
        entryData.billed = this.timeEntries[index].billed;
        this.timeEntries[index] = entryData;
      }
    } else {
      // Add new entry
      this.timeEntries.push(entryData);
    }
    
    // Save to central store and localStorage
    dataManager.saveTimeEntriesToLocalStorage(this.timeEntries);
    
    // Re-render and reset form
    this.renderTimeEntries();
    this.resetForm();
    
    this.debugLog('Time entry saved', entryData);
  }
  
  /**
   * Get the current value from a form field
   */
  getFormValue(type) {
    const selectElement = this[`${type}Select`];
    const hiddenInput = document.getElementById(`selected-${type}`);
    
    // Get value from element (priority: Select > Hidden Input)
    if (selectElement?.value) {
      return selectElement.value;
    }
    
    if (hiddenInput?.value) {
      return hiddenInput.value;
    }
    
    return '';
  }
  
  /**
   * Validate form inputs
   */
  validateForm() {
    // Team member
    const teamMember = this.getFormValue('team');
    if (!teamMember) {
      alert('Please select a team member.');
      return false;
    }
    
    // Customer
    const customer = this.getFormValue('customer');
    if (!customer) {
      alert('Please select a customer.');
      return false;
    }
    
    // Project
    const project = this.getFormValue('project');
    if (!project) {
      alert('Please select a project.');
      return false;
    }
    
    return true;
  }
  
  /**
   * Get the current timer text
   */
  getTimerDurationText() {
    // If timer is running, get current values
    if (this.timerHours && this.timerMinutes && this.timerSeconds) {
      return `${this.timerHours.textContent}:${this.timerMinutes.textContent}:${this.timerSeconds.textContent}`;
    }
    
    // Alternative: read from data attribute
    if (this.timerDisplay?.getAttribute('data-duration')) {
      return this.timerDisplay.getAttribute('data-duration');
    }
    
    // Fallback: convert seconds
    const hours = Math.floor(this.elapsedSeconds / 3600);
    const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
    const seconds = this.elapsedSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  /**
   * Reset the form
   */
  resetForm() {
    // Reset timer
    this.stopTimer();
    this.resetTimer();
    
    // Reset form fields
    if (this.teamSelect) this.teamSelect.value = '';
    if (this.customerSelect) this.customerSelect.value = '';
    if (this.projectSelect) this.projectSelect.value = '';
    if (this.assignmentInput) this.assignmentInput.value = '';
    if (this.notesTextarea) this.notesTextarea.value = '';
    
    // Reset hidden fields
    if (this.entryIdInput) this.entryIdInput.value = '';
    if (this.selectedTeamInput) this.selectedTeamInput.value = '';
    if (this.selectedCustomerInput) this.selectedCustomerInput.value = '';
    if (this.selectedProjectInput) this.selectedProjectInput.value = '';
    
    // Reset selection display elements
    this.updateSelectionDisplay('team', '');
    this.updateSelectionDisplay('customer', '');
    this.updateSelectionDisplay('project', '');
    this.updateSelectionDisplay('assignment', '');
    
    // Clean up and prepare for new entry
    this.currentEntryId = null;
    
    this.debugLog('Form reset');
  }
  
  /**
   * Update the display of selected elements
   */
  updateSelectionDisplay(type, value) {
    const displayElement = document.getElementById(`selected-${type}-display`);
    if (!displayElement) return;
    
    if (value) {
      const spanElement = displayElement.querySelector('span');
      if (spanElement) spanElement.textContent = value;
      displayElement.classList.add('selected');
    } else {
      const defaultTexts = {
        team: 'No team member selected',
        customer: 'No customer selected',
        project: 'No project selected',
        assignment: 'No assignment selected'
      };
      
      const spanElement = displayElement.querySelector('span');
      if (spanElement) spanElement.textContent = defaultTexts[type] || '';
      displayElement.classList.remove('selected');
    }
  }
  
  /**
   * Load an existing entry for editing
   */
  editTimeEntry(id) {
    const entry = this.timeEntries.find(entry => entry.id === id);
    if (!entry) return;
    
    // Fill form with entry data
    if (this.teamSelect) this.teamSelect.value = entry.teamMember || '';
    if (this.customerSelect) this.customerSelect.value = entry.customer || '';
    if (this.projectSelect) this.projectSelect.value = entry.project || '';
    if (this.assignmentInput) this.assignmentInput.value = entry.assignment || '';
    if (this.notesTextarea) this.notesTextarea.value = entry.notes || '';
    
    // Update hidden fields
    if (this.entryIdInput) this.entryIdInput.value = entry.id;
    if (this.selectedTeamInput) this.selectedTeamInput.value = entry.teamMember || '';
    if (this.selectedCustomerInput) this.selectedCustomerInput.value = entry.customer || '';
    if (this.selectedProjectInput) this.selectedProjectInput.value = entry.project || '';
    
    // Update selection display elements
    this.updateSelectionDisplay('team', entry.teamMember);
    this.updateSelectionDisplay('customer', entry.customer);
    this.updateSelectionDisplay('project', entry.project);
    this.updateSelectionDisplay('assignment', entry.assignment);
    
    // Set timer value from entry
    this.setTimerFromDuration(entry.duration);
    
    // Store ID of edited entry
    this.currentEntryId = entry.id;
    
    this.debugLog('Editing time entry', entry);
  }
  
  /**
   * Set the timer to a specific duration
   */
  setTimerFromDuration(durationString) {
    // Stop timer if it's running
    this.stopTimer();
    
    // Parse duration
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    
    // Format HH:MM:SS
    if (durationString && durationString.includes(':')) {
      const parts = durationString.split(':');
      if (parts.length >= 3) {
        hours = parseInt(parts[0], 10) || 0;
        minutes = parseInt(parts[1], 10) || 0;
        seconds = parseInt(parts[2], 10) || 0;
      }
    }
    
    // Calculate total seconds
    this.elapsedSeconds = hours * 3600 + minutes * 60 + seconds;
    
    // Update timer display
    this.updateTimerDisplay(hours, minutes, seconds);
  }
  
  /**
   * Delete a time entry
   */
  deleteTimeEntry(id) {
    const index = this.timeEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.timeEntries.splice(index, 1);
      // Save to central store and localStorage
      dataManager.saveTimeEntriesToLocalStorage(this.timeEntries);
      this.renderTimeEntries();
      this.debugLog(`Time entry deleted: ${id}`);
    }
  }
  
  /**
   * Toggle the billing status of an entry
   */
  toggleEntryBilledStatus(id) {
    const index = this.timeEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.timeEntries[index].billed = !this.timeEntries[index].billed;
      // Save to central store and localStorage
      dataManager.saveTimeEntriesToLocalStorage(this.timeEntries);
      this.renderTimeEntries();
      this.debugLog(`Billing status toggled for entry: ${id}`);
    }
  }
  
  /**
   * Filter entries by search term
   */
  filterBySearch(searchTerm) {
    this.searchTerm = searchTerm.toLowerCase();
    this.renderTimeEntries();
  }
  
  /**
   * Render all time entries in the table
   */
  renderTimeEntries() {
    if (!this.timeTrackerTable) return;
    
    // Clear table
    this.timeTrackerTable.innerHTML = '';
    
    // Apply filters
    let filteredEntries = this.timeEntries;
    // Filter für Teammitglied
    if (this.selectedTeamFilter && this.selectedTeamFilter !== 'ALL') {
      filteredEntries = filteredEntries.filter(entry => entry.teamMember === this.selectedTeamFilter);
    }
    // Filter for "Only unbilled"
    if (this.filterUnbilledBtn?.classList.contains('active')) {
      filteredEntries = filteredEntries.filter(entry => !entry.billed);
    }
    
    // Filter by search term
    if (this.searchTerm) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.teamMember.toLowerCase().includes(this.searchTerm) ||
        entry.customer.toLowerCase().includes(this.searchTerm) ||
        entry.project.toLowerCase().includes(this.searchTerm) ||
        entry.assignment.toLowerCase().includes(this.searchTerm) ||
        entry.notes.toLowerCase().includes(this.searchTerm)
      );
    }
    
    // Show "no entries" message if empty
    if (filteredEntries.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 8;
      emptyCell.className = 'empty-table-message';
      emptyCell.textContent = 'No time entries found.';
      emptyRow.appendChild(emptyCell);
      this.timeTrackerTable.appendChild(emptyRow);
      return;
    }
    
    // Add entries to table
    filteredEntries.forEach(entry => {
      const row = document.createElement('tr');
      
      // Data cells
      this.addCell(row, entry.teamMember);
      this.addCell(row, entry.customer);
      this.addCell(row, entry.project);
      this.addCell(row, entry.assignment || '-');
      this.addCell(row, this.formatDate(entry.startDate));
      this.addCell(row, entry.duration);
      
      // Billed status with special formatting
      const billedCell = document.createElement('td');
      billedCell.textContent = entry.billed ? 'Yes' : 'No';
      billedCell.style.color = entry.billed ? 'var(--color-green, #4CAF50)' : 'var(--color-red, #F44336)';
      row.appendChild(billedCell);
      
      // Actions
      const actionsCell = document.createElement('td');
      actionsCell.className = 'action-cell';
      
      // Edit button
      const editButton = this.createActionButton('fa-pen', () => this.editTimeEntry(entry.id));
      
      // Toggle billing status button
      const toggleBilledButton = this.createActionButton('fa-check-circle', () => this.toggleEntryBilledStatus(entry.id));
      
      // Delete button
      const deleteButton = this.createActionButton('fa-trash', () => {
        if (confirm('Are you sure you want to delete this entry?')) {
          this.deleteTimeEntry(entry.id);
        }
      });
      
      actionsCell.appendChild(editButton);
      actionsCell.appendChild(toggleBilledButton);
      actionsCell.appendChild(deleteButton);
      row.appendChild(actionsCell);
      
      this.timeTrackerTable.appendChild(row);
    });
    
    // Team-Filter-Optionen aktualisieren
    this.addTeamFilterOptions();
  }
  
  /**
   * Füllt das Team-Filter-Dropdown mit allen Teammitgliedern
   */
  addTeamFilterOptions() {
    if (!this.teamFilter) return;
    // Alle Teammitglieder aus den Einträgen sammeln
    const members = Array.from(new Set(this.timeEntries.map(e => e.teamMember).filter(Boolean)));
    // Aktuelle Auswahl merken
    const current = this.teamFilter.value;
    // Dropdown leeren
    this.teamFilter.innerHTML = '';
    // Option für alle
    const allOption = document.createElement('option');
    allOption.value = 'ALL';
    allOption.innerHTML = '&#xf007; Alle Teammitglieder'; // FontAwesome User-Icon
    this.teamFilter.appendChild(allOption);
    // Optionen für jedes Teammitglied
    members.forEach(member => {
      const opt = document.createElement('option');
      opt.value = member;
      opt.textContent = member;
      this.teamFilter.appendChild(opt);
    });
    // Auswahl wiederherstellen, falls möglich
    if (members.includes(current)) {
      this.teamFilter.value = current;
    } else {
      this.teamFilter.value = 'ALL';
    }
  }
  
  /**
   * Add a cell to a table row
   */
  addCell(row, content) {
    const cell = document.createElement('td');
    cell.textContent = content;
    row.appendChild(cell);
    return cell;
  }
  
  /**
   * Create an action button for the table
   */
  createActionButton(iconClass, clickHandler) {
    const button = document.createElement('button');
    const classNames = iconClass === 'fa-trash' ? 'delete-button' : 'edit-button';
    button.className = classNames;
    
    const icon = document.createElement('i');
    icon.className = `fa-solid ${iconClass}`;
    button.appendChild(icon);
    
    button.addEventListener('click', clickHandler);
    return button;
  }
  
  /**
   * Format a date for display
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  }
  
  /**
   * Format date to ISO format
   */
  formatDateForIso(date) {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Load time entries from localStorage via data manager
   */
  loadTimeEntries() {
    return dataManager.loadTimeEntriesFromLocalStorage();
  }
  
  /**
   * Save time entries to localStorage via data manager
   */
  saveTimeEntries() {
    dataManager.saveTimeEntriesToLocalStorage(this.timeEntries);
  }
  
  /**
   * Generate a unique ID for new entries
   */
  generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  }
  
  /**
   * Debug logger with timestamp
   */
  debugLog(message, data = null) {
    if (!this.debug) return;
    
    const timestamp = new Date().toISOString().substr(11, 12);
    if (data) {
      console.log(`[${timestamp}] ${message}`, data);
    } else {
      console.log(`[${timestamp}] ${message}`);
    }
  }
}

// Initialize TimeTracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.timeTracker = new TimeTracker();
});