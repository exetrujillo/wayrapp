/**
 * Progress Service Tests
 * Unit tests for progress tracking functionality
 */

import { ProgressService } from '../services/progressService';
import { ProgressRepository } from '../repositories/progressRepository';
import { PrismaClient } from '@prisma/client';
import { AppError } from '@/shared/middleware/errorHandler';
import { HttpStatus, ErrorCodes } from '@/shared/types';
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

// Mock lesson completion repository
const mockLessonCompletionRepository = {
  findByUserAndLesson: jest.fn(),
  create: jest.fn(),
  findByUser: jest.fn()
};

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
    beforeEach(() => {
      // Add necessary properties to progressService for testing
      (progressService as any).lessonCompletionRepository = mockLessonCompletionRepository;
    });

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

      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(userProgress);
      (mockLessonCompletionRepository.findByUserAndLesson as jest.Mock).mockResolvedValue(null);
      (mockLessonCompletionRepository.create as jest.Mock).mockResolvedValue(lessonCompletion);
      (mockProgressRepository.updateUserProgress as jest.Mock).mockResolvedValue(updatedProgress);

      // Mock the lesson service to return experience points
      jest.spyOn(progressService as any, 'calculateExperiencePoints').mockReturnValue(experiencePoints);

      // Act
      const result = await (progressService as any).completeLesson(userId, lessonId, score, timeSpentSeconds);

      // Assert
      expect(mockProgressRepository.findUserProgressByUserId).toHaveBeenCalledWith(userId);
      expect(mockLessonCompletionRepository.findByUserAndLesson).toHaveBeenCalledWith(userId, lessonId);
      expect(mockLessonCompletionRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        lesson_id: lessonId,
        completed_at: expect.any(Date),
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

    it('should update existing lesson completion if already completed', async () => {
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

      const updatedCompletion = {
        ...existingCompletion,
        score,
        time_spent_seconds: timeSpentSeconds,
        completed_at: expect.any(Date),
      };

      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(userProgress);
      (mockLessonCompletionRepository.findByUserAndLesson as jest.Mock).mockResolvedValue(existingCompletion);
      (mockLessonCompletionRepository.create as jest.Mock).mockResolvedValue(updatedCompletion);

      // Act
      const result = await (progressService as any).completeLesson(userId, lessonId, score, timeSpentSeconds);

      // Assert
      expect(mockLessonCompletionRepository.findByUserAndLesson).toHaveBeenCalledWith(userId, lessonId);
      expect(mockLessonCompletionRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        lesson_id: lessonId,
        completed_at: expect.any(Date),
        score,
        time_spent_seconds: timeSpentSeconds,
      });
      // No experience points update for re-completion
      expect(mockProgressRepository.updateUserProgress).not.toHaveBeenCalled();
      expect(result).toEqual({
        progress: userProgress,
        completion: updatedCompletion,
        experienceGained: 0,
      });
    });

    it('should throw error when user progress not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const lessonId = 'test-lesson-id';

      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect((progressService as any).completeLesson(userId, lessonId, 90, 120)).rejects.toThrow(
        new AppError('User progress not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND)
      );
    });
  });

  describe('getUserLessonCompletions', () => {
    beforeEach(() => {
      // Add necessary properties to progressService for testing
      (progressService as any).lessonCompletionRepository = mockLessonCompletionRepository;
    });

    it('should return user lesson completions', async () => {
      // Arrange
      const userId = 'test-user-id';
      const expectedCompletions = [
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
      ];

      (mockLessonCompletionRepository.findByUser as jest.Mock).mockResolvedValue(expectedCompletions);

      // Act
      const result = await (progressService as any).getUserLessonCompletions(userId);

      // Assert
      expect(mockLessonCompletionRepository.findByUser).toHaveBeenCalledWith(userId);
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
            lessonId: 'lesson-1',
            completedAt: new Date().toISOString(),
            score: 85,
            timeSpentSeconds: 120,
          },
          {
            lessonId: 'lesson-2',
            completedAt: new Date().toISOString(),
            score: 90,
            timeSpentSeconds: 150,
          },
        ],
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

      // Mock the completeLesson method
      const mockCompleteLessonSpy = jest.spyOn(progressService as any, 'completeLesson')
        .mockImplementation(async (userId, lessonId, score, timeSpentSeconds) => {
          return {
            progress: userProgress,
            completion: {
              user_id: userId,
              lesson_id: lessonId,
              completed_at: new Date(),
              score,
              time_spent_seconds: timeSpentSeconds
            },
            experienceGained: 10,
          };
        });

      // Act
      const result = await (progressService as any).syncOfflineProgress(userId, offlineData);

      // Assert
      expect(mockCompleteLessonSpy).toHaveBeenCalledTimes(2);
      expect(mockCompleteLessonSpy).toHaveBeenCalledWith(
        'test-user-id', 
        'lesson-1', 
        85, 
        120
      );
      expect(mockCompleteLessonSpy).toHaveBeenCalledWith(
        'test-user-id', 
        'lesson-2', 
        90, 
        150
      );
      expect(result).toEqual({
        syncedItems: 2,
        progress: userProgress,
        totalExperienceGained: 20,
      });
    });

    it('should handle empty offline data', async () => {
      // Arrange
      const userId = 'test-user-id';
      const offlineData = { completions: [] };
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
      const result = await (progressService as any).syncOfflineProgress(userId, offlineData);

      // Assert
      expect(result).toEqual({
        syncedItems: 0,
        progress: userProgress,
        totalExperienceGained: 0,
      });
    });

    it('should handle errors during sync and continue processing', async () => {
      // Arrange
      const userId = 'test-user-id';
      const offlineData = {
        completions: [
          {
            lessonId: 'lesson-1',
            completedAt: new Date().toISOString(),
            score: 85,
            timeSpentSeconds: 120,
          },
          {
            lessonId: 'invalid-lesson',
            completedAt: new Date().toISOString(),
            score: 90,
            timeSpentSeconds: 150,
          },
        ],
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

      // Mock the completeLesson method with different behaviors
      jest.spyOn(progressService as any, 'completeLesson')
        .mockImplementationOnce(async (userId, lessonId, score, timeSpentSeconds) => {
          return {
            progress: userProgress,
            completion: {
              user_id: userId,
              lesson_id: lessonId,
              completed_at: new Date(),
              score,
              time_spent_seconds: timeSpentSeconds
            },
            experienceGained: 10,
          };
        })
        .mockImplementationOnce(async () => {
          throw new Error('Invalid lesson');
        });

      (mockProgressRepository.findUserProgressByUserId as jest.Mock).mockResolvedValue(userProgress);

      // Act
      const result = await (progressService as any).syncOfflineProgress(userId, offlineData);

      // Assert
      expect((progressService as any).completeLesson).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        syncedItems: 1,
        progress: userProgress,
        totalExperienceGained: 10,
        errors: [expect.objectContaining({ lessonId: 'invalid-lesson' })],
      });
    });
  });
});