const { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let settings = {
    apiKey: '',
    model: 'gemini-2.0-flash',
    shortcut: 'Alt+Shift+S'
};

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// 設定の読み込み
function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf8');
            settings = { ...settings, ...JSON.parse(data) };
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// 設定の保存
function saveSettings() {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// メインウィンドウの作成
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 450,
        height: 700,
        minWidth: 380,
        minHeight: 500,
        frame: false,
        transparent: false,
        resizable: true,
        show: false,
        skipTaskbar: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow.webContents.send('settings-loaded', settings);
    });
}

// トレイアイコンの作成
function createTray() {
    // シンプルな16x16アイコンを作成
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');

    let trayIcon;
    if (fs.existsSync(iconPath)) {
        trayIcon = nativeImage.createFromPath(iconPath);
    } else {
        // アイコンがない場合は空のアイコンを作成
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'スクリーンショット撮影',
            click: () => captureAndAnalyze()
        },
        {
            label: 'ウィンドウを表示',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        { type: 'separator' },
        {
            label: '終了',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Gemini Screen Explainer');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

// グローバルショートカットの登録
function registerShortcut() {
    globalShortcut.unregisterAll();

    const success = globalShortcut.register(settings.shortcut, () => {
        console.log('Shortcut pressed:', settings.shortcut);
        captureAndAnalyze();
    });

    if (!success) {
        console.error('Failed to register shortcut:', settings.shortcut);
    }
}

// スクリーンショットを撮って解析
async function captureAndAnalyze() {
    try {
        console.log('Capturing screenshot...');

        // screenshot-desktopを使用
        const screenshot = require('screenshot-desktop');
        const imgBuffer = await screenshot({ format: 'png' });
        const base64Image = imgBuffer.toString('base64');

        console.log('Screenshot captured, size:', base64Image.length);

        // ウィンドウを表示
        mainWindow.show();
        mainWindow.focus();

        // レンダラーに送信
        mainWindow.webContents.send('screenshot-captured', {
            image: `data:image/png;base64,${base64Image}`,
            base64: base64Image
        });

    } catch (error) {
        console.error('Screenshot failed:', error);
        dialog.showErrorBox('エラー', 'スクリーンショットの撮影に失敗しました: ' + error.message);
    }
}

// IPCハンドラー
ipcMain.handle('get-settings', () => {
    return settings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
    settings = { ...settings, ...newSettings };
    saveSettings();
    registerShortcut();
    return true;
});

ipcMain.handle('capture-screenshot', async () => {
    await captureAndAnalyze();
});

ipcMain.handle('call-gemini-api', async (event, { contents }) => {
    if (!settings.apiKey) {
        throw new Error('APIキーが設定されていません');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
});

ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
});

ipcMain.on('window-close', () => {
    mainWindow.hide();
});

// アプリの初期化
app.whenReady().then(() => {
    loadSettings();
    createWindow();
    createTray();
    registerShortcut();

    mainWindow.show();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
