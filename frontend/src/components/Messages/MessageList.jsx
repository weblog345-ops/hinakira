import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const MessageList = ({ messages, selectedUser }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseURL = API_URL.replace('/api', '');

  const isImage = (mimetype) => {
    return mimetype && mimetype.startsWith('image/');
  };

  const getFileIcon = (mimetype) => {
    if (!mimetype) return '📄';
    if (mimetype.includes('pdf')) return '📕';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📘';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📗';
    if (mimetype.includes('zip') || mimetype.includes('compressed')) return '📦';
    return '📄';
  };

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-lg">メッセージを選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ライトボックス（画像拡大表示） */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="拡大表示"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>まだメッセージがありません</p>
            <p className="text-sm mt-2">最初のメッセージを送信してみましょう</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.sender.id === user.id;
              const attachments = message.attachments || [];

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md rounded-lg ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white'
                        : 'bg-white text-gray-900 shadow'
                    }`}
                  >
                    {/* メッセージテキスト */}
                    {message.content && (
                      <div className="px-4 py-2">
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    )}

                    {/* 添付ファイル */}
                    {attachments.length > 0 && (
                      <div className="px-2 pb-2 space-y-2">
                        {attachments.map((attachment, index) => (
                          <div key={index}>
                            {isImage(attachment.mimetype) ? (
                              // 画像の場合
                              <img
                                src={`${baseURL}${attachment.path}`}
                                alt={attachment.originalName}
                                className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setLightboxImage(`${baseURL}${attachment.path}`)}
                              />
                            ) : (
                              // その他のファイルの場合
                              <a
                                href={`${baseURL}${attachment.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center space-x-2 p-2 rounded ${
                                  isOwnMessage
                                    ? 'bg-white/20 hover:bg-white/30'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                } transition-colors`}
                              >
                                <span className="text-2xl">{getFileIcon(attachment.mimetype)}</span>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm truncate ${
                                      isOwnMessage ? 'text-white' : 'text-gray-700'
                                    }`}
                                  >
                                    {attachment.originalName}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      isOwnMessage ? 'text-white/70' : 'text-gray-500'
                                    }`}
                                  >
                                    {(attachment.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <span className={isOwnMessage ? 'text-white' : 'text-gray-500'}>
                                  ↓
                                </span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* タイムスタンプ */}
                    <div className="px-4 pb-2">
                      <p
                        className={`text-xs ${
                          isOwnMessage ? 'text-white/70' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </>
  );
};

export default MessageList;
