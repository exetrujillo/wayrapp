import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mobile API Client for communicating with WayrApp servers
 */
class MobileAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          // Navigate to login screen (will be handled by the auth state change)
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: { email: string; password: string }) {
    const response = await this.client.post('/api/v1/auth/login', credentials);
    return response.data;
  }

  async register(userData: { 
    fullName: string; 
    email: string; 
    password: string; 
    nativeLanguage: string;
  }) {
    const response = await this.client.post('/api/v1/auth/register', userData);
    return response.data;
  }

  // Learning
  async getCourses() {
    const response = await this.client.get('/api/v1/courses');
    return response.data;
  }

  async getCoursePackage(courseId: string) {
    const response = await this.client.get(`/api/v1/courses/${courseId}/package`);
    return response.data;
  }

  async submitProgress(lessonId: string, answers: any[]) {
    const response = await this.client.post(`/api/v1/progress/lessons/${lessonId}/complete`, {
      answers
    });
    return response.data;
  }
}

// Export a function to create API clients with different base URLs
export const createAPIClient = (baseURL: string) => new MobileAPIClient(baseURL);

// Default export for backward compatibility
export default MobileAPIClient;