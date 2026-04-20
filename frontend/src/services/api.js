import axios from 'axios';

// Base URL is read from the .env file (VITE_API_URL) so it works in both dev and production
const API_URL = import.meta.env.VITE_API_URL;

// Single axios instance shared across the whole app — keeps base URL and headers consistent
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — automatically attaches the JWT access token to every request
// so individual API calls don't have to manually set the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — handles token expiry automatically
// If any request gets a 401 (Unauthorized), it tries to silently refresh the access token
// using the stored refresh token, then retries the original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh if: it's a 401, it hasn't been retried yet, and it's not the login endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/users/login/')) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry the original failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh also failed — clear everything and redirect to home (session expired)
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        sessionStorage.setItem('session_expired', '1'); // LoginPage reads this to show a toast
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API — registration, login, and profile management
export const authAPI = {
  register: (data) => api.post('/users/register/', data),
  login: (data) => api.post('/users/login/', data),
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data) => api.patch('/users/profile/', data),
  deleteAccount: (password) => api.post('/users/delete/', { password }),
};

// Nutrition API — meals and water intake CRUD
export const nutritionAPI = {
  getMeals: (date) => api.get('/nutrition/meals/', { params: { date } }),
  createMeal: (data) => api.post('/nutrition/meals/', data),
  updateMeal: (id, data) => api.patch(`/nutrition/meals/${id}/`, data),
  deleteMeal: (id) => api.delete(`/nutrition/meals/${id}/`),
  getDailySummary: (date) => api.get('/nutrition/summary/', { params: { date } }),
  getWaterIntake: (date) => api.get('/nutrition/water/', { params: { date } }),
  logWater: (data) => api.post('/nutrition/water/', data),
  deleteWater: (id) => api.delete(`/nutrition/water/${id}/`),
};

// Activity API — workout logs and weekly summary
export const activityAPI = {
  getActivities: (date) => api.get('/activity/activities/', { params: { date } }),
  createActivity: (data) => api.post('/activity/activities/', data),
  updateActivity: (id, data) => api.patch(`/activity/activities/${id}/`, data),
  deleteActivity: (id) => api.delete(`/activity/activities/${id}/`),
  getWeeklySummary: () => api.get('/activity/summary/'),
};

// Sleep API — sleep logs, goals, and weekly/monthly summaries
export const sleepAPI = {
  getSleepLogs: (date) => api.get('/sleep/logs/', { params: { date } }),
  createSleepLog: (data) => api.post('/sleep/logs/', data),
  updateSleepLog: (id, data) => api.patch(`/sleep/logs/${id}/`, data),
  deleteSleepLog: (id) => api.delete(`/sleep/logs/${id}/`),
  getWeeklySummary: () => api.get('/sleep/summary/weekly/'),
  getMonthlySummary: () => api.get('/sleep/summary/monthly/'),
  getGoal: () => api.get('/sleep/goal/'),
  updateGoal: (data) => api.patch('/sleep/goal/', data),
};

export default api;
