// src/modules/progress/controllers/progressController.ts

/**
 * Comprehensive HTTP API controller for progress tracking and gamification endpoints.
 * 
 * This controller provides a complete REST API for managing user progress, lesson completions,
 * and gamification features in the WayrApp language learning platform. It handles all HTTP
 * request/response operations for progress-related functionality, including user progress
 * tracking, lesson completion processing, offline synchronization, and administrative operations.
 * 
 * The controller implements proper authentication and authorization patterns, comprehensive
 * input validation using Zod schemas, structured error handling with appropriate HTTP status
 * codes, and detailed logging for audit trails. It follows RESTful conventions and provides
 * both user-facing and administrative endpoints with role-based access control.
 * 
 * Key features include automatic user authentication validation, comprehensive request/response
 * validation, structured JSON responses with consistent formatting, proper HTTP status code
 * usage, role-based authorization for administrative functions, and detailed logging for
 * monitoring and debugging purposes.
 * 
 * The controller serves as the presentation layer in the clean architecture pattern, handling
 * HTTP concerns while delegating business logic to the ProgressService layer. All endpoints
 * require authentication, with specific endpoints requiring elevated permissions for
 * administrative operations.
 * 
 * @module ProgressController
 * @category Progress
 * @category Controllers
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Initialize controller with service dependency
 * const progressService = new ProgressService(progressRepository, prisma);
 * const progressController = new ProgressController(progressService);
 * 
 * // Register routes with Express router
 * router.get('/progress', progressController.getUserProgress);
 * router.post('/progress/lesson/:id', progressController.completeLesson);
 * router.put('/progress/sync', progressController.syncOfflineProgress);
 */

import { Request, Response, NextFunction } from 'express';
import { ProgressService } from '../services/progressService';
import { 
  UpdateProgressDto,
  OfflineProgressSync,
  UpdateUserProgressInput
} from '../types';
import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

/**
 * HTTP API controller for progress tracking operations.
 * 
 * @class ProgressController
 */
export class ProgressController {
  /**
   * Creates an instance of ProgressController.
   * 
   * @param {ProgressService} progressService - Service layer for progress business logic
   */
  constructor(private progressService: ProgressService) {}

  /**
   * Retrieves the current authenticated user's progress data.
   * 
   * Handles GET /api/progress endpoint. Requires authentication.
   * 
   * @param {Request} req - Express request object containing user authentication data
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Response format:
   * {
   *   "success": true,
   *   "data": {
   *     "user_id": "user-123",
   *     "experience_points": 1250,
   *     "lives_current": 5,
   *     "streak_current": 7,
   *     "last_completed_lesson_id": "lesson-456",
   *     "last_activity_date": "2025-01-01T10:00:00Z",
   *     "updated_at": "2025-01-01T10:00:00Z"
   *   }
   * }
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
   * Retrieves comprehensive progress summary with aggregated statistics for the current user.
   * 
   * Handles GET /api/progress/summary endpoint. Requires authentication.
   * 
   * @param {Request} req - Express request object containing user authentication data
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
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
   * Processes lesson completion and updates user progress with experience points.
   * 
   * Handles POST /api/progress/lesson/:id endpoint. Requires authentication.
   * 
   * @param {Request} req - Express request object with lesson ID in params and completion data in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Request body:
   * {
   *   "score": 85,
   *   "time_spent_seconds": 120
   * }
   * 
   * // Response format:
   * {
   *   "success": true,
   *   "data": {
   *     "progress": { ... },
   *     "completion": { ... },
   *     "experience_gained": 25
   *   },
   *   "message": "Lesson completed successfully"
   * }
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

      // Extract validated data from middleware
      const { id: lessonId } = req.params as { id: string };
      const bodyData = req.body;
      
      // Construct the progress data with lesson_id from URL parameter
      const progressData: UpdateProgressDto = {
        lesson_id: lessonId,
        score: bodyData.score,
        time_spent_seconds: bodyData.time_spent_seconds,
      };

      const result = await this.progressService.completeLesson(userId, progressData);

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
   * Synchronizes offline lesson completions with the server, handling conflicts and duplicates.
   * 
   * Handles PUT /api/progress/sync endpoint. Requires authentication.
   * 
   * @param {Request} req - Express request object with offline sync data in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Request body:
   * {
   *   "completions": [
   *     {
   *       "lesson_id": "lesson-123",
   *       "completed_at": "2025-01-01T10:00:00Z",
   *       "score": 92,
   *       "time_spent_seconds": 180
   *     }
   *   ],
   *   "last_sync_timestamp": "2025-01-01T09:00:00Z"
   * }
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

      // Use validated data from middleware
      const syncData: OfflineProgressSync = req.body;

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
   * Retrieves paginated list of lesson completions for the current user.
   * 
   * Handles GET /api/progress/completions endpoint. Requires authentication.
   * Supports query parameters: page, limit, sortBy, sortOrder for pagination and sorting.
   * 
   * @param {Request} req - Express request object with pagination parameters in query
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
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

      // Use validated pagination parameters from middleware
      const paginationOptions = req.query;

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
   * Checks whether a specific lesson has been completed by the current user.
   * 
   * Handles GET /api/progress/lesson/:id/completed endpoint. Requires authentication.
   * 
   * @param {Request} req - Express request object with lesson ID in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
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

      // Use validated lesson ID from middleware
      const { id: lessonId } = req.params as { id: string };

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
   * Updates user progress with manual adjustments (administrative function).
   * 
   * Handles PUT /api/progress endpoint. Requires authentication.
   * 
   * @param {Request} req - Express request object with progress updates in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
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

      // Use validated request body from middleware
      const updates: UpdateUserProgressInput = req.body;

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
   * Awards bonus experience points to a target user (administrative function).
   * 
   * Handles POST /api/progress/bonus endpoint. Requires admin role.
   * 
   * @param {Request} req - Express request object with bonus award data in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Request body:
   * {
   *   "target_user_id": "user-456",
   *   "bonus_points": 100,
   *   "reason": "Contest winner bonus"
   * }
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

      if (req.user?.role !== 'admin') {
        throw new AppError('Insufficient permissions', HttpStatus.FORBIDDEN, ErrorCodes.AUTHORIZATION_ERROR);
      }

      // Use validated request body from middleware
      const { target_user_id, bonus_points, reason } = req.body;

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
   * Updates user's current lives count for gamification features.
   * 
   * Handles PUT /api/progress/lives endpoint. Requires authentication.
   * 
   * @param {Request} req - Express request object with lives change data in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Request body:
   * {
   *   "lives_change": -1  // Subtract one life
   * }
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

      // Use validated request body from middleware
      const { lives_change } = req.body;

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
   * Resets a target user's progress to initial state (administrative function).
   * 
   * Handles POST /api/progress/reset endpoint. Requires admin role.
   * 
   * @param {Request} req - Express request object with target user ID in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Request body:
   * {
   *   "target_user_id": "user-789"
   * }
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

      if (req.user?.role !== 'admin') {
        throw new AppError('Insufficient permissions', HttpStatus.FORBIDDEN, ErrorCodes.AUTHORIZATION_ERROR);
      }

      // Use validated request body from middleware
      const { target_user_id } = req.body;

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
   * Retrieves aggregated completion statistics for a specific lesson (analytics function).
   * 
   * Handles GET /api/progress/lesson/:id/stats endpoint. Requires admin or content_creator role.
   * 
   * @param {Request} req - Express request object with lesson ID in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Response format:
   * {
   *   "success": true,
   *   "data": {
   *     "total_completions": 150,
   *     "average_score": 82.5,
   *     "average_time_spent": 145.2
   *   }
   * }
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

      // Use validated lesson ID from middleware
      const { id: lessonId } = req.params as { id: string };

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