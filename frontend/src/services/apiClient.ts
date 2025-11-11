import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  (config) => {
    // Add authorization header if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
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
};

export default apiClient;

