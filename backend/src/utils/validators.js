import { body, validationResult } from 'express-validator';

// バリデーション結果をチェックするミドルウェア
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ユーザー登録のバリデーションルール
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('パスワードは6文字以上である必要があります'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('名前は1〜100文字で入力してください')
    .escape(),
];

// ログインのバリデーションルール
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('パスワードを入力してください'),
];

// メッセージ送信のバリデーションルール
export const messageValidation = [
  body('receiverId')
    .isInt({ min: 1 })
    .withMessage('受信者IDが無効です'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('メッセージは1〜5000文字で入力してください')
    .escape(),
];
