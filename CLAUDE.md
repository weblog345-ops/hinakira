# hinakira プロジェクト

## 概要
Web ベースのロゴ作成ツール。HTML5 Canvas を使ったフロントエンドのみの静的サイト。

## 技術スタック
- HTML5 / CSS3 / Vanilla JavaScript（フレームワークなし、依存なし）
- ビルドツールなし（静的ファイルをそのまま配信）

## ファイル構成
- `index.html` — メインページ（ロゴ作成UI）
- `style.css` — スタイルシート
- `script.js` — Canvas 描画ロジック、ドラッグ＆ドロップ、PNG エクスポート

## ローカル実行
```bash
python -m http.server 8000
# または
npx http-server
```

## hinakira-bot エコシステム
GitHub: https://github.com/hinakira-bot

このリポジトリは hinakira-bot アカウント配下のプロジェクト群と連携する。主要リポジトリ：

| リポジトリ | 種類 | 技術 | デプロイ先 |
|---|---|---|---|
| hinakira-accounting | AI会計自動化 | Python Flask + Gemini AI + Google Sheets | hinakira-accounting.vercel.app |
| ai-accounting-saas | AI会計SaaS | Python Flask + Gemini AI + Google Sheets | Vercel |
| ai_accounting_tool | AI会計ツール | Python + Gemini AI | Vercel |
| salon_reservation_system | サロン予約 | React + Vite | Vercel |
| vibe | テトリスゲーム | Vanilla JS | GitHub Pages |
| LP / LP-1 / lp-builder | ランディングページ | HTML / JS | — |
| Slide-creation / AI-Slide-Portfolio | スライド作成 | TypeScript / JS | — |
| Instagram-hinakira / Instagram-toyoda / Instagram-create | Instagram関連 | JS | — |
| Full-Screen-Screenshot | スクリーンショット | JS | — |
| HTML-Conversion / Convert-PDF-to-txt | ファイル変換 | HTML | — |
| MNP-Reminder | MNPリマインダー | JS | — |
| WorkFlow | ワークフロー | — | — |
| moviemaker | 動画作成 | — | — |

## 連携時の注意
- hinakira-bot のバックエンド系リポジトリ（accounting 系）は Python Flask + Gemini AI が共通基盤
- フロントエンド系は Vanilla JS または React
- デプロイ先は主に Vercel または GitHub Pages
