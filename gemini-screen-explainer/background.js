// Gemini Screen Explainer - Background Service Worker

console.log('[Background] Service worker started');

// アイコンクリック または ショートカットキー(_execute_action) で発火
chrome.action.onClicked.addListener(async (tab) => {
    console.log('[Background] Action clicked or shortcut pressed, tab:', tab.id, tab.url);
    await captureAndOpenPanel(tab);
});

// スクリーンショットを撮ってサイドパネルを開く
async function captureAndOpenPanel(tab) {
    console.log('[Background] captureAndOpenPanel called');

    let screenshot = null;

    // スクリーンショットを撮る
    try {
        screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'png',
            quality: 100
        });
        console.log('[Background] Screenshot captured, length:', screenshot.length);
    } catch (error) {
        console.error('[Background] Screenshot failed:', error.message);
    }

    // スクリーンショットをストレージに保存
    if (screenshot) {
        await chrome.storage.local.set({
            pendingScreenshot: screenshot,
            captureTimestamp: Date.now(),
            autoAnalyze: true
        });
        console.log('[Background] Screenshot saved to storage');
    }

    // サイドパネルを開く
    try {
        await chrome.sidePanel.open({ tabId: tab.id });
        console.log('[Background] Side panel opened');
    } catch (error) {
        console.error('[Background] Failed to open side panel:', error);
    }
}

// サイドパネルからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Message received:', message.action);

    if (message.action === 'captureScreenshot') {
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
        return true;
    }
});

// 拡張機能インストール時の初期化
chrome.runtime.onInstalled.addListener(() => {
    console.log('[Background] Extension installed/updated');
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch(err => console.error('[Background] setPanelBehavior error:', err));
});
