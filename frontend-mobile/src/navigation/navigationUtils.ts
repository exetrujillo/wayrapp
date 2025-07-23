import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './types';

/**
 * Navigation utilities for managing navigation state and deep linking
 */

let navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

/**
 * Set the navigation reference for use in navigation utilities
 */
export const setNavigationRef = (ref: NavigationContainerRef<RootStackParamList>) => {
  navigationRef = ref;
};

/**
 * Navigate to a specific screen
 */
export const navigate = (name: keyof RootStackParamList, params?: any) => {
  if (navigationRef?.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
};

/**
 * Go back to the previous screen
 */
export const goBack = () => {
  if (navigationRef?.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
};

/**
 * Reset navigation stack to a specific screen
 */
export const resetTo = (name: keyof RootStackParamList, params?: any) => {
  if (navigationRef?.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: name as never, params: params as never }],
      })
    );
  }
};

/**
 * Get current route name
 */
export const getCurrentRouteName = (): string | undefined => {
  if (navigationRef?.isReady()) {
    return navigationRef.getCurrentRoute()?.name;
  }
  return undefined;
};

/**
 * Handle authentication state changes
 */
export const handleAuthStateChange = async (isAuthenticated: boolean, hasServer: boolean) => {
  if (!hasServer) {
    resetTo('ServerSelection');
  } else if (!isAuthenticated) {
    resetTo('Login');
  } else {
    resetTo('Dashboard');
  }
};

/**
 * Handle deep link navigation
 */
export const handleDeepLink = (url: string) => {
  if (!navigationRef?.isReady()) {
    return;
  }

  // Parse the URL and navigate accordingly
  const urlParts = url.replace(/.*?:\/\//g, '').split('/');
  const [domain, ...pathParts] = urlParts;

  if (pathParts.length === 0) {
    navigate('Dashboard');
    return;
  }

  const [section, ...params] = pathParts;

  switch (section) {
    case 'servers':
      if (params.length > 0) {
        navigate('ServerDetails', { serverId: params[0] });
      } else {
        navigate('ServerSelection');
      }
      break;
    case 'auth':
      if (params[0] === 'login') {
        navigate('Login');
      } else if (params[0] === 'register') {
        navigate('Register');
      }
      break;
    case 'courses':
      if (params.length > 0) {
        navigate('Course', { courseId: params[0] });
      } else {
        navigate('Dashboard');
      }
      break;
    case 'lessons':
      if (params.length > 0) {
        navigate('Lesson', { lessonId: params[0] });
      }
      break;
    case 'profile':
      navigate('Profile');
      break;
    case 'settings':
      navigate('Settings');
      break;
    default:
      navigate('Dashboard');
  }
};

/**
 * Clear navigation state (useful for logout)
 */
export const clearNavigationState = async () => {
  try {
    await AsyncStorage.removeItem('NAVIGATION_STATE_V1');
  } catch (error) {
    console.error('Failed to clear navigation state:', error);
  }
};

/**
 * Navigation animation presets
 */
export const NavigationAnimations = {
  slideFromRight: {
    gestureDirection: 'horizontal' as const,
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 300,
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      };
    },
  },
  slideFromBottom: {
    gestureDirection: 'vertical' as const,
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 300,
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          transform: [
            {
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0],
              }),
            },
          ],
        },
      };
    },
  },
  fade: {
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 200,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 200,
        },
      },
    },
    cardStyleInterpolator: ({ current }: any) => {
      return {
        cardStyle: {
          opacity: current.progress,
        },
      };
    },
  },
};