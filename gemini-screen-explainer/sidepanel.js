// Gemini Screen Explainer - Side Panel Script

class GeminiScreenExplainer {
    constructor() {
        this.apiKey = '';
        this.model = 'gemini-2.0-flash';
        this.screenshotData = null;
        this.chatHistory = [];
        this.isProcessing = false;

        this.init();
    }

    async init() {
        console.log('[SidePanel] Initializing...');
        await this.loadSettings();
        this.setupEventListeners();
        this.setupStorageListener();

        // 起動時にペンディングスクリーンショットをチェック
        await this.checkPendingScreenshot();
    }

    setupStorageListener() {
        // ストレージの変更を監視
        chrome.storage.onChanged.addListener((changes, area) => {
            console.log('[SidePanel] Storage changed:', area, Object.keys(changes));
            if (area === 'local' && changes.pendingScreenshot && changes.pendingScreenshot.newValue) {
                console.log('[SidePanel] New screenshot detected in storage');
                this.checkPendingScreenshot();
            }
        });
    }

    async loadSettings() {
        const result = await chrome.storage.local.get(['geminiApiKey', 'geminiModel']);

        if (result.geminiApiKey) {
            this.apiKey = result.geminiApiKey;
            document.getElementById('apiKey').value = '••••••••••••••••';
            console.log('[SidePanel] API key loaded');
        }

        if (result.geminiModel) {
            this.model = result.geminiModel;
            document.getElementById('modelSelect').value = this.model;
        }
    }

    async checkPendingScreenshot() {
        if (this.isProcessing) {
            console.log('[SidePanel] Already processing, skipping');
            return;
        }

        console.log('[SidePanel] Checking for pending screenshot...');

        const result = await chrome.storage.local.get(['pendingScreenshot', 'captureTimestamp', 'autoAnalyze']);
        console.log('[SidePanel] Storage result:', {
            hasScreenshot: !!result.pendingScreenshot,
            timestamp: result.captureTimestamp,
            autoAnalyze: result.autoAnalyze
        });

        if (result.pendingScreenshot && result.captureTimestamp) {
            const age = Date.now() - result.captureTimestamp;
            console.log('[SidePanel] Screenshot age:', age, 'ms');

            if (age < 30000) { // 30秒以内
                this.isProcessing = true;
                this.screenshotData = result.pendingScreenshot;

                // ストレージから削除
                await chrome.storage.local.remove(['pendingScreenshot', 'captureTimestamp', 'autoAnalyze']);

                // プレビュー表示
                document.getElementById('previewImage').src = this.screenshotData;
                document.getElementById('screenshotPreview').classList.remove('hidden');
                console.log('[SidePanel] Screenshot preview displayed');

                // APIキーがあれば自動解析
                if (this.apiKey && result.autoAnalyze) {
                    console.log('[SidePanel] Starting auto-analysis...');
                    await this.analyzeScreenshot();
                } else if (!this.apiKey) {
                    document.getElementById('settingsDetails').open = true;
                    this.showError('APIキーを設定してください');
                }

                this.isProcessing = false;
            }
        }
    }

    setupEventListeners() {
        document.getElementById('saveApiKey').addEventListener('click', () => this.saveApiKey());
        document.getElementById('modelSelect').addEventListener('change', (e) => this.saveModel(e.target.value));
        document.getElementById('captureBtn').addEventListener('click', () => this.captureScreen());
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    }

    async saveApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        const key = apiKeyInput.value.trim();

        if (key && key !== '••••••••••••••••') {
            this.apiKey = key;
            await chrome.storage.local.set({ geminiApiKey: key });
            apiKeyInput.value = '••••••••••••••••';
            this.showTemporaryMessage('保存完了');

            if (this.screenshotData && this.chatHistory.length === 0) {
                await this.analyzeScreenshot();
            }
        }
    }

    async saveModel(model) {
        this.model = model;
        await chrome.storage.local.set({ geminiModel: model });
    }

    async captureScreen() {
        if (!this.apiKey) {
            document.getElementById('settingsDetails').open = true;
            this.showError('APIキーを設定してください');
            return;
        }

        console.log('[SidePanel] Manual capture requested');

        try {
            const response = await chrome.runtime.sendMessage({ action: 'captureScreenshot' });
            console.log('[SidePanel] Capture response:', response);

            if (response && response.success && response.screenshot) {
                this.screenshotData = response.screenshot;
                document.getElementById('previewImage').src = this.screenshotData;
                document.getElementById('screenshotPreview').classList.remove('hidden');
                await this.analyzeScreenshot();
            } else {
                this.showError('スクリーンショット失敗: ' + (response?.error || '不明なエラー'));
            }
        } catch (error) {
            console.error('[SidePanel] Capture error:', error);
            this.showError('スクリーンショット失敗: ' + error.message);
        }
    }

    async analyzeScreenshot() {
        if (!this.screenshotData) {
            this.showError('スクリーンショットがありません');
            return;
        }

        this.showLoading(true);

        try {
            const base64Data = this.screenshotData.replace(/^data:image\/\w+;base64,/, '');

            const response = await this.callGeminiAPI([
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType: 'image/png',
                                data: base64Data
                            }
                        },
                        {
                            text: 'この画面のスクリーンショットを詳しく説明してください。画面に表示されている内容、UIの構成、重要な情報などを日本語で解説してください。'
                        }
                    ]
                }
            ]);

            this.chatHistory = [
                {
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: base64Data } },
                        { text: '画面を説明してください' }
                    ]
                },
                {
                    role: 'model',
                    parts: [{ text: response }]
                }
            ];

            this.showLoading(false);
            this.showChatSection();
            this.addMessage('assistant', response);
            document.getElementById('settingsDetails').open = false;

        } catch (error) {
            this.showLoading(false);
            this.showError('解析失敗: ' + error.message);
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;

        input.value = '';
        this.addMessage('user', message);

        this.chatHistory.push({
            role: 'user',
            parts: [{ text: message }]
        });

        try {
            const response = await this.callGeminiAPI(this.chatHistory);
            this.chatHistory.push({
                role: 'model',
                parts: [{ text: response }]
            });
            this.addMessage('assistant', response);
        } catch (error) {
            this.addMessage('assistant', 'エラー: ' + error.message);
        }
    }

    async callGeminiAPI(contents) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    addMessage(role, text) {
        const container = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = `message ${role}`;
        div.innerHTML = `
            <div class="message-label">${role === 'assistant' ? '🤖 Gemini' : '👤 あなた'}</div>
            <div class="message-text">${text}</div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    showLoading(show) {
        document.getElementById('loadingSection').classList.toggle('hidden', !show);
        document.getElementById('captureBtn').disabled = show;
    }

    showChatSection() {
        document.getElementById('chatSection').classList.remove('hidden');
        document.getElementById('resetSection').classList.remove('hidden');
    }

    showError(message) {
        const existing = document.querySelector('.error');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = 'error';
        div.textContent = message;
        document.querySelector('.container').insertBefore(div, document.getElementById('screenshotSection'));
        setTimeout(() => div.remove(), 5000);
    }

    showTemporaryMessage(message) {
        const btn = document.getElementById('saveApiKey');
        const original = btn.textContent;
        btn.textContent = '✓ ' + message;
        setTimeout(() => btn.textContent = original, 1500);
    }

    reset() {
        this.screenshotData = null;
        this.chatHistory = [];
        document.getElementById('screenshotPreview').classList.add('hidden');
        document.getElementById('chatSection').classList.add('hidden');
        document.getElementById('resetSection').classList.add('hidden');
        document.getElementById('chatMessages').innerHTML = '';
        document.getElementById('captureBtn').disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[SidePanel] DOM loaded');
    window.app = new GeminiScreenExplainer();
});
