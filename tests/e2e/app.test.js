const { Application } = require('spectron');
const path = require('path');
const electronPath = require('electron');

describe('TimeTracker Application', () => {
  let app;
  
  // Timeout für E2E-Tests erhöhen
  jest.setTimeout(30000);
  
  beforeEach(async () => {
    app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '../../src')],
      env: {
        NODE_ENV: 'test'
      }
    });
    
    return app.start();
  });
  
  afterEach(async () => {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });
  
  test('App startet und zeigt das Hauptfenster an', async () => {
    const count = await app.client.getWindowCount();
    expect(count).toBe(1);
    
    // Überprüfe, ob der Titel korrekt ist
    const title = await app.client.getTitle();
    expect(title).toBe('TimeTracker');
  });
  
  test('CSV-Import funktioniert korrekt', async () => {
    // Den Import-Button finden und klicken
    const importButton = await app.client.$('#import-csv-button');
    await importButton.click();
    
    // Dialog sollte angezeigt werden (kann in Spectron schwer zu testen sein)
    // Stattdessen überprüfen, dass nach einem simulierten Import die Tabelle Daten enthält
    
    // Simuliere einen Import durch direkten Aufruf der Funktion
    await app.client.execute(() => {
      const testCsvData = 'id,name,startDate,endDate,hours,project,category,description,teamMemberId\n' +
                           '1,Test Entry,2023-05-01,2023-05-01,8,Test Project,Development,Test Description,user1';
      
      // Mock FileReader und Datei-Upload
      window.appState = window.appState || {};
      window.appState.centralStore = window.appState.centralStore || {};
      window.appState.centralStore.timeEntries = [];
      
      const dataManager = require('../../src/scripts/modules/data-manager');
      dataManager.processCsvData(testCsvData);
      
      const tableRenderer = require('../../src/scripts/modules/table-renderer');
      tableRenderer.renderDataTable(['startDate', 'endDate']);
    });
    
    // Überprüfen, ob die Tabelle Daten enthält
    const tableRows = await app.client.$$('#data-table tr');
    expect(tableRows.length).toBeGreaterThan(1); // Header + mindestens eine Zeile
  });
  
  test('Zeit-Tracking-Funktionalität', async () => {
    // Zum Zeit-Tracking-Tab wechseln
    const timeTrackingTab = await app.client.$('#tab-timetracking');
    await timeTrackingTab.click();
    
    // Start-Button finden und klicken
    const startButton = await app.client.$('#tt-start-button');
    await startButton.click();
    
    // Warten, damit die Timer-Anzeige aktualisiert wird (2 Sekunden)
    await app.client.pause(2000);
    
    // Überprüfen, ob der Timer läuft (sollte nicht mehr "00:00:00" anzeigen)
    const timerDisplay = await app.client.$('#tt-timer-display');
    const timerText = await timerDisplay.getText();
    expect(timerText).not.toBe('00:00:00');
    
    // Stop-Button klicken
    const stopButton = await app.client.$('#tt-stop-button');
    await stopButton.click();
    
    // Formular ausfüllen
    await app.client.$('#tt-team-member').selectByVisibleText('Team Member 1');
    await app.client.$('#tt-project').selectByVisibleText('Project A');
    await app.client.$('#tt-category').selectByVisibleText('Development');
    await app.client.$('#tt-description').setValue('E2E Test Entry');
    
    // Save-Button klicken
    const saveButton = await app.client.$('#tt-save-button');
    await saveButton.click();
    
    // Überprüfen, ob ein neuer Eintrag hinzugefügt wurde
    // Wechsle zurück zum Haupttab
    const mainTab = await app.client.$('#tab-main');
    await mainTab.click();
    
    // Überprüfen, ob die Tabelle den neuen Eintrag enthält
    const tableData = await app.client.$$('#data-table tr');
    expect(tableData.length).toBeGreaterThan(1);
    
    // Überprüfen, ob einer der Einträge "E2E Test Entry" enthält
    const tableText = await app.client.$('#data-table').getText();
    expect(tableText).toContain('E2E Test Entry');
  });
  
  test('Team-Ansicht zeigt Mitglieder und Statistiken', async () => {
    // Zum Team-Tab wechseln
    const teamTab = await app.client.$('#tab-team');
    await teamTab.click();
    
    // Überprüfen, ob die Team-Tabelle existiert
    const teamTable = await app.client.$('#team-time-entries-table');
    expect(await teamTable.isExisting()).toBe(true);
    
    // Überprüfen, ob die Statistiken angezeigt werden
    const statsSection = await app.client.$('#team-statistics');
    expect(await statsSection.isExisting()).toBe(true);
  });
  
  test('FIBU-Tab zeigt finanzielle Übersicht', async () => {
    // Zum FIBU-Tab wechseln
    const fibuTab = await app.client.$('#tab-fibu');
    await fibuTab.click();
    
    // Überprüfen, ob die FIBU-Tabelle existiert
    const fibuTable = await app.client.$('#fibu-table');
    expect(await fibuTable.isExisting()).toBe(true);
    
    // Überprüfen, ob die Summen-Zeile existiert
    const sumRow = await app.client.$('#fibu-sum-row');
    expect(await sumRow.isExisting()).toBe(true);
  });
  
  test('Filter- und Suchfunktionalität', async () => {
    // Zuerst einige Testdaten einfügen
    await app.client.execute(() => {
      window.appState = window.appState || {};
      window.appState.centralStore = window.appState.centralStore || {};
      window.appState.centralStore.timeEntries = [
        { id: '1', teamMemberId: 'user1', name: 'John', project: 'Project A', category: 'Development', hours: 8, startDate: '2023-05-01', endDate: '2023-05-01' },
        { id: '2', teamMemberId: 'user2', name: 'Jane', project: 'Project B', category: 'Meetings', hours: 4, startDate: '2023-05-02', endDate: '2023-05-02' },
        { id: '3', teamMemberId: 'user1', name: 'John', project: 'Project C', category: 'Planning', hours: 6, startDate: '2023-05-03', endDate: '2023-05-03' }
      ];
      
      const tableRenderer = require('../../src/scripts/modules/table-renderer');
      tableRenderer.renderDataTable(['startDate', 'endDate']);
    });
    
    // Suchfeld ausfüllen
    const searchInput = await app.client.$('#search-input');
    await searchInput.setValue('John');
    
    // Überprüfen, ob die Filterung funktioniert
    await app.client.pause(1000); // Kurz warten für die Filterung
    
    // Überprüfen, ob nur die Einträge von John angezeigt werden
    const visibleRows = await app.client.$$('#data-table tbody tr:not(.filtered-out)');
    expect(visibleRows.length).toBe(2); // Nur die zwei Einträge von John sollten sichtbar sein
  });
  
  test('Bearbeitbare Zellen funktionieren', async () => {
    // Testdaten einfügen
    await app.client.execute(() => {
      window.appState = window.appState || {};
      window.appState.centralStore = window.appState.centralStore || {};
      window.appState.centralStore.timeEntries = [
        { id: '1', name: 'Original Name', project: 'Project A', hours: 8, startDate: '2023-05-01', endDate: '2023-05-01' }
      ];
      
      const tableRenderer = require('../../src/scripts/modules/table-renderer');
      tableRenderer.renderDataTable(['startDate', 'endDate']);
    });
    
    // Eine bearbeitbare Zelle finden und anklicken
    const editableCell = await app.client.$('#data-table .editable-cell');
    await editableCell.doubleClick();
    
    // Neuen Wert eingeben
    await app.client.keys('Updated Name');
    await app.client.keys('Enter');
    
    // Überprüfen, ob der Wert aktualisiert wurde
    await app.client.pause(1000); // Kurz warten für die Aktualisierung
    
    // Überprüfen, ob die Zelle den neuen Wert enthält
    const updatedCell = await app.client.$('#data-table .editable-cell');
    const newText = await updatedCell.getText();
    expect(newText).toContain('Updated Name');
  });
});