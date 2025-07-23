import React, { createContext, useContext, useCallback, useRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList, setNavigationRef } from './navigationUtils';

interface NavigationContextType {
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>;
  navigate: (name: keyof RootStackParamList, params?: any) => void;
  goBack: () => void;
  resetTo: (name: keyof RootStackParamList, params?: any) => void;
  getCurrentRoute: () => string | undefined;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

/**
 * Navigation provider that manages navigation state and provides utilities
 */
export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Set the navigation reference for global use
  React.useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, []);

  const navigate = useCallback((name: keyof RootStackParamList, params?: any) => {
    if (navigationRef.current?.isReady()) {
      navigationRef.current.navigate(name as never, params as never);
    }
  }, []);

  const goBack = useCallback(() => {
    if (navigationRef.current?.isReady() && navigationRef.current.canGoBack()) {
      navigationRef.current.goBack();
    }
  }, []);

  const resetTo = useCallback((name: keyof RootStackParamList, params?: any) => {
    if (navigationRef.current?.isReady()) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: name as never, params: params as never }],
      });
    }
  }, []);

  const getCurrentRoute = useCallback(() => {
    if (navigationRef.current?.isReady()) {
      return navigationRef.current.getCurrentRoute()?.name;
    }
    return undefined;
  }, []);

  const value: NavigationContextType = {
    navigationRef,
    navigate,
    goBack,
    resetTo,
    getCurrentRoute,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Hook to use navigation context
 */
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export default NavigationContext;