import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { useTranslation } from 'react-i18next';

type Props = StackScreenProps<MainStackParamList, 'Lesson'>;

/**
 * Lesson Screen
 * Displays exercises for a selected lesson
 */
const LessonScreen = ({ route }: Props) => {
  const { lessonId } = route.params;
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lesson</Text>
      <Text>Exercises for lesson: {lessonId}</Text>
      <Text>{t('lesson.checkAnswer')}</Text>
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

export default LessonScreen;