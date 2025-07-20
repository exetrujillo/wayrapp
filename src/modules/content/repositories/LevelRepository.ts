import { PrismaClient, Level as PrismaLevel } from '@prisma/client';
import { Level, CreateLevelDto } from '../types';
import { PaginatedResult, QueryOptions } from '../../../shared/types';

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
    const {
      page = 1,
      limit = 20,
      sortBy = 'order',
      sortOrder = 'asc'
    } = options;

    const skip = (page - 1) * limit;

    const [levels, total] = await Promise.all([
      this.prisma.level.findMany({
        where: { courseId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { sections: true }
          }
        }
      }),
      this.prisma.level.count({ where: { courseId } })
    ]);

    const mappedLevels = levels.map(level => ({
      ...this.mapPrismaToModel(level),
      sections_count: level._count.sections
    }));

    return {
      data: mappedLevels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Level>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    const [levels, total] = await Promise.all([
      this.prisma.level.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { sections: true }
          }
        }
      }),
      this.prisma.level.count()
    ]);

    const mappedLevels = levels.map(level => ({
      ...this.mapPrismaToModel(level),
      sections_count: level._count.sections
    }));

    return {
      data: mappedLevels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
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