import { useEffect, useState } from 'react';
import { userAPI } from '../../services/api';

const UserSelector = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAvailableUsers();
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>ユーザーを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-4">新しいメッセージ</h3>

      <input
        type="text"
        placeholder="ユーザーを検索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input-field mb-4"
      />

      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            ユーザーが見つかりません
          </p>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                {user.role === 'ADMIN' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    管理者
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default UserSelector;
