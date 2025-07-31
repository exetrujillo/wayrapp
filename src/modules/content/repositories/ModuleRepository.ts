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

  /**
   * Reorders modules within a section using atomic transaction operations.
   * Updates the order positions of all specified modules to match the provided sequence,
   * ensuring data consistency through database transaction isolation.
   * 
   * This method performs atomic updates of module order values within a single transaction,
   * preventing race conditions and maintaining referential integrity. Each module's order
   * is updated based on its position in the provided module IDs array, starting from 1.
   * 
   * @param {string} sectionId - The unique section identifier containing the modules
   * @param {string[]} moduleIds - Array of module IDs in their new desired order sequence
   * @returns {Promise<boolean>} Promise resolving to true if reordering succeeded, false if failed
   * @throws {Error} When transaction fails or module assignments don't exist
   * 
   * @example
   * // Reorder modules within a section
   * const success = await moduleRepository.reorderModules('section-basic-grammar', [
   *   'module-present-tense',
   *   'module-past-tense', 
   *   'module-future-tense'
   * ]);
   * // Modules are now ordered: present-tense (1), past-tense (2), future-tense (3)
   */
  async reorderModules(
    sectionId: string,
    moduleIds: string[],
  ): Promise<boolean> {
    try {
      // Use a transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // First, set all modules to temporary negative orders to avoid constraint violations
        for (let i = 0; i < moduleIds.length; i++) {
          const moduleId = moduleIds[i];
          if (moduleId) {
            await tx.module.update({
              where: {
                id: moduleId,
                sectionId: sectionId, // Ensure module belongs to the specified section
              },
              data: {
                order: -(i + 1), // Use negative order temporarily
              },
            });
          }
        }

        // Then, update each module with its final positive order
        for (let i = 0; i < moduleIds.length; i++) {
          const moduleId = moduleIds[i];
          if (moduleId) {
            await tx.module.update({
              where: {
                id: moduleId,
                sectionId: sectionId,
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
      console.error('Failed to reorder modules:', error);
      return false;
    }
  }
}
