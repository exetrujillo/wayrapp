import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ServerNavigator from './ServerNavigator';

/**
 * Main application navigator that handles the root navigation state
 * and determines which navigator to show based on authentication state
 */
const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated and has selected a server
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const server = await AsyncStorage.getItem('server_url');
        
        setUserToken(token);
        setServerUrl(server);
      } catch (e) {
        console.error('Failed to load authentication state', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    // We could show a splash screen here
    return null;
  }

  return (
    <NavigationContainer>
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

export default AppNavigator;