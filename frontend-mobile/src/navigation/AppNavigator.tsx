import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ServerNavigator from './ServerNavigator';
import { useNavigation } from './NavigationContext';
import theme from '../theme';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

/**
 * Main application navigator that handles the root navigation state
 * and determines which navigator to show based on authentication state
 * Includes navigation state persistence and deep linking support
 */
const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [initialState, setInitialState] = useState<NavigationState | undefined>();
  const [isReady, setIsReady] = useState(false);
  const routeNameRef = useRef<string>();
  const { navigationRef } = useNavigation();

  // Deep linking configuration
  const linking = {
    prefixes: ['wayrapp://', 'https://wayrapp.com'],
    config: {
      screens: {
        ServerSelection: 'servers',
        ServerDetails: 'servers/:serverId',
        Login: 'auth/login',
        Register: 'auth/register',
        Dashboard: 'dashboard',
        Course: 'courses/:courseId',
        Lesson: 'lessons/:lessonId',
        Profile: 'profile',
        Settings: 'settings',
      },
    },
  };

  useEffect(() => {
    // Check if user is authenticated and has selected a server
    const bootstrapAsync = async () => {
      try {
        const [token, server, savedStateString] = await Promise.all([
          AsyncStorage.getItem('auth_token'),
          AsyncStorage.getItem('server_url'),
          AsyncStorage.getItem(PERSISTENCE_KEY),
        ]);
        
        setUserToken(token);
        setServerUrl(server);

        // Restore navigation state if available
        if (savedStateString) {
          const state = JSON.parse(savedStateString);
          setInitialState(state);
        }
      } catch (e) {
        console.error('Failed to load authentication state', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Handle navigation state changes for persistence
  const onStateChange = async (state: NavigationState | undefined) => {
    if (state) {
      try {
        await AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save navigation state', e);
      }
    }

    // Track current route for analytics or other purposes
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

    if (previousRouteName !== currentRouteName) {
      // You can add analytics tracking here
      console.log('Navigation changed from', previousRouteName, 'to', currentRouteName);
    }
    routeNameRef.current = currentRouteName;
  };

  const onReady = () => {
    setIsReady(true);
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary}
          animating={true}
        />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      initialState={initialState}
      onStateChange={onStateChange}
      onReady={onReady}
      linking={linking}
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.onSurface,
          border: theme.colors.outline,
          notification: theme.colors.error,
        },
      }}
    >
      {serverUrl ? (
        userToken ? (
          <MainNavigator />
        ) : (
          <AuthNavigator />
        )
      ) : (
        <ServerNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});

export default AppNavigator;