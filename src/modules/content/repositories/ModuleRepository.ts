import { PrismaClient, Module as PrismaModule } from "@prisma/client";
import { Module, CreateModuleDto } from "../types";
import { PaginatedResult, QueryOptions } from "../../../shared/types";
import {
  buildPrismaQueryParams,
  buildTextSearchWhere,
  buildEnumFilterWhere,
  combineWhereConditions,
  createPaginationResult,
  COMMON_FIELD_MAPPINGS,
  SORT_FIELDS,
  buildChildCountInclude,
  mapChildCounts
} from "../../../shared/utils/repositoryHelpers";

export class ModuleRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateModuleDto): Promise<Module> {
    const module = await this.prisma.module.create({
      data: {
        id: data.id,
        sectionId: data.section_id,
        moduleType: data.module_type,
        name: data.name,
        order: data.order,
      },
    });

    return this.mapPrismaToModel(module);
  }

  async findById(id: string): Promise<Module | null> {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    if (!module) return null;

    return {
      ...this.mapPrismaToModel(module),
      lessons_count: module._count.lessons,
    };
  }

  async findBySectionId(
    sectionId: string,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<Module>> {
    const { filters = {}, search } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.MODULE,
      'order',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const searchWhere = buildTextSearchWhere(search, ['name']);
    const sectionWhere = { sectionId };
    const moduleTypeWhere = buildEnumFilterWhere(filters["module_type"], 'moduleType');

    const where = combineWhereConditions(
      sectionWhere,
      searchWhere,
      moduleTypeWhere
    );

    // Build include for child counts
    const include = buildChildCountInclude(['lessons']);

    const [modules, total] = await Promise.all([
      this.prisma.module.findMany({
        ...queryParams,
        where,
        include,
      }),
      this.prisma.module.count({ where }),
    ]);

    // Map results with child counts
    const mappedModules = modules.map((module) => {
      const mapped = this.mapPrismaToModel(module);
      return {
        ...mapped,
        ...mapChildCounts(module, { lessons: 'lessons_count' })
      };
    });

    return createPaginationResult(mappedModules, total, options.page || 1, options.limit || 20);
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Module>> {
    const { filters = {}, search } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.MODULE,
      'created_at',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const searchWhere = buildTextSearchWhere(search, ['name']);
    const moduleTypeWhere = buildEnumFilterWhere(filters["module_type"], 'moduleType');
    const sectionWhere = filters["section_id"] ? { sectionId: filters["section_id"] } : {};

    const where = combineWhereConditions(
      searchWhere,
      moduleTypeWhere,
      sectionWhere
    );

    // Build include for child counts
    const include = buildChildCountInclude(['lessons']);

    const [modules, total] = await Promise.all([
      this.prisma.module.findMany({
        ...queryParams,
        where,
        include,
      }),
      this.prisma.module.count({ where }),
    ]);

    // Map results with child counts
    const mappedModules = modules.map((module) => {
      const mapped = this.mapPrismaToModel(module);
      return {
        ...mapped,
        ...mapChildCounts(module, { lessons: 'lessons_count' })
      };
    });

    return createPaginationResult(mappedModules, total, options.page || 1, options.limit || 20);
  }

  async update(
    id: string,
    data: Partial<Omit<CreateModuleDto, "id" | "section_id">>,
  ): Promise<Module> {
    const updateData: any = {};

    if (data.module_type) updateData.moduleType = data.module_type;
    if (data.name) updateData.name = data.name;
    if (data.order !== undefined) updateData.order = data.order;

    const module = await this.prisma.module.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    return {
      ...this.mapPrismaToModel(module),
      lessons_count: module._count.lessons,
    };
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.module.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.module.count({
      where: { id },
    });
    return count > 0;
  }

  async existsOrderInSection(
    sectionId: string,
    order: number,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = { sectionId, order };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.module.count({ where });
    return count > 0;
  }

  async existsLessonOrderInModule(
    moduleId: string,
    order: number,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = { moduleId, order };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.lesson.count({ where });
    return count > 0;
  }

  private mapPrismaToModel(module: PrismaModule): Module {
    return {
      id: module.id,
      section_id: module.sectionId,
      module_type: module.moduleType as
        | "informative"
        | "basic_lesson"
        | "reading"
        | "dialogue"
        | "exam",
      name: module.name,
      order: module.order,
      created_at: module.createdAt,
      updated_at: module.updatedAt,
    };
  }
}
