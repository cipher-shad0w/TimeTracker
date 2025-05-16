/**
 * Time Tracker module for TimeTracker
 * Handles time tracking functionality and entries management
 */

const dataManager = require('./data-manager');
const utils = require('./utils');

/**
 * Set up the time tracker functionality
 */
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
  const timeTrackerTable = document.getElementById('time-tracker-table')?.querySelector('tbody');
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
  if (saveEntryBtn) {
    saveEntryBtn.addEventListener('click', () => {
      saveTimeEntry();
    });
  }

  // Farben für Kategorieeinträge
  const colors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#009688', '#673AB7', '#CDDC39', '#795548', '#3F51B5'
  ];

  // Daten aus der CSV-Datei laden
  const teamMembers = dataManager.extractUniqueValues(dataManager.findColumnIndex('teammitglied') !== -1 ? dataManager.findColumnIndex('teammitglied') : 0);
  const customers = dataManager.extractUniqueValues(dataManager.findColumnIndex('kunden') !== -1 ? dataManager.findColumnIndex('kunden') : 1);
  const projects = dataManager.extractUniqueValues(dataManager.findColumnIndex('projekte') !== -1 ? dataManager.findColumnIndex('projekte') : 2);

  // Standardmäßig die Team-Kategorie laden
  if (categoryList) {
    loadCategoryItems('team');
  }

  // Event-Listener für Kategorie-Tabs
  if (categoryTabs) {
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
  }

  // Event-Listener für Kategorie-Suche
  if (categorySearch) {
    categorySearch.addEventListener('input', () => {
      filterCategoryItems(categorySearch.value);
    });
  }

  // Event-Listener für Auftragsfeld
  if (assignmentInput) {
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
  }

  // Aktions-Buttons
  if (saveEntryBtn) {
    saveEntryBtn.addEventListener('click', () => {
      saveTimeEntry();
    });
  }

  if (resetEntryBtn) {
    resetEntryBtn.addEventListener('click', () => {
      resetForm();
    });
  }

  if (deleteEntryBtn) {
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
  }

  // Sortieren und Filtern von Einträgen
  if (sortDateButton) {
    sortDateButton.addEventListener('click', () => {
      timeEntries.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      renderTimeEntries();
    });
  }

  if (filterUnbilledButton) {
    filterUnbilledButton.addEventListener('click', () => {
      filterUnbilledButton.classList.toggle('active');
      renderTimeEntries();
    });
  }

  // Ersten Tabellen-Render
  if (timeTrackerTable) {
    renderTimeEntries();
  }

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
    
    if (!displayElement) return;
    
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
      id: entryIdInput.value || utils.generateUniqueId(),
      teamMember: selectedTeamInput.value,
      customer: selectedCustomerInput.value,
      project: selectedProjectInput.value,
      assignment: assignmentInput.value || '',
      notes: timeEntryNotes.value || '',
      startDate: utils.formatDateForIso(now),
      endDate: utils.formatDateForIso(now),
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
      dateCell.textContent = utils.formatDate(entry.startDate);
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
}

/**
 * Populate dropdowns for category selection
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
  const teamColIdx = dataManager.findColumnIndex('team') !== -1 ? dataManager.findColumnIndex('team') : 0;
  const customerColIdx = dataManager.findColumnIndex('kund') !== -1 ? dataManager.findColumnIndex('kund') : 1; // matches kunde/kunden
  const projectColIdx = dataManager.findColumnIndex('projekt') !== -1 ? dataManager.findColumnIndex('projekt') : 2;
  
  // Get unique values for each category
  const teamMembers = dataManager.extractUniqueValues(teamColIdx);
  const customers = dataManager.extractUniqueValues(customerColIdx);
  const projects = dataManager.extractUniqueValues(projectColIdx);
  
  // Populate select elements
  dataManager.populateSelectOptions(teamSelect, teamMembers);
  dataManager.populateSelectOptions(customerSelect, customers);
  dataManager.populateSelectOptions(projectSelect, projects);
  
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

module.exports = {
  setupTimeTracker,
  populateCategoryDropdowns
};