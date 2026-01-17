import { useState } from 'react';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-purple-500 to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <Login onToggle={() => setIsLogin(false)} />
        ) : (
          <Register onToggle={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
