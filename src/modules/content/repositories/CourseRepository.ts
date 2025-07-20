import { PrismaClient, Course as PrismaCourse } from "@prisma/client";
import { Course, CreateCourseDto } from "../types";
import { PaginatedResult, QueryOptions } from "../../../shared/types";

export class CourseRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateCourseDto): Promise<Course> {
    const course = await this.prisma.course.create({
      data: {
        id: data.id,
        sourceLanguage: data.source_language,
        targetLanguage: data.target_language,
        name: data.name,
        ...(data.description && { description: data.description }),
        isPublic: data.is_public ?? true,
      },
    });

    return this.mapPrismaToModel(course);
  }

  async findById(id: string): Promise<Course | null> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { levels: true },
        },
      },
    });

    if (!course) return null;

    return {
      ...this.mapPrismaToModel(course),
      levels_count: course._count.levels,
    };
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Course>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
      filters = {},
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters["source_language"]) {
      where.sourceLanguage = filters["source_language"];
    }

    if (filters["target_language"]) {
      where.targetLanguage = filters["target_language"];
    }

    if (filters["is_public"] !== undefined) {
      where.isPublic = filters["is_public"];
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { levels: true },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    const mappedCourses = courses.map((course) => ({
      ...this.mapPrismaToModel(course),
      levels_count: course._count.levels,
    }));

    return {
      data: mappedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async update(id: string, data: Partial<CreateCourseDto>): Promise<Course> {
    const updateData: any = {};

    if (data.source_language) updateData.sourceLanguage = data.source_language;
    if (data.target_language) updateData.targetLanguage = data.target_language;
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.is_public !== undefined) updateData.isPublic = data.is_public;

    const course = await this.prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { levels: true },
        },
      },
    });

    return {
      ...this.mapPrismaToModel(course),
      levels_count: course._count.levels,
    };
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.course.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.course.count({
      where: { id },
    });
    return count > 0;
  }

  private mapPrismaToModel(course: PrismaCourse): Course {
    return {
      id: course.id,
      source_language: course.sourceLanguage,
      target_language: course.targetLanguage,
      name: course.name,
      ...(course.description && { description: course.description }),
      is_public: course.isPublic,
      created_at: course.createdAt,
      updated_at: course.updatedAt,
    };
  }
}
