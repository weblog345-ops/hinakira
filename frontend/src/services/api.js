import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Axiosインスタンスを作成
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（トークンを自動的に追加）
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // トークンが無効な場合はログアウト
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== 認証API =====
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

// ===== ユーザーAPI =====
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  getAvailableUsers: () => api.get('/users/available'),
};

// ===== メッセージAPI =====
export const messageAPI = {
  sendMessage: (data) => api.post('/messages', data),
  getConversation: (userId) => api.get(`/messages/${userId}`),
  getConversations: () => api.get('/messages/conversations'),
  getUnreadCount: () => api.get('/messages/unread-count'),
  markAsRead: (messageId) => api.patch(`/messages/${messageId}/read`),
};

export default api;
