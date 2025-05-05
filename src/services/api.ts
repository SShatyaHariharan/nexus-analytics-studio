
import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {}, {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          });
          
          // If successful, save the new token
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          // Update the Authorization header
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Show toast notification
        toast.error('Session expired. Please log in again.');
        
        // If we're not on the login page, redirect
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle specific error types with toast notifications
    if (error.response?.status === 400) {
      toast.error('Bad request: Please check your input.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.response?.status === 409) {
      toast.error('Conflict: The resource already exists.');
    } else if (error.response?.status === 500) {
      toast.error('Server error: Please try again later.');
    } else if (!error.response) {
      toast.error('Network error: Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
