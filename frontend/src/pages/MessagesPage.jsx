import { useState, useEffect } from 'react';
import { messageAPI } from '../services/api';
import ConversationList from '../components/Messages/ConversationList';
import MessageList from '../components/Messages/MessageList';
import MessageForm from '../components/Messages/MessageForm';
import UserSelector from '../components/Messages/UserSelector';
import { useAuth } from '../context/AuthContext';

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  const loadConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const response = await messageAPI.getConversation(userId);
      setMessages(response.data.data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowUserSelector(false);
  };

  const handleSendMessage = async (content) => {
    if (!selectedUser) return;

    try {
      await messageAPI.sendMessage({
        receiverId: selectedUser.id,
        content,
      });

      // メッセージを再読み込み
      await loadMessages(selectedUser.id);
      await loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* 左サイドバー - 会話リスト */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">メッセージ</h2>
            {isAdmin && (
              <button
                onClick={() => setShowUserSelector(!showUserSelector)}
                className="mt-3 w-full btn-primary text-sm"
              >
                + 新しいメッセージ
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {showUserSelector ? (
              <UserSelector onSelectUser={handleSelectUser} />
            ) : (
              <ConversationList
                conversations={conversations}
                selectedUserId={selectedUser?.id}
                onSelectUser={handleSelectUser}
              />
            )}
          </div>
        </div>

        {/* メイン - メッセージエリア */}
        <div className="flex-1 flex flex-col">
          {selectedUser && (
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
                {selectedUser.role === 'ADMIN' && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                    管理者
                  </span>
                )}
              </div>
            </div>
          )}

          <MessageList messages={messages} selectedUser={selectedUser} />

          <MessageForm onSend={handleSendMessage} selectedUser={selectedUser} />
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
