import axios from 'axios';

// Backend URL'si - geliştirme icin localhost
const API_URL = 'http://localhost:5000/api';

// Axios instance olustur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Her istege token'i otomatik ekle (localStorage'da varsa)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token suresi dolunca otomatik logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ============================================
// EXPENSES API
// ============================================
export const expensesAPI = {
  getAll: () => api.get('/expenses'),
  getSummary: () => api.get('/expenses/summary'),
  getByCategory: () => api.get('/expenses/by-category'),
  create: (data) => api.post('/expenses', data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// ============================================
// CATEGORIES API
// ============================================
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export default api;