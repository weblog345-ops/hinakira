// Gemini Screen Explainer - Background Service Worker

// アイコンクリック時にサイドパネルを開く
chrome.action.onClicked.addListener(async (tab) => {
    await openSidePanelAndCapture(tab);
});

// ショートカットキーのハンドリング
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'capture-and-explain') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            await openSidePanelAndCapture(tab);
        }
    }
});

// サイドパネルを開いてスクリーンショットをキャプチャ
async function openSidePanelAndCapture(tab) {
    try {
        // スクリーンショットを先に撮る
        const screenshot = await chrome.tabs.captureVisibleTab(null, {
            format: 'png',
            quality: 100
        });

        // スクリーンショットをストレージに保存
        await chrome.storage.local.set({
            pendingScreenshot: screenshot,
            captureTimestamp: Date.now()
        });

        // サイドパネルを開く
        await chrome.sidePanel.open({ windowId: tab.windowId });

    } catch (error) {
        console.error('Failed to capture screenshot:', error);
    }
}

// 拡張機能インストール時の初期化
chrome.runtime.onInstalled.addListener(() => {
    // サイドパネルの動作を設定
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
