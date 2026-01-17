import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Layout/Header';
import AuthPage from './pages/AuthPage';
import MessagesPage from './pages/MessagesPage';

// 認証が必要なルートを保護するコンポーネント
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ログイン済みユーザーが認証ページにアクセスした時のリダイレクト
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/messages" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* 公開ルート */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <AuthPage />
              </GuestRoute>
            }
          />

          {/* 保護されたルート */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Header />
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          {/* デフォルトリダイレクト */}
          <Route path="/" element={<Navigate to="/messages" replace />} />
          <Route path="*" element={<Navigate to="/messages" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
