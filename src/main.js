const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function getIconPath() {
    switch (process.platform) {
        case 'darwin':
            return path.join(__dirname, '../IconikAIIcons/mac/icon.icns');
        case 'win32':
            return path.join(__dirname, '../IconikAIIcons/web/favicon.ico');
        case 'linux':
            return path.join(__dirname, '../IconikAIIcons/web/favicon-32x32.png');
        default:
            return path.join(__dirname, '../IconikAIIcons/web/favicon-32x32.png');
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 900,
        icon: getIconPath(),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.on('ready', () => {
    createWindow();
    if (process.platform === 'darwin') {
        app.dock.setIcon(path.join(__dirname, '../IconikAIIcons/ios/appstore.png'));
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});