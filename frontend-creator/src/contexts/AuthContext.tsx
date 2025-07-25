import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { User, LoginCredentials } from '../utils/types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Token validation interval (check every 5 minutes)
  const TOKEN_VALIDATION_INTERVAL = 5 * 60 * 1000;

  // Helper function to perform automatic logout with error message
  const performAutomaticLogout = async (errorMessage: string) => {
    console.log('Performing automatic logout due to session issues:', errorMessage);

    // Set error message for user feedback
    setError(errorMessage);

    // Clear user state immediately
    setUser(null);

    // Clear session data from storage
    authService.clearSessionAndRedirect();

    // Navigate to login page
    // Note: clearSessionAndRedirect handles navigation, but we'll also navigate
    // in case the redirect doesn't work as expected
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  // Check if user is already authenticated on mount and validate session
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthProvider] Initializing authentication...');
      setIsLoading(true);
      setError(null);

      try {
        // First check if we have valid tokens in storage
        if (authService.isAuthenticated()) {
          try {
            // Validate session by fetching fresh user data from /auth/me endpoint
            // This replaces the old getCurrentUser() call with a real API call to get fresh user data
            console.log('[AuthProvider] Token found. Validating with API...');
            const userData = await authService.getCurrentUserProfile();
            setUser(userData);
            console.log('User profile successfully fetched and validated from /auth/me endpoint');
          } catch (profileError: any) {
            console.error('[AuthProvider] API validation failed:', profileError);

            // If profile fetch fails due to invalid/expired token, try to refresh
            if (profileError.message?.includes('session has expired') || profileError.status === 401) {
              try {
                // Attempt token refresh if refresh token is available
                console.log('Attempting token refresh due to expired session');
                await authService.refreshToken();

                // After successful refresh, fetch user profile again
                const userData = await authService.getCurrentUserProfile();
                setUser(userData);
                console.log('Session successfully refreshed and user profile updated');
              } catch (refreshError: any) {
                console.error('Token refresh failed:', refreshError);

                // If refresh also fails, perform automatic logout
                await performAutomaticLogout('Your session has expired. Please log in again.');
              }
            } else {
              // For other errors (network, server errors), show error but don't logout automatically
              const errorMessage = profileError.message || 'Failed to validate session. Please try refreshing the page.';
              setError(errorMessage);
              console.error('Profile fetch failed with non-auth error:', errorMessage);
            }
          }
        } else {
          // No valid authentication found, ensure user state is cleared
          setUser(null);
          console.log('[AuthProvider] No token found. Setting loading to false.');
        }
      } catch (err: any) {
        console.error('[AuthProvider] Initialization error:', err);
        const errorMessage = 'Failed to initialize authentication. Please try logging in again.';
        await performAutomaticLogout(errorMessage);
      } finally {
        // THIS IS THE CRITICAL FIX
        console.log('[AuthProvider] Finalizing initialization.');
        console.log('[AuthProvider] Initialization finished. Final loading state: false');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [navigate]);

  // Set up periodic token validation for authenticated users
  useEffect(() => {
    let validationInterval: NodeJS.Timeout;

    if (user && !isLoading) {
      console.log('Setting up periodic token validation for session persistence');

      validationInterval = setInterval(async () => {
        try {
          // Only validate if we still have tokens and user is authenticated
          if (authService.isAuthenticated()) {
            console.log('Performing periodic token validation to maintain session');
            await authService.getCurrentUserProfile();
            console.log('Periodic token validation successful - session maintained');

            // Clear any existing errors since validation was successful
            if (error) {
              setError(null);
            }
          } else {
            console.log('No valid tokens found during periodic check - performing automatic logout');
            await performAutomaticLogout('Your session has expired. Please log in again.');
          }
        } catch (validationError: any) {
          console.error('Periodic token validation failed:', validationError);

          // If validation fails due to expired/invalid token, attempt refresh
          if (validationError.status === 401) {
            try {
              console.log('Attempting token refresh during periodic validation to maintain session');
              await authService.refreshToken();

              // After successful refresh, validate the session again
              const userData = await authService.getCurrentUserProfile();
              setUser(userData);
              console.log('Token refresh and session validation successful during periodic check');

              // Clear any existing errors
              if (error) {
                setError(null);
              }
            } catch (refreshError: any) {
              console.error('Token refresh failed during periodic validation:', refreshError);

              // If refresh fails, perform automatic logout
              await performAutomaticLogout('Your session has expired and could not be renewed. Please log in again.');
            }
          } else {
            // For non-auth errors, don't logout but show error
            console.error('Periodic validation failed with non-auth error:', validationError);
            setError('Session validation failed. Please check your connection.');
          }
        }
      }, TOKEN_VALIDATION_INTERVAL);
    }

    // Cleanup interval on unmount or when user changes
    return () => {
      if (validationInterval) {
        console.log('Clearing token validation interval');
        clearInterval(validationInterval);
      }
    };
  }, [user, isLoading, navigate]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call auth service login which handles production API response format
      const response = await authService.login(credentials);

      // Validate that we received the expected production API response format
      if (!response.tokens || !response.tokens.accessToken || !response.user) {
        console.error('Invalid response format from production API:', response);
        throw new Error('Invalid response format from authentication server. Please try again.');
      }

      // Validate user data structure
      if (!response.user.id || !response.user.email) {
        console.error('Invalid user data in response:', response.user);
        throw new Error('Invalid user data received from server. Please try again.');
      }

      // Set user state with the authenticated user data from production API
      setUser(response.user);

      // Clear any existing errors
      setError(null);

      // Navigate to dashboard on successful login
      navigate('/dashboard');
    } catch (err: any) {

      // Set user-friendly error message based on the error type
      let errorMessage = 'Failed to login. Please try again.';

      if (err.message) {
        // Use the specific error message from auth service or API
        errorMessage = err.message;
      } else if (err.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err.status === 403) {
        errorMessage = 'Account access denied. Please contact support.';
      } else if (err.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!err.status) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      setError(errorMessage);

      // Re-throw error so calling components can handle it if needed
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting logout with production API');

      // Call auth service logout which handles production API logout endpoint if available
      await authService.logout();

      console.log('Logout API call successful, clearing user state');

      // Clear user state
      setUser(null);

      // Clear any existing errors
      setError(null);

      console.log('Navigating to login page after successful logout');

      // Navigate to login page
      navigate('/login');
    } catch (err: any) {
      console.error('Logout error in AuthContext:', err);

      // Even if logout API call fails, we should still clear local state
      // This ensures the user is logged out locally regardless of server response
      console.log('Logout API failed, but clearing local session anyway');

      setUser(null);
      authService.clearSessionAndRedirect();

      // Provide user feedback about the logout status
      const errorMessage = err.status >= 500
        ? 'Logout completed locally. Server error occurred but you have been logged out.'
        : err.status === 401
          ? 'Session already expired. You have been logged out.'
          : 'Logout completed locally. Network error occurred but you have been logged out.';

      setError(errorMessage);

      // Navigate to login page regardless of API error
      navigate('/login');

      // Don't re-throw logout errors as they shouldn't prevent the user from being logged out locally
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    error,
  };

  // Show loading state while initializing authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading Application...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};