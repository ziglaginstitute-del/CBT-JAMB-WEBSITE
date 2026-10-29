/**
 * PrepCBT - Standalone Offline CBT Examination System
 * Electron Main Process
 */

const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let isKioskActive = false;

// Offline JSON Database storage path in OS userData
const DB_FILE_NAME = 'prepcbt_offline_db.json';
const getDbPath = () => path.join(app.getPath('userData'), DB_FILE_NAME);

/**
 * Safely read local offline database from disk
 */
async function readOfflineDatabase() {
  const dbPath = getDbPath();
  try {
    if (!fs.existsSync(dbPath)) {
      return null;
    }
    const raw = await fs.promises.readFile(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[PrepCBT Main] Error reading offline database:', err);
    return null;
  }
}

/**
 * Safely persist local offline database to disk
 */
async function writeOfflineDatabase(data) {
  const dbPath = getDbPath();
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    const payload = {
      ...data,
      lastSaved: new Date().toISOString()
    };
    await fs.promises.writeFile(dbPath, JSON.stringify(payload, null, 2), 'utf8');
    return { success: true, path: dbPath };
  } catch (err) {
    console.error('[PrepCBT Main] Error saving offline database:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Configure Kiosk / Exam Lockdown Mode
 * Restricts student candidates from minimizing, switching apps, or opening external browsers
 */
function applyKioskMode(enable) {
  if (!mainWindow) return false;
  isKioskActive = Boolean(enable);

  if (isKioskActive) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setFullScreen(true);
    mainWindow.setKiosk(true);
    mainWindow.setResizable(false);
    mainWindow.setMovable(false);
    mainWindow.setMinimizable(false);
  } else {
    mainWindow.setKiosk(false);
    mainWindow.setFullScreen(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
    mainWindow.setMovable(true);
    mainWindow.setMinimizable(true);
  }

  return isKioskActive;
}

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1360, screenWidth),
    height: Math.min(900, screenHeight),
    minWidth: 1200,
    minHeight: 800,
    title: 'PrepCBT - Standard Offline CBT Examination System',
    backgroundColor: '#0f172a', // Tailwind slate-900
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  // Smooth show when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Block opening unverified external windows during CBT session
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Determine application load target (Vite dev server or packaged production build)
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || (process.argv.includes('--dev') ? 'http://localhost:3000' : null);

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      // Fallback if dev server is starting up or unavailable
      const distPath = path.join(__dirname, '../dist/index.html');
      if (fs.existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      }
    });
  } else {
    const distPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      // Local dev fallback
      mainWindow.loadURL('http://localhost:3000');
    }
  }

  // Prevent accidental close when in active examination lockdown mode
  mainWindow.on('close', (e) => {
    if (isKioskActive) {
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['Cancel', 'Exit Examination (Admin Authorization Required)'],
        defaultId: 0,
        cancelId: 0,
        title: 'CBT Examination Locked',
        message: 'Lockdown Examination Mode is currently active.',
        detail: 'Exiting will invalidate any ongoing candidate test sessions. Only invigilators with the administrator passcode should terminate this session.'
      });

      if (choice === 0) {
        e.preventDefault();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================================
// IPC Handlers for Local Database & Examination Utilities
// ============================================================================

// 1. Read offline database from appData
ipcMain.handle('load-local-data', async () => {
  return await readOfflineDatabase();
});

// 2. Save offline database to appData
ipcMain.handle('save-local-data', async (_event, payload) => {
  return await writeOfflineDatabase(payload);
});

// 3. Export Question Bank or full system data to USB Flash Drive (.json)
ipcMain.handle('export-data-usb', async (_event, payload) => {
  if (!mainWindow) return { success: false, error: 'No active window' };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const defaultFileName = `PrepCBT_Question_Bank_Export_${timestamp}.json`;

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export PrepCBT Question Bank to Flash Drive / Local Disk',
    defaultPath: defaultFileName,
    filters: [
      { name: 'JSON Exam Package (*.json)', extensions: ['json'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });

  if (canceled || !filePath) {
    return { success: false, canceled: true };
  }

  try {
    const jsonString = JSON.stringify(payload, null, 2);
    await fs.promises.writeFile(filePath, jsonString, 'utf8');
    return { success: true, filePath, size: jsonString.length };
  } catch (err) {
    console.error('[PrepCBT Main] Export to USB failed:', err);
    return { success: false, error: err.message };
  }
});

// 4. Import Questions / Candidates from USB Flash Drive (.json)
ipcMain.handle('import-data-usb', async () => {
  if (!mainWindow) return { success: false, error: 'No active window' };

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select PrepCBT Question Bank Package from USB / Disk',
    properties: ['openFile'],
    filters: [
      { name: 'JSON Exam Package (*.json)', extensions: ['json'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });

  if (canceled || !filePaths || filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    const raw = await fs.promises.readFile(filePaths[0], 'utf8');
    const parsed = JSON.parse(raw);
    return { 
      success: true, 
      filePath: filePaths[0],
      data: parsed 
    };
  } catch (err) {
    console.error('[PrepCBT Main] Import from USB failed:', err);
    return { success: false, error: 'Failed to parse JSON file: ' + err.message };
  }
});

// 5. Toggle Examination Kiosk / Fullscreen Lockdown Mode
ipcMain.handle('toggle-kiosk-mode', async (_event, enabled) => {
  const current = applyKioskMode(enabled);
  return { success: true, isKiosk: current };
});

// 6. Get Electron runtime system info
ipcMain.handle('get-app-info', async () => {
  return {
    isElectron: true,
    version: app.getVersion(),
    platform: process.platform,
    dbPath: getDbPath(),
    isKiosk: isKioskActive
  };
});

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
