import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { ServerStackParamList } from '../navigation/ServerNavigator';

type Props = StackScreenProps<ServerStackParamList, 'ServerDetails'>;

/**
 * Server Details Screen
 * Displays detailed information about a selected server
 */
const ServerDetailsScreen = ({ route }: Props) => {
  const { serverId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Server Details</Text>
      <Text>Details for server: {serverId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default ServerDetailsScreen;