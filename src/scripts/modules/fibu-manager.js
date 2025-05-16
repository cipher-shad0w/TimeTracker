/**
 * Financial accounting (Fibu) manager module for TimeTracker
 * Handles financial calculations and reporting
 */

const appState = require('./app-state');
const dataManager = require('./data-manager');
const utils = require('./utils');

/**
 * Calculate average hourly wage based on fee and hours
 */
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
  const teamColIdx = dataManager.findColumnIndex('team');
  const projektColIdx = dataManager.findColumnIndex('projekt');
  const auftragColIdx = dataManager.findColumnIndex('auftrag'); 
  const durationColIdx = dataManager.findDurationColumnIndex();
  const startDateColIdx = dataManager.findColumnIndex('start') !== -1 ? dataManager.findColumnIndex('start') : -1;
  
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
      const durationMinutes = utils.parseDurationToMinutes(durationStr);
      if (durationMinutes <= 0) return;
      
      // Determine which month this entry belongs to
      let monthIndex = -1;
      
      // First try to extract month from Auftrag
      if (auftragColIdx !== -1) {
        const auftrag = row[auftragColIdx]?.replace(/"/g, '').trim() || '';
        const auftragMonth = utils.extractMonthFromAuftrag(auftrag);
        if (auftragMonth > 0) {
          monthIndex = auftragMonth - 1; // Convert to 0-based index
        }
      }
      
      // If no month from Auftrag, try the start date
      if (monthIndex === -1 && startDateColIdx !== -1) {
        const startDateStr = row[startDateColIdx]?.replace(/"/g, '').trim() || '';
        const startDate = utils.parseDate(startDateStr);
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
      cell.textContent = monthlyTotals[i] > 0 ? utils.formatMinutesToHHMM(monthlyTotals[i]) : '';
    }
  }
}

module.exports = {
  calculateAverageHourlyWage,
  populateFibuTimesRow
};