import axios from 'axios';

// Get API URL from environment variables
// Fallback: Use localhost in development, live server in production
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production'
    ? 'http://193.203.160.42:9000/api'
    : 'http://localhost:5001/api');

// Debug: Log the API URL being used
console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_URL: API_URL,
  MODE: import.meta.env.MODE
});

// Export API_URL for fetch calls
export const getApiUrl = (path = '') => {
  const url = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${url}`;
};

// Helper for fetch calls with auth
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const fullUrl = url.startsWith('http') ? url : getApiUrl(url);

  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  return fetch(fullUrl, { ...defaultOptions, ...options });
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 240000, // 4 minutes to accommodate n8n PDF processing (backend waits 3 minutes)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;