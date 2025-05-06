/**
 * TimeTracker - Main renderer process
 * Handles CSV data loading, UI setup and user interactions
 */

const fs = require('fs');
const path = require('path');

/**
 * Application state management
 */
const appState = {
  csvData: {
    headers: [],
    rows: []
  },
  filters: {
    teamMember: '',
    project: '',
    customer: ''
  },
  sidebarCollapsed: false
};

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupTimeTracker(); // Initialize the time tracker functionality
});

/**
 * Main application initialization function
 * Sets up all UI elements and loads data
 */
function initializeApp() {
  setupTabs();
  setupSidebarToggle();
  setupEditableCells();
  loadCsvData();
  setupFilterEvents();
  setupSearchFunction();
  
  // Uncomment to enable theme switching
  // setupThemeSwitch();
}

function setupThemeSwitch() {
  const themeSwitch = document.getElementById('checkbox');
  
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'light') {
      themeSwitch.checked = true;
    }
  }
  
  themeSwitch.addEventListener('change', function() {
    if (this.checked) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    }
  });
}

function setupSidebarToggle() {
  const burgerMenu = document.getElementById('burger-menu');
  const sidebar = document.getElementById('sidebar');
  
  const sidebarState = localStorage.getItem('sidebarCollapsed');
  if (sidebarState === 'true') {
    sidebar.classList.add('collapsed');
    appState.sidebarCollapsed = true;
  }
  
  burgerMenu.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    appState.sidebarCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', appState.sidebarCollapsed);
  });
}

function setupTabs() {
  // Jetzt benutzen wir die sidebar-tab-buttons anstelle der alten tab-buttons
  const tabButtons = document.querySelectorAll('.sidebar-tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      const tabId = button.getAttribute('data-tab');
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

function setupFilterEvents() {
  const teamMemberFilter = document.getElementById('team-member-filter');
  const projectFilter = document.getElementById('project-filter');
  const applyFiltersBtn = document.getElementById('apply-filters');
  const resetFiltersBtn = document.getElementById('reset-filters');

  if (applyFiltersBtn) {
    applyFiltersBtn.style.display = 'none';
  }

  teamMemberFilter.addEventListener('change', () => {
    appState.filters.teamMember = teamMemberFilter.value;
    applyFilters();
  });

  projectFilter.addEventListener('change', () => {
    appState.filters.project = projectFilter.value;
    applyFilters();
  });

  resetFiltersBtn.addEventListener('click', () => {
    teamMemberFilter.value = '';
    projectFilter.value = '';
    appState.filters.teamMember = '';
    appState.filters.project = '';
    applyFilters();
  });
}

function loadCsvData() {
  const csvFilePath = path.join(__dirname, '../data/example_csv_time.csv');
  let csvContent;
  
  try {
    csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    console.log('CSV file loaded successfully');
    processCsvData(csvContent);
  } catch (err) {
    console.error('Error loading CSV file:', err);
    document.getElementById('app').innerHTML = `<p>Error loading CSV file: ${err.message}</p>`;
  }
}

function processCsvData(csvContent) {
  if (!csvContent) return;
  
  const rows = csvContent.split('\n')
    .filter(row => row.trim())
    .map(row => row.split(','));
    
  const headers = rows.shift();
  
  appState.csvData.headers = headers.map(h => h.replace(/"/g, ''));
  appState.csvData.rows = rows;

  const dateColumns = findDateColumns();
  
  renderDataTable(dateColumns);
  
  populateFilterOptions();
  populateCategoryDropdowns(); // Add this line to populate our dropdowns
  calculateTeamMemberTimeStatistics();
  populateFibuTimesRow();
}

function findDateColumns() {
  const startDateIdx = appState.csvData.headers.findIndex(header => 
    header.toLowerCase().includes('start date'));
  const endDateIdx = appState.csvData.headers.findIndex(header => 
    header.toLowerCase().includes('end date'));
  
  const showCombinedDate = startDateIdx !== -1 && endDateIdx !== -1;
  if (showCombinedDate) {
    appState.csvData.headers.push('Bearbeitungsdatum');
  }
  
  return {
    startDateIdx,
    endDateIdx,
    showCombinedDate
  };
}

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

function createTableRow(rowData, showCombinedDate, startDateIdx, endDateIdx) {
  const tr = document.createElement('tr');
  const durationIdx = findDurationColumnIndex();
  const billedColIdx = findColumnIndex('abgerechnet');
  
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
      cellContent = formatDurationToHHMM(cellContent);
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

function populateFilterOptions() {
  const teamMemberFilter = document.getElementById('team-member-filter');
  const projectFilter = document.getElementById('project-filter');
  
  if (!teamMemberFilter || !projectFilter) return;
  
  const teamColIdx = findColumnIndex('team') !== -1 ? findColumnIndex('team') : 0;
  const projectColIdx = findColumnIndex('projekt') !== -1 ? findColumnIndex('projekt') : 2;
  
  console.log('Team column index:', teamColIdx, 'Column name:', appState.csvData.headers[teamColIdx]);
  console.log('Project column index:', projectColIdx, 'Column name:', appState.csvData.headers[projectColIdx]);
  
  clearOptions(teamMemberFilter);
  clearOptions(projectFilter);
  
  if (teamColIdx !== -1) {
    const uniqueTeamMembers = extractUniqueValues(teamColIdx);
    console.log('Unique team members:', uniqueTeamMembers);
    populateSelectOptions(teamMemberFilter, uniqueTeamMembers);
  }
  
  if (projectColIdx !== -1) {
    const uniqueProjects = extractUniqueValues(projectColIdx);
    console.log('Unique projects:', uniqueProjects);
    populateSelectOptions(projectFilter, uniqueProjects);
  }
}

function findColumnIndex(keyword) {
  return appState.csvData.headers.findIndex(header => 
    header.toLowerCase().includes(keyword.toLowerCase()));
}

function clearOptions(selectElement) {
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }
}

function extractUniqueValues(columnIndex) {
  return [...new Set(
    appState.csvData.rows
      .map(row => row[columnIndex] ? row[columnIndex].replace(/"/g, '').trim() : null)
      .filter(Boolean)
  )].sort();
}

function populateSelectOptions(selectElement, values) {
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  });
}

function applyFilters() {
  const tables = document.querySelectorAll('.filterable-table');
  if (!tables.length) return;

  const teamMemberValue = appState.filters.teamMember;
  const projectValue = appState.filters.project;
  const searchQuery = document.getElementById('sidebar-search')?.value.trim().toLowerCase() || '';

    tables.forEach(table => {
    // Check table type and apply appropriate filter logic
    if (table.id === 'team-stats-table') {
      filterStatsTable(table, teamMemberValue, searchQuery);
    } else {
      filterDataTable(table, teamMemberValue, projectValue, searchQuery);
    }
  });
}

function filterStatsTable(table, teamMemberValue, searchQuery) {
  const rows = table.querySelectorAll('tbody tr');
  
  rows.forEach(row => {
    const teamMemberCell = row.querySelector('td:first-child');
    if (!teamMemberCell) return;
    
    const teamMemberName = teamMemberCell.textContent.trim();
    let showRow = true;
    
    // Apply team member filter
    if (teamMemberValue) {
      showRow = teamMemberName === teamMemberValue;
    }
    
    // Apply search filter
    if (showRow && searchQuery) {
      showRow = row.textContent.toLowerCase().includes(searchQuery);
    }
    
    row.style.display = showRow ? '' : 'none';
  });
}

function filterDataTable(table, teamMemberValue, projectValue, searchQuery) {
  const teamColIdx = findColumnIndex('team') !== -1 ? findColumnIndex('team') : 0;
  const projectColIdx = findColumnIndex('projekt') !== -1 ? findColumnIndex('projekt') : 2;
  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, index) => {
    if (index === 0) return;
    
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length === 0) return;
    
    let showRow = true;
    
    if (teamMemberValue && teamColIdx !== -1 && teamColIdx < cells.length) {
      const cellValue = cells[teamColIdx].textContent.trim();
          showRow = showRow && (cellValue === teamMemberValue);
    }
    
    if (projectValue && projectColIdx !== -1 && projectColIdx < cells.length) {
      const cellValue = cells[projectColIdx].textContent.trim();
          showRow = showRow && (cellValue === projectValue);
    }
    
    if (searchQuery) {
      const matchesText = cells.some(cell => 
        cell.textContent.toLowerCase().includes(searchQuery)
      );
      showRow = showRow && (matchesText);
    }
    
    row.style.display = showRow ? '' : 'none';
  });  
}

function setupSearchFunction() {
  const sidebarSearchInput = document.getElementById('sidebar-search');
  if (!sidebarSearchInput) return;
  
  sidebarSearchInput.addEventListener('input', (event) => {
    const query = event.target.value.trim();
    const table = document.querySelector('table');
    
    if (table) {
      searchTableContent(table, query);
    }
  });
}

function searchTableContent(table, query) {
  if (!query) {
    applyFilters();
    return;
  }

  const lowerQuery = query.toLowerCase();
  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, index) => {
    if (index === 0) return;
    
    const cells = Array.from(row.querySelectorAll('td'));
    const matchesText = cells.some(cell => 
      cell.textContent.toLowerCase().includes(lowerQuery)
    );
    
    const notesIdx = findColumnIndex('notiz');
    const matchesNotes = notesIdx !== -1 && cells[notesIdx] && 
                        cells[notesIdx].textContent.toLowerCase().includes(lowerQuery);
    
    row.style.display = (matchesText || matchesNotes) ? '' : 'none';
  });
}

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

function formatDurationToHHMM(durationString) {
  const regex = /(\d+)h\s*(\d+)m(?:\s*\d+s)?/;
  const match = durationString.match(regex);
  
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2].padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  return durationString;
}

function findDurationColumnIndex() {
  return appState.csvData.headers.findIndex(header => 
    header.toLowerCase().includes('dauer') || header.toLowerCase().includes('duration'));
}

function calculateTeamMemberTimeStatistics() {
  const teamColIdx = findColumnIndex('team') !== -1 ? findColumnIndex('team') : 0;
  const billedColIdx = findColumnIndex('abgerechnet') !== -1 ? findColumnIndex('abgerechnet') : -1;
  const durationColIdx = findDurationColumnIndex();
  
  if (durationColIdx === -1) return;
  
  // Get all unique team members
  const teamMembers = extractUniqueValues(teamColIdx);
  
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
  const projectColIdx = findColumnIndex('projekt') !== -1 ? findColumnIndex('projekt') : 2;
  
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
    const durationMinutes = parseDurationToMinutes(durationStr);
    
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
    unbilledCell.textContent = formatMinutesToHHMM(stats.unbilledTime);
    unbilledCell.className = 'unbilled-time';
    unbilledCell.setAttribute('data-value', stats.unbilledTime);
    row.appendChild(unbilledCell);
    
    // Billed time
    const billedCell = document.createElement('td');
    billedCell.textContent = formatMinutesToHHMM(stats.billedTime);
    billedCell.className = 'billed-time';
    billedCell.setAttribute('data-value', stats.billedTime);
    row.appendChild(billedCell);
    
    // Total time
    const totalCell = document.createElement('td');
    totalCell.textContent = formatMinutesToHHMM(stats.totalTime);
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
    totalUnbilledCell.textContent = formatMinutesToHHMM(totalStats.unbilledTime);
    totalUnbilledCell.className = 'unbilled-time';
    totalUnbilledCell.style.fontWeight = 'bold';
    totalUnbilledCell.setAttribute('data-value', totalStats.unbilledTime);
    totalRow.appendChild(totalUnbilledCell);
    
    // Total billed time
    const totalBilledCell = document.createElement('td');
    totalBilledCell.textContent = formatMinutesToHHMM(totalStats.billedTime);
    totalBilledCell.className = 'billed-time';
    totalBilledCell.style.fontWeight = 'bold';
    totalBilledCell.setAttribute('data-value', totalStats.billedTime);
    totalRow.appendChild(totalBilledCell);
    
    // Grand total time
    const grandTotalCell = document.createElement('td');
    grandTotalCell.textContent = formatMinutesToHHMM(totalStats.totalTime);
    grandTotalCell.className = 'total-time';
    grandTotalCell.style.fontWeight = 'bold';
    grandTotalCell.setAttribute('data-value', totalStats.totalTime);
    totalRow.appendChild(grandTotalCell);
    
    tableBody.appendChild(totalRow);
  }
}

function updateTeamMemberName(teamMemberValue) {
  const element = document.getElementById('summary-team-member');
  if (element) {
    element.textContent = teamMemberValue || 'Alle Teammitglieder';
  }
}

function parseDurationToMinutes(durationStr) {
  let totalMinutes = 0;
  
  const hoursMatch = durationStr.match(/(\d+)h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1], 10) * 60;
  }
  
  const minutesMatch = durationStr.match(/(\d+)m/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1], 10);
  }
  
  // Seconds are rounded to the nearest minute
  const secondsMatch = durationStr.match(/(\d+)s/);
  if (secondsMatch) {
    totalMinutes += Math.round(parseInt(secondsMatch[1], 10) / 60);
  }
  
  return totalMinutes;
}

function formatMinutesToHHMM(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

function calculateAverageHourlyWage() {
  const fibuTable = document.querySelector('.fibu-table');
  if (!fibuTable) return;

  // Find fee row (Honorar)
  const feeRow = Array.from(fibuTable.querySelectorAll('tbody tr')).find(row => 
    row.cells[0].textContent.trim() === 'Honorar');
  
  // Find billed hours row
  const billedHoursRow = Array.from(fibuTable.querySelectorAll('tbody tr')).find(row => 
    row.cells[0].textContent.trim() === 'Abgerechnete Stunden');
  
  // Find average hourly wage row
  const avgWageRow = Array.from(fibuTable.querySelectorAll('tbody tr')).find(row => 
    row.cells[0].textContent.trim() === 'Durchschnittlicher Stundenlohn');
    
  // Find times row
  const timesRow = Array.from(fibuTable.querySelectorAll('tbody tr')).find(row => 
    row.cells[0].textContent.trim() === 'Zeiten');
    
  // Find exact fee row (Genaues Honorar)
  const exactFeeRow = Array.from(fibuTable.querySelectorAll('tbody tr')).find(row => 
    row.cells[0].textContent.trim() === 'Genaues Honorar');
    
  // Find deviation row (Abweichungen)
  const deviationRow = Array.from(fibuTable.querySelectorAll('tbody tr')).find(row => 
    row.cells[0].textContent.trim() === 'Abweichungen');
  
  if (!feeRow || !billedHoursRow || !avgWageRow || !timesRow || !exactFeeRow || !deviationRow) return;
  
  // Loop through each month (columns)
  for (let i = 1; i < feeRow.cells.length; i++) {
    const feeInput = feeRow.cells[i].querySelector('input');
    const hoursInput = billedHoursRow.cells[i].querySelector('input');
    
    // Clear the average hourly wage cell initially (no placeholder)
    avgWageRow.cells[i].textContent = '';
    
    // Calculate average hourly wage, exact fee and deviation whenever fee or hours input changes
    const calculateWage = () => {
      const fee = parseFloat(feeInput.value.replace(/,/g, '.')) || 0;
      const hoursText = hoursInput.value.replace(/,/g, '.');
      
      // Parse hours:minutes format or direct hour value
      let hours = 0;
      if (hoursText.includes(':')) {
        const [h, m] = hoursText.split(':');
        hours = parseFloat(h) + (parseFloat(m) / 60) || 0;
      } else {
        hours = parseFloat(hoursText) || 0;
      }
      
      // Calculate and display the average hourly wage only if there are both valid fee and hours values
      if (fee > 0 && hours > 0) {
        const avgWage = (fee / hours).toFixed(2);
        avgWageRow.cells[i].textContent = avgWage + ' €/h';
        
        // Calculate exact fee based on average wage * actual time
        const exactFee = calculateExactFee(i, parseFloat(avgWage), timesRow.cells[i], exactFeeRow.cells[i]);
        
        // Calculate and display the deviation (Honorar - Genaues Honorar)
        calculateDeviation(fee, exactFee, deviationRow.cells[i]);
      } else {
        // Clear cells when data is invalid
        avgWageRow.cells[i].textContent = '';
        exactFeeRow.cells[i].textContent = '';
        deviationRow.cells[i].textContent = '';
      }
    };
    
    // Add event listeners to update calculations when inputs change
    if (feeInput) {
      feeInput.addEventListener('input', calculateWage);
    }
    
    if (hoursInput) {
      hoursInput.addEventListener('input', calculateWage);
    }
    
    // Initial calculation
    if (feeInput && hoursInput) {
      calculateWage();
    }
  }
}

/**
 * Calculate exact fee based on average hourly wage and actual time
 * @param {number} monthIndex - Index of the month column
 * @param {number} avgHourlyWage - Average hourly wage
 * @param {HTMLTableCellElement} timeCell - Table cell containing the time value
 * @param {HTMLTableCellElement} exactFeeCell - Table cell to output the exact fee
 * @returns {number} The calculated exact fee amount
 */
function calculateExactFee(monthIndex, avgHourlyWage, timeCell, exactFeeCell) {
  // Get the time value from the times cell
  const timeText = timeCell.textContent.trim();
  
  if (!timeText) {
    // No time data, clear the exact fee cell
    exactFeeCell.textContent = '';
    return 0;
  }
  
  // Parse the time in format HH:MM to hours as decimal
  let actualHours = 0;
  if (timeText.includes(':')) {
    const [h, m] = timeText.split(':');
    actualHours = parseInt(h, 10) + (parseInt(m, 10) / 60);
  }
  
  // Calculate the exact fee
  if (actualHours > 0 && avgHourlyWage > 0) {
    const exactFee = actualHours * avgHourlyWage;
    exactFeeCell.textContent = exactFee.toFixed(2) + ' €';
    return exactFee;
  } else {
    exactFeeCell.textContent = '';
    return 0;
  }
}

/**
 * Calculates the deviation between the entered fee and the exact fee
 * @param {number} enteredFee - The manually entered fee amount
 * @param {number} exactFee - The calculated exact fee based on time and hourly wage
 * @param {HTMLTableCellElement} deviationCell - The cell to display the deviation
 */
function calculateDeviation(enteredFee, exactFee, deviationCell) {
  if (enteredFee === 0 || exactFee === 0) {
    deviationCell.textContent = '';
    deviationCell.className = '';
    return;
  }
  
  const deviation = enteredFee - exactFee;
  
  // Format the deviation with appropriate sign and color
  deviationCell.textContent = deviation.toFixed(2) + ' €';
  
  // Add class for styling based on positive/negative deviation
  if (deviation > 0) {
    deviationCell.className = 'positive-deviation';
    deviationCell.style.color = 'var(--color-green)';
  } else if (deviation < 0) {
    deviationCell.className = 'negative-deviation';
    deviationCell.style.color = 'var(--color-red)';
  } else {
    deviationCell.className = '';
    deviationCell.style.color = '';
  }
}

function setupEditableCells() {
  document.querySelectorAll('.editable-cell').forEach(cell => {
    cell.addEventListener('input', (e) => {
      const value = e.target.value;
      const sanitized = value.replace(/[^0-9.,]/g, '');
      
      if ((sanitized.match(/[.,]/g) || []).length > 1) {
        e.target.value = sanitized.substring(0, sanitized.length - 1);
      } else {
        e.target.value = sanitized;
      }
    });
  });
  
  // Calculate average hourly wage after setting up editable cells
  calculateAverageHourlyWage();
}

/**
 * Populates the "Zeiten" row in the Fibu tab with time data from the CSV
 * Filters by assignment (Auftrag) and ensures month matches assignment
 * Only shows data from "Finanzbuchführung" project (with variations in spelling)
 */
function populateFibuTimesRow() {
  const fibuTable = document.querySelector('.fibu-table');
  if (!fibuTable) return;

  // Find the "Zeiten" row in the Fibu table
  const timesRow = Array.from(fibuTable.querySelectorAll('tbody tr')).find(row => 
    row.cells[0].textContent.trim() === 'Zeiten');
  
  if (!timesRow) return;

  // Find column indices from CSV
  const teamColIdx = findColumnIndex('team');
  const projektColIdx = findColumnIndex('projekt');
  const auftragColIdx = findColumnIndex('auftrag'); 
  const durationColIdx = findDurationColumnIndex();
  const startDateColIdx = findColumnIndex('start') !== -1 ? findColumnIndex('start') : -1;
  
  if (durationColIdx === -1) {
    console.error('Duration column not found in CSV');
    return;
  }

  // Initialize monthly totals (one for each month)
  const monthlyTotals = Array(12).fill(0);
  
  // Get the current filter values
  const teamMemberValue = appState.filters.teamMember || '';
  
  console.log('Processing CSV data for Fibu tab, rows:', appState.csvData.rows.length);
  
  // Process each row in the CSV data
  appState.csvData.rows.forEach(row => {
    try {
      // Apply team member filter if set
      if (teamMemberValue && teamColIdx !== -1 && 
          row[teamColIdx]?.replace(/"/g, '').trim() !== teamMemberValue) {
        return; // Skip if team filter doesn't match
      }
      
      // Check for Finanzbuchführung project with multiple spelling variants
      if (projektColIdx !== -1) {
        const projectValue = row[projektColIdx]?.replace(/"/g, '').trim() || '';
        // Check for various spellings including with/without umlauts
        const fibuVariants = ['finanzbuchführung', 'finanzbuchfuehrung', 'fibu'];
        if (!fibuVariants.some(variant => projectValue.toLowerCase().includes(variant))) {
          return; // Skip if not related to Finanzbuchführung
        }
      } else {
        return; // Skip if project column not found
      }
      
      // Calculate duration in minutes
      const durationStr = row[durationColIdx]?.replace(/"/g, '').trim() || '';
      const durationMinutes = parseDurationToMinutes(durationStr);
      if (durationMinutes <= 0) return;
      
      // Determine which month this entry belongs to
      let monthIndex = -1;
      
      // First try to extract month from Auftrag
      if (auftragColIdx !== -1) {
        const auftrag = row[auftragColIdx]?.replace(/"/g, '').trim() || '';
        const auftragMonth = extractMonthFromAuftrag(auftrag);
        if (auftragMonth > 0) {
          monthIndex = auftragMonth - 1; // Convert to 0-based index
        }
      }
      
      // If no month from Auftrag, try the start date
      if (monthIndex === -1 && startDateColIdx !== -1) {
        const startDateStr = row[startDateColIdx]?.replace(/"/g, '').trim() || '';
        const startDate = parseDate(startDateStr);
        if (startDate) {
          monthIndex = startDate.getMonth(); // 0-based (January is 0)
        }
      }
      
      // Add to the corresponding month's total if we could determine the month
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyTotals[monthIndex] += durationMinutes;
        console.log(`Added ${durationMinutes} minutes for project "${row[projektColIdx]?.replace(/"/g, '').trim()}" to month ${monthIndex + 1}`);
      }
    } catch (err) {
      console.error('Error processing row for Fibu times:', err);
    }
  });
  
  console.log('Monthly totals:', monthlyTotals);
  
  // Update the Fibu table with the calculated times
  for (let i = 0; i < 12; i++) {
    const cell = timesRow.cells[i + 1]; // +1 to skip first column which is the label
    if (cell) {
      cell.textContent = monthlyTotals[i] > 0 ? formatMinutesToHHMM(monthlyTotals[i]) : '';
    }
  }
}

/**
 * Extracts month number (1-12) from assignment string
 * Handles formats like "04.2025", "4.2025", "04/2025", "4/2025"
 * Also handles just month numbers like "04" or "4"
 */
function extractMonthFromAuftrag(auftrag) {
  // Check if the string is empty
  if (!auftrag) return -1;
  
  // First try to match patterns with year like "04.2025"
  const monthPatterns = [
    /^(\d{1,2})\.(\d{4})$/, // 04.2025 or 4.2025
    /^(\d{1,2})\/(\d{4})$/, // 04/2025 or 4/2025
    /^(\d{1,2})-(\d{4})$/,  // 04-2025 or 4-2025
    /^(\d{4})[-\/\.](\d{1,2})$/ // 2025.04, 2025/04, 2025-04
  ];
  
  for (const pattern of monthPatterns) {
    const match = auftrag.match(pattern);
    if (match) {
      // Check if month is in position 1 or 2 based on the pattern
      const monthIndex = pattern.toString().indexOf('(\\d{4})') > pattern.toString().indexOf('(\\d{1,2})') ? 1 : 2;
      const month = parseInt(match[monthIndex], 10);
      if (month >= 1 && month <= 12) {
        return month;
      }
    }
  }
  
  // Try to match just month numbers like "04" or "4"
  const simpleMonthMatch = auftrag.match(/^(\d{1,2})$/);
  if (simpleMonthMatch) {
    const month = parseInt(simpleMonthMatch[1], 10);
    if (month >= 1 && month <= 12) {
      return month;
    }
  }
  
  // If nothing matches, check if the auftrag contains any roman numerals for months
  const romanNumerals = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 
    'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 
    'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
  };
  
  for (const [roman, value] of Object.entries(romanNumerals)) {
    if (auftrag.includes(roman)) {
      return value;
    }
  }
  
  return -1; // Unable to extract month
}

/**
 * Parses a date string into a Date object
 * Handles multiple formats like "DD.MM.YYYY", "DD/MM/YYYY"
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Try different date formats
  const formats = [
    /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // D.M.YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/  // D/M/YYYY
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Months are 0-based in JS
      const year = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
  }
  
  return null; // Couldn't parse date
}

function setupTimeTracker() {
  // DOM-Elemente für die Kategorie-Auswahl
  const categoryTabs = document.querySelectorAll('.category-tab');
  const categoryList = document.getElementById('category-list');
  const categorySearch = document.getElementById('category-search');
  const assignmentInput = document.getElementById('assignment-input');
  
  // DOM-Elemente für Auswahlanzeigeelemente
  const selectedTeamDisplay = document.getElementById('selected-team-display');
  const selectedCustomerDisplay = document.getElementById('selected-customer-display');
  const selectedProjectDisplay = document.getElementById('selected-project-display');
  const selectedAssignmentDisplay = document.getElementById('selected-assignment-display');
  
  // DOM-Elemente für Timer
  const timerStartBtn = document.getElementById('timer-start-btn');
  const timerStopBtn = document.getElementById('timer-stop-btn');
  const timerDisplay = document.querySelector('.timer-display');
  const timerStatus = document.getElementById('timer-status');
  
  // Timer-Anzeige mit korrektem Format initialisieren
  if (timerDisplay) {
    timerDisplay.textContent = '00:00:00';
  }
  
  // DOM-Elemente für Notizen und Aktionen
  const timeEntryNotes = document.getElementById('time-entry-notes');
  const saveEntryBtn = document.getElementById('save-entry-btn');
  const resetEntryBtn = document.getElementById('reset-entry-btn');
  const deleteEntryBtn = document.getElementById('delete-entry-btn');
  
  // Hidden Form Elemente
  const selectedTeamInput = document.getElementById('selected-team');
  const selectedCustomerInput = document.getElementById('selected-customer');
  const selectedProjectInput = document.getElementById('selected-project');
  const entryIdInput = document.getElementById('entry-id-input');
  
  // Tabellen-Elemente
  const timeTrackerTable = document.getElementById('time-tracker-table').querySelector('tbody');
  const sortDateButton = document.getElementById('sort-date-button');
  const filterUnbilledButton = document.getElementById('filter-unbilled-button');

  // Timer-Variablen
  let timerInterval = null;
  let timerStartTime = 0;
  let timerSeconds = 0;
  let timeEntries = loadTimeEntries();
  let currentCategory = 'team'; // Standard-Kategorie ist Teammitglied

  // Prüfe, ob die Timer-Elemente existieren
  if (timerDisplay) {
    // Timer initial auf 00:00:00 setzen
    timerDisplay.textContent = '00:00:00';
  } else {
    console.error('Timer-Display nicht gefunden!');
  }

  // Timer-Funktionalität
  if (timerStartBtn && timerStopBtn) {
    timerStartBtn.addEventListener('click', startTimer);
    timerStopBtn.addEventListener('click', stopTimer);
  } else {
    console.error('Timer-Buttons nicht gefunden!');
  }

  // Timer starten
  function startTimer() {
    if (timerInterval === null) {
      timerStartTime = Date.now() - (timerSeconds * 1000);
      timerInterval = setInterval(updateTimer, 1000);
      
      // UI aktualisieren
      if (timerStartBtn) timerStartBtn.style.display = 'none';
      if (timerStopBtn) timerStopBtn.style.display = 'inline-flex';
      if (timerStatus) {
        timerStatus.textContent = 'Zeit läuft...';
        timerStatus.style.color = '#4CAF50';
      }
    }
  }

  // Timer stoppen
  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
      
      // UI zurücksetzen
      if (timerStartBtn) timerStartBtn.style.display = 'inline-flex';
      if (timerStopBtn) timerStopBtn.style.display = 'none';
      if (timerStatus) {
        timerStatus.textContent = 'Gestoppt';
        timerStatus.style.color = '#F44336';
      }
    }
  }

  // Timer aktualisieren
  function updateTimer() {
    // Berechne verstrichene Zeit
    const elapsedSeconds = Math.floor((Date.now() - timerStartTime) / 1000);
    timerSeconds = elapsedSeconds;
    
    // Zeit in Stunden, Minuten und Sekunden zerlegen
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    
    // Formatierte Strings mit führenden Nullen
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    // Suche die individuellen Zeitanzeige-Elemente
    const hoursElement = document.querySelector('.timer-hours');
    const minutesElement = document.querySelector('.timer-minutes');
    const secondsElement = document.querySelector('.timer-seconds');
    
    // Aktualisiere die Elemente wenn sie existieren
    if (hoursElement) hoursElement.textContent = formattedHours;
    if (minutesElement) minutesElement.textContent = formattedMinutes;
    if (secondsElement) secondsElement.textContent = formattedSeconds;
    
    // Speichere auch das komplette Format für andere Funktionen
    const formattedTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    
    // Speichere den Wert auch im DOM-Element für spätere Verwendung
    if (timerDisplay) {
      timerDisplay.setAttribute('data-duration', formattedTime);
    }
  }

  // Aktions-Buttons
  saveEntryBtn.addEventListener('click', () => {
    saveTimeEntry();
  });

  // Farben für Kategorieeinträge
  const colors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#009688', '#673AB7', '#CDDC39', '#795548', '#3F51B5'
  ];

  // Daten aus der CSV-Datei laden
  const teamMembers = extractUniqueValues(findColumnIndex('teammitglied') !== -1 ? findColumnIndex('teammitglied') : 0);
  const customers = extractUniqueValues(findColumnIndex('kunden') !== -1 ? findColumnIndex('kunden') : 1);
  const projects = extractUniqueValues(findColumnIndex('projekte') !== -1 ? findColumnIndex('projekte') : 2);

  // Standardmäßig die Team-Kategorie laden
  loadCategoryItems('team');

  // Event-Listener für Kategorie-Tabs
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Aktiven Tab aktualisieren
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Kategorie-Liste aktualisieren
      currentCategory = tab.dataset.category;
      loadCategoryItems(currentCategory);
    });
  });

  // Event-Listener für Kategorie-Suche
  categorySearch.addEventListener('input', () => {
    filterCategoryItems(categorySearch.value);
  });

  // Event-Listener für Auftragsfeld
  assignmentInput.addEventListener('input', () => {
    updateSelectionDisplay('assignment', assignmentInput.value);
  });
  
  // Anzeige für den Auftrag aktualisieren wenn Fokus verloren geht
  assignmentInput.addEventListener('blur', () => {
    if (assignmentInput.value) {
      selectedAssignmentDisplay.querySelector('span').textContent = assignmentInput.value;
      selectedAssignmentDisplay.classList.add('selected');
    }
  });

  // Aktions-Buttons
  saveEntryBtn.addEventListener('click', () => {
    saveTimeEntry();
  });

  resetEntryBtn.addEventListener('click', () => {
    resetForm();
  });

  deleteEntryBtn.addEventListener('click', () => {
    if (entryIdInput.value) {
      if (confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?')) {
        deleteTimeEntry(entryIdInput.value);
        resetForm();
      }
    } else {
      resetForm();
    }
  });

  // Sortieren und Filtern von Einträgen
  sortDateButton.addEventListener('click', () => {
    timeEntries.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    renderTimeEntries();
  });

  filterUnbilledButton.addEventListener('click', () => {
    filterUnbilledButton.classList.toggle('active');
    renderTimeEntries();
  });

  // Ersten Tabellen-Render
  renderTimeEntries();

  /**
   * Kategorie-Elemente laden und anzeigen (Teammitglieder, Kunden oder Projekte)
   */
  function loadCategoryItems(category) {
    // Kategorie-Liste leeren
    categoryList.innerHTML = '';
    
    let items = [];
    
    // Elemente je nach Kategorie laden
    switch(category) {
      case 'team':
        items = teamMembers;
        break;
      case 'customer':
        items = customers;
        break;
      case 'project':
        items = projects;
        break;
    }
    
    // Elemente zur Liste hinzufügen
    items.forEach((item, index) => {
      const colorIndex = index % colors.length;
      const isFavorite = index < 3; // Erste 3 Einträge als Favoriten markiert
      
      const itemElement = document.createElement('div');
      itemElement.className = 'customer-item';
      itemElement.dataset.value = item;
      
      // Farbmarkierung hinzufügen
      const colorMarker = document.createElement('div');
      colorMarker.className = 'customer-color';
      colorMarker.style.backgroundColor = colors[colorIndex];
      
      // Namensanzeige hinzufügen
      const nameElement = document.createElement('div');
      nameElement.className = 'customer-name';
      nameElement.textContent = item;
      
      // Elemente zum Listeneintrag hinzufügen
      itemElement.appendChild(colorMarker);
      itemElement.appendChild(nameElement);
      
      // Favoriten-Stern für die ersten 3 Einträge
      if (isFavorite) {
        const favoriteIcon = document.createElement('i');
        favoriteIcon.className = 'fa-solid fa-star customer-favorite';
        itemElement.appendChild(favoriteIcon);
      }
      
      // Event-Listener für die Auswahl
      itemElement.addEventListener('click', () => {
        // Bisherigen ausgewählten Eintrag deselektieren
        const selectedItems = categoryList.querySelectorAll('.selected');
        selectedItems.forEach(item => item.classList.remove('selected'));
        
        // Neuen Eintrag auswählen
        itemElement.classList.add('selected');
        
        // Wert im Hidden-Input speichern und Anzeige aktualisieren
        switch(category) {
          case 'team':
            selectedTeamInput.value = item;
            updateSelectionDisplay('team', item);
            break;
          case 'customer':
            selectedCustomerInput.value = item;
            updateSelectionDisplay('customer', item);
            break;
          case 'project':
            selectedProjectInput.value = item;
            updateSelectionDisplay('project', item);
            break;
        }
      });
      
      // Eintrag zur Liste hinzufügen
      categoryList.appendChild(itemElement);
    });
  }

  /**
   * Kategorie-Elemente nach Suchbegriff filtern
   */
  function filterCategoryItems(searchText) {
    const lowerSearchText = searchText.toLowerCase();
    const items = categoryList.querySelectorAll('.customer-item');
    
    items.forEach(item => {
      const value = item.dataset.value.toLowerCase();
      if (value.includes(lowerSearchText)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  /**
   * Auswahlanzeigeelemente aktualisieren
   */
  function updateSelectionDisplay(type, value) {
    let displayElement;
    
    switch(type) {
      case 'team':
        displayElement = selectedTeamDisplay;
        break;
      case 'customer':
        displayElement = selectedCustomerDisplay;
        break;
      case 'project':
        displayElement = selectedProjectDisplay;
        break;
      case 'assignment':
        displayElement = selectedAssignmentDisplay;
        break;
      default:
        return;
    }
    
    if (value) {
      displayElement.querySelector('span').textContent = value;
      displayElement.classList.add('selected');
    } else {
      const defaultTexts = {
        team: 'Kein Teammitglied ausgewählt',
        customer: 'Kein Kunde ausgewählt',
        project: 'Kein Projekt ausgewählt',
        assignment: 'Kein Auftrag ausgewählt'
      };
      
      displayElement.querySelector('span').textContent = defaultTexts[type];
      displayElement.classList.remove('selected');
    }
  }

  /**
   * Timer aktualisieren
   */
  function updateTimer() {
    // Berechne verstrichene Zeit
    const elapsedSeconds = Math.floor((Date.now() - timerStartTime) / 1000);
    timerSeconds = elapsedSeconds;
    
    // Zeit in Stunden, Minuten und Sekunden zerlegen
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    
    // Formatierte Strings mit führenden Nullen
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    // Suche die individuellen Zeitanzeige-Elemente
    const hoursElement = document.querySelector('.timer-hours');
    const minutesElement = document.querySelector('.timer-minutes');
    const secondsElement = document.querySelector('.timer-seconds');
    
    // Aktualisiere die Elemente wenn sie existieren
    if (hoursElement) hoursElement.textContent = formattedHours;
    if (minutesElement) minutesElement.textContent = formattedMinutes;
    if (secondsElement) secondsElement.textContent = formattedSeconds;
    
    // Speichere auch das komplette Format für andere Funktionen
    const formattedTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    
    // Speichere den Wert auch im DOM-Element für spätere Verwendung
    if (timerDisplay) {
      timerDisplay.setAttribute('data-duration', formattedTime);
    }
  }

  /**
   * Zeiterfassung speichern
   */
  function saveTimeEntry() {
    // Validierung
    if (!selectedTeamInput.value || !selectedCustomerInput.value || !selectedProjectInput.value) {
      alert('Bitte wählen Sie mindestens Teammitglied, Kunde und Projekt aus.');
      return;
    }
    
    const now = new Date();
    const entryData = {
      id: entryIdInput.value || generateUniqueId(),
      teamMember: selectedTeamInput.value,
      customer: selectedCustomerInput.value,
      project: selectedProjectInput.value,
      assignment: assignmentInput.value || '',
      notes: timeEntryNotes.value || '',
      startDate: formatDateForIso(now),
      endDate: formatDateForIso(now),
      duration: timerDisplay.textContent || '00:00',
      billed: false,
      timestamp: now.getTime()
    };
    
    // Neuen Eintrag erstellen oder bestehenden aktualisieren
    if (entryIdInput.value) {
      // Vorhandenen Eintrag aktualisieren
      const index = timeEntries.findIndex(entry => entry.id === entryIdInput.value);
      if (index !== -1) {
        timeEntries[index] = entryData;
      }
    } else {
      // Neuen Eintrag hinzufügen
      timeEntries.push(entryData);
    }
    
    // Speichern und UI aktualisieren
    saveTimeEntries();
    renderTimeEntries();
    resetForm();
    
    // Timer-Daten zurücksetzen, wenn der Timer läuft
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerSeconds = 0;
      timerDisplay.textContent = '00:00:00';
      timerStartBtn.style.display = 'inline-flex';
      timerStopBtn.style.display = 'none';
      timerStatus.textContent = 'Bereit';
      timerStatus.style.color = '';
    }
  }

  /**
   * Formular zurücksetzen
   */
  function resetForm() {
    // Hidden-Inputs zurücksetzen
    selectedTeamInput.value = '';
    selectedCustomerInput.value = '';
    selectedProjectInput.value = '';
    entryIdInput.value = '';
    
    // Formular-Inputs zurücksetzen
    assignmentInput.value = '';
    timeEntryNotes.value = '';
    
    // Auswahlanzeige zurücksetzen
    updateSelectionDisplay('team', '');
    updateSelectionDisplay('customer', '');
    updateSelectionDisplay('project', '');
    updateSelectionDisplay('assignment', '');
    
    // Timer zurücksetzen wenn nötig
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerSeconds = 0;
    timerDisplay.textContent = '00:00:00';
    timerStartBtn.style.display = 'inline-flex';
    timerStopBtn.style.display = 'none';
    timerStatus.textContent = 'Bereit';
    timerStatus.style.color = '';
    
    // Ausgewählte Einträge in der Kategorie-Liste deselektieren
    const selectedItems = categoryList.querySelectorAll('.selected');
    selectedItems.forEach(item => item.classList.remove('selected'));
  }

  /**
   * Zeiterfassung löschen
   */
  function deleteTimeEntry(id) {
    const index = timeEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      timeEntries.splice(index, 1);
      saveTimeEntries();
      renderTimeEntries();
    }
  }

  /**
   * Zeiterfassungen in der Tabelle anzeigen
   */
  function renderTimeEntries() {
    // Tabelle leeren
    timeTrackerTable.innerHTML = '';
    
    // Einträge filtern wenn "Nur nicht abgerechnete" aktiv ist
    let filteredEntries = timeEntries;
    if (filterUnbilledButton.classList.contains('active')) {
      filteredEntries = timeEntries.filter(entry => !entry.billed);
    }
    
    // Einträge zur Tabelle hinzufügen
    filteredEntries.forEach(entry => {
      const row = document.createElement('tr');
      
      // Teammitglied
      const teamMemberCell = document.createElement('td');
      teamMemberCell.textContent = entry.teamMember;
      row.appendChild(teamMemberCell);
      
      // Kunde
      const customerCell = document.createElement('td');
      customerCell.textContent = entry.customer;
      row.appendChild(customerCell);
      
      // Projekt
      const projectCell = document.createElement('td');
      projectCell.textContent = entry.project;
      row.appendChild(projectCell);
      
      // Auftrag
      const assignmentCell = document.createElement('td');
      assignmentCell.textContent = entry.assignment;
      row.appendChild(assignmentCell);
      
      // Datum
      const dateCell = document.createElement('td');
      dateCell.textContent = formatDate(entry.startDate);
      row.appendChild(dateCell);
      
      // Dauer
      const durationCell = document.createElement('td');
      durationCell.textContent = entry.duration;
      row.appendChild(durationCell);
      
      // Abgerechnet
      const billedCell = document.createElement('td');
      if (entry.billed) {
        billedCell.textContent = 'Ja';
        billedCell.style.color = 'var(--color-green)';
      } else {
        billedCell.textContent = 'Nein';
        billedCell.style.color = 'var(--color-red)';
      }
      row.appendChild(billedCell);
      
      // Aktionen
      const actionsCell = document.createElement('td');
      actionsCell.className = 'action-cell';
      
      // Bearbeiten-Button
      const editButton = document.createElement('button');
      editButton.className = 'edit-button';
      editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
      editButton.addEventListener('click', () => {
        editEntry(entry.id);
      });
      
      // Abrechnen-Button (Umschalten des abgerechnet-Status)
      const toggleBilledButton = document.createElement('button');
      toggleBilledButton.className = 'edit-button';
      toggleBilledButton.innerHTML = '<i class="fa-solid fa-check-circle"></i>';
      toggleBilledButton.addEventListener('click', () => {
        toggleEntryBilledStatus(entry.id);
      });
      
      // Löschen-Button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button';
      deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
      deleteButton.addEventListener('click', () => {
        if (confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?')) {
          deleteTimeEntry(entry.id);
        }
      });
      
      actionsCell.appendChild(editButton);
      actionsCell.appendChild(toggleBilledButton);
      actionsCell.appendChild(deleteButton);
      row.appendChild(actionsCell);
      
      timeTrackerTable.appendChild(row);
    });
  }

  /**
   * Eintrag zum Bearbeiten laden
   */
  function editEntry(id) {
    const entry = timeEntries.find(entry => entry.id === id);
    if (!entry) return;
    
    // Formular mit den Daten füllen
    selectedTeamInput.value = entry.teamMember;
    selectedCustomerInput.value = entry.customer;
    selectedProjectInput.value = entry.project;
    assignmentInput.value = entry.assignment;
    timeEntryNotes.value = entry.notes;
    entryIdInput.value = entry.id;
    
    // Anzeige aktualisieren
    updateSelectionDisplay('team', entry.teamMember);
    updateSelectionDisplay('customer', entry.customer);
    updateSelectionDisplay('project', entry.project);
    updateSelectionDisplay('assignment', entry.assignment);
  }

  /**
   * Abgerechnet-Status umschalten
   */
  function toggleEntryBilledStatus(id) {
    const index = timeEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      timeEntries[index].billed = !timeEntries[index].billed;
      saveTimeEntries();
      renderTimeEntries();
    }
  }

  /**
   * Zeiterfassungen aus dem Local Storage laden
   */
  function loadTimeEntries() {
    const savedEntries = localStorage.getItem('timeEntries');
    return savedEntries ? JSON.parse(savedEntries) : [];
  }

  /**
   * Zeiterfassungen im Local Storage speichern
   */
  function saveTimeEntries() {
    localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
  }

  /**
   * Eindeutige ID generieren
   */
  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Datum formatieren für Anzeige
   */
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  }
  
  /**
   * Datum für ISO-Format formatieren
   */
  function formatDateForIso(date) {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Populates the dropdown selectors in the category selection area with data from CSV
 */
function populateCategoryDropdowns() {
  const teamSelect = document.getElementById('team-select');
  const customerSelect = document.getElementById('customer-select');
  const projectSelect = document.getElementById('project-select');
  
  if (!teamSelect || !customerSelect || !projectSelect) return;
  
  // Clear existing options
  teamSelect.innerHTML = '<option value="">Teammitglied auswählen</option>';
  customerSelect.innerHTML = '<option value="">Kunde auswählen</option>';
  projectSelect.innerHTML = '<option value="">Projekt auswählen</option>';
  
  // Find correct column indices
  const teamColIdx = findColumnIndex('team') !== -1 ? findColumnIndex('team') : 0;
  const customerColIdx = findColumnIndex('kund') !== -1 ? findColumnIndex('kund') : 1; // matches kunde/kunden
  const projectColIdx = findColumnIndex('projekt') !== -1 ? findColumnIndex('projekt') : 2;
  
  // Get unique values for each category
  const teamMembers = extractUniqueValues(teamColIdx);
  const customers = extractUniqueValues(customerColIdx);
  const projects = extractUniqueValues(projectColIdx);
  
  // Populate select elements
  populateSelectOptions(teamSelect, teamMembers);
  populateSelectOptions(customerSelect, customers);
  populateSelectOptions(projectSelect, projects);
  
  // Add event listeners to update the hidden inputs and UI
  teamSelect.addEventListener('change', function() {
    const selectedValue = this.value;
    document.getElementById('selected-team').value = selectedValue;
    updateSelectionDisplayFromDropdown('team', selectedValue);
  });
  
  customerSelect.addEventListener('change', function() {
    const selectedValue = this.value;
    document.getElementById('selected-customer').value = selectedValue;
    updateSelectionDisplayFromDropdown('customer', selectedValue);
  });
  
  projectSelect.addEventListener('change', function() {
    const selectedValue = this.value;
    document.getElementById('selected-project').value = selectedValue;
    updateSelectionDisplayFromDropdown('project', selectedValue);
  });
}

/**
 * Updates the selection display based on dropdown selection
 */
function updateSelectionDisplayFromDropdown(category, value) {
  const displayElement = document.getElementById(`selected-${category}-display`);
  if (!displayElement) return;
  
  if (value) {
    displayElement.classList.add('selected');
  } else {
    displayElement.classList.remove('selected');
  }
}
