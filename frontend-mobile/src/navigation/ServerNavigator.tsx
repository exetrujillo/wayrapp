import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Define the server stack param list
export type ServerStackParamList = {
  ServerSelection: undefined;
  ServerDetails: { serverId: string };
  ManualServerEntry: undefined;
};

const Stack = createStackNavigator<ServerStackParamList>();

/**
 * Server navigator that handles the server discovery and selection flows
 */
const ServerNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ServerSelection"
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="ServerSelection" 
        component={require('../screens/ServerSelectionScreen').default} 
        options={{ title: 'Choose Your Learning Server' }}
      />
      <Stack.Screen 
        name="ServerDetails" 
        component={require('../screens/ServerDetailsScreen').default} 
        options={({ route }) => ({ title: route.params.serverId })}
      />
      <Stack.Screen 
        name="ManualServerEntry" 
        component={require('../screens/ManualServerEntryScreen').default} 
        options={{ title: 'Add Custom Server' }}
      />
    </Stack.Navigator>
  );
};

export default ServerNavigator;