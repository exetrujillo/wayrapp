import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading, error, user } = useAuth();
  const location = useLocation();

  // Log authentication state for debugging
  useEffect(() => {
    console.log('ProtectedRoute - Authentication state:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      currentPath: location.pathname,
      error: error || 'none'
    });
  }, [isAuthenticated, isLoading, user, location.pathname, error]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          <p className="text-secondary-600 text-sm">Validating session...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an authentication error but still loading
  if (error && !isAuthenticated && !isLoading) {
    console.log('ProtectedRoute - Authentication error detected, redirecting to login:', error);
    
    // Pass error information to login page for user feedback
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location, 
          error: error,
          reason: 'session_expired'
        }} 
        replace 
      />
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute - User not authenticated, redirecting to login from:', location.pathname);
    
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          reason: 'not_authenticated'
        }} 
        replace 
      />
    );
  }

  // Additional validation: ensure we have user data
  if (isAuthenticated && !user) {
    console.warn('ProtectedRoute - Authenticated but no user data, this should not happen');
    
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          error: 'Session data incomplete. Please log in again.',
          reason: 'invalid_session'
        }} 
        replace 
      />
    );
  }

  // Log successful authentication
  console.log('ProtectedRoute - Access granted to authenticated user:', user?.email);

  // Render children if authenticated and user data is available
  return <>{children}</>;
};

export default ProtectedRoute;