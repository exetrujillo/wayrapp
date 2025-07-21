/**
 * ProgressService Unit Tests
 * Tests for business logic in ProgressService
 */

import { ProgressService } from '../progressService';
import { ProgressRepository } from '../../repositories/progressRepository';
import { PrismaClient } from '@prisma/client';
import { AppError } from '@/shared/middleware/errorHandler';
import { HttpStatus, ErrorCodes } from '@/shared/types';
import { UserProgressFactory, LessonCompletionFactory } from '@/shared/test/factories/progressFactory';

// Mock dependencies
jest.mock('../../repositories/progressRepository');
jest.mock('@prisma/client');
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ProgressService', () => {
  let progressService: ProgressService;
  let mockProgressRepository: jest.Mocked<ProgressRepository>;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockProgressRepository = {
      findUserProgressByUserId: jest.fn(),
      createUserProgress: jest.fn(),
      updateUserProgress: jest.fn(),
      findLessonCompletion: jest.fn(),
      createLessonCompletion: jest.fn(),
      findUserLessonCompletions: jest.fn(),
      isLessonCompleted: jest.fn(),
      getLessonCompletionStats: jest.fn(),
      getProgressSummary: jest.fn(),
      upsertUserProgress: jest.fn(),
      createMultipleLessonCompletions: jest.fn()
    } as any;

    mockPrisma = {
      lesson: {
        findUnique: jest.fn()
      }
    } as any;

    progressService = new ProgressService(
      mockProgressRepository,
      mockPrisma
    );

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getUserProgress', () => {
    it('should return user progress when found', async () => {
      // Arrange
      const userId = 'test-user-id';
      const expectedProgress = UserProgressFactory.build(userId);
      const mappedProgress = {
        user_id: expectedProgress.userId,
        experience_points: expectedProgress.experiencePoints,
        lives_current: expectedProgress.livesCurrent,
        streak_current: expectedProgress.streakCurrent,
        last_completed_lesson_id: expectedProgress.lastCompletedLessonId,
        last_activity_date: expectedProgress.lastActivityDate,
        updated_at: new Date()
      };

      mockProgressRepository.findUserProgressByUserId.mockResolvedValue(mappedProgress);

      // Act
      const result = await progressService.getUserProgress(userId);

      // Assert
      expect(mockProgressRepository.findUserProgressByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mappedProgress);
    });

    it('should create new progress when user progress not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const newProgress = UserProgressFactory.build(userId);
      const mappedProgress = {
        user_id: newProgress.userId,
        experience_points: 0,
        lives_current: 5,
        streak_current: 0,
        last_completed_lesson_id: null,
        last_activity_date: expect.any(Date),
        updated_at: expect.any(Date)
      };

      mockProgressRepository.findUserProgressByUserId.mockResolvedValue(null);
      mockProgressRepository.createUserProgress.mockResolvedValue(mappedProgress);

      // Act
      const result = await progressService.getUserProgress(userId);

      // Assert
      expect(mockProgressRepository.findUserProgressByUserId).toHaveBeenCalledWith(userId);
      expect(mockProgressRepository.createUserProgress).toHaveBeenCalledWith({
        user_id: userId,
        experience_points: 0,
        lives_current: 5,
        streak_current: 0
      });
      expect(result).toEqual(mappedProgress);
    });
  });

  describe('initializeUserProgress', () => {
    it('should initialize user progress successfully', async () => {
      // Arrange
      const userId = 'new-user-id';
      const expectedProgress = UserProgressFactory.build(userId);

      mockProgressRepository.findByUserId.mockResolvedValue(null);
      mockProgressRepository.create.mockResolvedValue(expectedProgress);

      // Act
      const result = await progressService.initializeUserProgress(userId);

      // Assert
      expect(mockProgressRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockProgressRepository.create).toHaveBeenCalledWith({
        userId,
        experiencePoints: 0,
        livesCurrent: 5,
        streakCurrent: 0,
        lastActivityDate: expect.any(Date),
      });
      expect(result).toEqual(expectedProgress);
    });

    it('should return existing progress if already initialized', async () => {
      // Arrange
      const userId = 'existing-user-id';
      const existingProgress = UserProgressFactory.build(userId);

      mockProgressRepository.findByUserId.mockResolvedValue(existingProgress);

      // Act
      const result = await progressService.initializeUserProgress(userId);

      // Assert
      expect(mockProgressRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockProgressRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingProgress);
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

      const userProgress = UserProgressFactory.build(userId, {
        experiencePoints: 100,
      });

      const updatedProgress = {
        ...userProgress,
        experiencePoints: userProgress.experiencePoints + experiencePoints,
        lastCompletedLessonId: lessonId,
      };

      const lessonCompletion = LessonCompletionFactory.build(userId, lessonId, {
        score,
        timeSpentSeconds,
      });

      mockProgressRepository.findByUserId.mockResolvedValue(userProgress);
      mockLessonCompletionRepository.findByUserAndLesson.mockResolvedValue(null);
      mockLessonCompletionRepository.create.mockResolvedValue(lessonCompletion);
      mockProgressRepository.updateExperiencePoints.mockResolvedValue(updatedProgress);
      mockProgressRepository.updateLastCompletedLesson.mockResolvedValue(updatedProgress);

      // Mock the lesson service to return experience points
      jest.spyOn(progressService as any, 'getLessonExperiencePoints').mockResolvedValue(experiencePoints);

      // Act
      const result = await progressService.completeLesson(userId, lessonId, { score, timeSpentSeconds });

      // Assert
      expect(mockProgressRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockLessonCompletionRepository.findByUserAndLesson).toHaveBeenCalledWith(userId, lessonId);
      expect(mockLessonCompletionRepository.create).toHaveBeenCalledWith({
        userId,
        lessonId,
        completedAt: expect.any(Date),
        score,
        timeSpentSeconds,
      });
      expect(mockProgressRepository.updateExperiencePoints).toHaveBeenCalledWith(
        userId,
        userProgress.experiencePoints + experiencePoints
      );
      expect(mockProgressRepository.updateLastCompletedLesson).toHaveBeenCalledWith(userId, lessonId);
      expect(result).toEqual({
        progress: updatedProgress,
        completion: lessonCompletion,
        experienceGained: experiencePoints,
      });
    });

    it('should throw error when user progress not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      const lessonId = 'test-lesson-id';

      mockProgressRepository.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(progressService.completeLesson(userId, lessonId, {})).rejects.toThrow(
        new AppError('User progress not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND)
      );
    });

    it('should update existing lesson completion if already completed', async () => {
      // Arrange
      const userId = 'test-user-id';
      const lessonId = 'test-lesson-id';
      const score = 95; // Improved score
      const timeSpentSeconds = 100; // Faster completion
      const experiencePoints = 0; // No additional XP for re-completion

      const userProgress = UserProgressFactory.build(userId, {
        experiencePoints: 100,
      });

      const existingCompletion = LessonCompletionFactory.build(userId, lessonId, {
        score: 80,
        timeSpentSeconds: 150,
      });

      const updatedCompletion = {
        ...existingCompletion,
        score,
        timeSpentSeconds,
        completedAt: expect.any(Date),
      };

      mockProgressRepository.findByUserId.mockResolvedValue(userProgress);
      mockLessonCompletionRepository.findByUserAndLesson.mockResolvedValue(existingCompletion);
      mockLessonCompletionRepository.create.mockResolvedValue(updatedCompletion);

      // Mock the lesson service to return experience points
      jest.spyOn(progressService as any, 'getLessonExperiencePoints').mockResolvedValue(experiencePoints);

      // Act
      const result = await progressService.completeLesson(userId, lessonId, { score, timeSpentSeconds });

      // Assert
      expect(mockLessonCompletionRepository.findByUserAndLesson).toHaveBeenCalledWith(userId, lessonId);
      expect(mockLessonCompletionRepository.create).toHaveBeenCalledWith({
        userId,
        lessonId,
        completedAt: expect.any(Date),
        score,
        timeSpentSeconds,
      });
      expect(mockProgressRepository.updateExperiencePoints).not.toHaveBeenCalled();
      expect(result).toEqual({
        progress: userProgress,
        completion: updatedCompletion,
        experienceGained: 0,
      });
    });
  });

  describe('getUserLessonCompletions', () => {
    it('should return user lesson completions', async () => {
      // Arrange
      const userId = 'test-user-id';
      const expectedCompletions = [
        LessonCompletionFactory.build(userId, 'lesson-1'),
        LessonCompletionFactory.build(userId, 'lesson-2'),
      ];

      mockLessonCompletionRepository.findByUser.mockResolvedValue(expectedCompletions);

      // Act
      const result = await progressService.getUserLessonCompletions(userId);

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
        lessonCompletions: [
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

      const userProgress = UserProgressFactory.build(userId);
      const mockCompleteLessonSpy = jest.spyOn(progressService, 'completeLesson').mockImplementation(
        async (userId, lessonId, data) => {
          return {
            progress: userProgress,
            completion: LessonCompletionFactory.build(userId, lessonId, {
              score: data.score,
              timeSpentSeconds: data.timeSpentSeconds,
            }),
            experienceGained: 10,
          };
        }
      );

      // Act
      const result = await progressService.syncOfflineProgress(userId, offlineData);

      // Assert
      expect(mockCompleteLessonSpy).toHaveBeenCalledTimes(2);
      expect(mockCompleteLessonSpy).toHaveBeenCalledWith('test-user-id', 'lesson-1', {
        score: 85,
        timeSpentSeconds: 120,
      });
      expect(mockCompleteLessonSpy).toHaveBeenCalledWith('test-user-id', 'lesson-2', {
        score: 90,
        timeSpentSeconds: 150,
      });
      expect(result).toEqual({
        syncedItems: 2,
        progress: userProgress,
        totalExperienceGained: 20,
      });
    });

    it('should handle empty offline data', async () => {
      // Arrange
      const userId = 'test-user-id';
      const offlineData = { lessonCompletions: [] };
      const userProgress = UserProgressFactory.build(userId);

      mockProgressRepository.findByUserId.mockResolvedValue(userProgress);

      // Act
      const result = await progressService.syncOfflineProgress(userId, offlineData);

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
        lessonCompletions: [
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

      const userProgress = UserProgressFactory.build(userId);

      jest.spyOn(progressService, 'completeLesson')
        .mockImplementationOnce(async (userId, lessonId, data) => {
          return {
            progress: userProgress,
            completion: LessonCompletionFactory.build(userId, lessonId, {
              score: data.score,
              timeSpentSeconds: data.timeSpentSeconds,
            }),
            experienceGained: 10,
          };
        })
        .mockImplementationOnce(async () => {
          throw new Error('Invalid lesson');
        });

      mockProgressRepository.findByUserId.mockResolvedValue(userProgress);

      // Act
      const result = await progressService.syncOfflineProgress(userId, offlineData);

      // Assert
      expect(progressService.completeLesson).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        syncedItems: 1,
        progress: userProgress,
        totalExperienceGained: 10,
        errors: [expect.objectContaining({ lessonId: 'invalid-lesson' })],
      });
    });
  });
});