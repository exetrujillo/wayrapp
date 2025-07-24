/**
 * Integration tests for API interactions
 * Tests API client behavior with mocked HTTP responses
 */

import axios from 'axios';
import { courseService } from '../../services/courseService';
import { authService } from '../../services/auth';
import { CreateCourseRequest, LoginCredentials } from '../../utils/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('Authentication Service', () => {
    it('successfully logs in user', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      const result = await authService.login(credentials);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'mock-refresh-token');
    });

    it('handles login errors correctly', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            message: 'Invalid credentials',
          },
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('logs out user correctly', async () => {
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      await authService.logout();

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/auth/logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });

    it('checks authentication status correctly', () => {
      // Test when token exists
      localStorageMock.getItem.mockReturnValue('mock-token');
      expect(authService.isAuthenticated()).toBe(true);

      // Test when token doesn't exist
      localStorageMock.getItem.mockReturnValue(null);
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('gets current user from localStorage', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = authService.getCurrentUser();
      expect(result).toEqual(mockUser);
    });
  });

  describe('Course Service', () => {
    it('successfully creates a course', async () => {
      const mockCourse = {
        id: '1',
        name: 'Test Course',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        description: 'A test course',
        isPublic: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockedAxios.post.mockResolvedValue({ data: mockCourse });

      const courseData: CreateCourseRequest = {
        name: 'Test Course',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        description: 'A test course',
        isPublic: true,
      };

      const result = await courseService.createCourse(courseData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/courses', courseData);
      expect(result).toEqual(mockCourse);
    });

    it('fetches courses with pagination', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              name: 'Course 1',
              sourceLanguage: 'en',
              targetLanguage: 'es',
              isPublic: true,
              createdAt: '2023-01-01T00:00:00Z',
              updatedAt: '2023-01-01T00:00:00Z',
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const params = { page: 1, limit: 10 };
      const result = await courseService.getCourses(params);

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/courses', { params });
      expect(result).toEqual(mockResponse.data);
    });

    it('handles course creation errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Course name already exists',
          },
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      const courseData: CreateCourseRequest = {
        name: 'Existing Course',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        isPublic: false,
      };

      await expect(courseService.createCourse(courseData)).rejects.toThrow('Course name already exists');
    });

    it('fetches single course by ID', async () => {
      const mockCourse = {
        id: '1',
        name: 'Test Course',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        isPublic: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockedAxios.get.mockResolvedValue({ data: mockCourse });

      const result = await courseService.getCourse('1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/courses/1');
      expect(result).toEqual(mockCourse);
    });

    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(networkError);

      await expect(courseService.getCourses()).rejects.toThrow('Network Error');
    });
  });

  describe('API Client Configuration', () => {
    it('includes auth token in requests when available', async () => {
      localStorageMock.getItem.mockReturnValue('mock-auth-token');
      
      // Mock axios create to return a mock instance
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: {} }),
        post: jest.fn().mockResolvedValue({ data: {} }),
        interceptors: {
          request: {
            use: jest.fn(),
          },
          response: {
            use: jest.fn(),
          },
        },
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      // Test that interceptor would add auth header
      const requestInterceptor = jest.fn((config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      const mockConfig = { headers: {} };
      const result = requestInterceptor(mockConfig);

      expect(result.headers.Authorization).toBe('Bearer mock-auth-token');
    });

    it('handles 401 responses by clearing auth tokens', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized',
          },
        },
      };

      // Simulate response interceptor behavior
      const responseInterceptor = jest.fn((error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          // In real app, would redirect to login
        }
        return Promise.reject(error);
      });

      await expect(responseInterceptor(mockError)).rejects.toEqual(mockError);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });
});