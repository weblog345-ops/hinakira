import { useState, useRef } from 'react';

const MessageForm = ({ onSend, selectedUser }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert('ファイルは最大5つまでです');
      return;
    }
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!message.trim() && selectedFiles.length === 0) || !selectedUser) return;

    setSending(true);
    try {
      // FormDataを作成
      const formData = new FormData();
      formData.append('receiverId', selectedUser.id);
      formData.append('content', message.trim() || '');

      // ファイルを追加
      selectedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      await onSend(formData);
      setMessage('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 選択されたファイルのプレビュー */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2 text-sm"
              >
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center">
                    📄
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* メッセージ入力とボタン */}
        <div className="flex items-end space-x-2">
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
          <div className="flex flex-col space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-center"
            >
              📎 ファイル
            </label>
            <button
              type="submit"
              disabled={(!message.trim() && selectedFiles.length === 0) || sending}
              className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {sending ? '送信中...' : '送信'}
            </button>
          </div>
        </div>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        Enter で送信、Shift + Enter で改行 | 画像・ファイル最大5つ、各10MBまで
      </p>
    </div>
  );
};

export default MessageForm;
