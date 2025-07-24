import apiClient from './api';
import { AuthResponse, LoginCredentials, RefreshTokenRequest } from '../utils/types';
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
      
      // Store tokens and user data
      this.setSession(response);
      
      // If remember me is not checked, set token to expire in 24 hours
      if (!credentials.rememberMe) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryDate.toISOString());
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
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
      
      // Update stored tokens
      this.setSession(response);
      
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout the user
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
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    
    if (!token) {
      return false;
    }
    
    // Check if token has expired
    if (expiry) {
      const expiryDate = new Date(expiry);
      if (expiryDate < new Date()) {
        this.clearSession();
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get the current authenticated user
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
   * Store authentication session data
   * @param authResponse Authentication response from API
   */
  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authResponse.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authResponse.refreshToken);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authResponse.user));
  }

  /**
   * Clear authentication session data
   */
  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  }
}

// Create and export auth service instance
export const authService = new AuthService();

export default authService;