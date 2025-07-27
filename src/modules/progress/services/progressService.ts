// src/modules/progress/services/progressService.ts

/**
 * Comprehensive progress tracking and gamification service for the WayrApp language learning platform.
 * 
 * This service manages all aspects of user progress including experience points calculation, lesson completion
 * tracking, streak management, and offline synchronization. It serves as the central business logic layer
 * for the progress tracking system, handling complex scenarios like performance-based experience multipliers,
 * conflict resolution during offline sync, and gamification features such as lives and daily streaks.
 * 
 * The service integrates with the ProgressRepository for data persistence and provides comprehensive
 * progress analytics for both users and administrators. It automatically initializes user progress
 * when needed and maintains data consistency through transactional operations and proper error handling.
 * 
 * Key features include intelligent experience point calculation based on lesson difficulty and user
 * performance, robust offline progress synchronization with duplicate detection, streak calculation
 * based on daily activity patterns, and comprehensive progress summaries for dashboard displays.
 * 
 * @module ProgressService
 * @category Progress
 * @category Services
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Initialize service with dependencies
 * const progressRepository = new ProgressRepository(prisma);
 * const progressService = new ProgressService(progressRepository, prisma);
 * 
 * // Complete a lesson and update progress
 * const result = await progressService.completeLesson('user-123', {
 *   lesson_id: 'lesson-456',
 *   score: 85,
 *   time_spent_seconds: 120
 * });
 * 
 * // Sync offline progress data
 * const syncResult = await progressService.syncOfflineProgress('user-123', {
 *   completions: [{ lesson_id: 'lesson-789', completed_at: '2025-01-01T10:00:00Z', score: 92 }],
 *   last_sync_timestamp: '2025-01-01T09:00:00Z'
 * });
 */

import {
  UserProgress,
  LessonCompletion,
  UpdateProgressDto,
  OfflineProgressSync,
  ProgressSummary,
  UpdateUserProgressDto
} from '../types';
import { ProgressRepository } from '../repositories/progressRepository';
import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, QueryOptions, PaginatedResult } from '@/shared/types';
import { logger } from '@/shared/utils/logger';
import { PrismaClient } from '@prisma/client';

/**
 * Progress tracking and gamification service for managing user learning progress.
 * 
 * @class ProgressService
 */
export class ProgressService {
  /**
   * Creates an instance of ProgressService.
   * 
   * @param {ProgressRepository} progressRepository - Repository for progress data operations
   * @param {PrismaClient} prisma - Prisma client for direct database access
   */
  constructor(
    private progressRepository: ProgressRepository,
    private prisma: PrismaClient
  ) { }

  /**
   * Retrieves user progress data, automatically creating initial progress record if none exists.
   * 
   * This method ensures every user has a progress record by creating one with default values
   * (0 experience points, 5 lives, 0 streak) when no existing progress is found.
   * 
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<UserProgress>} Promise resolving to the user's progress data
   * 
   * @example
   * const progress = await progressService.getUserProgress('user-123');
   * console.log(`User has ${progress.experience_points} experience points`);
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    let progress = await this.progressRepository.findUserProgressByUserId(userId);

    if (!progress) {
      // Create initial progress for user
      progress = await this.progressRepository.createUserProgress({
        user_id: userId,
        experience_points: 0,
        lives_current: 5,
        streak_current: 0,
      });

      logger.info('Created initial progress for user', { userId });
    }

    return progress;
  }

  /**
   * Updates specific fields of a user's progress record.
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {UpdateUserProgressDto} updates - Object containing the fields to update
   * @returns {Promise<UserProgress>} Promise resolving to the updated progress data
   * @throws {AppError} When user progress is not found (404 NOT_FOUND)
   */
  async updateUserProgress(userId: string, updates: UpdateUserProgressDto): Promise<UserProgress> {
    const existingProgress = await this.progressRepository.findUserProgressByUserId(userId);

    if (!existingProgress) {
      throw new AppError(
        'User progress not found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    return this.progressRepository.updateUserProgress(userId, updates);
  }

  /**
   * Processes lesson completion, calculates experience points, and updates user progress.
   * 
   * This method handles the complete lesson completion workflow including duplicate prevention,
   * experience calculation based on performance, streak updates, and progress tracking.
   * Experience points are calculated using the lesson's base points with performance multipliers:
   * - 90+ score: 20% bonus
   * - 80-89 score: 10% bonus  
   * - 60-79 score: no modifier
   * - <60 score: 20% reduction
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {UpdateProgressDto} progressData - Lesson completion data including lesson_id, score, and time_spent
   * @returns {Promise<{progress: UserProgress, completion: LessonCompletion, experienceGained: number}>} 
   *   Promise resolving to updated progress, completion record, and experience points gained
   * @throws {AppError} When lesson is already completed (409 CONFLICT) or lesson not found (404 NOT_FOUND)
   */
  async completeLesson(userId: string, progressData: UpdateProgressDto): Promise<{
    progress: UserProgress;
    completion: LessonCompletion;
    experienceGained: number;
  }> {
    // Check if lesson is already completed
    const existingCompletion = await this.progressRepository.findLessonCompletion(
      userId,
      progressData.lesson_id
    );

    if (existingCompletion) {
      throw new AppError(
        'Lesson already completed',
        HttpStatus.CONFLICT,
        ErrorCodes.CONFLICT
      );
    }

    // Get lesson details to calculate experience points
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: progressData.lesson_id },
    });

    if (!lesson) {
      throw new AppError(
        'Lesson not found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    // Calculate experience points based on lesson difficulty and user performance
    const experienceGained = this.calculateExperiencePoints(
      lesson.experiencePoints,
      progressData.score
    );

    // Get current progress or create if doesn't exist
    const currentProgress = await this.getUserProgress(userId);

    // Create lesson completion record
    const completion = await this.progressRepository.createLessonCompletion({
      user_id: userId,
      lesson_id: progressData.lesson_id,
      score: progressData.score ?? undefined,
      time_spent_seconds: progressData.time_spent_seconds ?? undefined,
    });

    // Update user progress
    const newExperiencePoints = currentProgress.experience_points + experienceGained;
    const newStreak = this.calculateStreak(currentProgress, new Date());

    const updatedProgress = await this.progressRepository.updateUserProgress(userId, {
      experience_points: newExperiencePoints,
      streak_current: newStreak,
      last_completed_lesson_id: progressData.lesson_id,
    });

    logger.info('Lesson completed successfully', {
      userId,
      lessonId: progressData.lesson_id,
      experienceGained,
      newExperiencePoints,
      newStreak,
    });

    return {
      progress: updatedProgress,
      completion,
      experienceGained,
    };
  }

  /**
   * Synchronizes offline lesson completions with the server, handling conflicts and duplicates.
   * 
   * This method processes multiple lesson completions from offline usage, automatically detecting
   * and skipping duplicates while maintaining data integrity. Completions are processed in
   * chronological order and experience points are accumulated and applied in a single update.
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {OfflineProgressSync} syncData - Offline sync data containing completions and last sync timestamp
   * @returns {Promise<{synced_completions: number, skipped_duplicates: number, updated_progress: UserProgress}>}
   *   Promise resolving to sync statistics and updated progress
   */
  async syncOfflineProgress(userId: string, syncData: OfflineProgressSync): Promise<{
    synced_completions: number;
    skipped_duplicates: number;
    updated_progress: UserProgress;
  }> {
    const lastSyncTime = new Date(syncData.last_sync_timestamp);
    let syncedCount = 0;
    let skippedCount = 0;
    let totalExperienceGained = 0;

    // Get current progress
    const currentProgress = await this.getUserProgress(userId);

    // Process completions in chronological order
    const sortedCompletions = syncData.completions.sort(
      (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );

    for (const completionData of sortedCompletions) {
      try {
        // Check if lesson exists and get experience points
        const lesson = await this.prisma.lesson.findUnique({
          where: { id: completionData.lesson_id },
        });

        if (!lesson) {
          logger.warn('Lesson not found during sync', {
            userId,
            lessonId: completionData.lesson_id,
          });
          continue;
        }

        // Check for existing completion
        const existingCompletion = await this.progressRepository.findLessonCompletion(
          userId,
          completionData.lesson_id
        );

        if (existingCompletion) {
          // Handle conflict resolution based on timestamps
          const existingTime = existingCompletion.completed_at.getTime();
          const newTime = new Date(completionData.completed_at).getTime();

          if (newTime > existingTime) {
            // New completion is more recent, but we can't update existing completion
            // Log this for potential manual resolution
            logger.info('Newer completion found during sync but skipping update', {
              userId,
              lessonId: completionData.lesson_id,
              existingTime: existingCompletion.completed_at,
              newTime: completionData.completed_at,
            });
          }

          skippedCount++;
          continue;
        }

        // Create new completion
        await this.progressRepository.createLessonCompletion({
          user_id: userId,
          lesson_id: completionData.lesson_id,
          score: completionData.score ?? undefined,
          time_spent_seconds: completionData.time_spent_seconds ?? undefined,
          completed_at: completionData.completed_at,
        });

        // Calculate experience gained
        const experienceGained = this.calculateExperiencePoints(
          lesson.experiencePoints,
          completionData.score
        );
        totalExperienceGained += experienceGained;
        syncedCount++;

      } catch (error) {
        logger.error('Error processing completion during sync', {
          error,
          userId,
          completionData,
        });
        // Continue with other completions
      }
    }

    // Update user progress with accumulated experience
    let updatedProgress = currentProgress;
    if (totalExperienceGained > 0) {
      const newExperiencePoints = currentProgress.experience_points + totalExperienceGained;

      // Find the most recent lesson completion for last_completed_lesson_id
      const mostRecentCompletion = sortedCompletions[sortedCompletions.length - 1];

      updatedProgress = await this.progressRepository.updateUserProgress(userId, {
        experience_points: newExperiencePoints,
        last_completed_lesson_id: mostRecentCompletion?.lesson_id ?? undefined,
      });
    }

    logger.info('Offline progress sync completed', {
      userId,
      syncedCount,
      skippedCount,
      totalExperienceGained,
      lastSyncTime,
    });

    return {
      synced_completions: syncedCount,
      skipped_duplicates: skippedCount,
      updated_progress: updatedProgress,
    };
  }

  /**
   * Retrieves comprehensive progress summary including lessons and courses statistics.
   * 
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<ProgressSummary>} Promise resolving to detailed progress summary
   */
  async getProgressSummary(userId: string): Promise<ProgressSummary> {
    const summary = await this.progressRepository.getProgressSummary(userId);

    if (!summary) {
      // Create initial progress and return summary
      await this.getUserProgress(userId);
      return this.progressRepository.getProgressSummary(userId) as Promise<ProgressSummary>;
    }

    return summary;
  }

  /**
   * Retrieves paginated list of user's lesson completions with sorting options.
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {QueryOptions} [options={}] - Optional pagination and sorting parameters
   * @returns {Promise<PaginatedResult<LessonCompletion>>} Promise resolving to paginated completion results
   */
  async getUserLessonCompletions(
    userId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<LessonCompletion>> {
    return this.progressRepository.findUserLessonCompletions(userId, options);
  }

  /**
   * Checks whether a specific lesson has been completed by the user.
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {string} lessonId - The unique identifier of the lesson
   * @returns {Promise<boolean>} Promise resolving to true if lesson is completed, false otherwise
   */
  async isLessonCompleted(userId: string, lessonId: string): Promise<boolean> {
    return this.progressRepository.isLessonCompleted(userId, lessonId);
  }

  /**
   * Retrieves aggregated completion statistics for a specific lesson (analytics function).
   * 
   * @param {string} lessonId - The unique identifier of the lesson
   * @returns {Promise<{total_completions: number, average_score: number | null, average_time_spent: number | null}>}
   *   Promise resolving to lesson completion statistics
   */
  async getLessonCompletionStats(lessonId: string): Promise<{
    total_completions: number;
    average_score: number | null;
    average_time_spent: number | null;
  }> {
    return this.progressRepository.getLessonCompletionStats(lessonId);
  }

  /**
   * Resets user progress to initial state (administrative function).
   * 
   * This method resets experience points to 0, lives to 5, streak to 0, and clears the last completed lesson.
   * 
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<UserProgress>} Promise resolving to the reset progress data
   */
  async resetUserProgress(userId: string): Promise<UserProgress> {
    return this.progressRepository.updateUserProgress(userId, {
      experience_points: 0,
      lives_current: 5,
      streak_current: 0,
      last_completed_lesson_id: undefined,
    });
  }

  /**
   * Awards bonus experience points to a user for special achievements or events.
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {number} bonusPoints - The number of bonus experience points to award
   * @param {string} reason - Description of why the bonus was awarded (for logging)
   * @returns {Promise<UserProgress>} Promise resolving to the updated progress data
   */
  async awardBonusExperience(userId: string, bonusPoints: number, reason: string): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress(userId);
    const newExperiencePoints = currentProgress.experience_points + bonusPoints;

    const updatedProgress = await this.progressRepository.updateUserProgress(userId, {
      experience_points: newExperiencePoints,
    });

    logger.info('Bonus experience awarded', {
      userId,
      bonusPoints,
      reason,
      newTotal: newExperiencePoints,
    });

    return updatedProgress;
  }

  /**
   * Updates user's current lives count for gamification features.
   * 
   * Lives are clamped between 0 and 10 to maintain game balance.
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {number} livesChange - The change in lives (positive to add, negative to subtract)
   * @returns {Promise<UserProgress>} Promise resolving to the updated progress data
   */
  async updateUserLives(userId: string, livesChange: number): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress(userId);
    const newLives = Math.max(0, Math.min(10, currentProgress.lives_current + livesChange));

    return this.progressRepository.updateUserProgress(userId, {
      lives_current: newLives,
    });
  }

  /**
   * Calculates experience points based on lesson difficulty and user performance.
   * 
   * Applies performance-based multipliers:
   * - Score ≥90: 20% bonus (×1.2)
   * - Score 80-89: 10% bonus (×1.1)  
   * - Score 60-79: no modifier (×1.0)
   * - Score <60: 20% reduction (×0.8)
   * 
   * @private
   * @param {number} baseLessonPoints - Base experience points for the lesson
   * @param {number} [score] - User's score on the lesson (0-100)
   * @returns {number} Calculated experience points (minimum 1)
   */
  private calculateExperiencePoints(baseLessonPoints: number, score?: number): number {
    let experiencePoints = baseLessonPoints;

    // Apply score multiplier if score is provided
    if (score !== undefined && score !== null) {
      if (score >= 90) {
        experiencePoints = Math.floor(experiencePoints * 1.2); // 20% bonus for excellent performance
      } else if (score >= 80) {
        experiencePoints = Math.floor(experiencePoints * 1.1); // 10% bonus for good performance
      } else if (score < 60) {
        experiencePoints = Math.floor(experiencePoints * 0.8); // 20% reduction for poor performance
      }
      // No modifier for scores 60-79 (normal performance)
    }

    return Math.max(1, experiencePoints); // Ensure at least 1 point is awarded
  }

  /**
   * Calculates user's learning streak based on activity patterns.
   * 
   * Streak logic:
   * - Same day or consecutive day activity: increment streak
   * - Gap of more than 1 day: reset streak to 1
   * 
   * @private
   * @param {UserProgress} currentProgress - Current user progress data
   * @param {Date} completionDate - Date of the current lesson completion
   * @returns {number} Updated streak count
   */
  private calculateStreak(currentProgress: UserProgress, completionDate: Date): number {
    const lastActivity = currentProgress.last_activity_date;
    const daysDifference = Math.floor(
      (completionDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference <= 1) {
      // Same day or consecutive day - maintain or increment streak
      return currentProgress.streak_current + 1;
    } else {
      // Streak broken - reset to 1
      return 1;
    }
  }
}