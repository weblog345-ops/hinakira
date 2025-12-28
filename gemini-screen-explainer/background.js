// Gemini Screen Explainer - Background Service Worker

// アイコンクリック時にサイドパネルを開く
chrome.action.onClicked.addListener(async (tab) => {
    await captureAndOpenPanel(tab);
});

// ショートカットキーのハンドリング
chrome.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);
    if (command === 'capture-and-explain') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            await captureAndOpenPanel(tab);
        }
    }
});

// スクリーンショットを撮ってサイドパネルを開く
async function captureAndOpenPanel(tab) {
    console.log('captureAndOpenPanel called, tab:', tab.id, tab.url);

    let screenshot = null;

    // スクリーンショットを撮る（chrome:// ページなどでは失敗する）
    try {
        screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'png',
            quality: 100
        });
        console.log('Screenshot captured successfully');
    } catch (error) {
        console.error('Screenshot failed:', error.message);
    }

    // スクリーンショットをストレージに保存（サイドパネル用）
    if (screenshot) {
        await chrome.storage.local.set({
            pendingScreenshot: screenshot,
            captureTimestamp: Date.now(),
            autoAnalyze: true  // 自動解析フラグ
        });
        console.log('Screenshot saved to storage');
    }

    // サイドパネルを開く
    try {
        await chrome.sidePanel.open({ tabId: tab.id });
        console.log('Side panel opened');
    } catch (error) {
        console.error('Failed to open side panel:', error);
    }
}

// サイドパネルからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);

    if (message.action === 'captureScreenshot') {
        // サイドパネルからのキャプチャリクエスト
        chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
            if (tab) {
                try {
                    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
                        format: 'png',
                        quality: 100
                    });
                    sendResponse({ success: true, screenshot });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            } else {
                sendResponse({ success: false, error: 'No active tab' });
            }
        });
        return true; // 非同期レスポンスを示す
    }

    if (message.action === 'getPendingScreenshot') {
        // 保存されたスクリーンショットを取得
        chrome.storage.local.get(['pendingScreenshot', 'captureTimestamp', 'autoAnalyze']).then((result) => {
            if (result.pendingScreenshot && result.captureTimestamp) {
                const age = Date.now() - result.captureTimestamp;
                if (age < 30000) { // 30秒以内
                    // 取得後に削除
                    chrome.storage.local.remove(['pendingScreenshot', 'captureTimestamp', 'autoAnalyze']);
                    sendResponse({
                        success: true,
                        screenshot: result.pendingScreenshot,
                        autoAnalyze: result.autoAnalyze
                    });
                } else {
                    chrome.storage.local.remove(['pendingScreenshot', 'captureTimestamp', 'autoAnalyze']);
                    sendResponse({ success: false, error: 'Screenshot expired' });
                }
            } else {
                sendResponse({ success: false, error: 'No pending screenshot' });
            }
        });
        return true;
    }
});

// 拡張機能インストール時の初期化
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated');
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch(err => console.error('Failed to set panel behavior:', err));
});

console.log('Background service worker started');
