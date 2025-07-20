/**
 * Progress Controller
 * HTTP request handlers for progress tracking endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { ProgressService } from '../services/progressService';
import { 
  UpdateProgressSchema, 
  OfflineProgressSyncSchema,
  UpdateUserProgressSchema,
  LessonIdParamSchema,
  UpdateProgressInput,
  OfflineProgressSyncInput,
  UpdateUserProgressInput
} from '../types';
import { PaginationSchema } from '@/shared/schemas';
import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

export class ProgressController {
  constructor(private progressService: ProgressService) {}

  /**
   * Get current user's progress
   * GET /api/progress
   */
  getUserProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      const progress = await this.progressService.getUserProgress(userId);

      res.status(HttpStatus.OK).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get progress summary for current user
   * GET /api/progress/summary
   */
  getProgressSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      const summary = await this.progressService.getProgressSummary(userId);

      res.status(HttpStatus.OK).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Complete a lesson and update progress
   * POST /api/progress/lesson/:id
   */
  completeLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      // Validate lesson ID parameter
      const { id: lessonId } = LessonIdParamSchema.parse(req.params);

      // Validate request body
      const progressData: UpdateProgressInput = {
        lesson_id: lessonId,
        score: req.body.score,
        time_spent_seconds: req.body.time_spent_seconds,
      };

      const validatedData = UpdateProgressSchema.parse(progressData);

      const result = await this.progressService.completeLesson(userId, validatedData);

      logger.info('Lesson completion processed', {
        userId,
        lessonId,
        experienceGained: result.experienceGained,
      });

      res.status(HttpStatus.CREATED).json({
        success: true,
        data: {
          progress: result.progress,
          completion: result.completion,
          experience_gained: result.experienceGained,
        },
        message: 'Lesson completed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Synchronize offline progress data
   * PUT /api/progress/sync
   */
  syncOfflineProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      // Validate request body
      const syncData: OfflineProgressSyncInput = OfflineProgressSyncSchema.parse(req.body);

      const result = await this.progressService.syncOfflineProgress(userId, syncData);

      logger.info('Offline progress sync completed', {
        userId,
        syncedCompletions: result.synced_completions,
        skippedDuplicates: result.skipped_duplicates,
      });

      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        message: `Synchronized ${result.synced_completions} completions, skipped ${result.skipped_duplicates} duplicates`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's lesson completions with pagination
   * GET /api/progress/completions
   */
  getUserLessonCompletions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      // Validate pagination parameters
      const paginationOptions = PaginationSchema.parse(req.query);

      const result = await this.progressService.getUserLessonCompletions(userId, paginationOptions);

      res.status(HttpStatus.OK).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check if a lesson is completed by current user
   * GET /api/progress/lesson/:id/completed
   */
  checkLessonCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      // Validate lesson ID parameter
      const { id: lessonId } = LessonIdParamSchema.parse(req.params);

      const isCompleted = await this.progressService.isLessonCompleted(userId, lessonId);

      res.status(HttpStatus.OK).json({
        success: true,
        data: {
          lesson_id: lessonId,
          is_completed: isCompleted,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user progress (admin/manual adjustment)
   * PUT /api/progress
   */
  updateUserProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      // Validate request body
      const updates: UpdateUserProgressInput = UpdateUserProgressSchema.parse(req.body);

      const updatedProgress = await this.progressService.updateUserProgress(userId, updates);

      logger.info('User progress updated manually', { userId, updates });

      res.status(HttpStatus.OK).json({
        success: true,
        data: updatedProgress,
        message: 'Progress updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Award bonus experience points (admin function)
   * POST /api/progress/bonus
   */
  awardBonusExperience = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      // Check if user has admin role
      if (req.user?.role !== 'admin') {
        throw new AppError(
          'Insufficient permissions',
          HttpStatus.FORBIDDEN,
          ErrorCodes.AUTHORIZATION_ERROR
        );
      }

      const { target_user_id, bonus_points, reason } = req.body;

      if (!target_user_id || !bonus_points || !reason) {
        throw new AppError(
          'Missing required fields: target_user_id, bonus_points, reason',
          HttpStatus.BAD_REQUEST,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      if (typeof bonus_points !== 'number' || bonus_points <= 0) {
        throw new AppError(
          'Bonus points must be a positive number',
          HttpStatus.BAD_REQUEST,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      const updatedProgress = await this.progressService.awardBonusExperience(
        target_user_id,
        bonus_points,
        reason
      );

      logger.info('Bonus experience awarded by admin', {
        adminId: userId,
        targetUserId: target_user_id,
        bonusPoints: bonus_points,
        reason,
      });

      res.status(HttpStatus.OK).json({
        success: true,
        data: updatedProgress,
        message: `Awarded ${bonus_points} bonus experience points`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user lives (gamification feature)
   * PUT /api/progress/lives
   */
  updateUserLives = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      const { lives_change } = req.body;

      if (typeof lives_change !== 'number') {
        throw new AppError(
          'Lives change must be a number',
          HttpStatus.BAD_REQUEST,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      const updatedProgress = await this.progressService.updateUserLives(userId, lives_change);

      res.status(HttpStatus.OK).json({
        success: true,
        data: updatedProgress,
        message: 'Lives updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset user progress (admin function)
   * POST /api/progress/reset
   */
  resetUserProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      // Check if user has admin role
      if (req.user?.role !== 'admin') {
        throw new AppError(
          'Insufficient permissions',
          HttpStatus.FORBIDDEN,
          ErrorCodes.AUTHORIZATION_ERROR
        );
      }

      const { target_user_id } = req.body;

      if (!target_user_id) {
        throw new AppError(
          'Missing required field: target_user_id',
          HttpStatus.BAD_REQUEST,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      const resetProgress = await this.progressService.resetUserProgress(target_user_id);

      logger.info('User progress reset by admin', {
        adminId: userId,
        targetUserId: target_user_id,
      });

      res.status(HttpStatus.OK).json({
        success: true,
        data: resetProgress,
        message: 'User progress reset successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get lesson completion statistics (admin/analytics)
   * GET /api/progress/lesson/:id/stats
   */
  getLessonCompletionStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      // Check if user has admin or content_creator role
      if (!['admin', 'content_creator'].includes(req.user?.role || '')) {
        throw new AppError(
          'Insufficient permissions',
          HttpStatus.FORBIDDEN,
          ErrorCodes.AUTHORIZATION_ERROR
        );
      }

      // Validate lesson ID parameter
      const { id: lessonId } = LessonIdParamSchema.parse(req.params);

      const stats = await this.progressService.getLessonCompletionStats(lessonId);

      res.status(HttpStatus.OK).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}