import { PrismaClient, Prisma } from "@prisma/client";
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
} from "../../../shared/utils/repositoryHelpers";

const courseWithCountsPayload = Prisma.validator<Prisma.CourseDefaultArgs>()({
  include: {
    _count: {
      select: { levels: true },
    },
  },
});

type CourseWithCountsPayload = Prisma.CourseGetPayload<typeof courseWithCountsPayload>;

export class CourseRepository {
  constructor(private prisma: PrismaClient) { }

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

    return {
      id: course.id,
      source_language: course.sourceLanguage,
      target_language: course.targetLanguage,
      name: course.name,
      is_public: course.isPublic,
      created_at: course.createdAt,
      updated_at: course.updatedAt,
      ...(course.description && { description: course.description }),
    };
  }

  async findById(id: string): Promise<(Course & { levels_count: number }) | null> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { levels: true },
        },
      },
    });

    if (!course) return null;

    return this.mapPrismaToModel(course);
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Course & { levels_count: number }>> {
    const { filters = {}, search } = options;
    const queryParams = buildPrismaQueryParams(options, SORT_FIELDS.COURSE, 'created_at', COMMON_FIELD_MAPPINGS);
    const searchWhere = buildTextSearchWhere(search, ['name', 'description']);
    const isPublicWhere = buildBooleanFilterWhere(filters["is_public"], 'isPublic');
    
    const where = combineWhereConditions(searchWhere, isPublicWhere);

    // Debug logging
    console.log('CourseRepository.findAll - Query params:', JSON.stringify(queryParams, null, 2));
    console.log('CourseRepository.findAll - Where clause:', JSON.stringify(where, null, 2));
    console.log('CourseRepository.findAll - Original options:', JSON.stringify(options, null, 2));

    // Let's also check total courses without any filters
    const totalCoursesInDb = await this.prisma.course.count();
    console.log('Total courses in database (no filters):', totalCoursesInDb);

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        ...queryParams,
        where,
        include: {
          _count: {
            select: { levels: true },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    console.log(`Query returned ${courses.length} courses out of ${total} total matching filters`);
    if (courses.length > 0) {
      console.log('First course:', courses[0]);
    }

    const mappedCourses = courses.map((course) => this.mapPrismaToModel(course));

    return createPaginationResult(mappedCourses, total, options.page || 1, options.limit || 20);
  }

  async update(id: string, data: Partial<CreateCourseDto>): Promise<Course & { levels_count: number }> {
    const updateData: Prisma.CourseUpdateInput = {}; // Usar el tipo correcto de Prisma

    if (data.source_language) updateData.sourceLanguage = data.source_language;
    if (data.target_language) updateData.targetLanguage = data.target_language;
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
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

    return this.mapPrismaToModel(course);
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

  private mapPrismaToModel(course: CourseWithCountsPayload): Course & { levels_count: number } {
    return {
      id: course.id,
      source_language: course.sourceLanguage,
      target_language: course.targetLanguage,
      name: course.name,
      is_public: course.isPublic,
      created_at: course.createdAt,
      updated_at: course.updatedAt,
      ...(course.description && { description: course.description }),
      levels_count: course._count.levels,
    };
  }
}