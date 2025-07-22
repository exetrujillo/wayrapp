import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Forgot Password Screen
 * Allows users to reset their password
 */
const ForgotPasswordScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text>Password reset form will be implemented here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;