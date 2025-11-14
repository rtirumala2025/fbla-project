import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor (add auth token if needed)
apiClient.interceptors.request.use(
  async (config) => {
    // Add Supabase auth token if available
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      // If auth fails, continue without token (for public endpoints)
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (handle errors globally)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const api = {
  /**
   * Get AI pet response
   */
  async getPetResponse(petName: string, petMood: string, context?: string) {
    const response = await apiClient.post('/api/ai/pet-response', {
      pet_name: petName,
      pet_mood: petMood,
      context,
    });
    return response.data;
  },

  /**
   * Get stats summary
   */
  async getStatsSummary() {
    const response = await apiClient.get('/api/stats/summary');
    return response.data;
  },

  /**
   * Health check
   */
  async healthCheck() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  /**
   * Analyze budget and get AI recommendations
   */
  async analyzeBudget(transactions: any[], monthlyBudget?: number, userId?: string) {
    const response = await apiClient.post('/api/budget-advisor/analyze', {
      transactions,
      monthly_budget: monthlyBudget,
      user_id: userId,
    });
    return response.data;
  },
};

export default apiClient;

