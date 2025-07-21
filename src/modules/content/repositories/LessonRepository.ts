import { PrismaClient, Lesson as PrismaLesson } from "@prisma/client";
import { Lesson, CreateLessonDto, LessonExercise } from "../types";
import { PaginatedResult, QueryOptions } from "../../../shared/types";
import {
  buildPrismaQueryParams,
  buildRangeFilterWhere,
  combineWhereConditions,
  createPaginationResult,
  COMMON_FIELD_MAPPINGS,
  SORT_FIELDS
} from "../../../shared/utils/repositoryHelpers";

export class LessonRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateLessonDto): Promise<Lesson> {
    const lesson = await this.prisma.lesson.create({
      data: {
        id: data.id,
        moduleId: data.module_id,
        experiencePoints: data.experience_points ?? 10,
        order: data.order,
      },
    });

    return this.mapPrismaToModel(lesson);
  }

  async findById(id: string): Promise<Lesson | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!lesson) return null;

    return {
      ...this.mapPrismaToModel(lesson),
      exercises: lesson.exercises.map((le) => this.mapLessonExercise(le)),
    };
  }

  async findByModuleId(
    moduleId: string,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<Lesson>> {
    const { filters = {} } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.LESSON,
      'order',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const moduleWhere = { moduleId };
    const experiencePointsWhere = buildRangeFilterWhere(
      filters["experience_points_min"] ? parseInt(filters["experience_points_min"]) : undefined,
      filters["experience_points_max"] ? parseInt(filters["experience_points_max"]) : undefined,
      'experiencePoints'
    );

    const where = combineWhereConditions(
      moduleWhere,
      experiencePointsWhere
    );

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        ...queryParams,
        where,
        include: {
          exercises: {
            include: {
              exercise: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    const mappedLessons = lessons.map((lesson) => ({
      ...this.mapPrismaToModel(lesson),
      exercises: lesson.exercises.map((le) => this.mapLessonExercise(le)),
    }));

    return createPaginationResult(mappedLessons, total, options.page || 1, options.limit || 20);
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Lesson>> {
    const { filters = {} } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.LESSON,
      'created_at',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const moduleWhere = filters["module_id"] ? { moduleId: filters["module_id"] } : {};

    const where = combineWhereConditions(moduleWhere);

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        ...queryParams,
        where,
        include: {
          exercises: {
            include: {
              exercise: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    const mappedLessons = lessons.map((lesson) => ({
      ...this.mapPrismaToModel(lesson),
      exercises: lesson.exercises.map((le) => this.mapLessonExercise(le)),
    }));

    return createPaginationResult(mappedLessons, total, options.page || 1, options.limit || 20);
  }

  async update(id: string, data: Partial<CreateLessonDto>): Promise<Lesson> {
    const updateData: any = {};

    if (data.experience_points !== undefined)
      updateData.experiencePoints = data.experience_points;
    if (data.order !== undefined) updateData.order = data.order;

    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: updateData,
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return {
      ...this.mapPrismaToModel(lesson),
      exercises: lesson.exercises.map((le) => this.mapLessonExercise(le)),
    };
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.lesson.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.lesson.count({
      where: { id },
    });
    return count > 0;
  }

  async assignExercise(
    lessonId: string,
    exerciseId: string,
    order: number,
  ): Promise<LessonExercise> {
    const lessonExercise = await this.prisma.lessonExercise.create({
      data: {
        lessonId,
        exerciseId,
        order,
      },
      include: {
        exercise: true,
      },
    });

    return this.mapLessonExercise(lessonExercise);
  }

  async unassignExercise(
    lessonId: string,
    exerciseId: string,
  ): Promise<boolean> {
    try {
      await this.prisma.lessonExercise.delete({
        where: {
          lessonId_exerciseId: {
            lessonId,
            exerciseId,
          },
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getLessonExercises(lessonId: string): Promise<LessonExercise[]> {
    const lessonExercises = await this.prisma.lessonExercise.findMany({
      where: { lessonId },
      include: {
        exercise: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    return lessonExercises.map((le) => this.mapLessonExercise(le));
  }

  async reorderExercises(
    lessonId: string,
    exerciseIds: string[],
  ): Promise<boolean> {
    try {
      // Use a transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // Update each exercise with its new order
        for (let i = 0; i < exerciseIds.length; i++) {
          const exerciseId = exerciseIds[i];
          if (exerciseId) {
            await tx.lessonExercise.update({
              where: {
                lessonId_exerciseId: {
                  lessonId,
                  exerciseId,
                },
              },
              data: {
                order: i + 1,
              },
            });
          }
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapPrismaToModel(lesson: PrismaLesson): Lesson {
    return {
      id: lesson.id,
      module_id: lesson.moduleId,
      experience_points: lesson.experiencePoints,
      order: lesson.order,
      created_at: lesson.createdAt,
      updated_at: lesson.updatedAt,
    };
  }

  private mapLessonExercise(le: any): LessonExercise {
    const lessonExercise: LessonExercise = {
      lesson_id: le.lessonId,
      exercise_id: le.exerciseId,
      order: le.order,
    };

    if (le.exercise) {
      lessonExercise.exercise = {
        id: le.exercise.id,
        exercise_type: le.exercise.exerciseType.replace("_", "-") as any,
        data: le.exercise.data,
        created_at: le.exercise.createdAt,
        updated_at: le.exercise.updatedAt,
      };
    }

    return lessonExercise;
  }
}
