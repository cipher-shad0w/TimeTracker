const path = require('path');

jest.mock('electron', () => {
  const mockBrowserWindow = jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    on: jest.fn(),
    webContents: {
      openDevTools: jest.fn()
    }
  }));
  
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

jest.mock('path', () => ({
  join: jest.fn((_, file) => file)
}));

describe('Main Process', () => {
  let electron;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.resetModules();
    
    electron = require('electron');
  });
  
  test('should create a browser window', () => {
    require('../../src/main');
    
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
    
    const calls = electron.app.on.mock.calls;
    const windowAllClosedCallback = calls.find(call => call[0] === 'window-all-closed')[1];
    
    const originalPlatform = process.platform;
    
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    });
    
    windowAllClosedCallback();
    
    expect(electron.app.quit).toHaveBeenCalled();
    
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true
    });
  });
  
  test('app should not quit on window-all-closed if on darwin', () => {
    require('../../src/main');
    
    const calls = electron.app.on.mock.calls;
    const windowAllClosedCallback = calls.find(call => call[0] === 'window-all-closed')[1];
    
    const originalPlatform = process.platform;
    
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true
    });
    
    windowAllClosedCallback();
    
    expect(electron.app.quit).not.toHaveBeenCalled();
    
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true
    });
  });
});