import transporter from '../config/email.js';

// メッセージ受信時のメール通知
export const sendMessageNotification = async (message) => {
  const { sender, receiver, content } = message;

  // メールトランスポーターが設定されていない場合はコンソールに出力
  if (!transporter) {
    console.log('📧 [メール通知シミュレーション]');
    console.log(`To: ${receiver.email}`);
    console.log(`Subject: ${sender.name}さんから新しいメッセージが届きました`);
    console.log(`本文:\n${sender.name}さんからメッセージが届きました。\n\n「${content.substring(0, 100)}${content.length > 100 ? '...' : ''}」\n\nHinakiraメッセージアプリで確認してください。`);
    return;
  }

  // メールの内容
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: receiver.email,
    subject: `${sender.name}さんから新しいメッセージが届きました`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .message-box {
            background: #f5f5f5;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📨 新しいメッセージ</h1>
          </div>
          <div class="content">
            <p>こんにちは、${receiver.name}さん</p>
            <p><strong>${sender.name}</strong>さんから新しいメッセージが届きました。</p>

            <div class="message-box">
              <p><strong>メッセージ内容:</strong></p>
              <p>${content.substring(0, 200)}${content.length > 200 ? '...' : ''}</p>
            </div>

            <p>メッセージの全文を確認するには、以下のボタンをクリックしてください。</p>

            <a href="${process.env.FRONTEND_URL}/messages" class="button">メッセージを確認する</a>

            <div class="footer">
              <p>このメールはHinakiraメッセージアプリから自動送信されています。</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      ${receiver.name}さん

      ${sender.name}さんから新しいメッセージが届きました。

      メッセージ内容:
      ${content}

      Hinakiraメッセージアプリで確認してください: ${process.env.FRONTEND_URL}/messages
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ メール送信成功:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ メール送信エラー:', error);
    throw error;
  }
};

// ウェルカムメール送信
export const sendWelcomeEmail = async (user) => {
  if (!transporter) {
    console.log('📧 [ウェルカムメール シミュレーション]');
    console.log(`To: ${user.email}`);
    console.log(`Subject: Hinakiraメッセージアプリへようこそ`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Hinakiraメッセージアプリへようこそ',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <h2>ようこそ、${user.name}さん！</h2>
        <p>Hinakiraメッセージアプリへの登録が完了しました。</p>
        <p>メッセージの送受信を始めましょう！</p>
        <p><a href="${process.env.FRONTEND_URL}">ログインする</a></p>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ ウェルカムメール送信成功');
  } catch (error) {
    console.error('❌ ウェルカムメール送信エラー:', error);
  }
};
