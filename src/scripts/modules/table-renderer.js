/**
 * Table renderer module for TimeTracker
 * Handles table creation and rendering functions
 */

const appState = require('./app-state');
const dataManager = require('./data-manager');
const utils = require('./utils');

/**
 * Render data table with CSV data
 */
function renderDataTable(dateColumns) {
  const { startDateIdx, endDateIdx, showCombinedDate } = dateColumns;
  const appDiv = document.getElementById('app');
  
  appDiv.innerHTML = '';
  
  const table = document.createElement('table');
  table.classList.add('filterable-table');
  
  const headerRow = createTableHeaders(showCombinedDate, startDateIdx, endDateIdx);
  table.appendChild(headerRow);

  appState.csvData.rows.forEach(row => {
    const tableRow = createTableRow(row, showCombinedDate, startDateIdx, endDateIdx);
    table.appendChild(tableRow);
  });

  appDiv.appendChild(table);
}

/**
 * Create table header row
 */
function createTableHeaders(showCombinedDate, startDateIdx, endDateIdx) {
  const headerRow = document.createElement('tr');
  
  appState.csvData.headers.forEach((header, index) => {
    if (showCombinedDate && (index === startDateIdx || index === endDateIdx)) {
      return;
    }
    
    const th = document.createElement('th');
    th.textContent = header;
    th.style.cursor = 'pointer';
    
    th.addEventListener('click', (event) => {
      const table = event.target.closest('table');
      sortTable(table, index);
    });
    
    headerRow.appendChild(th);
  });
  
  return headerRow;
}

/**
 * Create table row from data
 */
function createTableRow(rowData, showCombinedDate, startDateIdx, endDateIdx) {
  const tr = document.createElement('tr');
  const durationIdx = dataManager.findDurationColumnIndex();
  const billedColIdx = dataManager.findColumnIndex('abgerechnet');
  
  // Store the mapping from original column indices to visible column indices
  const columnMapping = {};
  let visibleIndex = 0;
  
  rowData.forEach((cell, index) => {
    if (showCombinedDate && (index === startDateIdx || index === endDateIdx)) {
      return;
    }
    
    // Map the original index to the visible index
    columnMapping[index] = visibleIndex++;
    
    const td = document.createElement('td');
    let cellContent = cell.replace(/"/g, '');
    
    // Special handling for duration column
    if (index === durationIdx) {
      cellContent = utils.formatDurationToHHMM(cellContent);
    }
    
    // Special handling for billed status column
    if (index === billedColIdx) {
      const billedStatus = cellContent.trim().toLowerCase();
      const isBilled = (billedStatus === 'ja' || billedStatus === 'yes' || billedStatus === 'true' || billedStatus === '1');
      
      if (isBilled) {
        td.textContent = 'Abgerechnet';
        td.style.color = 'var(--color-green)';
        td.style.fontWeight = 'bold';
      } else {
        td.textContent = 'Nicht Abgerechnet';
        td.style.color = 'var(--color-red)';
        td.style.fontWeight = 'bold';
      }
    } else {
      td.textContent = cellContent;
    }
    
    // Store the original column index in a data attribute
    td.setAttribute('data-original-col', index);
    
    tr.appendChild(td);
  });
  
  if (showCombinedDate && rowData[startDateIdx]) {
    const td = document.createElement('td');
    td.textContent = rowData[startDateIdx].replace(/"/g, '');
    tr.appendChild(td);
  }
  
  return tr;
}

/**
 * Sort table by column
 */
function sortTable(table, columnIndex) {
  const headerRow = table.querySelector('tr');
  const headers = Array.from(headerRow.querySelectorAll('th'));
  const currentHeader = headers[columnIndex];
  
  const ascending = currentHeader.getAttribute('data-sort') !== 'asc';
  
  headers.forEach(header => header.removeAttribute('data-sort'));
  
  currentHeader.setAttribute('data-sort', ascending ? 'asc' : 'desc');
  currentHeader.classList.add(ascending ? 'sorted-asc' : 'sorted-desc');
  
  const rowsArray = Array.from(table.querySelectorAll('tr')).slice(1);
  
  const sortedRows = rowsArray.sort((a, b) => {
    let aValue = a.children[columnIndex]?.textContent || '';
    let bValue = b.children[columnIndex]?.textContent || '';
    
    const aNum = Number(aValue);
    const bNum = Number(bValue);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return ascending ? aNum - bNum : bNum - aNum;
    }
    
    return ascending ? 
      aValue.localeCompare(bValue) : 
      bValue.localeCompare(aValue);
  });
  
  sortedRows.forEach(row => table.appendChild(row));
}

/**
 * Calculate and update team member time statistics
 */
function calculateTeamMemberTimeStatistics() {
  const teamColIdx = dataManager.findColumnIndex('team') !== -1 ? dataManager.findColumnIndex('team') : 0;
  const billedColIdx = dataManager.findColumnIndex('abgerechnet') !== -1 ? dataManager.findColumnIndex('abgerechnet') : -1;
  const durationColIdx = dataManager.findDurationColumnIndex();
  
  if (durationColIdx === -1) return;
  
  // Get all unique team members
  const teamMembers = dataManager.extractUniqueValues(teamColIdx);
  
  // Create a stats object for each team member
  const teamStats = {};
  
  // Initialize with empty stats for each team member
  teamMembers.forEach(member => {
    teamStats[member] = {
      billedTime: 0,
      unbilledTime: 0,
      totalTime: 0
    };
  });
  
  // Add an "All" category for total stats
  teamStats['__total__'] = {
    billedTime: 0,
    unbilledTime: 0,
    totalTime: 0
  };
  
  // Filter rows based on current project filter
  const projectValue = appState.filters.project;
  const projectColIdx = dataManager.findColumnIndex('projekt') !== -1 ? dataManager.findColumnIndex('projekt') : 2;
  
  appState.csvData.rows.forEach(row => {
    // Skip if row doesn't match project filter
    if (projectValue && projectColIdx !== -1 && row[projectColIdx] && 
        row[projectColIdx].replace(/"/g, '').trim() !== projectValue) {
      return;
    }
    
    // Get team member name
    const teamMemberName = row[teamColIdx] ? row[teamColIdx].replace(/"/g, '').trim() : 'Unknown';
    
    // Calculate duration in minutes
    const durationStr = row[durationColIdx]?.replace(/"/g, '') || '';
    const durationMinutes = utils.parseDurationToMinutes(durationStr);
    
    if (durationMinutes > 0) {
      // Check if billed or not
      let isBilled = false;
      
      if (billedColIdx !== -1 && row[billedColIdx]) {
        const billedStatus = row[billedColIdx].replace(/"/g, '').trim().toLowerCase();
        isBilled = (billedStatus === 'ja' || billedStatus === 'yes' || billedStatus === 'true' || billedStatus === '1');
      }
      
      // Update stats for specific team member
      if (teamStats[teamMemberName]) {
        if (isBilled) {
          teamStats[teamMemberName].billedTime += durationMinutes;
        } else {
          teamStats[teamMemberName].unbilledTime += durationMinutes;
        }
        teamStats[teamMemberName].totalTime += durationMinutes;
      }
      
      // Update total stats
      if (isBilled) {
        teamStats['__total__'].billedTime += durationMinutes;
      } else {
        teamStats['__total__'].unbilledTime += durationMinutes;
      }
      teamStats['__total__'].totalTime += durationMinutes;
    }
  });
  
  // Update the UI with calculated stats
  updateTeamStatsTable(teamStats);
}

/**
 * Update team stats table with calculated statistics
 */
function updateTeamStatsTable(teamStats) {
  const tableBody = document.querySelector('#team-stats-table tbody');
  if (!tableBody) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add event listeners to table headers for sorting
  const tableHeaders = document.querySelectorAll('#team-stats-table th');
  tableHeaders.forEach((header, index) => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      sortTeamStatsTable(index);
    });
  });
  
  // Get all team members (excluding the total)
  const teamMembers = Object.keys(teamStats).filter(key => key !== '__total__').sort();
  
  // Add rows for each team member
  teamMembers.forEach(member => {
    const stats = teamStats[member];
    const row = document.createElement('tr');
    
    // Team member name
    const nameCell = document.createElement('td');
    nameCell.textContent = member;
    nameCell.className = 'team-name';
    row.appendChild(nameCell);
    
    // Unbilled time
    const unbilledCell = document.createElement('td');
    unbilledCell.textContent = utils.formatMinutesToHHMM(stats.unbilledTime);
    unbilledCell.className = 'unbilled-time';
    unbilledCell.setAttribute('data-value', stats.unbilledTime);
    row.appendChild(unbilledCell);
    
    // Billed time
    const billedCell = document.createElement('td');
    billedCell.textContent = utils.formatMinutesToHHMM(stats.billedTime);
    billedCell.className = 'billed-time';
    billedCell.setAttribute('data-value', stats.billedTime);
    row.appendChild(billedCell);
    
    // Total time
    const totalCell = document.createElement('td');
    totalCell.textContent = utils.formatMinutesToHHMM(stats.totalTime);
    totalCell.className = 'total-time';
    totalCell.setAttribute('data-value', stats.totalTime);
    row.appendChild(totalCell);
    
    tableBody.appendChild(row);
  });
  
  // Add total row if there's more than one team member
  if (teamMembers.length > 1) {
    const totalStats = teamStats['__total__'];
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    
    // Total label
    const labelCell = document.createElement('td');
    labelCell.textContent = 'Gesamt';
    labelCell.style.fontWeight = 'bold';
    totalRow.appendChild(labelCell);
    
    // Total unbilled time
    const totalUnbilledCell = document.createElement('td');
    totalUnbilledCell.textContent = utils.formatMinutesToHHMM(totalStats.unbilledTime);
    totalUnbilledCell.className = 'unbilled-time';
    totalUnbilledCell.style.fontWeight = 'bold';
    totalUnbilledCell.setAttribute('data-value', totalStats.unbilledTime);
    totalRow.appendChild(totalUnbilledCell);
    
    // Total billed time
    const totalBilledCell = document.createElement('td');
    totalBilledCell.textContent = utils.formatMinutesToHHMM(totalStats.billedTime);
    totalBilledCell.className = 'billed-time';
    totalBilledCell.style.fontWeight = 'bold';
    totalBilledCell.setAttribute('data-value', totalStats.billedTime);
    totalRow.appendChild(totalBilledCell);
    
    // Grand total time
    const grandTotalCell = document.createElement('td');
    grandTotalCell.textContent = utils.formatMinutesToHHMM(totalStats.totalTime);
    grandTotalCell.className = 'total-time';
    grandTotalCell.style.fontWeight = 'bold';
    grandTotalCell.setAttribute('data-value', totalStats.totalTime);
    totalRow.appendChild(grandTotalCell);
    
    tableBody.appendChild(totalRow);
  }
}

/**
 * Sort the team statistics table
 */
function sortTeamStatsTable(columnIndex) {
  const table = document.getElementById('team-stats-table');
  if (!table) return;
  
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr:not(.total-row)'));
  
  // Get the table header
  const theader = table.querySelector('th:nth-child(' + (columnIndex + 1) + ')');
  
  // Determine sort direction
  const ascending = theader.getAttribute('data-sort') !== 'asc';
  
  // Clear all sort indicators
  table.querySelectorAll('th').forEach(th => {
    th.removeAttribute('data-sort');
    th.classList.remove('sorted-asc', 'sorted-desc');
  });
  
  // Set sort indicator on current header
  theader.setAttribute('data-sort', ascending ? 'asc' : 'desc');
  theader.classList.add(ascending ? 'sorted-asc' : 'sorted-desc');
  
  // Sort the rows
  rows.sort((a, b) => {
    let aValue, bValue;
    
    if (columnIndex === 0) {
      // Sort by name
      aValue = a.querySelector('.team-name').textContent;
      bValue = b.querySelector('.team-name').textContent;
      return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      // Sort by time (stored as minutes in the data-value attribute)
      const aCell = a.querySelector(`td:nth-child(${columnIndex + 1})`);
      const bCell = b.querySelector(`td:nth-child(${columnIndex + 1})`);
      
      aValue = parseInt(aCell.getAttribute('data-value') || '0', 10);
      bValue = parseInt(bCell.getAttribute('data-value') || '0', 10);
      
      return ascending ? aValue - bValue : bValue - aValue;
    }
  });
  
  // Remove all rows except total row
  const totalRow = tbody.querySelector('.total-row');
  if (totalRow) {
    totalRow.remove();
  }
  
  // Re-append rows in sorted order
  tbody.innerHTML = '';
  rows.forEach(row => tbody.appendChild(row));
  
  // Re-append total row at the end if it exists
  if (totalRow) {
    tbody.appendChild(totalRow);
  }
}

/**
 * Render time entries in the team tab
 * This displays the same time entries as in the time tracker tab
 */
function renderTeamTimeEntries() {
  const tableBody = document.getElementById('team-entries-table-body');
  const filterUnbilledBtn = document.getElementById('team-filter-unbilled-button');
  if (!tableBody) return;
  
  // Clear table
  tableBody.innerHTML = '';
  
  // Get entries from central store
  const timeEntries = appState.centralStore.timeEntries || [];
  
  // Apply filters
  let filteredEntries = timeEntries;
  
  // Filter for "Only unbilled" if active
  if (filterUnbilledBtn?.classList.contains('active')) {
    filteredEntries = filteredEntries.filter(entry => !entry.billed);
  }
  
  // Show "no entries" message if empty
  if (filteredEntries.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 8;
    emptyCell.className = 'empty-table-message';
    emptyCell.textContent = 'Keine Zeiterfassungen gefunden.';
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
    return;
  }
  
  // Add entries to table
  filteredEntries.forEach(entry => {
    const row = document.createElement('tr');
    
    // Data cells
    addCell(row, entry.teamMember);
    addCell(row, entry.customer);
    addCell(row, entry.project);
    addCell(row, entry.assignment || '-');
    addCell(row, utils.formatDate(entry.startDate));
    addCell(row, entry.duration);
    
    // Billed status with special formatting
    const billedCell = document.createElement('td');
    if (entry.billed) {
      billedCell.textContent = 'Ja';
      billedCell.style.color = 'var(--color-green)';
    } else {
      billedCell.textContent = 'Nein';
      billedCell.style.color = 'var(--color-red)';
    }
    row.appendChild(billedCell);
    
    // Actions
    const actionsCell = document.createElement('td');
    actionsCell.className = 'action-cell';
    
    // View details button
    const viewButton = createActionButton('fa-eye', () => {
      // Switch to Time Tracker tab and edit the entry
      const timeTrackerTab = document.querySelector('.sidebar-tab-button[data-tab="tab1"]');
      if (timeTrackerTab) {
        // Activate time tracker tab
        document.querySelectorAll('.sidebar-tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        timeTrackerTab.classList.add('active');
        document.getElementById('tab1').classList.add('active');
        
        // Edit entry in time tracker
        if (window.timeTracker && typeof window.timeTracker.editTimeEntry === 'function') {
          window.timeTracker.editTimeEntry(entry.id);
        }
      }
    });
    
    // Toggle billing status button
    const toggleBilledButton = createActionButton('fa-check-circle', () => {
      toggleEntryBilledStatus(entry.id);
    });
    
    actionsCell.appendChild(viewButton);
    actionsCell.appendChild(toggleBilledButton);
    row.appendChild(actionsCell);
    
    tableBody.appendChild(row);
  });
}

/**
 * Toggle the billing status of an entry and update all views
 */
function toggleEntryBilledStatus(id) {
  // Update in central store
  if (appState.centralStore.timeEntries) {
    const index = appState.centralStore.timeEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      appState.centralStore.timeEntries[index].billed = !appState.centralStore.timeEntries[index].billed;
      
      // Save to localStorage
      dataManager.saveTimeEntriesToLocalStorage();
      
      // Update all views
      renderTeamTimeEntries();
      
      // Update team stats
      calculateTeamMemberTimeStatistics();
      
      // If TimeTracker has been initialized, update its view too
      if (window.timeTracker && typeof window.timeTracker.renderTimeEntries === 'function') {
        window.timeTracker.renderTimeEntries();
      }
    }
  }
}

/**
 * Helper function to add a cell to a row
 */
function addCell(row, content) {
  const cell = document.createElement('td');
  cell.textContent = content;
  row.appendChild(cell);
  return cell;
}

/**
 * Helper function to create an action button
 */
function createActionButton(iconClass, clickHandler) {
  const button = document.createElement('button');
  const classNames = iconClass === 'fa-trash' ? 'delete-button' : 'edit-button';
  button.className = classNames;
  
  const icon = document.createElement('i');
  icon.className = `fa-solid ${iconClass}`;
  button.appendChild(icon);
  
  button.addEventListener('click', clickHandler);
  return button;
}

// Add new exports
module.exports = {
  renderDataTable,
  calculateTeamMemberTimeStatistics,
  updateTeamStatsTable,
  sortTeamStatsTable,
  sortTable,
  renderTeamTimeEntries,
  toggleEntryBilledStatus
};