import axios, { AxiosError } from 'axios';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : undefined),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('API returned 401 Unauthorized. Token might be invalid or expired.');
      // Optional: Logic to refresh token could go here
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.status === 404) {
      return 'Resource not found';
    }
    if (error.response?.status === 403) {
      return 'Access denied';
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    return error.message;
  }
  return 'An unexpected error occurred';
};
