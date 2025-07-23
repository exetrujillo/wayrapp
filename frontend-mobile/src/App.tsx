import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationProvider } from './navigation/NavigationContext';
import AppNavigator from './navigation/AppNavigator';
import theme from './theme';
import './i18n';

/**
 * Main application component with navigation context and theming
 */
export default function App() {
  // Initialize any app-wide services or listeners here
  useEffect(() => {
    // Example: Setup analytics, crash reporting, etc.
    console.log('WayrApp Mobile initialized with enhanced navigation and theming');
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationProvider>
            <StatusBar 
              style="auto" 
              backgroundColor={theme.colors.primary}
              translucent={false}
            />
            <AppNavigator />
          </NavigationProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}