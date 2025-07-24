import apiClient from './api';
import { AuthResponse, LoginCredentials, RefreshTokenRequest, User } from '../utils/types';
import { STORAGE_KEYS, API_ENDPOINTS } from '../utils/constants';

class AuthService {
  /**
   * Login user with email and password
   * @param credentials User login credentials
   * @returns Authentication response with token and user data
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN, 
        credentials
      );
      
      // Validate response structure
      if (!response.accessToken || !response.user) {
        throw new Error('Invalid authentication response from server');
      }
      
      // Store tokens and user data
      this.setSession(response);
      
      // If remember me is not checked, set token to expire in 24 hours
      if (!credentials.rememberMe) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryDate.toISOString());
      }
      
      return response;
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Provide more specific error messages for common authentication failures
      if (error.status === 401) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.status === 403) {
        throw new Error('Account is disabled or not authorized. Please contact support.');
      } else if (error.status === 429) {
        throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
      } else if (error.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!error.status) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      // Re-throw the original error if it's not a recognized type
      throw error;
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear all auth data from local storage
      this.clearSession();
      // Redirect to login page
      window.location.href = '/login';
    }
  }

  /**
   * Refresh the access token using the refresh token
   * @returns New authentication response with updated tokens
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REFRESH_TOKEN, 
        { refreshToken } as RefreshTokenRequest
      );
      
      // Validate response structure
      if (!response.accessToken) {
        throw new Error('Invalid refresh token response from server');
      }
      
      // Update stored tokens with new data
      this.setSession(response);
      
      return response;
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      
      // Provide specific error handling for refresh failures
      if (error.status === 401 || error.status === 403) {
        console.info('Refresh token is invalid or expired, redirecting to login');
      } else if (error.status >= 500) {
        console.error('Server error during token refresh');
      } else if (!error.status) {
        console.error('Network error during token refresh');
      }
      
      // If refresh fails for any reason, clear session and redirect
      this.clearSession();
      window.location.href = '/login';
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   * @returns Boolean indicating if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const user = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    
    // Must have both token and user data
    if (!token || !user) {
      return false;
    }
    
    // Validate token format (JWT tokens should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('Invalid token format detected, clearing session');
      this.clearSession();
      return false;
    }
    
    // Check if token has expired (for remember me functionality)
    if (expiry) {
      const expiryDate = new Date(expiry);
      if (expiryDate < new Date()) {
        console.info('Token expired, clearing session');
        this.clearSession();
        return false;
      }
    }
    
    // Validate user data can be parsed
    try {
      const userData = JSON.parse(user);
      if (!userData.id || !userData.email) {
        console.warn('Invalid user data detected, clearing session');
        this.clearSession();
        return false;
      }
    } catch (error) {
      console.warn('Failed to parse user data, clearing session');
      this.clearSession();
      return false;
    }
    
    return true;
  }

  /**
   * Get the current authenticated user from localStorage
   * @returns User object or null if not authenticated
   */
  getCurrentUser() {
    const userJson = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!userJson) {
      return null;
    }
    
    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  }

  /**
   * Fetch current user profile from the API
   * @returns Promise with current user data from server
   */
  async getCurrentUserProfile(): Promise<User> {
    try {
      const user = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
      
      // Validate user data structure
      if (!user || !user.id || !user.email) {
        throw new Error('Invalid user profile data received from server');
      }
      
      // Update stored user data with fresh data from server
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      
      // Provide specific error messages for common scenarios
      if (error.status === 401) {
        // Token is invalid or expired, clear session
        this.clearSession();
        throw new Error('Your session has expired. Please log in again.');
      } else if (error.status === 403) {
        throw new Error('You do not have permission to access this profile.');
      } else if (error.status >= 500) {
        throw new Error('Server error while fetching profile. Please try again later.');
      } else if (!error.status) {
        throw new Error('Network error while fetching profile. Please check your connection.');
      }
      
      // Re-throw the original error if it's not a recognized type
      throw error;
    }
  }

  /**
   * Store authentication session data
   * @param authResponse Authentication response from API
   */
  private setSession(authResponse: AuthResponse): void {
    // Validate required fields before storing
    if (!authResponse.accessToken) {
      throw new Error('Access token is required for authentication');
    }
    if (!authResponse.user) {
      throw new Error('User data is required for authentication');
    }
    
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authResponse.accessToken);
    
    // Store refresh token if provided
    if (authResponse.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken);
    }
    
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authResponse.user));
  }

  /**
   * Clear authentication session data
   */
  private clearSession(): void {
    // Remove all authentication-related data from localStorage
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    
    // Clear any other auth-related data that might exist
    // This ensures a clean slate for the next login
    const keysToCheck = Object.values(STORAGE_KEYS);
    keysToCheck.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Clear session and redirect to login (public method for external use)
   */
  clearSessionAndRedirect(): void {
    this.clearSession();
    window.location.href = '/login';
  }
}

// Create and export auth service instance
export const authService = new AuthService();

export default authService;