import React from 'react';
import { createStackNavigator, StackNavigationOptions, TransitionPresets } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { Appbar } from 'react-native-paper';
import { MainStackParamList } from './types';
import theme from '../theme';

const Stack = createStackNavigator<MainStackParamList>();

/**
 * Main navigator that handles the authenticated user flows
 * Includes custom header styling and smooth transitions
 */
const MainNavigator: React.FC = () => {
  const defaultScreenOptions: StackNavigationOptions = {
    headerShown: true,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    cardStyle: {
      backgroundColor: theme.colors.background,
    },
    headerStyle: {
      backgroundColor: theme.colors.surface,
      elevation: 4,
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    headerTitleStyle: {
      color: theme.colors.onSurface,
      fontSize: 20,
      fontWeight: '600',
      fontFamily: theme.fonts.headlineMedium.fontFamily,
    },
    headerTintColor: theme.colors.primary,
    ...Platform.select({
      ios: TransitionPresets.SlideFromRightIOS,
      android: TransitionPresets.FadeFromBottomAndroid,
      default: TransitionPresets.DefaultTransition,
    }),
  };

  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={defaultScreenOptions}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={require('../screens/DashboardScreen').default} 
        options={{
          title: 'My Courses',
          headerLeft: () => null, // Remove back button on dashboard
        }}
      />
      <Stack.Screen 
        name="Course" 
        component={require('../screens/CourseScreen').default} 
        options={({ route }) => ({
          title: `Course: ${route.params.courseId}`,
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen 
        name="Lesson" 
        component={require('../screens/LessonScreen').default} 
        options={{
          headerShown: false,
          ...TransitionPresets.ModalSlideFromBottomIOS,
          gestureDirection: 'vertical',
          cardStyle: {
            backgroundColor: theme.colors.primary,
          },
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={require('../screens/ProfileScreen').default} 
        options={{
          title: 'My Profile',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={require('../screens/SettingsScreen').default} 
        options={{
          title: 'Settings',
          headerBackTitleVisible: false,
          ...TransitionPresets.SlideFromRightIOS,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;