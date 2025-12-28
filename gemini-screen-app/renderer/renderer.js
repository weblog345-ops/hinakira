// Gemini Screen Explainer - Renderer

class App {
    constructor() {
        this.settings = {
            apiKey: '',
            model: 'gemini-2.0-flash',
            shortcut: 'Alt+Shift+S'
        };
        this.screenshotData = null;
        this.chatHistory = [];

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadSettings();
        this.setupIPCListeners();
    }

    async loadSettings() {
        try {
            const settings = await window.electronAPI.getSettings();
            this.settings = { ...this.settings, ...settings };
            this.updateSettingsUI();
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    updateSettingsUI() {
        if (this.settings.apiKey) {
            document.getElementById('apiKey').value = '••••••••••••••••';
        }
        document.getElementById('modelSelect').value = this.settings.model;
        document.getElementById('shortcutInput').value = this.settings.shortcut;
        document.getElementById('shortcutDisplay').textContent = this.settings.shortcut;
    }

    setupEventListeners() {
        // タイトルバーボタン
        document.getElementById('minimizeBtn').addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });

        document.getElementById('closeBtn').addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });

        // 設定
        document.getElementById('saveApiKeyBtn').addEventListener('click', () => this.saveApiKey());
        document.getElementById('modelSelect').addEventListener('change', (e) => this.saveModel(e.target.value));
        document.getElementById('saveShortcutBtn').addEventListener('click', () => this.saveShortcut());

        // APIキーリンク
        document.getElementById('apiKeyLink').addEventListener('click', (e) => {
            e.preventDefault();
            require('electron').shell.openExternal('https://aistudio.google.com/app/apikey');
        });

        // キャプチャ
        document.getElementById('captureBtn').addEventListener('click', () => this.captureScreen());

        // チャット
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // リセット
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    }

    setupIPCListeners() {
        // スクリーンショット受信
        window.electronAPI.onScreenshotCaptured((data) => {
            console.log('Screenshot received');
            this.screenshotData = data;
            this.showPreview(data.image);

            if (this.settings.apiKey) {
                this.analyzeScreenshot();
            } else {
                document.getElementById('settingsDetails').open = true;
                this.showError('APIキーを設定してください');
            }
        });

        // 設定読み込み
        window.electronAPI.onSettingsLoaded((settings) => {
            this.settings = { ...this.settings, ...settings };
            this.updateSettingsUI();
        });
    }

    async saveApiKey() {
        const input = document.getElementById('apiKey');
        const key = input.value.trim();

        if (key && key !== '••••••••••••••••') {
            this.settings.apiKey = key;
            await window.electronAPI.saveSettings({ apiKey: key });
            input.value = '••••••••••••••••';
            this.showMessage('APIキーを保存しました');

            // スクリーンショットがあれば解析開始
            if (this.screenshotData && this.chatHistory.length === 0) {
                this.analyzeScreenshot();
            }
        }
    }

    async saveModel(model) {
        this.settings.model = model;
        await window.electronAPI.saveSettings({ model });
    }

    async saveShortcut() {
        const input = document.getElementById('shortcutInput');
        const shortcut = input.value.trim();

        if (shortcut) {
            this.settings.shortcut = shortcut;
            await window.electronAPI.saveSettings({ shortcut });
            document.getElementById('shortcutDisplay').textContent = shortcut;
            this.showMessage('ショートカットを設定しました');
        }
    }

    async captureScreen() {
        if (!this.settings.apiKey) {
            document.getElementById('settingsDetails').open = true;
            this.showError('APIキーを設定してください');
            return;
        }

        await window.electronAPI.captureScreenshot();
    }

    showPreview(imageUrl) {
        document.getElementById('previewImage').src = imageUrl;
        document.getElementById('previewSection').classList.remove('hidden');
    }

    async analyzeScreenshot() {
        if (!this.screenshotData) return;

        this.showLoading(true);

        try {
            const response = await window.electronAPI.callGeminiAPI([
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType: 'image/png',
                                data: this.screenshotData.base64
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
                        { inlineData: { mimeType: 'image/png', data: this.screenshotData.base64 } },
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
            this.showError('解析に失敗しました: ' + error.message);
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
            const response = await window.electronAPI.callGeminiAPI(this.chatHistory);
            this.chatHistory.push({
                role: 'model',
                parts: [{ text: response }]
            });
            this.addMessage('assistant', response);
        } catch (error) {
            this.addMessage('assistant', 'エラー: ' + error.message);
        }
    }

    addMessage(role, text) {
        const container = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = `message ${role}`;
        div.innerHTML = `
            <div class="message-label">${role === 'assistant' ? '🤖 Gemini' : '👤 あなた'}</div>
            <div class="message-text">${this.escapeHtml(text)}</div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        document.querySelector('.container').insertBefore(div, document.querySelector('.section'));
        setTimeout(() => div.remove(), 5000);
    }

    showMessage(message) {
        const existing = document.querySelector('.success-message');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = 'error';
        div.style.background = 'rgba(39, 174, 96, 0.1)';
        div.style.borderColor = 'rgba(39, 174, 96, 0.3)';
        div.style.color = '#27ae60';
        div.textContent = message;
        document.querySelector('.settings-content').appendChild(div);
        setTimeout(() => div.remove(), 2000);
    }

    reset() {
        this.screenshotData = null;
        this.chatHistory = [];
        document.getElementById('previewSection').classList.add('hidden');
        document.getElementById('chatSection').classList.add('hidden');
        document.getElementById('resetSection').classList.add('hidden');
        document.getElementById('chatMessages').innerHTML = '';
        document.getElementById('captureBtn').disabled = false;
    }
}

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
