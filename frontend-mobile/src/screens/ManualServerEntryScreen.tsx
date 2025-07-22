import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Manual Server Entry Screen
 * Allows users to manually enter a custom server URL
 */
const ManualServerEntryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Custom Server</Text>
      <Text>Form for manual server entry will be implemented here</Text>
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

export default ManualServerEntryScreen;