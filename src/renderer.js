const fs = require('fs');
const path = require('path');

const appState = {
  csvData: {
    headers: [],
    rows: []
  },
  filters: {
    teamMember: '',
    project: ''
  },
  sidebarCollapsed: false
};

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  setupTabs();
  setupThemeSwitch();
  setupSidebarToggle();
  loadCsvData();
  setupFilterEvents();
  setupSearchFunction();
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
  const tabButtons = document.querySelectorAll('.tab-button');
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
  calculateTeamMemberTimeStatistics();
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
  const table = document.querySelector('table');
  if (!table) return;

  const teamMemberValue = appState.filters.teamMember;
  const projectValue = appState.filters.project;
  const searchQuery = document.getElementById('sidebar-search')?.value.trim().toLowerCase() || '';

  const teamColIdx = findColumnIndex('team') !== -1 ? findColumnIndex('team') : 0;
  const projectColIdx = findColumnIndex('projekt') !== -1 ? findColumnIndex('projekt') : 2;
  const notesIdx = findColumnIndex('notiz');

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
      
      const matchesNotes = notesIdx !== -1 && cells[notesIdx] && 
                          cells[notesIdx].textContent.toLowerCase().includes(searchQuery);
      
      showRow = showRow && (matchesText || matchesNotes);
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
