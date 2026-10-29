/**
 * PrepCBT - Standalone Offline CBT Examination System
 * Electron Preload Script
 * 
 * Securely bridges native IPC capabilities to the React Renderer via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Flag indicating application is operating inside native desktop shell
  isElectron: true,

  // Local File System Persistence (appData/prepcbt_offline_db.json)
  loadData: () => ipcRenderer.invoke('load-local-data'),
  saveData: (data) => ipcRenderer.invoke('save-local-data', data),

  // USB Flash Drive Import / Export
  exportDataToUSB: (data) => ipcRenderer.invoke('export-data-usb', data),
  importDataFromUSB: () => ipcRenderer.invoke('import-data-usb'),

  // Examination Lockdown / Anti-Cheating Kiosk Mode
  toggleKioskMode: (enabled) => ipcRenderer.invoke('toggle-kiosk-mode', enabled),

  // Native diagnostic information
  getAppInfo: () => ipcRenderer.invoke('get-app-info')
});
