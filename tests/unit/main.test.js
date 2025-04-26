/**
 * Unit tests for TimeTracker main process
 */
const path = require('path');

// Mock the Electron modules
jest.mock('electron', () => {
  const mockBrowserWindow = jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    on: jest.fn(),
    webContents: {
      openDevTools: jest.fn()
    }
  }));
  
  // Add mock property to BrowserWindow constructor for test access
  mockBrowserWindow.getAllWindows = jest.fn().mockReturnValue([]);
  
  return {
    app: {
      on: jest.fn((event, callback) => {
        if (event === 'ready') {
          callback();
        }
      }),
      quit: jest.fn()
    },
    BrowserWindow: mockBrowserWindow
  };
});

// Mock required Node.js modules
jest.mock('path', () => ({
  join: jest.fn((_, file) => file)
}));

// Test module
describe('Main Process', () => {
  let electron;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset module cache
    jest.resetModules();
    
    // Get fresh reference to electron mock
    electron = require('electron');
  });
  
  test('should create a browser window', () => {
    // Load the main module which triggers app ready event
    require('../../src/main');
    
    // Verify BrowserWindow was constructed
    expect(electron.BrowserWindow).toHaveBeenCalled();
    
    const constructorCall = electron.BrowserWindow.mock.calls[0][0];
    expect(constructorCall.width).toBe(800);
    expect(constructorCall.height).toBe(600);
    expect(constructorCall.webPreferences).toBeDefined();
    expect(constructorCall.webPreferences.nodeIntegration).toBe(true);
    expect(constructorCall.webPreferences.contextIsolation).toBe(false);
  });
  
  test('should load the index.html file', () => {
    require('../../src/main');
    
    const mockWindow = electron.BrowserWindow.mock.results[0].value;
    expect(mockWindow.loadFile).toHaveBeenCalledWith('index.html');
  });
  
  test('app should register window-all-closed event', () => {
    require('../../src/main');
    
    expect(electron.app.on).toHaveBeenCalledWith(
      'window-all-closed',
      expect.any(Function)
    );
  });
  
  test('app should register activate event', () => {
    require('../../src/main');
    
    expect(electron.app.on).toHaveBeenCalledWith(
      'activate',
      expect.any(Function)
    );
  });
  
  test('app should quit on window-all-closed if not on darwin', () => {
    require('../../src/main');
    
    // Find the window-all-closed callback
    const calls = electron.app.on.mock.calls;
    const windowAllClosedCallback = calls.find(call => call[0] === 'window-all-closed')[1];
    
    // Store original platform
    const originalPlatform = process.platform;
    
    // Mock platform as Windows
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    });
    
    // Call the callback
    windowAllClosedCallback();
    
    // Assert app.quit was called
    expect(electron.app.quit).toHaveBeenCalled();
    
    // Restore platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true
    });
  });
  
  test('app should not quit on window-all-closed if on darwin', () => {
    require('../../src/main');
    
    // Find the window-all-closed callback
    const calls = electron.app.on.mock.calls;
    const windowAllClosedCallback = calls.find(call => call[0] === 'window-all-closed')[1];
    
    // Store original platform
    const originalPlatform = process.platform;
    
    // Mock platform as macOS
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true
    });
    
    // Call the callback
    windowAllClosedCallback();
    
    // Assert app.quit was not called
    expect(electron.app.quit).not.toHaveBeenCalled();
    
    // Restore platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true
    });
  });
});