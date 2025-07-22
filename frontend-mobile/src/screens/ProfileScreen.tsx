import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Profile Screen
 * Displays user profile information
 */
const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <Text>User profile information will be displayed here</Text>
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

export default ProfileScreen;