/**
 * Axios client pre-configured with base URL and auth header injection.
 * Data flow: Components call api.* → axios sends JSON to FastAPI backend.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (username, password) => {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);
    return api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  me: () => api.get('/api/auth/me'),
};

// ── Quiz ──────────────────────────────────────────────────────────────────────
export const quizApi = {
  getCategories: () => api.get('/api/quiz/categories'),
  startQuiz: (params) => api.post('/api/quiz/start', params),
  submitQuiz: (payload) => api.post('/api/quiz/submit', payload),
};

// ── Progress ─────────────────────────────────────────────────────────────────
export const progressApi = {
  getStats: () => api.get('/api/progress/stats'),
};

export default api;
