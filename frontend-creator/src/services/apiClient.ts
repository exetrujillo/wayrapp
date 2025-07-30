/**
 * Unified API Client System for WayrApp Creator
 * 
 * This module provides a comprehensive, DRY API client system that handles all CRUD operations
 * consistently across the entire application. It implements centralized error handling, response
 * formatting, authentication, and specialized operations for hierarchical content management.
 * 
 * Key features:
 * - Generic CRUD operations for all entity types
 * - Consistent error handling and transformation
 * - Automatic token refresh and authentication
 * - Specialized methods for reordering, assignment, and unassignment
 * - Type-safe interfaces with comprehensive TypeScript support
 * - Optimistic updates and cache invalidation support
 * 
 * @module ApiClient
 * @category Services
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic CRUD operations
 * const courses = await apiClient.list<Course>('courses');
 * const course = await apiClient.get<Course>('courses', 'course-id');
 * const newCourse = await apiClient.create<Course>('courses', courseData);
 * const updated = await apiClient.update<Course>('courses', 'course-id', updateData);
 * await apiClient.delete('courses', 'course-id');
 * 
 * // Specialized operations
 * await apiClient.reorder('lessons', 'module-id', ['lesson1', 'lesson2', 'lesson3']);
 * await apiClient.assign('lessons', 'lesson-id', 'exercises', 'exercise-id', { order: 1 });
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { STORAGE_KEYS } from '../utils/constants';
import { env } from '../config/environment';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Generic API response wrapper that all endpoints should return
 * @template T The type of data contained in the response
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * Paginated response structure for list operations
 * @template T The type of items in the paginated list
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  success: boolean;
  message?: string;
  timestamp?: string;
}

/**
 * Pagination metadata included in paginated responses
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parameters for list operations with pagination and filtering
 */
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  // SECURITY_AUDIT_TODO: The [key: string]: any pattern allows arbitrary parameters to be passed to the API.
  // Consider implementing a more restrictive type or validation to prevent parameter pollution attacks.
  [key: string]: any; // Allow additional filter parameters
}

/**
 * Parameters for assignment operations (lesson-exercise relationships)
 */
export interface AssignmentData {
  order?: number;
  [key: string]: any; // Allow additional assignment metadata
}

/**
 * Parameters for unassignment operations
 */
export interface UnassignmentData {
  [key: string]: any; // Allow additional unassignment metadata
}

/**
 * Enhanced error class for API operations with detailed context
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;
  public readonly details: Record<string, any> | undefined;
  public readonly isNetworkError: boolean;
  public readonly isRetryable: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, any>,
    isNetworkError: boolean = false,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    // SECURITY_AUDIT_TODO: Optional properties with exactOptionalPropertyTypes can cause type issues.
    // Consider making these properties required or explicitly handle undefined values to prevent runtime errors.
    this.code = code;
    this.details = details;
    this.isNetworkError = isNetworkError;
    this.isRetryable = isRetryable;
    this.timestamp = new Date().toISOString();
  }
}

// ============================================================================
// Unified API Client Implementation
// ============================================================================

/**
 * Unified API Client class that provides consistent CRUD operations and error handling
 * for all entity types in the WayrApp Creator system.
 */
class UnifiedApiClient {
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

    this.setupInterceptors();
  }

  // ============================================================================
  // Private Methods - Setup and Error Handling
  // ============================================================================

  /**
   * Sets up request and response interceptors for authentication and error handling
   * @private
   */
  private setupInterceptors(): void {
    // Request interceptor for authentication
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
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // SECURITY_AUDIT_TODO: Token refresh endpoint should validate the refresh token server-side
            // and implement rate limiting to prevent abuse. Consider adding CSRF protection.
            const response = await this.client.post('/auth/refresh', { refreshToken });
            const { accessToken } = response.data.data.tokens;

            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

            // Notify all subscribers
            this.refreshSubscribers.forEach((callback) => callback(accessToken));
            this.refreshSubscribers = [];

            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // SECURITY_AUDIT_TODO: Consider implementing secure logout that notifies the server
            // to invalidate tokens server-side before clearing client storage.
            // Clear auth data and redirect to login
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
            // SECURITY_AUDIT_TODO: Direct window.location.href manipulation can be vulnerable to open redirect attacks.
            // Validate the redirect URL or use a router-based navigation method instead.
            window.location.href = '/login';
            return Promise.reject(this.handleAxiosError(refreshError as AxiosError));
          } finally {
            this.refreshTokenInProgress = false;
          }
        }

        return Promise.reject(this.handleAxiosError(error));
      }
    );
  }

  /**
   * Handles Axios errors and converts them to structured ApiClientError instances
   * @private
   * @param error - The Axios error to handle
   * @returns Structured ApiClientError with context
   */
  private handleAxiosError(error: AxiosError): ApiClientError {
    const isOffline = !navigator.onLine;
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      let message = data?.message || this.getDefaultErrorMessage(status);
      const code = data?.code;
      const details = data?.details;

      if (isOffline) {
        message = 'You appear to be offline. Please check your internet connection.';
      }

      return new ApiClientError(
        message,
        status,
        code || undefined,
        details || undefined,
        this.isNetworkError(status),
        this.isRetryableError(status)
      );
    } else if (error.request) {
      const message = isOffline 
        ? 'You appear to be offline. Please check your internet connection.'
        : 'No response received from server. Please check your network connection.';
        
      return new ApiClientError(message, 0, undefined, undefined, true, true);
    } else {
      const message = error.message || 'An error occurred while setting up the request';
      return new ApiClientError(message, 0, undefined, undefined, false, false);
    }
  }

  /**
   * Gets default error message based on HTTP status code
   * @private
   */
  private getDefaultErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Invalid request. Please check your input and try again.',
      401: 'You are not authorized. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      408: 'The request timed out. Please try again.',
      409: 'There was a conflict with your request. Please try again.',
      422: 'The data provided is invalid. Please check your input.',
      429: 'Too many requests. Please wait a moment before trying again.',
      500: 'Internal server error. Please try again later.',
      502: 'Bad gateway. The server is temporarily unavailable.',
      503: 'Service unavailable. Please try again later.',
      504: 'Gateway timeout. Please try again later.',
    };

    return messages[status] || 'An error occurred with the API request.';
  }

  /**
   * Checks if error is network-related
   * @private
   */
  private isNetworkError(status: number): boolean {
    return status === 0 || status >= 500 || status === 408 || status === 429;
  }

  /**
   * Checks if error is retryable
   * @private
   */
  private isRetryableError(status: number): boolean {
    if (status >= 400 && status < 500) {
      return status === 401 || status === 408 || status === 429;
    }
    return status === 0 || status >= 500;
  }

  /**
   * Normalizes API response to ensure consistent structure
   * @private
   */
  private normalizeResponse<T>(response: any): ApiResponse<T> {
    // Handle both wrapped and unwrapped responses
    if (response.data && response.success !== undefined) {
      return response as ApiResponse<T>;
    }

    // If response is not wrapped, wrap it
    return {
      success: true,
      data: response.data || response,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // Generic CRUD Operations
  // ============================================================================

  /**
   * Creates a new entity of the specified type
   * @template T The type of entity being created
   * @param endpoint - The API endpoint (e.g., 'courses', 'lessons')
   * @param data - The data for creating the entity
   * @returns Promise resolving to the created entity
   * 
   * @example
   * const course = await apiClient.create<Course>('courses', {
   *   name: 'Spanish Basics',
   *   sourceLanguage: 'en',
   *   targetLanguage: 'es'
   * });
   */
  async create<T>(endpoint: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(`/${endpoint}`, data);
      return this.normalizeResponse<T>(response.data);
    } catch (error) {
      console.error(`CREATE ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a single entity by ID
   * @template T The type of entity being retrieved
   * @param endpoint - The API endpoint (e.g., 'courses', 'lessons')
   * @param id - The unique identifier of the entity
   * @returns Promise resolving to the entity
   * 
   * @example
   * const course = await apiClient.get<Course>('courses', 'spanish-basics');
   */
  async get<T>(endpoint: string, id: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(`/${endpoint}/${id}`);
      return this.normalizeResponse<T>(response.data);
    } catch (error) {
      console.error(`GET ${endpoint}/${id} failed:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing entity
   * @template T The type of entity being updated
   * @param endpoint - The API endpoint (e.g., 'courses', 'lessons')
   * @param id - The unique identifier of the entity
   * @param data - The data for updating the entity
   * @returns Promise resolving to the updated entity
   * 
   * @example
   * const updated = await apiClient.update<Course>('courses', 'spanish-basics', {
   *   name: 'Spanish Fundamentals'
   * });
   */
  async update<T>(endpoint: string, id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(`/${endpoint}/${id}`, data);
      return this.normalizeResponse<T>(response.data);
    } catch (error) {
      console.error(`UPDATE ${endpoint}/${id} failed:`, error);
      throw error;
    }
  }

  /**
   * Deletes an entity by ID
   * @param endpoint - The API endpoint (e.g., 'courses', 'lessons')
   * @param id - The unique identifier of the entity
   * @returns Promise resolving when deletion is complete
   * 
   * @example
   * await apiClient.delete('courses', 'old-course-id');
   */
  async delete(endpoint: string, id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(`/${endpoint}/${id}`);
      return this.normalizeResponse<void>(response.data);
    } catch (error) {
      console.error(`DELETE ${endpoint}/${id} failed:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a paginated list of entities
   * @template T The type of entities in the list
   * @param endpoint - The API endpoint (e.g., 'courses', 'lessons')
   * @param params - Optional pagination and filtering parameters
   * @returns Promise resolving to paginated list of entities
   * 
   * @example
   * const courses = await apiClient.list<Course>('courses', {
   *   page: 1,
   *   limit: 10,
   *   search: 'spanish'
   * });
   */
  async list<T>(endpoint: string, params?: ListParams): Promise<PaginatedResponse<T>> {
    try {
      const response = await this.client.get<PaginatedResponse<T>>(`/${endpoint}`, { params });
      
      // Normalize response structure
      const data = response.data;
      if (Array.isArray(data)) {
        // Handle simple array responses by creating pagination structure
        return {
          data: data as T[],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
          success: true,
          timestamp: new Date().toISOString(),
        };
      }

      // Handle properly structured paginated responses
      return data as PaginatedResponse<T>;
    } catch (error) {
      console.error(`LIST ${endpoint} failed:`, error);
      throw error;
    }
  }

  // ============================================================================
  // Specialized Operations
  // ============================================================================

  /**
   * Reorders entities within a parent container
   * @param endpoint - The API endpoint (e.g., 'lessons', 'exercises')
   * @param parentId - The ID of the parent container
   * @param orderedIds - Array of entity IDs in the new order
   * @returns Promise resolving when reordering is complete
   * 
   * @example
   * await apiClient.reorder('lessons', 'module-id', ['lesson1', 'lesson2', 'lesson3']);
   */
  async reorder(endpoint: string, parentId: string, orderedIds: string[]): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.post<ApiResponse<void>>(
        `/${endpoint}/reorder`,
        { parentId, orderedIds }
      );
      return this.normalizeResponse<void>(response.data);
    } catch (error) {
      console.error(`REORDER ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Assigns an entity to another entity (many-to-many relationships)
   * @param parentEndpoint - The parent entity endpoint (e.g., 'lessons')
   * @param parentId - The ID of the parent entity
   * @param childEndpoint - The child entity endpoint (e.g., 'exercises')
   * @param childId - The ID of the child entity
   * @param data - Additional assignment data (e.g., order)
   * @returns Promise resolving when assignment is complete
   * 
   * @example
   * await apiClient.assign('lessons', 'lesson-id', 'exercises', 'exercise-id', { order: 1 });
   */
  async assign(
    parentEndpoint: string,
    parentId: string,
    childEndpoint: string,
    childId: string,
    data?: AssignmentData
  ): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.post<ApiResponse<void>>(
        `/${parentEndpoint}/${parentId}/${childEndpoint}/${childId}`,
        data || {}
      );
      return this.normalizeResponse<void>(response.data);
    } catch (error) {
      console.error(`ASSIGN ${parentEndpoint}/${parentId}/${childEndpoint}/${childId} failed:`, error);
      throw error;
    }
  }

  /**
   * Unassigns an entity from another entity (many-to-many relationships)
   * @param parentEndpoint - The parent entity endpoint (e.g., 'lessons')
   * @param parentId - The ID of the parent entity
   * @param childEndpoint - The child entity endpoint (e.g., 'exercises')
   * @param childId - The ID of the child entity
   * @param data - Additional unassignment data
   * @returns Promise resolving when unassignment is complete
   * 
   * @example
   * await apiClient.unassign('lessons', 'lesson-id', 'exercises', 'exercise-id');
   */
  async unassign(
    parentEndpoint: string,
    parentId: string,
    childEndpoint: string,
    childId: string,
    data?: UnassignmentData
  ): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.delete<ApiResponse<void>>(
        `/${parentEndpoint}/${parentId}/${childEndpoint}/${childId}`,
        { data: data || {} }
      );
      return this.normalizeResponse<void>(response.data);
    } catch (error) {
      console.error(`UNASSIGN ${parentEndpoint}/${parentId}/${childEndpoint}/${childId} failed:`, error);
      throw error;
    }
  }

  /**
   * Lists child entities for a specific parent (hierarchical relationships)
   * @template T The type of child entities
   * @param parentEndpoint - The parent entity endpoint (e.g., 'courses')
   * @param parentId - The ID of the parent entity
   * @param childEndpoint - The child entity endpoint (e.g., 'levels')
   * @param params - Optional pagination and filtering parameters
   * @returns Promise resolving to paginated list of child entities
   * 
   * @example
   * const levels = await apiClient.listByParent<Level>('courses', 'course-id', 'levels');
   */
  async listByParent<T>(
    parentEndpoint: string,
    parentId: string,
    childEndpoint: string,
    params?: ListParams
  ): Promise<PaginatedResponse<T>> {
    try {
      // SECURITY_AUDIT_TODO: Validate endpoint parameters to prevent path traversal attacks.
      // Consider implementing a whitelist of allowed endpoint combinations and sanitizing IDs.
      const response = await this.client.get<PaginatedResponse<T>>(
        `/${parentEndpoint}/${parentId}/${childEndpoint}`,
        { params }
      );
      
      const data = response.data;
      if (Array.isArray(data)) {
        return {
          data: data as T[],
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: data.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
          success: true,
          timestamp: new Date().toISOString(),
        };
      }

      return data as PaginatedResponse<T>;
    } catch (error) {
      console.error(`LIST BY PARENT ${parentEndpoint}/${parentId}/${childEndpoint} failed:`, error);
      throw error;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Uploads a file to the specified endpoint
   * @template T The type of response expected
   * @param endpoint - The upload endpoint
   * @param file - The file to upload
   * @param fieldName - The form field name for the file
   * @param additionalData - Additional form data
   * @param onProgress - Progress callback function
   * @returns Promise resolving to the upload response
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, any>,
    onProgress?: (percentage: number) => void
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await this.client.post<ApiResponse<T>>(`/${endpoint}`, formData, {
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

      return this.normalizeResponse<T>(response.data);
    } catch (error) {
      console.error(`UPLOAD ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Makes a custom request with full control over the HTTP method and configuration
   * @template T The type of response expected
   * @param config - Axios request configuration
   * @returns Promise resolving to the response
   */
  async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config);
      return this.normalizeResponse<T>(response.data);
    } catch (error) {
      console.error(`CUSTOM REQUEST failed:`, error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

/**
 * Singleton instance of the unified API client for use throughout the application.
 * 
 * This instance provides consistent CRUD operations, error handling, and specialized
 * functionality for all entity types in the WayrApp Creator system.
 * 
 * @example
 * import { apiClient } from '../services/apiClient';
 * 
 * // Use in components or hooks
 * const courses = await apiClient.list<Course>('courses');
 * const course = await apiClient.get<Course>('courses', 'course-id');
 */
export const apiClient = new UnifiedApiClient(env.apiUrl);

export default apiClient;