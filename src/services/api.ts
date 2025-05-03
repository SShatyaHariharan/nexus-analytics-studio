
import axios from "axios";
import { toast } from "sonner";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        });

        // Store the new access token
        const { access_token } = response.data;
        localStorage.setItem("access_token", access_token);

        // Retry the original request with the new token
        originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If token refresh fails, redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error("An unexpected error occurred");
    }

    return Promise.reject(error);
  }
);

export default api;
