// Gemini Screen Explainer - Background Service Worker

// アイコンクリック時にサイドパネルを開く
chrome.action.onClicked.addListener(async (tab) => {
    await openSidePanelAndCapture(tab);
});

// ショートカットキーのハンドリング
chrome.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);
    if (command === 'capture-and-explain') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Active tab:', tab);
        if (tab) {
            await openSidePanelAndCapture(tab);
        }
    }
});

// サイドパネルを開いてスクリーンショットをキャプチャ
async function openSidePanelAndCapture(tab) {
    console.log('openSidePanelAndCapture called with tab:', tab.id);

    try {
        // スクリーンショットを撮る
        const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'png',
            quality: 100
        });
        console.log('Screenshot captured');

        // スクリーンショットをストレージに保存
        await chrome.storage.local.set({
            pendingScreenshot: screenshot,
            captureTimestamp: Date.now()
        });
        console.log('Screenshot saved to storage');

        // サイドパネルを開く (tabIdを指定)
        await chrome.sidePanel.open({ tabId: tab.id });
        console.log('Side panel opened');

    } catch (error) {
        console.error('Failed to capture screenshot:', error);

        // スクリーンショットに失敗しても、サイドパネルは開く
        try {
            await chrome.sidePanel.open({ tabId: tab.id });
        } catch (e) {
            console.error('Failed to open side panel:', e);
        }
    }
}

// 拡張機能インストール時の初期化
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    // サイドパネルの動作を設定
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch(err => console.error('Failed to set panel behavior:', err));
});

// Service Worker起動時のログ
console.log('Background service worker started');
