/**
 * Utility functions for TimeTracker
 */

/**
 * Format duration string in HH:MM format
 */
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

/**
 * Parse duration string to minutes
 */
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

/**
 * Format minutes to HH:MM format
 */
function formatMinutesToHHMM(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

/**
 * Extract month number (1-12) from assignment string
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
 * Parse a date string into a Date object
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

/**
 * Generate a unique ID for entries
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Format a date for display
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE');
}

/**
 * Format a date for ISO storage
 */
function formatDateForIso(date) {
  return date.toISOString().split('T')[0];
}

module.exports = {
  formatDurationToHHMM,
  parseDurationToMinutes,
  formatMinutesToHHMM,
  extractMonthFromAuftrag,
  parseDate,
  generateUniqueId,
  formatDate,
  formatDateForIso
};