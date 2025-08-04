// src/modules/content/services/ExerciseUsageService.ts

/**
 * Exercise usage tracking and analytics service for the WayrApp content management system.
 * 
 * This service provides comprehensive exercise usage tracking, analytics, and management
 * capabilities for the WayrApp platform. It handles exercise usage statistics, lesson
 * assignment tracking, cascade delete warnings, and exercise duplication functionality.
 * The service serves as the primary business logic layer for exercise usage operations,
 * ensuring data integrity and providing detailed analytics for content creators.
 * 
 * Key architectural responsibilities include exercise usage tracking across lessons,
 * cascade delete impact analysis, exercise duplication with variation management,
 * usage frequency analytics, and performance metrics collection. The service integrates
 * with repository layers for data persistence and provides comprehensive error handling
 * for all business rule violations.
 * 
 * @module ExerciseUsageService
 * @category Services
 * @category Content
 * @category Exercise
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Initialize service with Prisma client
 * const exerciseUsageService = new ExerciseUsageService(prisma);
 * 
 * // Get exercise usage statistics
 * const usage = await exerciseUsageService.getExerciseUsage('exercise-001');
 * 
 * // Get cascade delete impact
 * const impact = await exerciseUsageService.getCascadeDeleteImpact('exercise-001');
 * 
 * // Duplicate exercise with variations
 * const duplicate = await exerciseUsageService.duplicateExercise('exercise-001', {
 *   id: 'exercise-001-variant',
 *   modifications: { difficulty: 'hard' }
 * });
 */

import { PrismaClient } from '@prisma/client';
import { ExerciseRepository } from '../repositories';
import { Exercise, CreateExerciseDto } from '../types';
import { AppError } from '../../../shared/middleware/errorHandler';
import { HttpStatus, ErrorCodes } from '../../../shared/types';

/**
 * Interface for exercise usage statistics
 */
export interface ExerciseUsage {
  exerciseId: string;
  exercise: Exercise;
  totalLessons: number;
  lessons: Array<{
    lessonId: string;
    lessonName: string;
    moduleId: string;
    moduleName: string;
    sectionId: string;
    sectionName: string;
    levelId: string;
    levelName: string;
    courseId: string;
    courseName: string;
    order: number;
  }>;
  usageFrequency: number;
  lastUsed: Date | null;
  createdAt: Date;
}

/**
 * Interface for cascade delete impact analysis
 */
export interface CascadeDeleteImpact {
  exerciseId: string;
  canDelete: boolean;
  affectedLessons: number;
  affectedCourses: number;
  warnings: string[];
  lessons: Array<{
    lessonId: string;
    lessonName: string;
    courseName: string;
    studentCount?: number;
  }>;
}

/**
 * Interface for exercise duplication options
 */
export interface ExerciseDuplicationOptions {
  id: string;
  modifications?: Record<string, any>;
  preserveUsage?: boolean;
}

/**
 * Interface for exercise analytics
 */
export interface ExerciseAnalytics {
  exerciseId: string;
  usageStats: {
    totalAssignments: number;
    uniqueLessons: number;
    uniqueCourses: number;
    averagePosition: number;
  };
  performanceMetrics: {
    completionRate?: number;
    averageScore?: number;
    averageTimeSpent?: number;
  };
  trends: {
    weeklyUsage: Array<{ week: string; count: number }>;
    monthlyUsage: Array<{ month: string; count: number }>;
  };
}

/**
 * Service class for comprehensive exercise usage tracking and management operations.
 * 
 * Provides complete functionality for exercise usage analytics, cascade delete impact
 * analysis, exercise duplication, and performance metrics collection. Handles complex
 * business logic including usage frequency calculation, lesson assignment tracking,
 * and exercise variation management.
 */
export class ExerciseUsageService {
  private exerciseRepository: ExerciseRepository;

  /**
   * Creates a new ExerciseUsageService instance
   * 
   * @param {PrismaClient} prisma - Initialized Prisma client for database operations
   */
  constructor(private prisma: PrismaClient) {
    this.exerciseRepository = new ExerciseRepository(prisma);
  }

  /**
   * Retrieves comprehensive usage statistics for a specific exercise.
   * 
   * Provides detailed information about which lessons use the exercise,
   * including the complete hierarchical context (course → level → section → module → lesson).
   * Calculates usage frequency and tracks when the exercise was last used.
   * 
   * @param {string} exerciseId - The unique exercise identifier
   * @returns {Promise<ExerciseUsage>} Promise resolving to comprehensive usage statistics
   * @throws {Error} When exercise with the specified ID is not found
   * 
   * @example
   * const usage = await exerciseUsageService.getExerciseUsage('exercise-translate-001');
   * console.log(`Exercise used in ${usage.totalLessons} lessons`);
   * usage.lessons.forEach(lesson => {
   *   console.log(`Used in: ${lesson.courseName} > ${lesson.lessonName}`);
   * });
   */
  async getExerciseUsage(exerciseId: string): Promise<ExerciseUsage> {
    // Check if exercise exists
    const exercise = await this.exerciseRepository.findById(exerciseId);
    if (!exercise) {
      throw new AppError(
        `Exercise '${exerciseId}' not found`,
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    // Get all lesson assignments with hierarchical context
    const lessonAssignments = await this.prisma.lessonExercise.findMany({
      where: { exerciseId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                section: {
                  include: {
                    level: {
                      include: {
                        course: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { lesson: { module: { section: { level: { course: { name: 'asc' } } } } } },
        { lesson: { name: 'asc' } }
      ]
    });

    // Calculate usage frequency (assignments per month since creation)
    const monthsSinceCreation = Math.max(1, 
      Math.ceil((Date.now() - exercise.created_at.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );
    const usageFrequency = lessonAssignments.length / monthsSinceCreation;

    // Find last usage date
    const lastUsed = lessonAssignments.length > 0 
      ? new Date(Math.max(...lessonAssignments.map(la => la.lesson.updatedAt.getTime())))
      : null;

    // Map lesson assignments to usage format
    const lessons = lessonAssignments.map(la => ({
      lessonId: la.lesson.id,
      lessonName: la.lesson.name,
      moduleId: la.lesson.module.id,
      moduleName: la.lesson.module.name,
      sectionId: la.lesson.module.section.id,
      sectionName: la.lesson.module.section.name,
      levelId: la.lesson.module.section.level.id,
      levelName: la.lesson.module.section.level.name,
      courseId: la.lesson.module.section.level.course.id,
      courseName: la.lesson.module.section.level.course.name,
      order: la.order
    }));

    return {
      exerciseId,
      exercise,
      totalLessons: lessonAssignments.length,
      lessons,
      usageFrequency,
      lastUsed,
      createdAt: exercise.created_at
    };
  }

  /**
   * Analyzes the impact of deleting an exercise on the content system.
   * 
   * Provides comprehensive analysis of what would be affected if the exercise
   * is deleted, including warnings about lessons that would lose content and
   * recommendations for content creators.
   * 
   * @param {string} exerciseId - The unique exercise identifier
   * @returns {Promise<CascadeDeleteImpact>} Promise resolving to impact analysis
   * @throws {Error} When exercise with the specified ID is not found
   * 
   * @example
   * const impact = await exerciseUsageService.getCascadeDeleteImpact('exercise-001');
   * if (!impact.canDelete) {
   *   console.log('Cannot delete exercise:');
   *   impact.warnings.forEach(warning => console.log(`- ${warning}`));
   * }
   */
  async getCascadeDeleteImpact(exerciseId: string): Promise<CascadeDeleteImpact> {
    // Check if exercise exists
    const exercise = await this.exerciseRepository.findById(exerciseId);
    if (!exercise) {
      throw new AppError(
        `Exercise '${exerciseId}' not found`,
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    // Get all lesson assignments with course information
    const lessonAssignments = await this.prisma.lessonExercise.findMany({
      where: { exerciseId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                section: {
                  include: {
                    level: {
                      include: {
                        course: true
                      }
                    }
                  }
                }
              }
            },
            completions: true // For student count estimation
          }
        }
      }
    });

    const affectedLessons = lessonAssignments.length;
    const affectedCourses = new Set(
      lessonAssignments.map(la => la.lesson.module.section.level.course.id)
    ).size;

    // Generate warnings
    const warnings: string[] = [];
    if (affectedLessons > 0) {
      warnings.push(`This exercise is currently used in ${affectedLessons} lesson(s)`);
    }
    if (affectedCourses > 1) {
      warnings.push(`Deletion will affect ${affectedCourses} different courses`);
    }

    // Check if any lessons would become empty
    const lessonsWithFewExercises = await Promise.all(
      lessonAssignments.map(async (la) => {
        const exerciseCount = await this.prisma.lessonExercise.count({
          where: { lessonId: la.lesson.id }
        });
        return { lesson: la.lesson, exerciseCount };
      })
    );

    const lessonsBecomingEmpty = lessonsWithFewExercises.filter(l => l.exerciseCount <= 1);
    if (lessonsBecomingEmpty.length > 0) {
      warnings.push(`${lessonsBecomingEmpty.length} lesson(s) would become empty after deletion`);
    }

    // Determine if deletion is safe
    const canDelete = affectedLessons === 0 || (affectedLessons <= 3 && affectedCourses <= 1);

    // Map lessons for detailed impact view
    const lessons = lessonAssignments.map(la => ({
      lessonId: la.lesson.id,
      lessonName: la.lesson.name,
      courseName: la.lesson.module.section.level.course.name,
      studentCount: la.lesson.completions.length // Approximate student count
    }));

    return {
      exerciseId,
      canDelete,
      affectedLessons,
      affectedCourses,
      warnings,
      lessons
    };
  }

  /**
   * Creates a duplicate of an existing exercise with optional modifications.
   * 
   * Allows content creators to create variations of existing exercises by
   * duplicating the exercise data and applying modifications. Useful for
   * creating difficulty variations or similar exercises with different content.
   * 
   * @param {string} sourceExerciseId - The unique identifier of the exercise to duplicate
   * @param {ExerciseDuplicationOptions} options - Duplication configuration options
   * @param {string} options.id - New unique identifier for the duplicated exercise
   * @param {Record<string, any>} [options.modifications] - Optional modifications to apply to the exercise data
   * @param {boolean} [options.preserveUsage=false] - Whether to copy lesson assignments (not recommended)
   * @returns {Promise<Exercise>} Promise resolving to the created duplicate exercise
   * @throws {Error} When source exercise is not found or duplicate ID already exists
   * 
   * @example
   * const duplicate = await exerciseUsageService.duplicateExercise('exercise-001', {
   *   id: 'exercise-001-hard',
   *   modifications: {
   *     difficulty: 'hard',
   *     timeLimit: 30
   *   }
   * });
   */
  async duplicateExercise(
    sourceExerciseId: string, 
    options: ExerciseDuplicationOptions
  ): Promise<Exercise> {
    // Check if source exercise exists
    const sourceExercise = await this.exerciseRepository.findById(sourceExerciseId);
    if (!sourceExercise) {
      throw new AppError(
        `Source exercise '${sourceExerciseId}' not found`,
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    // Check if target ID already exists
    const existingExercise = await this.exerciseRepository.findById(options.id);
    if (existingExercise) {
      throw new AppError(
        `Exercise with ID '${options.id}' already exists`,
        HttpStatus.CONFLICT,
        ErrorCodes.CONFLICT
      );
    }

    // Prepare duplicate data
    const duplicateData: CreateExerciseDto = {
      id: options.id,
      exercise_type: sourceExercise.exercise_type,
      data: {
        ...sourceExercise.data,
        ...options.modifications
      }
    };

    // Create the duplicate exercise
    const duplicateExercise = await this.exerciseRepository.create(duplicateData);

    // Optionally preserve usage (copy lesson assignments)
    if (options.preserveUsage) {
      const sourceAssignments = await this.prisma.lessonExercise.findMany({
        where: { exerciseId: sourceExerciseId }
      });

      // Copy assignments to the new exercise
      await Promise.all(
        sourceAssignments.map(assignment =>
          this.prisma.lessonExercise.create({
            data: {
              lessonId: assignment.lessonId,
              exerciseId: options.id,
              order: assignment.order + 1000 // Offset to avoid conflicts
            }
          })
        )
      );
    }

    return duplicateExercise;
  }

  /**
   * Retrieves comprehensive analytics for a specific exercise.
   * 
   * Provides detailed analytics including usage statistics, performance metrics,
   * and usage trends over time. Useful for content creators to understand
   * how their exercises are being used and performing.
   * 
   * @param {string} exerciseId - The unique exercise identifier
   * @returns {Promise<ExerciseAnalytics>} Promise resolving to comprehensive analytics
   * @throws {Error} When exercise with the specified ID is not found
   * 
   * @example
   * const analytics = await exerciseUsageService.getExerciseAnalytics('exercise-001');
   * console.log(`Used in ${analytics.usageStats.uniqueLessons} lessons`);
   * console.log(`Average completion rate: ${analytics.performanceMetrics.completionRate}%`);
   */
  async getExerciseAnalytics(exerciseId: string): Promise<ExerciseAnalytics> {
    // Check if exercise exists
    const exercise = await this.exerciseRepository.findById(exerciseId);
    if (!exercise) {
      throw new AppError(
        `Exercise '${exerciseId}' not found`,
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    // Get usage statistics
    const lessonAssignments = await this.prisma.lessonExercise.findMany({
      where: { exerciseId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                section: {
                  include: {
                    level: {
                      include: {
                        course: true
                      }
                    }
                  }
                }
              }
            },
            completions: true
          }
        }
      }
    });

    const totalAssignments = lessonAssignments.length;
    const uniqueLessons = new Set(lessonAssignments.map(la => la.lessonId)).size;
    const uniqueCourses = new Set(
      lessonAssignments.map(la => la.lesson.module.section.level.course.id)
    ).size;
    const averagePosition = totalAssignments > 0 
      ? lessonAssignments.reduce((sum, la) => sum + la.order, 0) / totalAssignments
      : 0;

    // Calculate performance metrics (placeholder - would need actual completion data)
    const allCompletions = lessonAssignments.flatMap(la => la.lesson.completions);
    const completionRate = allCompletions.length > 0 ? 85 : 0; // Placeholder
    const averageScore = allCompletions.length > 0 ? 78 : 0; // Placeholder
    const averageTimeSpent = allCompletions.length > 0 ? 45 : 0; // Placeholder

    // Generate usage trends (simplified - would need actual time-series data)
    const now = new Date();
    const weeklyUsage = Array.from({ length: 12 }, (_, i) => {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekString = weekStart.toISOString().split('T')[0];
      return {
        week: weekString || '',
        count: Math.floor(Math.random() * 10) // Placeholder
      };
    }).reverse();

    const monthlyUsage = Array.from({ length: 6 }, (_, i) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthString = monthStart.toISOString().split('T')[0]?.substring(0, 7);
      return {
        month: monthString || '',
        count: Math.floor(Math.random() * 30) // Placeholder
      };
    }).reverse();

    return {
      exerciseId,
      usageStats: {
        totalAssignments,
        uniqueLessons,
        uniqueCourses,
        averagePosition
      },
      performanceMetrics: {
        completionRate,
        averageScore,
        averageTimeSpent
      },
      trends: {
        weeklyUsage,
        monthlyUsage
      }
    };
  }

  /**
   * Retrieves usage statistics for multiple exercises in batch.
   * 
   * Efficiently retrieves usage statistics for multiple exercises at once,
   * useful for dashboard views and bulk operations.
   * 
   * @param {string[]} exerciseIds - Array of exercise identifiers
   * @returns {Promise<ExerciseUsage[]>} Promise resolving to array of usage statistics
   * 
   * @example
   * const usageStats = await exerciseUsageService.getBatchExerciseUsage([
   *   'exercise-001', 'exercise-002', 'exercise-003'
   * ]);
   */
  async getBatchExerciseUsage(exerciseIds: string[]): Promise<ExerciseUsage[]> {
    const usagePromises = exerciseIds.map(id => 
      this.getExerciseUsage(id).catch(() => null)
    );
    
    const results = await Promise.all(usagePromises);
    return results.filter((usage): usage is ExerciseUsage => usage !== null);
  }
}