import { PrismaClient, Exercise as PrismaExercise } from "@prisma/client";
import { Exercise, CreateExerciseDto } from "../types";
import { PaginatedResult, QueryOptions } from "../../../shared/types";
import {
  buildPrismaQueryParams,
  buildEnumFilterWhere,
  combineWhereConditions,
  createPaginationResult,
  COMMON_FIELD_MAPPINGS,
  SORT_FIELDS
} from "../../../shared/utils/repositoryHelpers";

export class ExerciseRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateExerciseDto): Promise<Exercise> {
    const exercise = await this.prisma.exercise.create({
      data: {
        id: data.id,
        exerciseType: data.exercise_type.replace('-', '_') as any,
        data: data.data,
      },
    });

    return this.mapPrismaToModel(exercise);
  }

  async findById(id: string): Promise<Exercise | null> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) return null;

    return this.mapPrismaToModel(exercise);
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Exercise>> {
    const { filters = {} } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.EXERCISE,
      'created_at',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const exerciseTypeWhere = filters["exercise_type"] 
      ? buildEnumFilterWhere(filters["exercise_type"].replace('-', '_'), 'exerciseType')
      : {};

    const where = combineWhereConditions(exerciseTypeWhere);

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        ...queryParams,
        where,
      }),
      this.prisma.exercise.count({ where }),
    ]);

    const mappedExercises = exercises.map((exercise) => 
      this.mapPrismaToModel(exercise)
    );

    return createPaginationResult(mappedExercises, total, options.page || 1, options.limit || 20);
  }

  async update(id: string, data: Partial<CreateExerciseDto>): Promise<Exercise> {
    const updateData: any = {};

    if (data.exercise_type) updateData.exerciseType = data.exercise_type.replace('-', '_') as any;
    if (data.data !== undefined) updateData.data = data.data;

    const exercise = await this.prisma.exercise.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaToModel(exercise);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.exercise.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.exercise.count({
      where: { id },
    });
    return count > 0;
  }

  async findByType(exerciseType: string, options: QueryOptions = {}): Promise<PaginatedResult<Exercise>> {
    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.EXERCISE,
      'created_at',
      COMMON_FIELD_MAPPINGS
    );

    const prismaExerciseType = exerciseType.replace('-', '_') as any;
    const where = { exerciseType: prismaExerciseType };

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        ...queryParams,
        where,
      }),
      this.prisma.exercise.count({ where }),
    ]);

    const mappedExercises = exercises.map((exercise) => 
      this.mapPrismaToModel(exercise)
    );

    return createPaginationResult(mappedExercises, total, options.page || 1, options.limit || 20);
  }

  async findByIds(ids: string[]): Promise<Exercise[]> {
    const exercises = await this.prisma.exercise.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return exercises.map((exercise) => this.mapPrismaToModel(exercise));
  }

  private mapPrismaToModel(exercise: PrismaExercise): Exercise {
    return {
      id: exercise.id,
      exercise_type: exercise.exerciseType.replace('_', '-') as any,
      data: exercise.data,
      created_at: exercise.createdAt,
      updated_at: exercise.updatedAt,
    };
  }
}