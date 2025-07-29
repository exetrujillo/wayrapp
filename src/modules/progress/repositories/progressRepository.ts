// src/modules/progress/repositories/progressRepository.ts

/**
 * Comprehensive data access layer for progress tracking operations using Prisma ORM.
 * 
 * This repository provides a complete abstraction over the database layer for all progress-related
 * data operations in the WayrApp language learning platform. It handles user progress tracking,
 * lesson completion records, and analytics data with robust error handling and transaction support.
 * 
 * The repository implements the Repository pattern, providing a clean interface between the business
 * logic layer and the database. It includes comprehensive Prisma error handling, automatic data
 * mapping between database models and application interfaces, and optimized queries for performance.
 * 
 * Key features include atomic transaction support for batch operations, intelligent error mapping
 * from Prisma errors to application-specific errors, pagination support for large datasets,
 * aggregation queries for analytics, and comprehensive CRUD operations for both user progress
 * and lesson completion entities.
 * 
 * The repository ensures data consistency through proper constraint handling, provides efficient
 * upsert operations for progress updates, and includes specialized methods for offline synchronization
 * scenarios with duplicate detection and conflict resolution.
 * 
 * @module ProgressRepository
 * @category Progress
 * @category Repositories
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Initialize repository with Prisma client
 * const progressRepository = new ProgressRepository(prisma);
 * 
 * // Create user progress
 * const progress = await progressRepository.createUserProgress({
 *   user_id: 'user-123',
 *   experience_points: 0,
 *   lives_current: 5,
 *   streak_current: 0
 * });
 * 
 * // Record lesson completion
 * const completion = await progressRepository.createLessonCompletion({
 *   user_id: 'user-123',
 *   lesson_id: 'lesson-456',
 *   score: 85,
 *   time_spent_seconds: 120
 * });
 */

import { PrismaClient, Prisma } from "@prisma/client";
import {
  UserProgress,
  LessonCompletion,
  CreateUserProgressDto,
  UpdateUserProgressDto,
  CreateLessonCompletionDto,
  ProgressSummary,
} from "../types";
import { AppError } from "@/shared/middleware/errorHandler";
import {
  ErrorCodes,
  HttpStatus,
  QueryOptions,
  PaginatedResult,
} from "@/shared/types";
import { logger } from "@/shared/utils/logger";

/**
 * Data access layer for progress tracking operations.
 * 
 * @class ProgressRepository
 */
export class ProgressRepository {
  /**
   * Creates an instance of ProgressRepository.
   * 
   * @param {PrismaClient} prisma - Prisma client instance for database operations
   */
  constructor(private prisma: PrismaClient) {}

  /**
   * Creates a new user progress record in the database.
   * 
   * @param {CreateUserProgressDto} data - User progress data to create
   * @returns {Promise<UserProgress>} Promise resolving to the created progress record
   * @throws {AppError} When user progress already exists (409 CONFLICT) or user not found (404 NOT_FOUND)
   */
  async createUserProgress(data: CreateUserProgressDto): Promise<UserProgress> {
    try {
      const progress = await this.prisma.userProgress.create({
        data: {
          userId: data.user_id,
          experiencePoints: data.experience_points ?? 0,
          livesCurrent: data.lives_current ?? 5,
          streakCurrent: data.streak_current ?? 0,
          lastCompletedLessonId: data.last_completed_lesson_id ?? null,
        },
      });

      return this.mapPrismaUserProgressToUserProgress(progress);
    } catch (error) {
      logger.error("Error creating user progress", {
        error,
        userId: data.user_id,
      });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          // Unique constraint violation - progress already exists
          throw new AppError(
            "User progress already exists",
            HttpStatus.CONFLICT,
            ErrorCodes.CONFLICT,
          );
        }
        if (error.code === "P2003") {
          // Foreign key constraint violation
          throw new AppError(
            "User not found",
            HttpStatus.NOT_FOUND,
            ErrorCodes.NOT_FOUND,
          );
        }
      }

      throw new AppError(
        "Failed to create user progress",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Retrieves user progress record by user ID.
   * 
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<UserProgress | null>} Promise resolving to user progress or null if not found
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   */
  async findUserProgressByUserId(userId: string): Promise<UserProgress | null> {
    try {
      const progress = await this.prisma.userProgress.findUnique({
        where: { userId },
      });

      return progress
        ? this.mapPrismaUserProgressToUserProgress(progress)
        : null;
    } catch (error) {
      logger.error("Error finding user progress", { error, userId });
      throw new AppError(
        "Failed to find user progress",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Updates user progress record with specified changes.
   * 
   * Automatically updates the last activity date and handles lesson relationship updates.
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {UpdateUserProgressDto} updates - Object containing fields to update
   * @returns {Promise<UserProgress>} Promise resolving to the updated progress record
   * @throws {AppError} When user progress not found (404 NOT_FOUND) or database operation fails
   */
  async updateUserProgress(
    userId: string,
    updates: UpdateUserProgressDto,
  ): Promise<UserProgress> {
    try {
      const updateData: Prisma.UserProgressUpdateInput = {};

      if (updates.experience_points !== undefined) {
        updateData.experiencePoints = updates.experience_points;
      }
      if (updates.lives_current !== undefined) {
        updateData.livesCurrent = updates.lives_current;
      }
      if (updates.streak_current !== undefined) {
        updateData.streakCurrent = updates.streak_current;
      }
      if (updates.last_completed_lesson_id !== undefined) {
        updateData.lastCompletedLesson = updates.last_completed_lesson_id
          ? { connect: { id: updates.last_completed_lesson_id } }
          : { disconnect: true };
      }

      // Always update last activity date
      updateData.lastActivityDate = new Date();

      const progress = await this.prisma.userProgress.update({
        where: { userId },
        data: updateData,
      });

      return this.mapPrismaUserProgressToUserProgress(progress);
    } catch (error) {
      logger.error("Error updating user progress", { error, userId });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          // Record not found
          throw new AppError(
            "User progress not found",
            HttpStatus.NOT_FOUND,
            ErrorCodes.NOT_FOUND,
          );
        }
      }

      throw new AppError(
        "Failed to update user progress",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Creates new user progress or updates existing record atomically (upsert operation).
   * 
   * This method provides atomic create-or-update functionality, ensuring data consistency
   * when the existence of user progress is uncertain.
   * 
   * @param {CreateUserProgressDto} data - User progress data for creation or update
   * @returns {Promise<UserProgress>} Promise resolving to the created or updated progress record
   * @throws {AppError} When user not found (404 NOT_FOUND) or database operation fails
   */
  async upsertUserProgress(data: CreateUserProgressDto): Promise<UserProgress> {
    try {
      const progress = await this.prisma.userProgress.upsert({
        where: { userId: data.user_id },
        update: {
          ...(data.experience_points !== undefined && {
            experiencePoints: data.experience_points,
          }),
          ...(data.lives_current !== undefined && {
            livesCurrent: data.lives_current,
          }),
          ...(data.streak_current !== undefined && {
            streakCurrent: data.streak_current,
          }),
          ...(data.last_completed_lesson_id !== undefined && {
            lastCompletedLesson: data.last_completed_lesson_id
              ? { connect: { id: data.last_completed_lesson_id } }
              : { disconnect: true },
          }),
          lastActivityDate: new Date(),
        },
        create: {
          userId: data.user_id,
          experiencePoints: data.experience_points ?? 0,
          livesCurrent: data.lives_current ?? 5,
          streakCurrent: data.streak_current ?? 0,
          lastCompletedLessonId: data.last_completed_lesson_id ?? null,
        },
      });

      return this.mapPrismaUserProgressToUserProgress(progress);
    } catch (error) {
      logger.error("Error upserting user progress", {
        error,
        userId: data.user_id,
      });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
          // Foreign key constraint violation
          throw new AppError(
            "User not found",
            HttpStatus.NOT_FOUND,
            ErrorCodes.NOT_FOUND,
          );
        }
      }

      throw new AppError(
        "Failed to upsert user progress",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Creates a new lesson completion record in the database.
   * 
   * @param {CreateLessonCompletionDto} data - Lesson completion data to create
   * @returns {Promise<LessonCompletion>} Promise resolving to the created completion record
   * @throws {AppError} When lesson already completed (409 CONFLICT), user/lesson not found (404 NOT_FOUND), or database operation fails
   */
  async createLessonCompletion(
    data: CreateLessonCompletionDto,
  ): Promise<LessonCompletion> {
    try {
      const completion = await this.prisma.lessonCompletion.create({
        data: {
          userId: data.user_id,
          lessonId: data.lesson_id,
          completedAt: data.completed_at
            ? new Date(data.completed_at)
            : new Date(),
          score: data.score ?? null,
          timeSpentSeconds: data.time_spent_seconds ?? null,
        },
      });

      return this.mapPrismaLessonCompletionToLessonCompletion(completion);
    } catch (error) {
      logger.error("Error creating lesson completion", { error, data });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          // Unique constraint violation - lesson already completed
          throw new AppError(
            "Lesson already completed by user",
            HttpStatus.CONFLICT,
            ErrorCodes.CONFLICT,
          );
        }
        if (error.code === "P2003") {
          // Foreign key constraint violation
          throw new AppError(
            "User or lesson not found",
            HttpStatus.NOT_FOUND,
            ErrorCodes.NOT_FOUND,
          );
        }
      }

      throw new AppError(
        "Failed to create lesson completion",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Retrieves a specific lesson completion record by user and lesson ID.
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {string} lessonId - The unique identifier of the lesson
   * @returns {Promise<LessonCompletion | null>} Promise resolving to completion record or null if not found
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   */
  async findLessonCompletion(
    userId: string,
    lessonId: string,
  ): Promise<LessonCompletion | null> {
    try {
      const completion = await this.prisma.lessonCompletion.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
      });

      return completion
        ? this.mapPrismaLessonCompletionToLessonCompletion(completion)
        : null;
    } catch (error) {
      logger.error("Error finding lesson completion", {
        error,
        userId,
        lessonId,
      });
      throw new AppError(
        "Failed to find lesson completion",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Retrieves paginated list of lesson completions for a specific user.
   * 
   * Supports pagination, sorting, and filtering options for efficient data retrieval.
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {QueryOptions} [options={}] - Query options including pagination and sorting parameters
   * @returns {Promise<PaginatedResult<LessonCompletion>>} Promise resolving to paginated completion results
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   */
  async findUserLessonCompletions(
    userId: string,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<LessonCompletion>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "completedAt",
        sortOrder = "desc",
      } = options;
      const skip = (page - 1) * limit;

      // Get total count
      const total = await this.prisma.lessonCompletion.count({
        where: { userId },
      });

      // Get completions
      const completions = await this.prisma.lessonCompletion.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      });

      const mappedCompletions = completions.map((completion) =>
        this.mapPrismaLessonCompletionToLessonCompletion(completion),
      );

      return {
        data: mappedCompletions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error finding user lesson completions", {
        error,
        userId,
        options,
      });
      throw new AppError(
        "Failed to retrieve lesson completions",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Creates multiple lesson completion records atomically within a transaction.
   * 
   * This method is optimized for offline synchronization scenarios, automatically
   * skipping duplicate completions and ensuring data consistency through transaction handling.
   * 
   * @param {CreateLessonCompletionDto[]} completions - Array of lesson completion data to create
   * @returns {Promise<LessonCompletion[]>} Promise resolving to array of successfully created completion records
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   */
  async createMultipleLessonCompletions(
    completions: CreateLessonCompletionDto[],
  ): Promise<LessonCompletion[]> {
    try {
      const results: LessonCompletion[] = [];

      // Use transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        for (const completion of completions) {
          try {
            const created = await tx.lessonCompletion.create({
              data: {
                userId: completion.user_id,
                lessonId: completion.lesson_id,
                completedAt: new Date(completion.completed_at || new Date()),
                score: completion.score ?? null,
                timeSpentSeconds: completion.time_spent_seconds ?? null,
              },
            });
            results.push(
              this.mapPrismaLessonCompletionToLessonCompletion(created),
            );
          } catch (error) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              // Skip duplicates - lesson already completed
              logger.info("Skipping duplicate lesson completion", {
                userId: completion.user_id,
                lessonId: completion.lesson_id,
              });
              continue;
            }
            throw error;
          }
        }
      });

      return results;
    } catch (error) {
      logger.error("Error creating multiple lesson completions", {
        error,
        completions,
      });
      throw new AppError(
        "Failed to create lesson completions",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Retrieves comprehensive progress summary with aggregated statistics.
   * 
   * Calculates lessons completed, courses started, and other analytics data by performing
   * complex queries across multiple related tables. Includes advanced analytics like
   * longest streak, completion percentage, and average score.
   * 
   * @param {string} userId - The unique identifier of the user
   * @returns {Promise<ProgressSummary | null>} Promise resolving to progress summary or null if user progress not found
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   */
  async getProgressSummary(userId: string): Promise<ProgressSummary | null> {
    try {
      const progress = await this.prisma.userProgress.findUnique({
        where: { userId },
      });

      if (!progress) {
        return null;
      }

      // Count completed lessons and get aggregation stats
      const completionStats = await this.prisma.lessonCompletion.aggregate({
        where: { userId },
        _count: { lessonId: true },
        _avg: { score: true },
      });

      const lessonsCompleted = completionStats._count.lessonId;
      const averageScore = completionStats._avg.score || 0;

      // Get total lessons count for completion percentage
      const totalLessons = await this.prisma.lesson.count();
      const completionPercentage = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;

      // Calculate longest streak from completion dates
      const completions = await this.prisma.lessonCompletion.findMany({
        where: { userId },
        orderBy: { completedAt: 'asc' },
        select: { completedAt: true },
      });

      const longestStreak = this.calculateLongestStreak(completions.map(c => c.completedAt));

      // Count courses started (courses with at least one completed lesson)
      const uniqueCourses = await this.prisma.lessonCompletion.findMany({
        where: { userId },
        distinct: ["lessonId"],
        select: {
          lesson: {
            select: {
              module: {
                select: {
                  section: {
                    select: {
                      level: {
                        select: {
                          courseId: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const coursesStarted = new Set(
        uniqueCourses.map(
          (completion) => completion.lesson.module.section.level.courseId,
        ),
      ).size;

      // For now, set courses completed to 0 (would need more complex logic)
      const coursesCompleted = 0;

      return {
        user_id: userId,
        experience_points: progress.experiencePoints,
        lives_current: progress.livesCurrent,
        streak_current: progress.streakCurrent,
        longest_streak: longestStreak,
        lessons_completed: lessonsCompleted,
        courses_started: coursesStarted,
        courses_completed: coursesCompleted,
        completion_percentage: Math.round(completionPercentage * 100) / 100, // Round to 2 decimal places
        average_score: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
        last_activity_date: progress.lastActivityDate,
      };
    } catch (error) {
      logger.error("Error getting progress summary", { error, userId });
      throw new AppError(
        "Failed to get progress summary",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Checks whether a specific lesson has been completed by the user.
   * 
   * @param {string} userId - The unique identifier of the user
   * @param {string} lessonId - The unique identifier of the lesson
   * @returns {Promise<boolean>} Promise resolving to true if lesson is completed, false otherwise
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   */
  async isLessonCompleted(userId: string, lessonId: string): Promise<boolean> {
    try {
      const completion = await this.prisma.lessonCompletion.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
      });

      return !!completion;
    } catch (error) {
      logger.error("Error checking lesson completion", {
        error,
        userId,
        lessonId,
      });
      throw new AppError(
        "Failed to check lesson completion",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Retrieves aggregated completion statistics for a specific lesson.
   * 
   * Calculates total completions, average score, and average time spent using database aggregation functions.
   * 
   * @param {string} lessonId - The unique identifier of the lesson
   * @returns {Promise<{total_completions: number, average_score: number | null, average_time_spent: number | null}>}
   *   Promise resolving to lesson completion statistics
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   */
  async getLessonCompletionStats(lessonId: string): Promise<{
    total_completions: number;
    average_score: number | null;
    average_time_spent: number | null;
  }> {
    try {
      const stats = await this.prisma.lessonCompletion.aggregate({
        where: { lessonId },
        _count: { userId: true },
        _avg: {
          score: true,
          timeSpentSeconds: true,
        },
      });

      return {
        total_completions: stats._count.userId,
        average_score: stats._avg.score,
        average_time_spent: stats._avg.timeSpentSeconds,
      };
    } catch (error) {
      logger.error("Error getting lesson completion stats", {
        error,
        lessonId,
      });
      throw new AppError(
        "Failed to get lesson completion statistics",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR,
      );
    }
  }

  /**
   * Maps Prisma UserProgress model to application UserProgress interface.
   * 
   * Transforms database field names to application interface field names for clean separation
   * between database schema and application domain models.
   * 
   * @private
   * @param {any} prismaProgress - Prisma UserProgress model instance
   * @returns {UserProgress} Mapped UserProgress interface object
   */
  private mapPrismaUserProgressToUserProgress(
    prismaProgress: any,
  ): UserProgress {
    return {
      user_id: prismaProgress.userId,
      experience_points: prismaProgress.experiencePoints,
      lives_current: prismaProgress.livesCurrent,
      streak_current: prismaProgress.streakCurrent,
      last_completed_lesson_id: prismaProgress.lastCompletedLessonId,
      last_activity_date: prismaProgress.lastActivityDate,
      updated_at: prismaProgress.updatedAt,
    };
  }

  /**
   * Maps Prisma LessonCompletion model to application LessonCompletion interface.
   * 
   * Transforms database field names to application interface field names for clean separation
   * between database schema and application domain models.
   * 
   * @private
   * @param {any} prismaCompletion - Prisma LessonCompletion model instance
   * @returns {LessonCompletion} Mapped LessonCompletion interface object
   */
  private mapPrismaLessonCompletionToLessonCompletion(
    prismaCompletion: any,
  ): LessonCompletion {
    return {
      user_id: prismaCompletion.userId,
      lesson_id: prismaCompletion.lessonId,
      completed_at: prismaCompletion.completedAt,
      score: prismaCompletion.score,
      time_spent_seconds: prismaCompletion.timeSpentSeconds,
    };
  }

  /**
   * Calculates the longest consecutive streak from completion dates.
   * 
   * Analyzes completion dates to find the longest sequence of consecutive days
   * with lesson completions. Days are considered consecutive if they are within
   * 24 hours of each other.
   * 
   * @private
   * @param {Date[]} completionDates - Array of completion dates sorted in ascending order
   * @returns {number} The longest consecutive streak in days
   */
  private calculateLongestStreak(completionDates: Date[]): number {
    if (completionDates.length === 0) {
      return 0;
    }

    let longestStreak = 1;
    let currentStreak = 1;

    // Convert dates to day strings for comparison (YYYY-MM-DD format)
    const dayStrings = completionDates.map(date => 
      date.toISOString().split('T')[0]
    );

    // Remove duplicates (multiple completions on same day)
    const uniqueDays = [...new Set(dayStrings)].sort();

    if (uniqueDays.length <= 1) {
      return uniqueDays.length;
    }

    for (let i = 1; i < uniqueDays.length; i++) {
      const currentDay = uniqueDays[i];
      const previousDay = uniqueDays[i - 1];
      
      if (!currentDay || !previousDay) {
        continue;
      }
      
      const currentDate = new Date(currentDay);
      const previousDate = new Date(previousDay);
      
      // Calculate difference in days
      const diffTime = currentDate.getTime() - previousDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        // Break in streak
        currentStreak = 1;
      }
    }

    return longestStreak;
  }
}
