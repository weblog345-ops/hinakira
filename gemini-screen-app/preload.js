const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 設定
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

    // スクリーンショット
    captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),

    // Gemini API
    callGeminiAPI: (contents) => ipcRenderer.invoke('call-gemini-api', { contents }),

    // ウィンドウ操作
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    closeWindow: () => ipcRenderer.send('window-close'),

    // イベントリスナー
    onScreenshotCaptured: (callback) => {
        ipcRenderer.on('screenshot-captured', (event, data) => callback(data));
    },
    onSettingsLoaded: (callback) => {
        ipcRenderer.on('settings-loaded', (event, settings) => callback(settings));
    }
});
