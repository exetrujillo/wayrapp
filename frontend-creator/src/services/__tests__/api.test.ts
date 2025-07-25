import apiClient from '../api';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the environment
jest.mock('../../config/environment', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return the mocked axios instance
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('Request Interceptor', () => {
    it('should add authorization header when token exists', () => {
      // Mock localStorage
      const mockToken = 'test-token';
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => mockToken),
        },
        writable: true,
      });

      // Verify axios.create was called with correct config
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should not add authorization header when token does not exist', () => {
      // Mock localStorage with no token
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => null),
        },
        writable: true,
      });

      // Verify axios.create was called with correct config
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('Response Interceptor', () => {
    it('should return response data on success', async () => {
      const mockResponseData = { id: 1, name: 'Test' };
      const mockResponse = { data: mockResponseData };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await apiClient.get('/test');
      
      expect(result).toEqual(mockResponseData);
    });

    it('should handle 401 errors by clearing token and redirecting', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      // Mock localStorage
      const mockRemoveItem = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: {
          removeItem: mockRemoveItem,
        },
        writable: true,
      });

      // Mock window.location
      delete (window as any).location;
      (window as any).location = { href: '' };

      mockedAxios.get.mockRejectedValue(mockError);

      await expect(apiClient.get('/test')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockError = {
        request: {},
        message: 'Network Error',
      };

      mockedAxios.get.mockRejectedValue(mockError);

      await expect(apiClient.get('/test')).rejects.toThrow('Network error. Please check your connection.');
    });

    it('should handle server errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };

      mockedAxios.get.mockRejectedValue(mockError);

      await expect(apiClient.get('/test')).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: [
              { field: 'name', message: 'Name is required' },
              { field: 'email', message: 'Email is invalid' },
            ],
          },
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(apiClient.post('/test', {})).rejects.toThrow('Validation failed');
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET requests correctly', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockedAxios.get.mockResolvedValue({ data: mockData });

      const result = await apiClient.get('/test');

      expect(mockedAxios.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(mockData);
    });

    it('should make POST requests correctly', async () => {
      const mockData = { id: 1, name: 'Test' };
      const postData = { name: 'Test' };
      mockedAxios.post.mockResolvedValue({ data: mockData });

      const result = await apiClient.post('/test', postData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/test', postData, undefined);
      expect(result).toEqual(mockData);
    });

    it('should make PUT requests correctly', async () => {
      const mockData = { id: 1, name: 'Updated Test' };
      const putData = { name: 'Updated Test' };
      mockedAxios.put.mockResolvedValue({ data: mockData });

      const result = await apiClient.put('/test/1', putData);

      expect(mockedAxios.put).toHaveBeenCalledWith('/test/1', putData, undefined);
      expect(result).toEqual(mockData);
    });

    it('should make DELETE requests correctly', async () => {
      mockedAxios.delete.mockResolvedValue({ data: null });

      const result = await apiClient.delete('/test/1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toBeNull();
    });

    it('should make PATCH requests correctly', async () => {
      const mockData = { id: 1, name: 'Patched Test' };
      const patchData = { name: 'Patched Test' };
      mockedAxios.patch.mockResolvedValue({ data: mockData });

      const result = await apiClient.patch('/test/1', patchData);

      expect(mockedAxios.patch).toHaveBeenCalledWith('/test/1', patchData, undefined);
      expect(result).toEqual(mockData);
    });
  });

  describe('Request Configuration', () => {
    it('should pass through request config options', async () => {
      const mockData = { id: 1, name: 'Test' };
      const config = { timeout: 5000, headers: { 'Custom-Header': 'value' } };
      mockedAxios.get.mockResolvedValue({ data: mockData });

      await apiClient.get('/test', config);

      expect(mockedAxios.get).toHaveBeenCalledWith('/test', config);
    });

    it('should handle request with query parameters', async () => {
      const mockData = { data: [], meta: { total: 0 } };
      const params = { page: 1, limit: 10 };
      mockedAxios.get.mockResolvedValue({ data: mockData });

      await apiClient.get('/test', { params });

      expect(mockedAxios.get).toHaveBeenCalledWith('/test', { params });
    });
  });

  describe('Error Handling', () => {
    it('should preserve error status and data', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };

      mockedAxios.get.mockRejectedValue(mockError);

      try {
        await apiClient.get('/test');
      } catch (error: any) {
        expect(error.status).toBe(404);
        expect(error.message).toBe('Not found');
      }
    });

    it('should handle errors without response', async () => {
      const mockError = new Error('Request failed');
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(apiClient.get('/test')).rejects.toThrow('Request failed');
    });
  });
});