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
  constructor(private prisma: PrismaClient) {}

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