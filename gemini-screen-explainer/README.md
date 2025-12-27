# Gemini Screen Explainer

画面をスクリーンショットすると、Gemini（生成AI）が画面の内容を解説し、その後チャットで質問を続けられるChrome拡張機能です。

## 機能

- 📸 ワンクリックでスクリーンショット取得
- 🤖 Geminiによる画面の自動解説
- 💬 解説後のチャット継続
- ⌨️ キーボードショートカット対応（Ctrl+Shift+G / Cmd+Shift+G）

## インストール方法

### 1. アイコンの生成

1. `icons/generate-icons.html` をブラウザで開く
2. 各サイズのボタンをクリックしてアイコンをダウンロード
3. ダウンロードしたファイルを `icons/` フォルダに配置:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### 2. Chrome拡張機能としてインストール

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `gemini-screen-explainer` フォルダを選択

### 3. APIキーの設定

1. [Google AI Studio](https://aistudio.google.com/app/apikey) でAPIキーを取得
2. 拡張機能のポップアップでAPIキーを入力して保存

## 使い方

1. 解説したいWebページを開く
2. 拡張機能アイコンをクリック（または `Ctrl+Shift+G`）
3. 「📸 画面をキャプチャ」ボタンをクリック
4. Geminiが画面を解説するまで待つ
5. 質問があればチャット欄に入力して送信

## 必要な権限

- `activeTab`: 現在のタブのスクリーンショット取得
- `storage`: APIキーの保存
- `host_permissions`: Gemini APIへのアクセス

## 技術スタック

- Chrome Extension Manifest V3
- Gemini 2.0 Flash API
- Vanilla JavaScript

## ファイル構成

```
gemini-screen-explainer/
├── manifest.json     # 拡張機能設定
├── popup.html        # ポップアップUI
├── popup.css         # スタイル
├── popup.js          # メインロジック
├── icons/
│   ├── icon.svg      # オリジナルアイコン
│   ├── generate-icons.html  # アイコン生成ツール
│   ├── icon16.png    # 16x16アイコン
│   ├── icon48.png    # 48x48アイコン
│   └── icon128.png   # 128x128アイコン
└── README.md         # このファイル
```

## ライセンス

MIT License
