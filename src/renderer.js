const fs = require('fs');
const path = require('path');

// Global variable to store our data
let csvData = {
    headers: [],
    rows: []
};

// Tab Functionality
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadCsvData();
    setupFilterEvents();
    setupThemeSwitch();
});

// Theme Switch Functionality
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
    themeSwitch.addEventListener('change', function(e) {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        }
    });
}

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

// Set up event listeners for sidebar filters
function setupFilterEvents() {
    const teamMemberFilter = document.getElementById('team-member-filter');
    const projectFilter = document.getElementById('project-filter');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');

    // Apply filters button click
    applyFiltersBtn.addEventListener('click', () => {
        applyFilters();
    });

    // Reset filters button click
    resetFiltersBtn.addEventListener('click', () => {
        teamMemberFilter.value = '';
        projectFilter.value = '';
        applyFilters();
    });
}

// Load CSV data and set up table
function loadCsvData() {
    // Load the CSV file
    const csvFilePath = path.join(__dirname, '../example_csv_time.csv');
    let csv;
    let table;
    
    try {
        csv = fs.readFileSync(csvFilePath, 'utf-8');
        console.log('CSV file loaded successfully');
    } catch (err) {
        console.error('Error loading CSV file:', err);
        document.getElementById('app').innerHTML = `<p>Error loading CSV file: ${err.message}</p>`;
        return;
    }

    if (csv) {
        // Parse the CSV file
        const rows = csv.split('\n').filter(row => row.trim()).map(row => row.split(','));
        const headers = rows.shift();
        
        // Store parsed data in our global variable
        csvData.headers = headers.map(h => h.replace(/"/g, ''));
        csvData.rows = rows;

        // Find indices for start and end date columns
        const startDateIdx = csvData.headers.findIndex(header => 
            header.toLowerCase().includes('start date'));
        const endDateIdx = csvData.headers.findIndex(header => 
            header.toLowerCase().includes('end date'));
        
        // Add a new "Bearbeitungsdatum" header if both date columns exist
        const showCombinedDate = startDateIdx !== -1 && endDateIdx !== -1;
        if (showCombinedDate) {
            csvData.headers.push('Bearbeitungsdatum');
        }

        // Render the data
        const appDiv = document.getElementById('app');
        
        // Create search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Suche nach Mitarbeitern...';
        searchInput.classList.add('search-input');
        appDiv.appendChild(searchInput);

        // Create table
        table = document.createElement('table');

        // Create table headers
        const headerRow = document.createElement('tr');
        csvData.headers.forEach((header, index) => {
            // Skip rendering the original date columns if we're showing the combined date
            if (showCombinedDate && (index === startDateIdx || index === endDateIdx)) {
                return;
            }
            
            const th = document.createElement('th');
            th.textContent = header.replace(/"/g, '');
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => sortTable(table, index));
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Create table rows
        rows.forEach(row => {
            const tr = document.createElement('tr');
            
            // Process regular cells
            row.forEach((cell, index) => {
                // Skip rendering the original date columns if we're showing the combined date
                if (showCombinedDate && (index === startDateIdx || index === endDateIdx)) {
                    return;
                }
                
                const td = document.createElement('td');
                td.textContent = cell.replace(/"/g, '');
                tr.appendChild(td);
            });
            
            // Add the combined date cell if both date columns exist
            if (showCombinedDate) {
                const td = document.createElement('td');
                // Use the start date as the bearbeitungsdatum since they should be the same day
                if (row[startDateIdx]) {
                    td.textContent = row[startDateIdx].replace(/"/g, '');
                }
                tr.appendChild(td);
            }
            
            table.appendChild(tr);
        });

        appDiv.appendChild(table);

        // Add event listener for search
        searchInput.addEventListener('input', () => {
            filterTable(table, searchInput.value);
        });
        
        // Populate filter options from data if needed
        populateFilterOptions();
    }
}

// Populate filter options based on actual data
function populateFilterOptions() {
    const teamMemberFilter = document.getElementById('team-member-filter');
    const projectFilter = document.getElementById('project-filter');
    
    // Determine column indices
    const teamColIdx = csvData.headers.findIndex(header => 
        header.toLowerCase().includes('teammitglied') || header.toLowerCase().includes('team'));
    const projectColIdx = csvData.headers.findIndex(header => 
        header.toLowerCase().includes('projekte') || header.toLowerCase().includes('projekt'));
    
    // Clear existing options except first one (All)
    while (teamMemberFilter.options.length > 1) {
        teamMemberFilter.remove(1);
    }
    
    while (projectFilter.options.length > 1) {
        projectFilter.remove(1);
    }
    
    // Add team members from actual data
    if (teamColIdx !== -1) {
        // Get unique team member names from data
        const uniqueTeamMembers = [...new Set(csvData.rows.map(row => {
            if (row[teamColIdx]) return row[teamColIdx].replace(/"/g, '').trim();
            return null;
        }).filter(Boolean))].sort();
        
        // Add options to select
        uniqueTeamMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            teamMemberFilter.appendChild(option);
        });
    }
    
    // Add projects from actual data
    if (projectColIdx !== -1) {
        // Get unique project names from data
        const uniqueProjects = [...new Set(csvData.rows.map(row => {
            if (row[projectColIdx]) return row[projectColIdx].replace(/"/g, '').trim();
            return null;
        }).filter(Boolean))].sort();
        
        // Add options to select
        uniqueProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
            projectFilter.appendChild(option);
        });
    }
}

// Apply filters to the table
function applyFilters() {
    const table = document.querySelector('table');
    if (!table) return;

    const teamMemberValue = document.getElementById('team-member-filter').value;
    const projectValue = document.getElementById('project-filter').value;

    // Determine column indices for filtering
    const teamColIdx = csvData.headers.findIndex(header => 
        header.toLowerCase().includes('teammitglied') || header.toLowerCase().includes('team'));
    const projectColIdx = csvData.headers.findIndex(header => 
        header.toLowerCase().includes('projekte') || header.toLowerCase().includes('projekt'));

    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        if (index === 0) return; // Skip header row
        
        const cells = Array.from(row.querySelectorAll('td'));
        
        // Skip if no cells
        if (cells.length === 0) return;
        
        let showRow = true;
        
        // Filter by team member
        if (teamMemberValue && teamColIdx !== -1) {
            // Exakte Übereinstimmung mit dem ausgewählten Teammitglied
            const cellValue = cells[teamColIdx].textContent.trim();
            showRow = showRow && (cellValue === teamMemberValue);
        }
        
        // Filter by project
        if (projectValue && projectColIdx !== -1) {
            // Exakte Übereinstimmung mit dem ausgewählten Projekt
            const cellValue = cells[projectColIdx].textContent.trim();
            showRow = showRow && (cellValue === projectValue);
        }
        
        // Zeile anzeigen oder ausblenden
        row.style.display = showRow ? '' : 'none';
    });
}

// Table filter function
function filterTable(table, query) {
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, index) => {
        if (index === 0) return; // Skip header row
        const cells = Array.from(row.querySelectorAll('td'));
        const matches = cells.some(cell => cell.textContent.toLowerCase().includes(query.toLowerCase()));
        row.style.display = matches ? '' : 'none';
    });
}

// Table sort function
function sortTable(table, columnIndex) {
    const rowsArray = Array.from(table.querySelectorAll('tr')).slice(1); // Exclude header row
    const sortedRows = rowsArray.sort((a, b) => {
        const aText = a.children[columnIndex].textContent;
        const bText = b.children[columnIndex].textContent;
        return aText.localeCompare(bText);
    });
    sortedRows.forEach(row => table.appendChild(row));
}