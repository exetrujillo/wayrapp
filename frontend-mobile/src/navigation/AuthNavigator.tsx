import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Define the authentication stack param list
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Authentication navigator that handles login, registration, and password recovery flows
 */
const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={require('../screens/LoginScreen').default} 
      />
      <Stack.Screen 
        name="Register" 
        component={require('../screens/RegisterScreen').default} 
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={require('../screens/ForgotPasswordScreen').default} 
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;