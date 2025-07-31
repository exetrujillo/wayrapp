import { PrismaClient, Level as PrismaLevel } from '@prisma/client';
import { Level, CreateLevelDto } from '../types';
import { PaginatedResult, QueryOptions } from '../../../shared/types';
import {
  buildPrismaQueryParams,
  buildTextSearchWhere,
  combineWhereConditions,
  createPaginationResult,
  COMMON_FIELD_MAPPINGS,
  SORT_FIELDS,
  buildChildCountInclude,
  mapChildCounts
} from '../../../shared/utils/repositoryHelpers';

export class LevelRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateLevelDto): Promise<Level> {
    const level = await this.prisma.level.create({
      data: {
        id: data.id,
        courseId: data.course_id,
        code: data.code,
        name: data.name,
        order: data.order
      }
    });

    return this.mapPrismaToModel(level);
  }

  async findById(id: string): Promise<Level | null> {
    const level = await this.prisma.level.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sections: true }
        }
      }
    });

    if (!level) return null;

    return {
      ...this.mapPrismaToModel(level),
      sections_count: level._count.sections
    };
  }

  async findByCourseId(courseId: string, options: QueryOptions = {}): Promise<PaginatedResult<Level>> {
    const { filters = {}, search } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.LEVEL,
      'order',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const searchWhere = buildTextSearchWhere(search, ['name', 'code']);
    const courseWhere = { courseId };
    const codeWhere = filters['code'] ? { code: filters['code'] } : {};

    const where = combineWhereConditions(
      courseWhere,
      searchWhere,
      codeWhere
    );

    // Build include for child counts
    const include = buildChildCountInclude(['sections']);

    const [levels, total] = await Promise.all([
      this.prisma.level.findMany({
        ...queryParams,
        where,
        include,
      }),
      this.prisma.level.count({ where })
    ]);

    // Map results with child counts
    const mappedLevels = levels.map((level) => {
      const mapped = this.mapPrismaToModel(level);
      return {
        ...mapped,
        ...mapChildCounts(level, { sections: 'sections_count' })
      };
    });

    return createPaginationResult(mappedLevels, total, options.page || 1, options.limit || 20);
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Level>> {
    const { filters = {}, search } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.LEVEL,
      'created_at',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const searchWhere = buildTextSearchWhere(search, ['name', 'code']);
    const courseWhere = filters['course_id'] ? { courseId: filters['course_id'] } : {};
    const codeWhere = filters['code'] ? { code: filters['code'] } : {};

    const where = combineWhereConditions(
      searchWhere,
      courseWhere,
      codeWhere
    );

    // Build include for child counts
    const include = buildChildCountInclude(['sections']);

    const [levels, total] = await Promise.all([
      this.prisma.level.findMany({
        ...queryParams,
        where,
        include,
      }),
      this.prisma.level.count({ where })
    ]);

    // Map results with child counts
    const mappedLevels = levels.map((level) => {
      const mapped = this.mapPrismaToModel(level);
      return {
        ...mapped,
        ...mapChildCounts(level, { sections: 'sections_count' })
      };
    });

    return createPaginationResult(mappedLevels, total, options.page || 1, options.limit || 20);
  }

  async update(id: string, data: Partial<Omit<CreateLevelDto, 'id' | 'course_id'>>): Promise<Level> {
    const updateData: any = {};
    
    if (data.code) updateData.code = data.code;
    if (data.name) updateData.name = data.name;
    if (data.order !== undefined) updateData.order = data.order;

    const level = await this.prisma.level.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { sections: true }
        }
      }
    });

    return {
      ...this.mapPrismaToModel(level),
      sections_count: level._count.sections
    };
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.level.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.level.count({
      where: { id }
    });
    return count > 0;
  }

  async existsInCourse(courseId: string, code: string, excludeId?: string): Promise<boolean> {
    const where: any = { courseId, code };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.level.count({ where });
    return count > 0;
  }

  async existsOrderInCourse(courseId: string, order: number, excludeId?: string): Promise<boolean> {
    const where: any = { courseId, order };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.level.count({ where });
    return count > 0;
  }

  /**
   * Reorders levels within a course using atomic transaction operations.
   * Updates the order positions of all specified levels to match the provided sequence,
   * ensuring data consistency through database transaction isolation.
   * 
   * @param {string} courseId - The unique identifier of the course containing the levels
   * @param {string[]} levelIds - Array of level IDs in their new desired order
   * @returns {Promise<boolean>} True if reordering was successful, false otherwise
   * @throws {Error} When database transaction fails or constraint violations occur
   * 
   * @example
   * // Reorder levels within a course
   * const success = await levelRepository.reorderLevels('course-spanish-101', [
   *   'level-beginner',
   *   'level-intermediate', 
   *   'level-advanced'
   * ]);
   * // Levels are now ordered: beginner (1), intermediate (2), advanced (3)
   */
  async reorderLevels(
    courseId: string, // Used for validation in service layer
    levelIds: string[],
  ): Promise<boolean> {
    try {
      // Use a transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // Validate that all levels belong to the specified course
        for (const levelId of levelIds) {
          const level = await tx.level.findUnique({
            where: { id: levelId },
            select: { courseId: true }
          });
          
          if (!level || level.courseId !== courseId) {
            throw new Error(`Level ${levelId} does not belong to course ${courseId}`);
          }
        }

        // First, set all levels to temporary negative orders to avoid constraint violations
        for (let i = 0; i < levelIds.length; i++) {
          const levelId = levelIds[i];
          if (levelId) {
            await tx.level.update({
              where: {
                id: levelId,
              },
              data: {
                order: -(i + 1), // Use negative order temporarily
              },
            });
          }
        }

        // Then, update each level with its final positive order
        for (let i = 0; i < levelIds.length; i++) {
          const levelId = levelIds[i];
          if (levelId) {
            await tx.level.update({
              where: {
                id: levelId,
              },
              data: {
                order: i + 1, // Final positive order
              },
            });
          }
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to reorder levels:', error);
      return false;
    }
  }

  private mapPrismaToModel(level: PrismaLevel): Level {
    return {
      id: level.id,
      course_id: level.courseId,
      code: level.code,
      name: level.name,
      order: level.order,
      created_at: level.createdAt,
      updated_at: level.updatedAt
    };
  }
}