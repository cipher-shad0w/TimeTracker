const fs = require('fs');
const path = require('path');

// Global state object to store our data
const appState = {
  csvData: {
    headers: [],
    rows: []
  },
  filters: {
    teamMember: '',
    project: ''
  }
};

// Initialize application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
  setupTabs();
  setupThemeSwitch();
  loadCsvData();
  setupFilterEvents();
}

/**
 * Set up theme switching functionality
 */
function setupThemeSwitch() {
  const themeSwitch = document.getElementById('checkbox');
  
  // Check if user preference exists in localStorage
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    // If theme is light, check the checkbox
    if (currentTheme === 'light') {
      themeSwitch.checked = true;
    }
  }
  
  // Add event listener to toggle theme
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

/**
 * Set up tab navigation
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Deactivate all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activate clicked tab
      const tabId = button.getAttribute('data-tab');
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

/**
 * Set up event listeners for sidebar filters
 */
function setupFilterEvents() {
  const teamMemberFilter = document.getElementById('team-member-filter');
  const projectFilter = document.getElementById('project-filter');
  const applyFiltersBtn = document.getElementById('apply-filters');
  const resetFiltersBtn = document.getElementById('reset-filters');

  // Apply filters button click
  applyFiltersBtn.addEventListener('click', () => {
    appState.filters.teamMember = teamMemberFilter.value;
    appState.filters.project = projectFilter.value;
    applyFilters();
  });

  // Reset filters button click
  resetFiltersBtn.addEventListener('click', () => {
    teamMemberFilter.value = '';
    projectFilter.value = '';
    appState.filters.teamMember = '';
    appState.filters.project = '';
    applyFilters();
  });
}

/**
 * Load and process CSV data
 */
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

/**
 * Process CSV content and render table
 * @param {string} csvContent - CSV file content
 */
function processCsvData(csvContent) {
  if (!csvContent) return;
  
  // Parse the CSV file
  const rows = csvContent.split('\n')
    .filter(row => row.trim())
    .map(row => row.split(','));
    
  const headers = rows.shift();
  
  // Store parsed data in our global state
  appState.csvData.headers = headers.map(h => h.replace(/"/g, ''));
  appState.csvData.rows = rows;

  // Find indices for date columns
  const dateColumns = findDateColumns();
  
  // Render the data table
  renderDataTable(dateColumns);
  
  // Populate filter options based on actual data
  populateFilterOptions();
}

/**
 * Find date column indices in CSV headers
 * @returns {object} Object containing date column indices and combined flag
 */
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

/**
 * Render data table with CSV content
 * @param {object} dateColumns - Date column configuration
 */
function renderDataTable(dateColumns) {
  const { startDateIdx, endDateIdx, showCombinedDate } = dateColumns;
  const appDiv = document.getElementById('app');
  
  // Clear existing content
  appDiv.innerHTML = '';
  
  // Create search input
  const searchInput = createSearchInput();
  appDiv.appendChild(searchInput);

  // Create table
  const table = document.createElement('table');
  
  // Create table headers
  const headerRow = createTableHeaders(showCombinedDate, startDateIdx, endDateIdx);
  table.appendChild(headerRow);

  // Create table rows
  appState.csvData.rows.forEach(row => {
    const tableRow = createTableRow(row, showCombinedDate, startDateIdx, endDateIdx);
    table.appendChild(tableRow);
  });

  appDiv.appendChild(table);

  // Add event listener for search
  searchInput.addEventListener('input', () => {
    filterTable(table, searchInput.value);
  });
}

/**
 * Create search input element
 * @returns {HTMLElement} Search input element
 */
function createSearchInput() {
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Suche nach Mitarbeitern...';
  searchInput.classList.add('search-input');
  return searchInput;
}

/**
 * Create table header row
 * @param {boolean} showCombinedDate - Whether to show combined date column
 * @param {number} startDateIdx - Start date column index
 * @param {number} endDateIdx - End date column index
 * @returns {HTMLElement} Table header row element
 */
function createTableHeaders(showCombinedDate, startDateIdx, endDateIdx) {
  const headerRow = document.createElement('tr');
  
  appState.csvData.headers.forEach((header, index) => {
    // Skip original date columns if showing combined date
    if (showCombinedDate && (index === startDateIdx || index === endDateIdx)) {
      return;
    }
    
    const th = document.createElement('th');
    th.textContent = header;
    th.style.cursor = 'pointer';
    
    // Add sorting functionality
    th.addEventListener('click', (event) => {
      const table = event.target.closest('table');
      sortTable(table, index);
    });
    
    headerRow.appendChild(th);
  });
  
  return headerRow;
}

/**
 * Create table data row
 * @param {string[]} rowData - Row data array
 * @param {boolean} showCombinedDate - Whether to show combined date column
 * @param {number} startDateIdx - Start date column index
 * @param {number} endDateIdx - End date column index
 * @returns {HTMLElement} Table row element
 */
function createTableRow(rowData, showCombinedDate, startDateIdx, endDateIdx) {
  const tr = document.createElement('tr');
  
  // Process regular cells
  rowData.forEach((cell, index) => {
    // Skip original date columns if showing combined date
    if (showCombinedDate && (index === startDateIdx || index === endDateIdx)) {
      return;
    }
    
    const td = document.createElement('td');
    td.textContent = cell.replace(/"/g, '');
    tr.appendChild(td);
  });
  
  // Add the combined date cell if needed
  if (showCombinedDate && rowData[startDateIdx]) {
    const td = document.createElement('td');
    td.textContent = rowData[startDateIdx].replace(/"/g, '');
    tr.appendChild(td);
  }
  
  return tr;
}

/**
 * Populate filter dropdowns based on CSV data
 */
function populateFilterOptions() {
  const teamMemberFilter = document.getElementById('team-member-filter');
  const projectFilter = document.getElementById('project-filter');
  
  if (!teamMemberFilter || !projectFilter) return;
  
  // Find column indices for team and project
  const teamColIdx = findColumnIndex('team');
  const projectColIdx = findColumnIndex('project');
  
  // Clear existing options except first one (All)
  clearOptions(teamMemberFilter);
  clearOptions(projectFilter);
  
  // Add team member options
  if (teamColIdx !== -1) {
    const uniqueTeamMembers = extractUniqueValues(teamColIdx);
    populateSelectOptions(teamMemberFilter, uniqueTeamMembers);
  }
  
  // Add project options
  if (projectColIdx !== -1) {
    const uniqueProjects = extractUniqueValues(projectColIdx);
    populateSelectOptions(projectFilter, uniqueProjects);
  }
}

/**
 * Find column index by keyword in headers
 * @param {string} keyword - Keyword to search for in headers
 * @returns {number} Column index or -1 if not found
 */
function findColumnIndex(keyword) {
  return appState.csvData.headers.findIndex(header => 
    header.toLowerCase().includes(keyword));
}

/**
 * Clear select options except first one
 * @param {HTMLSelectElement} selectElement - Select element to clear
 */
function clearOptions(selectElement) {
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }
}

/**
 * Extract unique values from a specific column
 * @param {number} columnIndex - Column index to extract values from
 * @returns {string[]} Array of unique values
 */
function extractUniqueValues(columnIndex) {
  return [...new Set(
    appState.csvData.rows
      .map(row => row[columnIndex] ? row[columnIndex].replace(/"/g, '').trim() : null)
      .filter(Boolean)
  )].sort();
}

/**
 * Populate select element with options
 * @param {HTMLSelectElement} selectElement - Select element to populate
 * @param {string[]} values - Option values to add
 */
function populateSelectOptions(selectElement, values) {
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  });
}

/**
 * Apply filters to the table data
 */
function applyFilters() {
  const table = document.querySelector('table');
  if (!table) return;

  const teamMemberValue = appState.filters.teamMember;
  const projectValue = appState.filters.project;

  // Find column indices for filtering
  const teamColIdx = findColumnIndex('team');
  const projectColIdx = findColumnIndex('project');

  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, index) => {
    if (index === 0) return; // Skip header row
    
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length === 0) return;
    
    let showRow = true;
    
    // Filter by team member
    if (teamMemberValue && teamColIdx !== -1 && teamColIdx < cells.length) {
      const cellValue = cells[teamColIdx].textContent.trim();
      showRow = showRow && (cellValue === teamMemberValue);
    }
    
    // Filter by project
    if (projectValue && projectColIdx !== -1 && projectColIdx < cells.length) {
      const cellValue = cells[projectColIdx].textContent.trim();
      showRow = showRow && (cellValue === projectValue);
    }
    
    // Show or hide row
    row.style.display = showRow ? '' : 'none';
  });
}

/**
 * Filter table rows based on search query
 * @param {HTMLTableElement} table - Table to filter
 * @param {string} query - Search query
 */
function filterTable(table, query) {
  if (!query) {
    // If query is empty, show all rows (except headers) and return
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header
      row.style.display = '';
    });
    return;
  }

  const lowerQuery = query.toLowerCase();
  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, index) => {
    if (index === 0) return; // Skip header row
    
    const cells = Array.from(row.querySelectorAll('td'));
    const matches = cells.some(cell => 
      cell.textContent.toLowerCase().includes(lowerQuery)
    );
    
    row.style.display = matches ? '' : 'none';
  });
}

/**
 * Sort table by column
 * @param {HTMLTableElement} table - Table to sort
 * @param {number} columnIndex - Column index to sort by
 */
function sortTable(table, columnIndex) {
  const headerRow = table.querySelector('tr');
  const headers = Array.from(headerRow.querySelectorAll('th'));
  const currentHeader = headers[columnIndex];
  
  // Toggle sort direction
  const ascending = currentHeader.getAttribute('data-sort') !== 'asc';
  
  // Reset all headers
  headers.forEach(header => header.removeAttribute('data-sort'));
  
  // Set current header sort direction
  currentHeader.setAttribute('data-sort', ascending ? 'asc' : 'desc');
  
  // Get rows and convert to array (excluding header)
  const rowsArray = Array.from(table.querySelectorAll('tr')).slice(1);
  
  // Sort rows
  const sortedRows = rowsArray.sort((a, b) => {
    let aValue = a.children[columnIndex]?.textContent || '';
    let bValue = b.children[columnIndex]?.textContent || '';
    
    // Check if values are numbers
    const aNum = Number(aValue);
    const bNum = Number(bValue);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return ascending ? aNum - bNum : bNum - aNum;
    }
    
    // Otherwise sort as strings
    return ascending ? 
      aValue.localeCompare(bValue) : 
      bValue.localeCompare(aValue);
  });
  
  // Append sorted rows to table
  sortedRows.forEach(row => table.appendChild(row));
}