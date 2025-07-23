import React from 'react';
import { createStackNavigator, StackNavigationOptions, TransitionPresets } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { ServerStackParamList } from './types';
import theme from '../theme';

const Stack = createStackNavigator<ServerStackParamList>();

/**
 * Server navigator that handles the server discovery and selection flows
 * Includes custom header styling and smooth transitions
 */
const ServerNavigator: React.FC = () => {
  const defaultScreenOptions: StackNavigationOptions = {
    headerShown: true,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    cardStyle: {
      backgroundColor: theme.colors.background,
    },
    headerStyle: {
      backgroundColor: theme.colors.primary,
      elevation: 4,
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    headerTitleStyle: {
      color: theme.colors.onPrimary,
      fontSize: 20,
      fontWeight: '600',
      fontFamily: theme.fonts.headlineMedium.fontFamily,
    },
    headerTintColor: theme.colors.onPrimary,
    ...Platform.select({
      ios: TransitionPresets.SlideFromRightIOS,
      android: TransitionPresets.FadeFromBottomAndroid,
      default: TransitionPresets.DefaultTransition,
    }),
  };

  return (
    <Stack.Navigator
      initialRouteName="ServerSelection"
      screenOptions={defaultScreenOptions}
    >
      <Stack.Screen 
        name="ServerSelection" 
        component={require('../screens/ServerSelectionScreen').default} 
        options={{
          title: 'Choose Your Learning Server',
          headerLeft: () => null, // Remove back button on server selection
        }}
      />
      <Stack.Screen 
        name="ServerDetails" 
        component={require('../screens/ServerDetailsScreen').default} 
        options={({ route }) => ({
          title: `Server: ${route.params.serverId}`,
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen 
        name="ManualServerEntry" 
        component={require('../screens/ManualServerEntryScreen').default} 
        options={{
          title: 'Add Custom Server',
          headerBackTitleVisible: false,
          ...TransitionPresets.ModalSlideFromBottomIOS,
          gestureDirection: 'vertical',
        }}
      />
    </Stack.Navigator>
  );
};

export default ServerNavigator;