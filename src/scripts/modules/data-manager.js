/**
 * Data manager module for TimeTracker
 * Handles loading and processing CSV data
 */

const fs = require('fs');
const path = require('path');
const appState = require('./app-state');
const utils = require('./utils');

/**
 * DataManager class for handling CSV data operations
 */
class DataManager {
  constructor() {
    this.csvFilePath = path.join(__dirname, '../../../data/example_csv_time.csv');
  }

  /**
   * Load CSV data from file
   */
  loadCsvData() {
    let csvContent;
    
    try {
      csvContent = fs.readFileSync(this.csvFilePath, 'utf-8');
      console.log('CSV file loaded successfully');
      this.processCsvData(csvContent);
      return true;
    } catch (err) {
      console.error('Error loading CSV file:', err);
      document.getElementById('app').innerHTML = `<p>Error loading CSV file: ${err.message}</p>`;
      return false;
    }
  }

  /**
   * Process raw CSV content
   */
  processCsvData(csvContent) {
    if (!csvContent) return;
    
    const rows = csvContent.split('\n')
      .filter(row => row.trim())
      .map(row => row.split(','));
      
    const headers = rows.shift();
    
    appState.csvData.headers = headers.map(h => h.replace(/"/g, ''));
    appState.csvData.rows = rows;

    const dateColumns = this.findDateColumns();
    
    // Convert CSV data to central store format
    this.importCsvDataToCentralStore();
    
    // Return data that might be needed by other modules
    return {
      dateColumns
    };
  }

  /**
   * Import CSV data from a user-selected file
   * @param {File} file - The file object from the file input element
   * @returns {Promise<boolean>} - Success status of the import
   */
  importCsvFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvContent = event.target.result;
          this.processCsvData(csvContent);
          appState.centralStore.lastImport = new Date();
          resolve(true);
        } catch (err) {
          console.error('Error processing imported CSV:', err);
          reject(err);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Convert CSV data to unified format and add to central store
   */
  importCsvDataToCentralStore() {
    // Find column indices for mapping
    const teamColIdx = this.findColumnIndex('team') !== -1 ? 
      this.findColumnIndex('team') : this.findColumnIndex('teammitglied');
    const customerColIdx = this.findColumnIndex('kunde') !== -1 ?
      this.findColumnIndex('kunde') : this.findColumnIndex('kunden');
    const projectColIdx = this.findColumnIndex('projekt') !== -1 ? 
      this.findColumnIndex('projekt') : this.findColumnIndex('projekte');
    const assignmentColIdx = this.findColumnIndex('auftrag');
    const notesColIdx = this.findColumnIndex('note') !== -1 ? 
      this.findColumnIndex('note') : this.findColumnIndex('notizen');
    const startDateColIdx = this.findColumnIndex('start') !== -1 ?
      this.findColumnIndex('start') : this.findColumnIndex('datum');
    const durationColIdx = this.findDurationColumnIndex();
    const billedColIdx = this.findColumnIndex('abgerechnet');
    
    // Generate entries for central store from CSV data
    const importedEntries = appState.csvData.rows.map(row => {
      // Extract values with default fallbacks
      const teamMember = teamColIdx !== -1 && row[teamColIdx] ? row[teamColIdx].replace(/"/g, '').trim() : 'Unknown';
      const customer = customerColIdx !== -1 && row[customerColIdx] ? row[customerColIdx].replace(/"/g, '').trim() : '';
      const project = projectColIdx !== -1 && row[projectColIdx] ? row[projectColIdx].replace(/"/g, '').trim() : '';
      const assignment = assignmentColIdx !== -1 && row[assignmentColIdx] ? row[assignmentColIdx].replace(/"/g, '').trim() : '';
      const notes = notesColIdx !== -1 && row[notesColIdx] ? row[notesColIdx].replace(/"/g, '').trim() : '';
      
      // Parse date
      let startDate = new Date().toISOString().split('T')[0];
      if (startDateColIdx !== -1 && row[startDateColIdx]) {
        const parsedDate = utils.parseDate(row[startDateColIdx].replace(/"/g, '').trim());
        if (parsedDate) {
          startDate = utils.formatDateForIso(parsedDate);
        }
      }
      
      // Parse duration
      const durationStr = durationColIdx !== -1 && row[durationColIdx] ? row[durationColIdx].replace(/"/g, '').trim() : '00:00';
      
      // Parse billed status
      let billed = false;
      if (billedColIdx !== -1 && row[billedColIdx]) {
        const billedStatus = row[billedColIdx].replace(/"/g, '').trim().toLowerCase();
        billed = (billedStatus === 'ja' || billedStatus === 'yes' || billedStatus === 'true' || billedStatus === '1');
      }
      
      // Create entry in unified format
      return {
        id: utils.generateUniqueId(),
        teamMember,
        customer,
        project,
        assignment,
        notes,
        startDate,
        endDate: startDate, // Use same date if end date not available
        duration: durationStr,
        billed,
        timestamp: new Date().getTime(),
        source: 'csv_import' // Mark the source
      };
    });
    
    // Combine with existing entries
    const existingEntries = this.loadTimeEntriesFromLocalStorage();
    
    // Merge entries, removing potential duplicates (basic deduplication)
    const existingIds = existingEntries.map(entry => entry.id);
    const dedupedImportedEntries = importedEntries.filter(entry => !existingIds.includes(entry.id));
    
    // Update central store
    appState.centralStore.timeEntries = [...existingEntries, ...dedupedImportedEntries];
    
    // Save combined entries to localStorage
    this.saveTimeEntriesToLocalStorage(appState.centralStore.timeEntries);
    
    console.log(`Imported ${dedupedImportedEntries.length} entries to central store`);
  }
  
  /**
   * Load time entries from localStorage
   */
  loadTimeEntriesFromLocalStorage() {
    try {
      const savedEntries = localStorage.getItem('timeEntries');
      return savedEntries ? JSON.parse(savedEntries) : [];
    } catch (error) {
      console.error('Error loading time entries:', error);
      return [];
    }
  }
  
  /**
   * Save time entries to localStorage and update central store
   */
  saveTimeEntriesToLocalStorage(entries = null) {
    try {
      const dataToSave = entries || appState.centralStore.timeEntries;
      localStorage.setItem('timeEntries', JSON.stringify(dataToSave));
      appState.centralStore.timeEntries = dataToSave;
    } catch (error) {
      console.error('Error saving time entries:', error);
    }
  }

  /**
   * Initialize the central store with data from localStorage
   */
  initCentralStore() {
    appState.centralStore.timeEntries = this.loadTimeEntriesFromLocalStorage();
    console.log(`Central store initialized with ${appState.centralStore.timeEntries.length} entries`);
  }

  /**
   * Find date columns in the CSV headers
   */
  findDateColumns() {
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
   * Find column index by keyword
   */
  findColumnIndex(keyword) {
    return appState.csvData.headers.findIndex(header => 
      header.toLowerCase().includes(keyword.toLowerCase()));
  }

  /**
   * Find duration column index
   */
  findDurationColumnIndex() {
    return appState.csvData.headers.findIndex(header => 
      header.toLowerCase().includes('dauer') || header.toLowerCase().includes('duration'));
  }

  /**
   * Extract unique values from a column
   */
  extractUniqueValues(columnIndex) {
    return [...new Set(
      appState.csvData.rows
        .map(row => row[columnIndex] ? row[columnIndex].replace(/"/g, '').trim() : null)
        .filter(Boolean)
    )].sort();
  }

  /**
   * Clear options from a select element
   */
  clearOptions(selectElement) {
    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }
  }

  /**
   * Populate a select element with options
   */
  populateSelectOptions(selectElement, values) {
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectElement.appendChild(option);
    });
  }
}

// Create and export an instance of DataManager
const dataManager = new DataManager();
module.exports = dataManager;