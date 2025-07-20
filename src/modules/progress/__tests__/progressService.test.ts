/**
 * Progress Service Tests
 * Unit tests for progress tracking functionality
 */

import { ProgressService } from '../services/progressService';
import { ProgressRepository } from '../repositories/progressRepository';
import { PrismaClient } from '@prisma/client';

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
} as unknown as ProgressRepository;

describe('ProgressService', () => {
  let progressService: ProgressService;

  beforeEach(() => {
    progressService = new ProgressService(mockProgressRepository, mockPrisma);
    jest.clearAllMocks();
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
        last_activity_date: new Date(),
        updated_at: new Date(),
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
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
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
});