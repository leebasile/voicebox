import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as os from 'os';

/**
 * Voicebox — A cross-platform text-to-speech desktop application.
 * Main process entry point for Electron.
 */

const isDev = process.env.NODE_ENV === 'development';
const isMac = process.platform === 'darwin';

let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window with appropriate settings
 * for the current platform.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 680,
    minWidth: 680,
    minHeight: 480,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    backgroundColor: '#1a1a2e',
    show: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Load the renderer
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window once ready to avoid flash of unstyled content
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS re-create window when dock icon is clicked and no windows exist
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS keep the app running even when all windows are closed
  if (!isMac) {
    app.quit();
  }
});

// ── IPC handlers ─────────────────────────────────────────────────────────────

/**
 * Returns basic system information used by the renderer for diagnostics
 * and engine capability detection.
 */
ipcMain.handle('get-system-info', () => ({
  platform: process.platform,
  arch: process.arch,
  osVersion: os.release(),
  appVersion: app.getVersion(),
}));

/**
 * Opens the given directory path in the native file explorer.
 */
ipcMain.handle('open-directory', async (_event, dirPath: string) => {
  await shell.openPath(dirPath);
});
