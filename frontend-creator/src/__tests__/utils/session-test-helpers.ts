/**
 * Session Testing Utilities
 * Helper functions for testing session expiration scenarios
 */

import { authService } from '../../services/auth';

/**
 * Utility functions for testing session expiration behavior
 */
export const sessionTestHelpers = {
  /**
   * Simulate token expiration by corrupting the access token
   */
  simulateTokenExpiration(): void {
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken) {
      // Corrupt the token to make it invalid
      localStorage.setItem('auth_token', currentToken + '_expired');
      console.log('Access token corrupted to simulate expiration');
    }
  },

  /**
   * Simulate refresh token expiration by corrupting both tokens
   */
  simulateRefreshTokenExpiration(): void {
    const currentAccessToken = localStorage.getItem('auth_token');
    const currentRefreshToken = localStorage.getItem('refresh_token');
    
    if (currentAccessToken) {
      localStorage.setItem('auth_token', currentAccessToken + '_expired');
    }
    if (currentRefreshToken) {
      localStorage.setItem('refresh_token', currentRefreshToken + '_expired');
    }
    console.log('Both tokens corrupted to simulate complete expiration');
  },

  /**
   * Check current authentication state
   */
  checkAuthState(): void {
    console.log('=== Authentication State ===');
    console.log('Is Authenticated:', authService.isAuthenticated());
    console.log('Current User:', authService.getCurrentUser());
    console.log('Access Token:', localStorage.getItem('auth_token') ? 'Present' : 'Missing');
    console.log('Refresh Token:', localStorage.getItem('refresh_token') ? 'Present' : 'Missing');
    console.log('User Data:', localStorage.getItem('auth_user') ? 'Present' : 'Missing');
  },

  /**
   * Test profile fetch (triggers session validation)
   */
  async testProfileFetch(): Promise<void> {
    console.log('Testing profile fetch...');
    try {
      const user = await authService.getCurrentUserProfile();
      console.log('✅ Profile fetch successful:', user.email);
    } catch (error: any) {
      console.log('❌ Profile fetch failed:', error.message);
      console.log('Error details:', error);
    }
  },

  /**
   * Test token refresh
   */
  async testTokenRefresh(): Promise<void> {
    console.log('Testing token refresh...');
    try {
      const response = await authService.refreshToken();
      console.log('✅ Token refresh successful');
      console.log('New access token received:', !!response.accessToken);
    } catch (error: any) {
      console.log('❌ Token refresh failed:', error.message);
      console.log('Error details:', error);
    }
  },

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('token_expiry');
    console.log('All authentication data cleared');
  },

  /**
   * Simulate network error by temporarily overriding fetch
   */
  simulateNetworkError(durationMs: number = 5000): () => void {
    const originalFetch = window.fetch;
    
    window.fetch = () => {
      return Promise.reject(new Error('Network error simulated'));
    };
    
    console.log(`Network error simulation started for ${durationMs}ms`);
    
    const cleanup = () => {
      window.fetch = originalFetch;
      console.log('Network error simulation ended');
    };
    
    setTimeout(cleanup, durationMs);
    
    return cleanup;
  },

  /**
   * Run a comprehensive session test
   */
  async runSessionTest(): Promise<void> {
    console.log('🧪 Starting comprehensive session test...\n');
    
    // Check initial state
    console.log('1. Initial State:');
    this.checkAuthState();
    console.log('');
    
    // Test profile fetch
    console.log('2. Profile Fetch Test:');
    await this.testProfileFetch();
    console.log('');
    
    // Simulate token expiration
    console.log('3. Simulating Token Expiration:');
    this.simulateTokenExpiration();
    await this.testProfileFetch();
    console.log('');
    
    // Test token refresh
    console.log('4. Token Refresh Test:');
    await this.testTokenRefresh();
    console.log('');
    
    // Test profile fetch after refresh
    console.log('5. Profile Fetch After Refresh:');
    await this.testProfileFetch();
    console.log('');
    
    // Simulate complete expiration
    console.log('6. Simulating Complete Token Expiration:');
    this.simulateRefreshTokenExpiration();
    await this.testProfileFetch();
    await this.testTokenRefresh();
    console.log('');
    
    console.log('🏁 Session test completed');
  }
};

// Make helpers available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).sessionTestHelpers = sessionTestHelpers;
  console.log('Session test helpers available at window.sessionTestHelpers');
}