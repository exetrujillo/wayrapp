/**
 * Progress Service Tests
 * Unit tests for progress tracking functionality
 */

import { ProgressService } from '../services/progressService';
import { ProgressRepository } from '../repositories/progressRepository';
import { PrismaClient } from '@prisma/client';
// No need to import AppError, HttpStatus, or ErrorCodes as we're not using them directly
import { mockDate } from '@/shared/test/utils/testUtils';

// Mock Prisma client
const mockPrisma = {
  lesson: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock repository
const mockProgressRepository = {
  findUserProgressByUserId: jest.fn(),
  createUserProgress: jest.fn(),
  updateUserProgress: jest.fn(),
  createLessonCompletion: jest.fn(),
  findLessonCompletion: jest.fn(),
  findUserLessonCompletions: jest.fn(),
  isLessonCompleted: jest.fn(),
  getLessonCompletionStats: jest.fn(),
  getProgressSummary: jest.fn(),
  upsertUserProgress: jest.fn(),
  createMultipleLessonCompletions: jest.fn()
} as unknown as ProgressRepository;

// We don't need a separate mockLessonRepository since we're using mockPrisma.lesson

// We don't need a separate mockLessonCompletionRepository since we're using mockProgressRepository

// // Mock factories for test data
// const UserProgressFactory = {
//   build: (userId: string, overrides = {}) => ({
//     userId,
//     experiencePoints: 100,
//     livesCurrent: 5,
//     streakCurrent: 3,
//     lastCompletedLessonId: 'lesson-1',
//     lastActivityDate: new Date(),
//     ...overrides
//   })
// };

// const LessonCompletionFactory = {
//   build: (userId: string, lessonId: string, overrides = {}) => ({
//     userId,
//     lessonId,
//     completedAt: new Date(),
//     score: 85,
//     timeSpentSeconds: 120,
//     ...overrides
//   })
// };

describe('ProgressService', () => {
  let progressService: ProgressService;
  let dateMock: ReturnType<typeof mockDate>;

  beforeEach(() => {
    // Set up consistent date mocking
    dateMock = mockDate(new Date('2025-01-01T00:00:00Z'));
    
    progressService = new ProgressService(mockProgressRepository, mockPrisma);
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original Date
    dateMock.restore();
  });

  describe('getUserProgress', () => {
    it('should return existing progress', async () => {
      const mockProgress = {
        user_id: 'user-123',
        experience_points: 100,
        lives_current: 5,
        streak_current: 3,
        last_completed_lesson_id: 'lesson-1',
        last_activity_date: new Date(),
        updated_at: new Date(),
      };

      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(mockProgress);

      const result = await progressService.getUserProgress('user-123');

      expect(result).toEqual(mockProgress);
      expect(mockProgressRepository.findUserProgressByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should create initial progress if none exists', async () => {
      const mockCreatedProgress = {
        user_id: 'user-123',
        experience_points: 0,
        lives_current: 5,
        streak_current: 0,
        last_completed_lesson_id: null,
        last_activity_date: expect.any(Date),
        updated_at: expect.any(Date),
      };

      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(null);
      (mockProgressRepository.createUserProgress as jest.Mock).mockResolvedValue(mockCreatedProgress);

      const result = await progressService.getUserProgress('user-123');

      expect(result).toEqual(mockCreatedProgress);
      expect(mockProgressRepository.createUserProgress).toHaveBeenCalledWith({
        user_id: 'user-123',
        experience_points: 0,
        lives_current: 5,
        streak_current: 0,
      });
    });
  });

  describe('calculateExperiencePoints', () => {
    it('should calculate experience points correctly', () => {
      const service = progressService as any;

      // Test excellent performance (90+ score)
      expect(service.calculateExperiencePoints(10, 95)).toBe(12); // 10 * 1.2 = 12

      // Test good performance (80-89 score)
      expect(service.calculateExperiencePoints(10, 85)).toBe(11); // 10 * 1.1 = 11

      // Test normal performance (60-79 score)
      expect(service.calculateExperiencePoints(10, 70)).toBe(10); // no modifier

      // Test poor performance (<60 score)
      expect(service.calculateExperiencePoints(10, 50)).toBe(8); // 10 * 0.8 = 8

      // Test no score provided
      expect(service.calculateExperiencePoints(10)).toBe(10); // no modifier

      // Test minimum points
      expect(service.calculateExperiencePoints(1, 50)).toBe(1); // minimum 1 point
    });
  });

  describe('calculateStreak', () => {
    it('should calculate streak correctly', () => {
      const service = progressService as any;
      const now = new Date();
      const yesterday = dateMock.helpers.yesterday();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const currentProgress = {
        user_id: 'user-123',
        experience_points: 100,
        lives_current: 5,
        streak_current: 5,
        last_completed_lesson_id: 'lesson-1',
        last_activity_date: yesterday,
        updated_at: new Date(),
      };

      // Test consecutive day - should increment streak
      expect(service.calculateStreak(currentProgress, now)).toBe(6);

      // Test same day - should increment streak
      expect(service.calculateStreak(currentProgress, yesterday)).toBe(6);

      // Test streak broken - should reset to 1
      currentProgress.last_activity_date = twoDaysAgo;
      expect(service.calculateStreak(currentProgress, now)).toBe(1);
    });
  });

  describe('completeLesson', () => {
    it('should complete lesson and update progress successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const lessonId = 'test-lesson-id';
      const score = 90;
      const timeSpentSeconds = 120;
      const experiencePoints = 10;

      const userProgress = {
        user_id: userId,
        experience_points: 100,
        lives_current: 5,
        streak_current: 3,
        last_completed_lesson_id: null,
        last_activity_date: new Date(),
        updated_at: new Date()
      };

      const updatedProgress = {
        ...userProgress,
        experience_points: userProgress.experience_points + experiencePoints,
        last_completed_lesson_id: lessonId,
      };

      const lessonCompletion = {
        user_id: userId,
        lesson_id: lessonId,
        completed_at: expect.any(Date),
        score,
        time_spent_seconds: timeSpentSeconds,
      };

      const lesson = {
        id: lessonId,
        moduleId: 'test-module-id',
        experiencePoints: 10,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(userProgress);
      (mockProgressRepository.findLessonCompletion as jest.Mock).mockResolvedValue(null);
      (mockProgressRepository.createLessonCompletion as jest.Mock).mockResolvedValue(lessonCompletion);
      (mockProgressRepository.updateUserProgress as jest.Mock).mockResolvedValue(updatedProgress);
      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(lesson);

      // Mock the lesson service to return experience points
      jest.spyOn(progressService as any, 'calculateExperiencePoints').mockReturnValue(experiencePoints);

      // Act
      const result = await progressService.completeLesson(userId, { lesson_id: lessonId, score, time_spent_seconds: timeSpentSeconds });

      // Assert
      expect(mockProgressRepository.findUserProgressByUserId).toHaveBeenCalledWith(userId);
      expect(mockProgressRepository.findLessonCompletion).toHaveBeenCalledWith(userId, lessonId);
      expect(mockProgressRepository.createLessonCompletion).toHaveBeenCalledWith({
        user_id: userId,
        lesson_id: lessonId,
        score,
        time_spent_seconds: timeSpentSeconds,
      });
      expect(mockProgressRepository.updateUserProgress).toHaveBeenCalledWith(userId, expect.objectContaining({
        experience_points: userProgress.experience_points + experiencePoints,
        last_completed_lesson_id: lessonId
      }));
      expect(result).toEqual({
        progress: updatedProgress,
        completion: lessonCompletion,
        experienceGained: experiencePoints,
      });
    });

    it('should throw error when lesson already completed', async () => {
      // Arrange
      const userId = 'test-user-id';
      const lessonId = 'test-lesson-id';
      const score = 95; // Improved score
      const timeSpentSeconds = 100; // Faster completion

      const userProgress = {
        user_id: userId,
        experience_points: 100,
        lives_current: 5,
        streak_current: 3,
        last_completed_lesson_id: lessonId,
        last_activity_date: new Date(),
        updated_at: new Date()
      };

      const existingCompletion = {
        user_id: userId,
        lesson_id: lessonId,
        completed_at: new Date(Date.now() - 86400000), // Yesterday
        score: 80,
        time_spent_seconds: 150,
      };

      const lesson = {
        id: lessonId,
        moduleId: 'test-module-id',
        experiencePoints: 10,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(userProgress);
      (mockProgressRepository.findLessonCompletion as jest.Mock).mockResolvedValue(existingCompletion);
      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(lesson);

      // Act & Assert
      await expect(progressService.completeLesson(userId, { lesson_id: lessonId, score, time_spent_seconds: timeSpentSeconds }))
        .rejects.toThrow('Lesson already completed');
    });

    it('should create user progress if not found', async () => {
      // Arrange
      const userId = 'new-user-id';
      const lessonId = 'test-lesson-id';
      const score = 90;
      const timeSpentSeconds = 120;
      const experiencePoints = 10;

      const newUserProgress = {
        user_id: userId,
        experience_points: 0,
        lives_current: 5,
        streak_current: 0,
        last_completed_lesson_id: null,
        last_activity_date: new Date(),
        updated_at: new Date()
      };

      const updatedProgress = {
        ...newUserProgress,
        experience_points: experiencePoints,
        last_completed_lesson_id: lessonId,
        streak_current: 1
      };

      const lessonCompletion = {
        user_id: userId,
        lesson_id: lessonId,
        completed_at: expect.any(Date),
        score,
        time_spent_seconds: timeSpentSeconds,
      };

      const lesson = {
        id: lessonId,
        moduleId: 'test-module-id',
        experiencePoints: 10,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // First call returns null (not found), second call returns the newly created progress
      (mockProgressRepository.findUserProgressByUserId as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newUserProgress);
      (mockProgressRepository.createUserProgress as jest.Mock).mockResolvedValue(newUserProgress);
      (mockProgressRepository.findLessonCompletion as jest.Mock).mockResolvedValue(null);
      (mockProgressRepository.createLessonCompletion as jest.Mock).mockResolvedValue(lessonCompletion);
      (mockProgressRepository.updateUserProgress as jest.Mock).mockResolvedValue(updatedProgress);
      (mockPrisma.lesson.findUnique as jest.Mock).mockResolvedValue(lesson);

      // Mock the lesson service to return experience points
      jest.spyOn(progressService as any, 'calculateExperiencePoints').mockReturnValue(experiencePoints);

      // Act
      const result = await progressService.completeLesson(userId, { lesson_id: lessonId, score, time_spent_seconds: timeSpentSeconds });

      // Assert
      expect(mockProgressRepository.createUserProgress).toHaveBeenCalledWith({
        user_id: userId,
        experience_points: 0,
        lives_current: 5,
        streak_current: 0,
      });
      expect(result).toEqual({
        progress: updatedProgress,
        completion: lessonCompletion,
        experienceGained: experiencePoints,
      });
    });
  });

  describe('getUserLessonCompletions', () => {
    it('should return user lesson completions', async () => {
      // Arrange
      const userId = 'test-user-id';
      const expectedCompletions = {
        data: [
          {
            user_id: userId,
            lesson_id: 'lesson-1',
            completed_at: new Date(),
            score: 85,
            time_spent_seconds: 120
          },
          {
            user_id: userId,
            lesson_id: 'lesson-2',
            completed_at: new Date(),
            score: 90,
            time_spent_seconds: 150
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      (mockProgressRepository.findUserLessonCompletions as jest.Mock).mockResolvedValue(expectedCompletions);

      // Act
      const result = await progressService.getUserLessonCompletions(userId);

      // Assert
      expect(mockProgressRepository.findUserLessonCompletions).toHaveBeenCalledWith(userId, {});
      expect(result).toEqual(expectedCompletions);
    });
  });

  describe('syncOfflineProgress', () => {
    it('should sync offline progress successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const offlineData = {
        completions: [
          {
            lesson_id: 'lesson-1',
            completed_at: new Date().toISOString(),
            score: 85,
            time_spent_seconds: 120,
          },
          {
            lesson_id: 'lesson-2',
            completed_at: new Date().toISOString(),
            score: 90,
            time_spent_seconds: 150,
          },
        ],
        last_sync_timestamp: new Date().toISOString()
      };

      const userProgress = {
        user_id: userId,
        experience_points: 100,
        lives_current: 5,
        streak_current: 3,
        last_completed_lesson_id: null,
        last_activity_date: new Date(),
        updated_at: new Date()
      };

      const updatedProgress = {
        ...userProgress,
        experience_points: 120,
        last_completed_lesson_id: 'lesson-2'
      };

      // Mock lessons
      (mockPrisma.lesson.findUnique as jest.Mock)
        .mockImplementation(({ where }) => {
          if (where.id === 'lesson-1' || where.id === 'lesson-2') {
            return Promise.resolve({
              id: where.id,
              moduleId: 'test-module-id',
              experiencePoints: 10,
              order: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          return Promise.resolve(null);
        });

      // Mock repository methods
      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(userProgress);
      (mockProgressRepository.findLessonCompletion as jest.Mock).mockResolvedValue(null);
      (mockProgressRepository.createLessonCompletion as jest.Mock).mockImplementation(
        (data) => Promise.resolve({
          ...data,
          completed_at: new Date(data.completed_at || new Date())
        })
      );
      (mockProgressRepository.updateUserProgress as jest.Mock).mockResolvedValue(updatedProgress);

      // Act
      const result = await progressService.syncOfflineProgress(userId, offlineData);

      // Assert
      expect(mockPrisma.lesson.findUnique).toHaveBeenCalledTimes(2);
      expect(mockProgressRepository.createLessonCompletion).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        synced_completions: 2,
        skipped_duplicates: 0,
        updated_progress: updatedProgress
      });
    });

    it('should handle empty offline data', async () => {
      // Arrange
      const userId = 'test-user-id';
      const offlineData = { 
        completions: [],
        last_sync_timestamp: new Date().toISOString()
      };
      const userProgress = {
        user_id: userId,
        experience_points: 100,
        lives_current: 5,
        streak_current: 3,
        last_completed_lesson_id: null,
        last_activity_date: new Date(),
        updated_at: new Date()
      };

      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(userProgress);

      // Act
      const result = await progressService.syncOfflineProgress(userId, offlineData);

      // Assert
      expect(result).toEqual({
        synced_completions: 0,
        skipped_duplicates: 0,
        updated_progress: userProgress
      });
    });

    it('should handle errors during sync and continue processing', async () => {
      // Arrange
      const userId = 'test-user-id';
      const offlineData = {
        completions: [
          {
            lesson_id: 'lesson-1',
            completed_at: new Date().toISOString(),
            score: 85,
            time_spent_seconds: 120,
          },
          {
            lesson_id: 'invalid-lesson',
            completed_at: new Date().toISOString(),
            score: 90,
            time_spent_seconds: 150,
          },
        ],
        last_sync_timestamp: new Date().toISOString()
      };

      const userProgress = {
        user_id: userId,
        experience_points: 100,
        lives_current: 5,
        streak_current: 3,
        last_completed_lesson_id: null,
        last_activity_date: new Date(),
        updated_at: new Date()
      };

      const updatedProgress = {
        ...userProgress,
        experience_points: 110,
        last_completed_lesson_id: 'lesson-1'
      };

      // Mock lessons
      (mockPrisma.lesson.findUnique as jest.Mock)
        .mockImplementation(({ where }) => {
          if (where.id === 'lesson-1') {
            return Promise.resolve({
              id: where.id,
              moduleId: 'test-module-id',
              experiencePoints: 10,
              order: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          return Promise.resolve(null); // Invalid lesson returns null
        });

      // Mock repository methods
      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(userProgress);
      (mockProgressRepository.findLessonCompletion as jest.Mock).mockResolvedValue(null);
      (mockProgressRepository.createLessonCompletion as jest.Mock).mockImplementation(
        (data) => {
          if (data.lesson_id === 'invalid-lesson') {
            throw new Error('Lesson not found');
          }
          return Promise.resolve({
            ...data,
            completed_at: new Date(data.completed_at || new Date())
          });
        }
      );
      (mockProgressRepository.updateUserProgress as jest.Mock).mockResolvedValue(updatedProgress);

      // Act
      const result = await progressService.syncOfflineProgress(userId, offlineData);

      // Assert
      expect(mockPrisma.lesson.findUnique).toHaveBeenCalledTimes(2);
      expect(mockProgressRepository.createLessonCompletion).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        synced_completions: 1,
        skipped_duplicates: 0,
        updated_progress: updatedProgress
      });
    });
  });
});