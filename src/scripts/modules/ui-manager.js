/**
 * UI Manager module for TimeTracker
 * Handles UI setup and interactions
 */

const appState = require('./app-state');
const dataManager = require('./data-manager');
const tableRenderer = require('./table-renderer');

/**
 * Setup sidebar toggle functionality
 */
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

/**
 * Setup tab switching functionality
 */
function setupTabs() {
  // Using the sidebar-tab-buttons instead of the old tab-buttons
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

/**
 * Setup filter events for data filtering
 */
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

/**
 * Apply filters to tables based on current filter state
 */
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

/**
 * Filter statistics table
 */
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

/**
 * Filter data table
 */
function filterDataTable(table, teamMemberValue, projectValue, searchQuery) {
  const dataManager = require('./data-manager');
  const teamColIdx = dataManager.findColumnIndex('team') !== -1 ? dataManager.findColumnIndex('team') : 0;
  const projectColIdx = dataManager.findColumnIndex('projekt') !== -1 ? dataManager.findColumnIndex('projekt') : 2;
  
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

/**
 * Setup search functionality
 */
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

/**
 * Search within table content
 */
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
    
    const notesIdx = require('./data-manager').findColumnIndex('notiz');
    const matchesNotes = notesIdx !== -1 && cells[notesIdx] && 
                        cells[notesIdx].textContent.toLowerCase().includes(lowerQuery);
    
    row.style.display = (matchesText || matchesNotes) ? '' : 'none';
  });
}

/**
 * Setup theme switch functionality
 */
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

/**
 * Setup editable cells
 */
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
}

/**
 * Update team member name display
 */
function updateTeamMemberName(teamMemberValue) {
  const element = document.getElementById('summary-team-member');
  if (element) {
    element.textContent = teamMemberValue || 'Alle Teammitglieder';
  }
}

/**
 * Setup CSV import functionality
 */
function setupCsvImport() {
  // First check if elements already exist
  if (document.getElementById('csv-import-button')) return;
  
  // Create the UI elements for CSV import
  createCsvImportUI();
  
  // Add event listeners
  const importButton = document.getElementById('csv-import-button');
  const fileInput = document.getElementById('csv-file-input');
  const importStatusMsg = document.getElementById('import-status-message');
  
  if (importButton && fileInput) {
    importButton.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', async (event) => {
      if (event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      importStatusMsg.textContent = `Importiere "${file.name}"...`;
      importStatusMsg.style.display = 'block';
      
      try {
        await dataManager.importCsvFromFile(file);
        
        // Update UI components
        const dateColumns = dataManager.findDateColumns();
        tableRenderer.renderDataTable(dateColumns);
        tableRenderer.calculateTeamMemberTimeStatistics();
        
        // Display success message with file name
        importStatusMsg.textContent = `CSV-Import erfolgreich: ${file.name}`;
        importStatusMsg.style.color = 'var(--color-green)';
        
        // Reset file input for future imports
        fileInput.value = '';
        
        // Hide message after 5 seconds
        setTimeout(() => {
          importStatusMsg.style.display = 'none';
        }, 5000);
        
      } catch (error) {
        console.error('CSV import failed:', error);
        importStatusMsg.textContent = `Fehler beim Import: ${error.message}`;
        importStatusMsg.style.color = 'var(--color-red)';
      }
    });
  }
}

/**
 * Create CSV import UI elements
 */
function createCsvImportUI() {
  // Create CSV import button in the main container
  const mainContainer = document.querySelector('.container');
  if (!mainContainer) return;
  
  // Create wrapper for the import elements
  const importWrapper = document.createElement('div');
  importWrapper.className = 'csv-import-wrapper';
  importWrapper.style.margin = '10px 0';
  importWrapper.style.padding = '10px';
  
  // Create import button
  const importButton = document.createElement('button');
  importButton.id = 'csv-import-button';
  importButton.className = 'action-button';
  importButton.innerHTML = '<i class="fas fa-file-import"></i> CSV importieren';
  importButton.style.marginRight = '10px';
  
  // Create hidden file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'csv-file-input';
  fileInput.accept = '.csv';
  fileInput.style.display = 'none';
  
  // Create status message element
  const statusMessage = document.createElement('div');
  statusMessage.id = 'import-status-message';
  statusMessage.style.display = 'none';
  statusMessage.style.margin = '10px 0';
  statusMessage.style.padding = '5px';
  
  // Add elements to the DOM
  importWrapper.appendChild(importButton);
  importWrapper.appendChild(fileInput);
  importWrapper.appendChild(statusMessage);
  
  // Add import wrapper after first heading or at the top
  const firstHeading = mainContainer.querySelector('h1, h2');
  if (firstHeading) {
    firstHeading.parentNode.insertBefore(importWrapper, firstHeading.nextSibling);
  } else {
    mainContainer.insertBefore(importWrapper, mainContainer.firstChild);
  }
}

module.exports = {
  setupSidebarToggle,
  setupTabs,
  setupFilterEvents,
  applyFilters,
  setupSearchFunction,
  setupThemeSwitch,
  setupEditableCells,
  updateTeamMemberName,
  setupCsvImport
};