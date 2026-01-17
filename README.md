# Hinakira メッセージアプリ

コミュニティメンバーとのコミュニケーションを円滑にするメッセージングアプリケーションです。メールアドレスを登録しておくと、新しいメッセージが届いた際にメール通知を受け取ることができます。

## 主な機能

- **ユーザー認証**: メールアドレスとパスワードでの登録・ログイン
- **権限管理**:
  - 管理者: 全員とメッセージのやり取りが可能
  - 一般会員: 管理者とのみメッセージのやり取りが可能
- **リアルタイムメッセージング**: テキストメッセージの送受信
- **メール通知**: 新しいメッセージを受信した際の自動メール通知
- **未読管理**: 未読メッセージ数の表示と既読機能
- **レスポンシブデザイン**: デスクトップ・タブレット・スマートフォン対応

## 技術スタック

### バックエンド
- **Node.js** + **Express**: サーバーフレームワーク
- **Prisma ORM**: データベース管理
- **SQLite**: データベース
- **JWT**: 認証トークン
- **bcrypt**: パスワードハッシュ化
- **Nodemailer**: メール送信

### フロントエンド
- **React 18**: UIライブラリ
- **Vite**: ビルドツール
- **React Router**: ルーティング
- **Tailwind CSS**: スタイリング
- **Axios**: HTTP クライアント

## セキュリティ対策

- ✅ パスワードの bcrypt ハッシュ化（salt rounds: 10）
- ✅ JWT トークンベースの認証
- ✅ 入力バリデーションとサニタイゼーション
- ✅ レート制限（DDoS 対策）
- ✅ CORS 設定
- ✅ SQL インジェクション対策（Prisma ORM 使用）
- ✅ XSS 対策（入力エスケープ）
- ✅ セキュリティヘッダー設定

## プロジェクト構造

```
hinakira/
├── backend/                    # バックエンドアプリケーション
│   ├── src/
│   │   ├── config/            # 設定ファイル
│   │   ├── middleware/        # ミドルウェア
│   │   ├── routes/            # API ルート
│   │   ├── controllers/       # コントローラー
│   │   ├── services/          # ビジネスロジック
│   │   ├── utils/             # ユーティリティ
│   │   └── server.js          # メインサーバーファイル
│   ├── prisma/
│   │   └── schema.prisma      # データベーススキーマ
│   └── package.json
├── frontend/                   # フロントエンドアプリケーション
│   ├── src/
│   │   ├── components/        # React コンポーネント
│   │   ├── pages/             # ページコンポーネント
│   │   ├── services/          # API サービス
│   │   └── context/           # React Context
│   └── package.json
└── README.md
```

## セットアップ手順

### 前提条件

- Node.js 18 以上
- npm または yarn

### 1. バックエンドのセットアップ

```bash
cd backend

# パッケージをインストール
npm install

# Prisma クライアントを生成
npm run prisma:generate

# データベースのマイグレーション
npm run prisma:migrate

# 初期管理者アカウントを作成
npm run seed
```

#### 環境変数の設定

`backend/.env` ファイルを編集して、必要な設定を行ってください。

**初期管理者アカウント**:
- Email: `admin@hinakira.app`
- Password: `admin123` （本番環境では必ず変更してください）

### 2. フロントエンドのセットアップ

```bash
cd frontend

# パッケージをインストール
npm install
```

### 3. アプリケーションの起動

#### バックエンドを起動

```bash
cd backend
npm run dev
```

バックエンドは `http://localhost:3000` で起動します。

#### フロントエンドを起動（別のターミナルで）

```bash
cd frontend
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

## 使い方

### 管理者として

1. ログイン（admin@hinakira.app / admin123）
2. 「新しいメッセージ」ボタンをクリック
3. ユーザーを選択してメッセージを送信

### 一般会員として

1. 新規登録ページからアカウント作成
2. ログイン後、管理者とメッセージのやり取り

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `GET /api/auth/me` - 現在のユーザー情報

### メッセージ
- `POST /api/messages` - メッセージ送信
- `GET /api/messages/conversations` - 会話一覧
- `GET /api/messages/:userId` - 特定ユーザーとの会話

## ライセンス

MIT
