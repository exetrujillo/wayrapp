import { PrismaClient, Section as PrismaSection } from '@prisma/client';
import { Section, CreateSectionDto } from '../types';
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

export class SectionRepository {
  constructor(private prisma: PrismaClient) { }

  async create(data: CreateSectionDto): Promise<Section> {
    const section = await this.prisma.section.create({
      data: {
        id: data.id,
        levelId: data.level_id,
        name: data.name,
        order: data.order
      }
    });

    return this.mapPrismaToModel(section);
  }

  async findById(id: string): Promise<Section | null> {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        _count: {
          select: { modules: true }
        }
      }
    });

    if (!section) return null;

    return {
      ...this.mapPrismaToModel(section),
      modules_count: section._count.modules
    };
  }

  async findByLevelId(levelId: string, options: QueryOptions = {}): Promise<PaginatedResult<Section>> {
    const { search } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.SECTION,
      'order',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const searchWhere = buildTextSearchWhere(search, ['name']);
    const levelWhere = { levelId };

    const where = combineWhereConditions(
      levelWhere,
      searchWhere
    );

    // Build include for child counts
    const include = buildChildCountInclude(['modules']);

    const [sections, total] = await Promise.all([
      this.prisma.section.findMany({
        ...queryParams,
        where,
        include,
      }),
      this.prisma.section.count({ where })
    ]);

    // Map results with child counts
    const mappedSections = sections.map((section) => {
      const mapped = this.mapPrismaToModel(section);
      return {
        ...mapped,
        ...mapChildCounts(section, { modules: 'modules_count' })
      };
    });

    return createPaginationResult(mappedSections, total, options.page || 1, options.limit || 20);
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Section>> {
    const { filters = {}, search } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.SECTION,
      'created_at',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const searchWhere = buildTextSearchWhere(search, ['name']);
    const levelWhere = filters['level_id'] ? { levelId: filters['level_id'] } : {};

    const where = combineWhereConditions(
      searchWhere,
      levelWhere
    );

    // Build include for child counts
    const include = buildChildCountInclude(['modules']);

    const [sections, total] = await Promise.all([
      this.prisma.section.findMany({
        ...queryParams,
        where,
        include,
      }),
      this.prisma.section.count({ where })
    ]);

    // Map results with child counts
    const mappedSections = sections.map((section) => {
      const mapped = this.mapPrismaToModel(section);
      return {
        ...mapped,
        ...mapChildCounts(section, { modules: 'modules_count' })
      };
    });

    return createPaginationResult(mappedSections, total, options.page || 1, options.limit || 20);
  }

  async update(id: string, data: Partial<Omit<CreateSectionDto, 'id' | 'level_id'>>): Promise<Section> {
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.order !== undefined) updateData.order = data.order;

    const section = await this.prisma.section.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { modules: true }
        }
      }
    });

    return {
      ...this.mapPrismaToModel(section),
      modules_count: section._count.modules
    };
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.section.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.section.count({
      where: { id }
    });
    return count > 0;
  }

  async existsOrderInLevel(levelId: string, order: number, excludeId?: string): Promise<boolean> {
    const where: any = { levelId, order };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.section.count({ where });
    return count > 0;
  }

  /**
   * Reorders sections within a level using atomic transaction operations.
   * Updates the order positions of all specified sections to match the provided sequence,
   * ensuring data consistency through database transaction isolation.
   * 
   * @param {string} levelId - The unique identifier of the level containing the sections
   * @param {string[]} sectionIds - Array of section IDs in their new desired order
   * @returns {Promise<boolean>} True if reordering was successful, false otherwise
   * @throws {Error} When database transaction fails or constraint violations occur
   * 
   * @example
   * // Reorder sections within a level
   * const success = await sectionRepository.reorderSections('level-basic-grammar', [
   *   'section-present-tense',
   *   'section-past-tense', 
   *   'section-future-tense'
   * ]);
   * // Sections are now ordered: present-tense (1), past-tense (2), future-tense (3)
   */
  async reorderSections(
    levelId: string, // Used for validation in service layer
    sectionIds: string[],
  ): Promise<boolean> {
    try {
      // Use a transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // Validate that all sections belong to the specified level
        for (const sectionId of sectionIds) {
          const section = await tx.section.findUnique({
            where: { id: sectionId },
            select: { levelId: true }
          });

          if (!section || section.levelId !== levelId) {
            throw new Error(`Section ${sectionId} does not belong to level ${levelId}`);
          }
        }

        // First, set all sections to temporary negative orders to avoid constraint violations
        for (let i = 0; i < sectionIds.length; i++) {
          const sectionId = sectionIds[i];
          if (sectionId) {
            await tx.section.update({
              where: {
                id: sectionId,
              },
              data: {
                order: -(i + 1), // Use negative order temporarily
              },
            });
          }
        }

        // Then, update each section with its final positive order
        for (let i = 0; i < sectionIds.length; i++) {
          const sectionId = sectionIds[i];
          if (sectionId) {
            await tx.section.update({
              where: {
                id: sectionId,
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
      console.error('Failed to reorder sections:', error);
      return false;
    }
  }

  private mapPrismaToModel(section: PrismaSection): Section {
    return {
      id: section.id,
      level_id: section.levelId,
      name: section.name,
      order: section.order,
      created_at: section.createdAt,
      updated_at: section.updatedAt
    };
  }
}