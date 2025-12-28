// Gemini Screen Explainer - Popup Script

class GeminiScreenExplainer {
    constructor() {
        this.apiKey = '';
        this.model = 'gemini-2.0-flash';
        this.screenshotData = null;
        this.chatHistory = [];

        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        await this.displayShortcut();
    }

    async loadSettings() {
        const result = await chrome.storage.local.get(['geminiApiKey', 'geminiModel']);

        if (result.geminiApiKey) {
            this.apiKey = result.geminiApiKey;
            document.getElementById('apiKey').value = '••••••••••••••••';
        }

        if (result.geminiModel) {
            this.model = result.geminiModel;
            document.getElementById('modelSelect').value = this.model;
        }
    }

    async displayShortcut() {
        try {
            const commands = await chrome.commands.getAll();
            const actionCommand = commands.find(cmd => cmd.name === '_execute_action');

            if (actionCommand && actionCommand.shortcut) {
                document.getElementById('currentShortcut').textContent =
                    `現在のショートカット: ${actionCommand.shortcut}`;
            } else {
                document.getElementById('currentShortcut').textContent =
                    'ショートカット未設定';
            }
        } catch (e) {
            console.log('Could not get shortcuts:', e);
        }
    }

    setupEventListeners() {
        // APIキー保存
        document.getElementById('saveApiKey').addEventListener('click', () => this.saveApiKey());

        // モデル選択
        document.getElementById('modelSelect').addEventListener('change', (e) => this.saveModel(e.target.value));

        // ショートカット設定リンク
        document.getElementById('shortcutLink').addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
        });

        // スクリーンショット
        document.getElementById('captureBtn').addEventListener('click', () => this.captureScreen());

        // チャット送信
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // リセット
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    }

    async saveApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        const key = apiKeyInput.value.trim();

        if (key && key !== '••••••••••••••••') {
            this.apiKey = key;
            await chrome.storage.local.set({ geminiApiKey: key });
            apiKeyInput.value = '••••••••••••••••';
            this.showTemporaryMessage('APIキーを保存しました！');
        }
    }

    async saveModel(model) {
        this.model = model;
        await chrome.storage.local.set({ geminiModel: model });
    }

    async captureScreen() {
        if (!this.apiKey) {
            this.showError('APIキーを設定してください');
            return;
        }

        try {
            // 現在のタブのスクリーンショットを取得
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            const screenshot = await chrome.tabs.captureVisibleTab(null, {
                format: 'png',
                quality: 100
            });

            this.screenshotData = screenshot;

            // プレビュー表示
            document.getElementById('previewImage').src = screenshot;
            document.getElementById('screenshotPreview').classList.remove('hidden');

            // Geminiで解析
            await this.analyzeScreenshot();

        } catch (error) {
            this.showError('スクリーンショットの取得に失敗しました: ' + error.message);
        }
    }

    async analyzeScreenshot() {
        this.showLoading(true);

        try {
            // Base64データを抽出
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

            // チャット履歴に追加
            this.chatHistory = [
                {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType: 'image/png',
                                data: base64Data
                            }
                        },
                        { text: '画面を説明してください' }
                    ]
                },
                {
                    role: 'model',
                    parts: [{ text: response }]
                }
            ];

            // 結果を表示
            this.showLoading(false);
            this.showChatSection();
            this.addMessage('assistant', response);

        } catch (error) {
            this.showLoading(false);
            this.showError('画像の解析に失敗しました: ' + error.message);
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        input.value = '';
        this.addMessage('user', message);

        // チャット履歴に追加
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                }
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
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const labelDiv = document.createElement('div');
        labelDiv.className = 'message-label';
        labelDiv.textContent = role === 'assistant' ? '🤖 Gemini' : '👤 あなた';

        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = text;

        messageDiv.appendChild(labelDiv);
        messageDiv.appendChild(textDiv);
        messagesContainer.appendChild(messageDiv);

        // スクロール
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
        // 既存のエラーを削除
        const existingError = document.querySelector('.error');
        if (existingError) existingError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        document.querySelector('.container').appendChild(errorDiv);

        setTimeout(() => errorDiv.remove(), 5000);
    }

    showTemporaryMessage(message) {
        const btn = document.getElementById('saveApiKey');
        const originalText = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = originalText, 1500);
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

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new GeminiScreenExplainer();
});
