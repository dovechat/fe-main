import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
});

// Добавляем access token к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Обработчик 401 и автоматический refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { access_token } = await refreshToken();
        localStorage.setItem('token', access_token);
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // если refresh не сработал — выкидываем на логин
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// функция refresh token
async function refreshToken() {
  const refresh_token = localStorage.getItem('refreshToken');
  if (!refresh_token) throw new Error('No refresh token');

  const response = await axios.post(
    `${import.meta.env.VITE_CHAT_URL}/auth/refresh`,
    { refresh_token }
  );
  // возвращаем access token (и по желанию новый refresh token)
  return response.data; // { access_token: '...', refresh_token: '...' }
}

// API функции
export async function fetchConversations(params = {}) {
    const response = await api.get('/conversations', { params });
    return response.data;
}

export async function fetchConversation(conversationId) {
  const response = await api.get(`/conversations/${conversationId}`);
  return response.data;
}

export async function fetchLineChannels(lineId) {
  const response = await api.get(`/lines/${lineId}/channels`);
  return response.data;
}

export async function fetchMessages(conversationId) {
  const response = await api.get(`/conversations/${conversationId}/messages`);
  return response.data;
}

export async function getMyLines() {
  const response = await api.get('/lines');
  return response.data;
}

export async function fetchLinesWithChannels() {
  const response = await api.get('/lines-with-channels');
  return response.data;
}

export async function createConversation(data) {
  const response = await api.post('/conversations', data);
  return response.data;
}

export async function setConversationStatus(conversationId, isClosed) {
    const response = await api.patch(`/conversations/${conversationId}/status`, { is_closed: isClosed });
    return response.data;
}

export default api;