import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { STORAGE_KEYS } from '../utils/constants';
import { ApiError } from '../utils/types';

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
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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
            const { token } = response.data;

            // Update the token in localStorage
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

            // Notify all subscribers that the token has been refreshed
            this.refreshSubscribers.forEach((callback) => callback(token));
            this.refreshSubscribers = [];

            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // If refresh fails, clear auth data and redirect to login
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
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
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data as any;

      // Extract error details from response
      const message = data?.message || 'An error occurred with the API request';
      const code = data?.code;
      const details = data?.details;

      return new ApiClientError(message, status, code, details);
    } else if (error.request) {
      // The request was made but no response was received
      return new ApiClientError(
        'No response received from server. Please check your network connection.',
        0
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      return new ApiClientError(
        error.message || 'An error occurred while setting up the request',
        0
      );
    }
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
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Extended API client with auth methods
class ExtendedApiClient extends ApiClient {
  /**
   * Login user
   * @param credentials Login credentials
   * @returns Promise with auth response
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', credentials);
  }

  /**
   * Refresh authentication token
   * @param refreshToken Refresh token
   * @returns Promise with new auth response
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/refresh', { refreshToken });
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
export const apiClient = new ExtendedApiClient('/api/v1');

export default apiClient;