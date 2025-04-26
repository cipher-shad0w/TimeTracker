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

  applyFiltersBtn.addEventListener('click', () => {
    appState.filters.teamMember = teamMemberFilter.value;
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
  
  const searchInput = createSearchInput();
  appDiv.appendChild(searchInput);

  const table = document.createElement('table');
  
  const headerRow = createTableHeaders(showCombinedDate, startDateIdx, endDateIdx);
  table.appendChild(headerRow);

  appState.csvData.rows.forEach(row => {
    const tableRow = createTableRow(row, showCombinedDate, startDateIdx, endDateIdx);
    table.appendChild(tableRow);
  });

  appDiv.appendChild(table);

  searchInput.addEventListener('input', () => {
    filterTable(table, searchInput.value);
  });
}

function createSearchInput() {
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Suche nach Mitarbeitern...';
  searchInput.classList.add('search-input');
  return searchInput;
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
  
  rowData.forEach((cell, index) => {
    if (showCombinedDate && (index === startDateIdx || index === endDateIdx)) {
      return;
    }
    
    const td = document.createElement('td');
    td.textContent = cell.replace(/"/g, '');
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
  
  const teamColIdx = findColumnIndex('team') !== -1 ? findColumnIndex('team') : 0; // Erste Spalte ist typischerweise "Teammitglied"
  const projectColIdx = findColumnIndex('projekt') !== -1 ? findColumnIndex('projekt') : 2; // Projekte sind typischerweise in der dritten Spalte
  
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
    
    row.style.display = showRow ? '' : 'none';
  });
}

function filterTable(table, query) {
  if (!query) {
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (index === 0) return;
      row.style.display = '';
    });
    return;
  }

  const lowerQuery = query.toLowerCase();
  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, index) => {
    if (index === 0) return;
    
    const cells = Array.from(row.querySelectorAll('td'));
    const matches = cells.some(cell => 
      cell.textContent.toLowerCase().includes(lowerQuery)
    );
    
    row.style.display = matches ? '' : 'none';
  });
}

function sortTable(table, columnIndex) {
  const headerRow = table.querySelector('tr');
  const headers = Array.from(headerRow.querySelectorAll('th'));
  const currentHeader = headers[columnIndex];
  
  const ascending = currentHeader.getAttribute('data-sort') !== 'asc';
  
  headers.forEach(header => header.removeAttribute('data-sort'));
  
  currentHeader.setAttribute('data-sort', ascending ? 'asc' : 'desc');
  
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