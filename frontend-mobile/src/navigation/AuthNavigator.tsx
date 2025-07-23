import React from 'react';
import { createStackNavigator, StackNavigationOptions, TransitionPresets } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { AuthStackParamList } from './types';
import theme from '../theme';

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Authentication navigator that handles login, registration, and password recovery flows
 * Includes smooth transitions and consistent theming
 */
const AuthNavigator: React.FC = () => {
  const screenOptions: StackNavigationOptions = {
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    cardStyle: {
      backgroundColor: theme.colors.background,
    },
    ...Platform.select({
      ios: TransitionPresets.SlideFromRightIOS,
      android: TransitionPresets.FadeFromBottomAndroid,
      default: TransitionPresets.DefaultTransition,
    }),
  };

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={screenOptions}
    >
      <Stack.Screen 
        name="Login" 
        component={require('../screens/LoginScreen').default}
        options={{
          animationTypeForReplace: 'pop',
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={require('../screens/RegisterScreen').default}
        options={{
          ...TransitionPresets.ModalSlideFromBottomIOS,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={require('../screens/ForgotPasswordScreen').default}
        options={{
          ...TransitionPresets.SlideFromRightIOS,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;