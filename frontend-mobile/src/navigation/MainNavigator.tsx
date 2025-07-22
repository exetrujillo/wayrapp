import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Define the main stack param list
export type MainStackParamList = {
  Dashboard: undefined;
  Course: { courseId: string };
  Lesson: { lessonId: string };
  Profile: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

/**
 * Main navigator that handles the authenticated user flows
 */
const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={require('../screens/DashboardScreen').default} 
        options={{ title: 'My Courses' }}
      />
      <Stack.Screen 
        name="Course" 
        component={require('../screens/CourseScreen').default} 
        options={({ route }) => ({ title: route.params.courseId })}
      />
      <Stack.Screen 
        name="Lesson" 
        component={require('../screens/LessonScreen').default} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Profile" 
        component={require('../screens/ProfileScreen').default} 
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={require('../screens/SettingsScreen').default} 
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;