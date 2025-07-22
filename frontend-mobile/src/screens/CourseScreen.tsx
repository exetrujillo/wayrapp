import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';

type Props = StackScreenProps<MainStackParamList, 'Course'>;

/**
 * Course Screen
 * Displays lessons for a selected course
 */
const CourseScreen = ({ route }: Props) => {
  const { courseId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Course Details</Text>
      <Text>Lessons for course: {courseId}</Text>
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

export default CourseScreen;