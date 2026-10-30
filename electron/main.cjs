/**
 * PrepCBT - Standalone Offline CBT Examination System
 * Electron Main Process
 */

const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

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
    minWidth: 1024,
    minHeight: 700,
    title: 'PrepCBT - Standard Offline CBT Examination System',
    backgroundColor: '#0f172a', // Tailwind slate-900
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false // Facilitate local file loading across relative assets
    }
  });

  // Smooth show when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Safety fallback: Ensure window is visible even if ready-to-show is delayed
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 2000);

  // Enable F12 toggle for debugging
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Block opening unverified external windows during CBT session
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Determine application load target (Vite dev server or packaged production build)
  const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || (isDev ? 'http://localhost:3000' : null);

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl).catch(() => {
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

ipcMain.handle('load-local-data', async () => {
  return await readOfflineDatabase();
});

ipcMain.handle('save-local-data', async (_event, payload) => {
  return await writeOfflineDatabase(payload);
});

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

ipcMain.handle('toggle-kiosk-mode', async (_event, enabled) => {
  const current = applyKioskMode(enabled);
  return { success: true, isKiosk: current };
});

ipcMain.handle('get-app-info', async () => {
  return {
    isElectron: true,
    version: app.getVersion(),
    platform: process.platform,
    dbPath: getDbPath(),
    isKiosk: isKioskActive
  };
});

/**
 * Universal Native HTTP Dispatcher for Email Delivery
 * Bypasses all browser CORS restrictions and dispatches directly from Node.js
 */
function makeHttpRequest(targetUrl, options, postData) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(targetUrl);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const reqOptions = {
        method: options.method || 'POST',
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        headers: options.headers || {}
      };

      const req = client.request(reqOptions, (res) => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: raw
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.setTimeout(20000, () => {
        req.destroy();
        reject(new Error('Network request timed out after 20 seconds. Please check your internet connection.'));
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

ipcMain.handle('send-native-email', async (_event, payload) => {
  const { provider, settings, to, subject, html, text, templateParams } = payload || {};

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email address.' };
  }

  try {
    if (provider === 'resend') {
      const apiKey = settings?.resendApiKey?.trim();
      if (!apiKey) {
        return { success: false, error: 'Resend API key is not configured. Please enter your API key in Email Settings.' };
      }

      const fromAddress = settings?.resendFrom?.trim() || 'PrepCBT <onboarding@resend.dev>';
      const postBody = JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject: subject || 'PrepCBT Examination Statement of Result',
        html: html || `<pre>${text}</pre>`,
        text: text || ''
      });

      const res = await makeHttpRequest('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postBody)
        }
      }, postBody);

      let parsed = {};
      try { parsed = JSON.parse(res.data); } catch { parsed = { raw: res.data }; }

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return { success: true, provider: 'resend', id: parsed.id };
      } else {
        const errorMsg = parsed.message || parsed.error || `HTTP ${res.statusCode}: ${res.data}`;
        return { success: false, provider: 'resend', error: errorMsg };
      }

    } else if (provider === 'emailjs') {
      const serviceId = settings?.emailjsServiceId?.trim();
      const templateId = settings?.emailjsTemplateId?.trim();
      const publicKey = settings?.emailjsPublicKey?.trim();

      if (!serviceId || !templateId || !publicKey) {
        return { success: false, error: 'EmailJS credentials incomplete. Please configure Service ID, Template ID, and Public Key.' };
      }

      const postBody = JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: to,
          to_name: templateParams?.candidateName || 'Candidate',
          subject: subject,
          message: text,
          html_message: html,
          ...templateParams
        }
      });

      const res = await makeHttpRequest('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postBody)
        }
      }, postBody);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return { success: true, provider: 'emailjs' };
      } else {
        return { success: false, provider: 'emailjs', error: `EmailJS responded with error: ${res.data}` };
      }

    } else if (provider === 'webhook') {
      const webhookUrl = settings?.webhookUrl?.trim();
      if (!webhookUrl) {
        return { success: false, error: 'Webhook / Google Apps Script URL is missing in Email Settings.' };
      }

      const postBody = JSON.stringify({
        to,
        subject,
        text,
        html,
        templateParams,
        timestamp: new Date().toISOString()
      });

      const res = await makeHttpRequest(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postBody)
        }
      }, postBody);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return { success: true, provider: 'webhook', data: res.data };
      } else {
        return { success: false, provider: 'webhook', error: `Webhook endpoint returned HTTP ${res.statusCode}: ${res.data}` };
      }

    } else {
      return { success: false, error: `Unknown email provider: "${provider}". Please choose Resend, EmailJS, or Webhook.` };
    }

  } catch (err) {
    console.error('[PrepCBT Native Email Dispatch Error]:', err);
    return { success: false, error: err.message || 'Network error occurred while connecting to email service.' };
  }
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
