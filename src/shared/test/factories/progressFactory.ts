/**
 * Progress Factory for Test Data Generation
 * Creates test progress data with customizable properties
 */
import { UserProgress, LessonCompletion } from '@prisma/client';

export class UserProgressFactory {
  static build(userId: string, overrides: Partial<UserProgress> = {}): Omit<UserProgress, 'updatedAt'> {
    const defaultProgress = {
      userId,
      experiencePoints: 100,
      livesCurrent: 5,
      streakCurrent: 3,
      lastCompletedLessonId: null,
      lastActivityDate: new Date(),
    };

    return {
      ...defaultProgress,
      ...overrides,
    };
  }
}

export class LessonCompletionFactory {
  static build(
    userId: string, 
    lessonId: string, 
    overrides: Partial<LessonCompletion> = {}
  ): LessonCompletion {
    const defaultCompletion = {
      userId,
      lessonId,
      completedAt: new Date(),
      score: 85,
      timeSpentSeconds: 120,
    };

    return {
      ...defaultCompletion,
      ...overrides,
    };
  }
}