/**
 * TeamView - Functionality for Team Overview tab
 * This file handles the display of team data and time entries in the Team tab
 */

// Import data manager to access the central store
const dataManager = require('./scripts/modules/data-manager');
const appState = require('./scripts/modules/app-state');

class TeamView {
  /**
   * Initialize the TeamView
   */
  constructor() {
    // Use entries from central store
    this.timeEntries = appState.centralStore.timeEntries;
    
    // Reference DOM elements
    this.initDomElements();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Render time entries table
    this.renderTeamStats();
    this.renderTeamTimeEntries();
  }
  
  /**
   * Reference all required DOM elements in the Team tab
   */
  initDomElements() {
    // Team stats table
    this.teamStatsTable = document.querySelector('#team-stats-table tbody');
    
    // Team time entries table
    this.teamTimeTrackerTable = document.querySelector('#team-time-tracker-table tbody');
    this.teamSortDateBtn = document.getElementById('team-sort-date-button');
    this.teamFilterUnbilledBtn = document.getElementById('team-filter-unbilled-button');
  }
  
  /**
   * Set up event listeners for Team tab
   */
  setupEventListeners() {
    // Sort by date
    if (this.teamSortDateBtn) {
      this.teamSortDateBtn.addEventListener('click', () => {
        this.timeEntries.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        this.renderTeamTimeEntries();
      });
    }
    
    // Filter unbilled entries
    if (this.teamFilterUnbilledBtn) {
      this.teamFilterUnbilledBtn.addEventListener('click', () => {
        this.teamFilterUnbilledBtn.classList.toggle('active');
        this.renderTeamTimeEntries();
      });
    }
  }
  
  /**
   * Render team statistics summary
   */
  renderTeamStats() {
    if (!this.teamStatsTable) return;
    
    // Clear table
    this.teamStatsTable.innerHTML = '';
    
    // Get team stats
    const teamStats = this.calculateTeamStats();
    
    // Add team stats rows
    Object.entries(teamStats).forEach(([teamMember, stats]) => {
      const row = document.createElement('tr');
      
      // Team member name
      const nameCell = document.createElement('td');
      nameCell.textContent = teamMember;
      nameCell.className = 'team-name';
      row.appendChild(nameCell);
      
      // Unbilled hours
      const unbilledCell = document.createElement('td');
      unbilledCell.textContent = this.formatDuration(stats.unbilled);
      unbilledCell.className = 'unbilled-time';
      row.appendChild(unbilledCell);
      
      // Billed hours
      const billedCell = document.createElement('td');
      billedCell.textContent = this.formatDuration(stats.billed);
      billedCell.className = 'billed-time';
      row.appendChild(billedCell);
      
      // Total hours
      const totalCell = document.createElement('td');
      totalCell.textContent = this.formatDuration(stats.total);
      totalCell.className = 'total-time';
      row.appendChild(totalCell);
      
      this.teamStatsTable.appendChild(row);
    });
  }
  
  /**
   * Calculate team stats from time entries
   */
  calculateTeamStats() {
    const stats = {};
    
    // Process all entries
    this.timeEntries.forEach(entry => {
      const teamMember = entry.teamMember;
      
      // Skip entries with no team member
      if (!teamMember) return;
      
      // Initialize stats for this team member if needed
      if (!stats[teamMember]) {
        stats[teamMember] = {
          billed: 0,
          unbilled: 0,
          total: 0
        };
      }
      
      // Parse duration format (HH:MM:SS)
      const seconds = this.parseDuration(entry.duration);
      
      // Add to stats
      if (entry.billed) {
        stats[teamMember].billed += seconds;
      } else {
        stats[teamMember].unbilled += seconds;
      }
      stats[teamMember].total += seconds;
    });
    
    return stats;
  }
  
  /**
   * Parse duration string (HH:MM:SS) to seconds
   */
  parseDuration(durationString) {
    if (!durationString) return 0;
    
    const parts = durationString.split(':');
    if (parts.length < 3) return 0;
    
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  /**
   * Format seconds to HH:MM:SS
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  
  /**
   * Render all time entries in the team table
   */
  renderTeamTimeEntries() {
    if (!this.teamTimeTrackerTable) return;
    
    // Clear table
    this.teamTimeTrackerTable.innerHTML = '';
    
    // Apply filters
    let filteredEntries = [...this.timeEntries];
    
    // Filter for "Only unbilled"
    if (this.teamFilterUnbilledBtn?.classList.contains('active')) {
      filteredEntries = filteredEntries.filter(entry => !entry.billed);
    }
    
    // Show "no entries" message if empty
    if (filteredEntries.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 8;
      emptyCell.className = 'empty-table-message';
      emptyCell.textContent = 'Keine Zeiteinträge gefunden.';
      emptyRow.appendChild(emptyCell);
      this.teamTimeTrackerTable.appendChild(emptyRow);
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
      billedCell.textContent = entry.billed ? 'Ja' : 'Nein';
      billedCell.style.color = entry.billed ? 'var(--color-green, #4CAF50)' : 'var(--color-red, #F44336)';
      row.appendChild(billedCell);
      
      // Actions
      const actionsCell = document.createElement('td');
      actionsCell.className = 'action-cell';
      
      // Toggle billing status button
      const toggleBilledButton = document.createElement('button');
      toggleBilledButton.className = 'edit-button';
      const toggleIcon = document.createElement('i');
      toggleIcon.className = 'fa-solid fa-check-circle';
      toggleBilledButton.appendChild(toggleIcon);
      toggleBilledButton.addEventListener('click', () => this.toggleEntryBilledStatus(entry.id));
      
      actionsCell.appendChild(toggleBilledButton);
      row.appendChild(actionsCell);
      
      this.teamTimeTrackerTable.appendChild(row);
    });
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
   * Toggle the billing status of an entry
   */
  toggleEntryBilledStatus(id) {
    const index = this.timeEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.timeEntries[index].billed = !this.timeEntries[index].billed;
      // Save to central store and localStorage
      dataManager.saveTimeEntriesToLocalStorage(this.timeEntries);
      // Re-render both tables
      this.renderTeamStats();
      this.renderTeamTimeEntries();
      console.log(`Billing status toggled for entry: ${id}`);
    }
  }
  
  /**
   * Format a date for display
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  }
}

// Initialize TeamView when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.teamView = new TeamView();
});