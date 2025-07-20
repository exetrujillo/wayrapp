import { PrismaClient, Section as PrismaSection } from '@prisma/client';
import { Section, CreateSectionDto } from '../types';
import { PaginatedResult, QueryOptions } from '../../../shared/types';

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
    const {
      page = 1,
      limit = 20,
      sortBy = 'order',
      sortOrder = 'asc'
    } = options;

    const skip = (page - 1) * limit;

    const [sections, total] = await Promise.all([
      this.prisma.section.findMany({
        where: { levelId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { modules: true }
          }
        }
      }),
      this.prisma.section.count({ where: { levelId } })
    ]);

    const mappedSections = sections.map(section => ({
      ...this.mapPrismaToModel(section),
      modules_count: section._count.modules
    }));

    return {
      data: mappedSections,
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

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Section>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    const [sections, total] = await Promise.all([
      this.prisma.section.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { modules: true }
          }
        }
      }),
      this.prisma.section.count()
    ]);

    const mappedSections = sections.map(section => ({
      ...this.mapPrismaToModel(section),
      modules_count: section._count.modules
    }));

    return {
      data: mappedSections,
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