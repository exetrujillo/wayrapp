/**
 * Integration tests for API interactions
 * Tests API client behavior with mocked HTTP responses
 */

import { CreateCourseRequest, LoginCredentials } from '../../utils/types';
import { ApiClientError } from '../../services/api';

// Mock the API client module before importing services
jest.mock('../../services/api', () => {
  class MockApiClientError extends Error {
    status: number;
    code?: string;
    details?: Record<string, any>;

    constructor(message: string, status: number, code?: string, details?: Record<string, any>) {
      super(message);
      this.name = 'ApiClientError';
      this.status = status;
      if (code !== undefined) {
        this.code = code;
      }
      if (details !== undefined) {
        this.details = details;
      }
    }
  }

  const mockApiClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockApiClient,
    apiClient: mockApiClient,
    ApiClientError: MockApiClientError,
  };
});

// Now import the services after mocking
import { courseService } from '../../services/courseService';
import { authService } from '../../services/auth';
import apiClient from '../../services/api';

// Get the mocked API client
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

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
    
    // Reset mock API client
    mockApiClient.get.mockClear();
    mockApiClient.post.mockClear();
    mockApiClient.put.mockClear();
    mockApiClient.patch.mockClear();
    mockApiClient.delete.mockClear();
  });

  describe('Authentication Service', () => {
    it('successfully logs in user', async () => {
      const mockResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'Test User',
            role: 'admin',
            countryCode: 'US',
            registrationDate: '2023-01-01T00:00:00Z',
            lastLoginDate: '2023-01-01T00:00:00Z',
            isActive: true,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          tokens: {
            accessToken: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
          },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      const result = await authService.login(credentials);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'mock-jwt-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'mock-refresh-token');
    });

    it('handles login errors correctly', async () => {
      const mockError = new ApiClientError('Invalid credentials', 401);

      mockApiClient.post.mockRejectedValue(mockError);

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('logs out user correctly', async () => {
      mockApiClient.post.mockResolvedValue({ success: true });

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });

    it('checks authentication status correctly', () => {
      // Test when token exists (JWT format with 3 parts)
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'access_token') return 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';
        if (key === 'auth_user') return JSON.stringify({ id: '1', email: 'test@example.com' });
        return null;
      });
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

      mockApiClient.post.mockResolvedValue(mockCourse);

      const courseData: CreateCourseRequest = {
        id: 'test-course',
        name: 'Test Course',
        source_language: 'en',
        target_language: 'es',
        description: 'A test course',
        is_public: true,
      };

      const result = await courseService.createCourse(courseData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/courses', courseData);
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

      mockApiClient.get.mockResolvedValue(mockResponse.data);

      const params = { page: 1, limit: 10 };
      const result = await courseService.getCourses(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/courses', { params });
      expect(result).toEqual(mockResponse.data);
    });

    it('handles course creation errors', async () => {
      const mockError = {
        status: 409,
        message: 'Course name already exists',
      };

      mockApiClient.post.mockRejectedValue(mockError);

      const courseData: CreateCourseRequest = {
        id: 'existing-course',
        name: 'Existing Course',
        source_language: 'en',
        target_language: 'es',
        is_public: false,
      };

      await expect(courseService.createCourse(courseData)).rejects.toThrow('A course with this name already exists');
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

      mockApiClient.get.mockResolvedValue(mockCourse);

      const result = await courseService.getCourse('1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/courses/1');
      expect(result).toEqual(mockCourse);
    });

    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      mockApiClient.get.mockRejectedValue(networkError);

      await expect(courseService.getCourses()).rejects.toThrow('Network Error');
    });
  });

  describe('API Client Configuration', () => {
    it('includes auth token in requests when available', async () => {
      localStorageMock.getItem.mockReturnValue('mock-auth-token');

      // Test that interceptor would add auth header
      const requestInterceptor = jest.fn((config) => {
        const token = localStorage.getItem('access_token');
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
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // In real app, would redirect to login
        }
        return Promise.reject(error);
      });

      await expect(responseInterceptor(mockError)).rejects.toEqual(mockError);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });
});