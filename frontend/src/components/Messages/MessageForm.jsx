import { useState } from 'react';

const MessageForm = ({ onSend, selectedUser }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;

    setSending(true);
    try {
      await onSend(message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`${selectedUser.name}さんにメッセージを送信...`}
            className="input-field resize-none"
            rows="3"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? '送信中...' : '送信'}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        Enter で送信、Shift + Enter で改行
      </p>
    </div>
  );
};

export default MessageForm;
