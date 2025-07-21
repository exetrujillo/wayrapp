import { PrismaClient, Course as PrismaCourse } from "@prisma/client";
import { Course, CreateCourseDto } from "../types";
import { PaginatedResult, QueryOptions } from "../../../shared/types";
import {
  buildPrismaQueryParams,
  buildTextSearchWhere,
  buildBooleanFilterWhere,
  combineWhereConditions,
  createPaginationResult,
  COMMON_FIELD_MAPPINGS,
  SORT_FIELDS,
  buildChildCountInclude,
  mapChildCounts
} from "../../../shared/utils/repositoryHelpers";

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
    const { filters = {}, search } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.COURSE,
      'created_at',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const searchWhere = buildTextSearchWhere(search, ['name', 'description']);
    const sourceLanguageWhere = filters["source_language"] 
      ? { sourceLanguage: filters["source_language"] } 
      : {};
    const targetLanguageWhere = filters["target_language"] 
      ? { targetLanguage: filters["target_language"] } 
      : {};
    const isPublicWhere = buildBooleanFilterWhere(filters["is_public"], 'isPublic');

    const where = combineWhereConditions(
      searchWhere,
      sourceLanguageWhere,
      targetLanguageWhere,
      isPublicWhere
    );

    // Build include for child counts
    const include = buildChildCountInclude(['levels']);

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        ...queryParams,
        where,
        include,
      }),
      this.prisma.course.count({ where }),
    ]);

    // Map results with child counts
    const mappedCourses = courses.map((course) => {
      const mapped = this.mapPrismaToModel(course);
      return {
        ...mapped,
        ...mapChildCounts(course, { levels: 'levels_count' })
      };
    });

    return createPaginationResult(mappedCourses, total, options.page || 1, options.limit || 20);
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
