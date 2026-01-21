import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
              Hinakira
            </h1>
            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{user.name}</span>
                {isAdmin && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    管理者
                  </span>
                )}
              </div>
            )}
          </div>

          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/messages')}
                  className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
                >
                  メッセージ
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/users')}
                    className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
                  >
                    ユーザー一覧
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
                >
                  ログイン
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary"
                >
                  新規登録
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
