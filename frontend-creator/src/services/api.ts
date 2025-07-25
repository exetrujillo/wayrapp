import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { STORAGE_KEYS } from '../utils/constants';
import { ApiError } from '../utils/types';
import { env } from '../config/environment';

// Custom error class for API errors
export class ApiClientError extends Error {
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

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenInProgress: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(this.handleAxiosError(error))
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle token expiration and refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshTokenInProgress) {
            // Wait for the token refresh to complete
            return new Promise<string>((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.refreshTokenInProgress = true;

          try {
            // Try to refresh the token
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.client.post('/auth/refresh', { refreshToken });
            const { accessToken } = response.data.data.tokens;

            // Update the token in localStorage
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

            // Notify all subscribers that the token has been refreshed
            this.refreshSubscribers.forEach((callback) => callback(accessToken));
            this.refreshSubscribers = [];

            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // If refresh fails, clear auth data and redirect to login
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
            window.location.href = '/login';
            return Promise.reject(this.handleAxiosError(refreshError as AxiosError));
          } finally {
            this.refreshTokenInProgress = false;
          }
        }

        // Handle other errors
        return Promise.reject(this.handleAxiosError(error));
      }
    );
  }

  /**
   * Handle Axios errors and convert to ApiClientError
   * @param error Axios error
   * @returns ApiClientError with structured error information
   */
  private handleAxiosError(error: AxiosError): ApiClientError {
    // Log detailed error information for debugging
    console.error('AXIOS ERROR DETAILS:', error.response?.data || error.message);
    
    // Check for network connectivity
    const isOffline = !navigator.onLine;
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data as any;

      // Extract error details from response
      let message = data?.message || this.getDefaultErrorMessage(status);
      const code = data?.code;
      const details = data?.details;

      // Add network context if relevant
      if (isOffline) {
        message = 'You appear to be offline. Please check your internet connection.';
      }

      const apiError = new ApiClientError(message, status, code, details);
      
      // Add additional context
      (apiError as any).isNetworkError = this.isNetworkError(status);
      (apiError as any).isRetryable = this.isRetryableError(status);
      (apiError as any).timestamp = new Date().toISOString();
      
      return apiError;
    } else if (error.request) {
      // The request was made but no response was received
      const message = isOffline 
        ? 'You appear to be offline. Please check your internet connection.'
        : 'No response received from server. Please check your network connection.';
        
      const apiError = new ApiClientError(message, 0);
      (apiError as any).isNetworkError = true;
      (apiError as any).isRetryable = true;
      (apiError as any).timestamp = new Date().toISOString();
      
      return apiError;
    } else {
      // Something happened in setting up the request that triggered an Error
      const message = error.message || 'An error occurred while setting up the request';
      const apiError = new ApiClientError(message, 0);
      (apiError as any).isNetworkError = false;
      (apiError as any).isRetryable = false;
      (apiError as any).timestamp = new Date().toISOString();
      
      return apiError;
    }
  }

  /**
   * Get default error message based on HTTP status code
   */
  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'You are not authorized. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'The request timed out. Please try again.';
      case 409:
        return 'There was a conflict with your request. Please try again.';
      case 422:
        return 'The data provided is invalid. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment before trying again.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. Please try again later.';
      default:
        return 'An error occurred with the API request.';
    }
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(status: number): boolean {
    return status === 0 || status >= 500 || status === 408 || status === 429;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(status: number): boolean {
    // Don't retry client errors (4xx) except for auth and timeout
    if (status >= 400 && status < 500) {
      return status === 401 || status === 408 || status === 429;
    }
    
    // Retry network errors and server errors
    return status === 0 || status >= 500;
  }

  /**
   * Format error response for consistent error handling
   * @param error Error object
   * @returns Formatted API error
   */
  private formatErrorResponse(error: any): ApiError {
    if (error instanceof ApiClientError) {
      const apiError: ApiError = {
        message: error.message,
      };
      
      if (error.code !== undefined) {
        apiError.code = error.code;
      }
      if (error.details !== undefined) {
        apiError.details = error.details;
      }
      
      return apiError;
    }

    return {
      message: error.message || 'An unknown error occurred',
    };
  }

  /**
   * Make a GET request
   * @param url API endpoint
   * @param config Optional Axios config
   * @returns Promise with response data
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`GET ${url} failed:`, error);
      throw this.formatErrorResponse(error);
    }
  }

  /**
   * Make a POST request
   * @param url API endpoint
   * @param data Request payload
   * @param config Optional Axios config
   * @returns Promise with response data
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`POST ${url} failed:`, error);
      throw this.formatErrorResponse(error);
    }
  }

  /**
   * Make a PUT request
   * @param url API endpoint
   * @param data Request payload
   * @param config Optional Axios config
   * @returns Promise with response data
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PUT ${url} failed:`, error);
      throw this.formatErrorResponse(error);
    }
  }

  /**
   * Make a PATCH request
   * @param url API endpoint
   * @param data Request payload
   * @param config Optional Axios config
   * @returns Promise with response data
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PATCH ${url} failed:`, error);
      throw this.formatErrorResponse(error);
    }
  }

  /**
   * Make a DELETE request
   * @param url API endpoint
   * @param config Optional Axios config
   * @returns Promise with response data
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${url} failed:`, error);
      throw this.formatErrorResponse(error);
    }
  }

  /**
   * Upload a file
   * @param url API endpoint
   * @param file File to upload
   * @param fieldName Form field name for the file
   * @param additionalData Additional form data
   * @param onProgress Progress callback
   * @returns Promise with response data
   */
  async uploadFile<T>(
    url: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, any>,
    onProgress?: (percentage: number) => void
  ): Promise<T> {
    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      // Add any additional data to the form
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await this.client.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentage);
          }
        },
      });

      return response.data;
    } catch (error) {
      console.error(`File upload to ${url} failed:`, error);
      throw this.formatErrorResponse(error);
    }
  }
}

// Auth API methods
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username?: string;
    countryCode?: string;
    registrationDate: string;
    lastLoginDate?: string;
    profilePictureUrl?: string;
    isActive: boolean;
    role: 'student' | 'content_creator' | 'admin';
    createdAt: string;
    updatedAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Full API response wrapper
export interface FullApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
}

// Extended API client with auth methods
class ExtendedApiClient extends ApiClient {
  /**
   * Login user
   * @param credentials Login credentials
   * @returns Promise with auth response
   */
  async login(credentials: LoginCredentials): Promise<FullApiResponse<AuthResponse>> {
    return this.post<FullApiResponse<AuthResponse>>('/auth/login', credentials);
  }

  /**
   * Refresh authentication token
   * @param refreshToken Refresh token
   * @returns Promise with new auth response
   */
  async refreshToken(refreshToken: string): Promise<FullApiResponse<AuthResponse>> {
    return this.post<FullApiResponse<AuthResponse>>('/auth/refresh', { refreshToken });
  }

  /**
   * Logout user
   * @returns Promise
   */
  async logout(): Promise<void> {
    return this.post<void>('/auth/logout');
  }
}

// Create and export API client instance
export const apiClient = new ExtendedApiClient(env.apiUrl);

export default apiClient;