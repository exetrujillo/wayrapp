/**
 * Progress Service
 * Business logic for progress tracking and experience points calculation
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

export class ProgressService {
  constructor(
    private progressRepository: ProgressRepository,
    private prisma: PrismaClient
  ) {}

  /**
   * Get user progress, creating it if it doesn't exist
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
   * Update user progress
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
   * Complete a lesson and update progress
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
   * Synchronize offline progress data
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
   * Get progress summary for a user
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
   * Get user's lesson completions with pagination
   */
  async getUserLessonCompletions(
    userId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<LessonCompletion>> {
    return this.progressRepository.findUserLessonCompletions(userId, options);
  }

  /**
   * Check if a lesson is completed by user
   */
  async isLessonCompleted(userId: string, lessonId: string): Promise<boolean> {
    return this.progressRepository.isLessonCompleted(userId, lessonId);
  }

  /**
   * Get lesson completion statistics (for analytics)
   */
  async getLessonCompletionStats(lessonId: string): Promise<{
    total_completions: number;
    average_score: number | null;
    average_time_spent: number | null;
  }> {
    return this.progressRepository.getLessonCompletionStats(lessonId);
  }

  /**
   * Reset user progress (admin function)
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
   * Award bonus experience points
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
   * Update user lives (for gamification)
   */
  async updateUserLives(userId: string, livesChange: number): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress(userId);
    const newLives = Math.max(0, Math.min(10, currentProgress.lives_current + livesChange));

    return this.progressRepository.updateUserProgress(userId, {
      lives_current: newLives,
    });
  }

  /**
   * Calculate experience points based on lesson difficulty and performance
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
   * Calculate streak based on last activity
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