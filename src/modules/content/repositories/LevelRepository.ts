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