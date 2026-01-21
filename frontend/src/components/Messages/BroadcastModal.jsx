import { useState, useEffect } from 'react';
import { userAPI, messageAPI } from '../../services/api';

const BroadcastModal = ({ isOpen, onClose, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleSend = async () => {
    if (!content.trim()) {
      alert('メッセージを入力してください');
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      alert('送信先を選択してください');
      return;
    }

    setSending(true);
    try {
      await messageAPI.broadcastMessage({
        content: content.trim(),
        recipientIds: sendToAll ? [] : selectedUsers,
      });

      setContent('');
      setSelectedUsers([]);
      setSendToAll(true);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      alert('送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">一斉送信</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* メッセージ入力 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メッセージ内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="メッセージを入力してください"
              rows={5}
              className="input-field resize-none"
            />
          </div>

          {/* 送信先選択 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                送信先
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendToAll}
                    onChange={(e) => {
                      setSendToAll(e.target.checked);
                      if (e.target.checked) {
                        setSelectedUsers([]);
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">全員に送信</span>
                </label>
                {!sendToAll && (
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedUsers.length === users.length ? '全解除' : '全選択'}
                  </button>
                )}
              </div>
            </div>

            {!sendToAll && (
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {loading ? (
                  <p className="text-center text-gray-500 py-4">読み込み中...</p>
                ) : users.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">ユーザーが見つかりません</p>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        {user.role === 'ADMIN' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            管理者
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sendToAll && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  📢 全メンバー（{users.length}人）にメッセージが送信されます
                </p>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="btn-secondary"
            >
              キャンセル
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !content.trim()}
              className="btn-primary"
            >
              {sending ? '送信中...' : `送信${sendToAll ? `（${users.length}人）` : selectedUsers.length > 0 ? `（${selectedUsers.length}人）` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastModal;
