# Gemini Screen Explainer - デスクトップアプリ

スクリーンショットをGeminiが解説するElectronデスクトップアプリです。
グローバルショートカットでどこからでも即座にスクリーンショットを撮影し、AIが画面を解説します。

## 機能

- 🖥️ グローバルショートカット（デフォルト: `Alt+Shift+S`）でどこからでもスクショ
- 🤖 Gemini AIによる画面の自動解説
- 💬 解説後のチャット継続
- 📌 システムトレイ常駐
- ⚙️ カスタマイズ可能なショートカット

## インストール

### 開発環境で実行

```bash
cd gemini-screen-app

# 依存関係のインストール
npm install

# 起動
npm start
```

### ビルド（インストーラー作成）

```bash
# Windows用
npm run build:win

# Mac用
npm run build:mac

# Linux用
npm run build:linux
```

ビルドされたファイルは `dist/` フォルダに出力されます。

## 初回設定

1. アプリを起動
2. 「設定」を開く
3. [APIキーを取得](https://aistudio.google.com/app/apikey) からGemini APIキーを取得
4. APIキーを入力して「保存」

## 使い方

### ショートカットキー
- `Alt+Shift+S` (デフォルト): 画面をキャプチャしてGeminiで解説

### 手動操作
1. 「画面をキャプチャ」ボタンをクリック
2. Geminiが画面を解説
3. チャット欄で追加の質問が可能

### システムトレイ
- トレイアイコンをクリック: ウィンドウを表示
- 右クリック: コンテキストメニュー

## 設定

| 項目 | 説明 |
|------|------|
| API キー | Gemini APIキー |
| モデル | 使用するGeminiモデル |
| ショートカット | グローバルショートカットキー |

## 対応モデル

- Gemini 2.0 Flash (推奨)
- Gemini 1.5 Flash
- Gemini 1.5 Pro

## 必要要件

- Node.js 18以上
- npm または yarn

## ライセンス

MIT License
