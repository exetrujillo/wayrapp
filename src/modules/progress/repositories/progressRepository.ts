/**
 * Progress Repository
 * Data access layer for progress operations using Prisma
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

export class ProgressRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create user progress record
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
   * Find user progress by user ID
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
   * Update user progress
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
   * Create or update user progress (upsert)
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
   * Create lesson completion record
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
   * Find lesson completion by user and lesson ID
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
   * Find all lesson completions for a user
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
   * Create multiple lesson completions (for offline sync)
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
   * Get progress summary for a user
   */
  async getProgressSummary(userId: string): Promise<ProgressSummary | null> {
    try {
      const progress = await this.prisma.userProgress.findUnique({
        where: { userId },
      });

      if (!progress) {
        return null;
      }

      // Count completed lessons
      const lessonsCompleted = await this.prisma.lessonCompletion.count({
        where: { userId },
      });

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
        lessons_completed: lessonsCompleted,
        courses_started: coursesStarted,
        courses_completed: coursesCompleted,
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
   * Check if lesson is completed by user
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
   * Get lesson completion statistics
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
   * Map Prisma UserProgress to UserProgress interface
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
   * Map Prisma LessonCompletion to LessonCompletion interface
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
}
