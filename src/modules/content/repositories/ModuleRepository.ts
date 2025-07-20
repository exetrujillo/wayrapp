import { PrismaClient, Module as PrismaModule } from "@prisma/client";
import { Module, CreateModuleDto } from "../types";
import { PaginatedResult, QueryOptions } from "../../../shared/types";

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
    const {
      page = 1,
      limit = 20,
      sortBy = "order",
      sortOrder = "asc",
      filters = {},
    } = options;

    const skip = (page - 1) * limit;

    const where: any = { sectionId };

    if (filters["module_type"]) {
      where.moduleType = filters["module_type"];
    }

    const [modules, total] = await Promise.all([
      this.prisma.module.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { lessons: true },
          },
        },
      }),
      this.prisma.module.count({ where }),
    ]);

    const mappedModules = modules.map((module) => ({
      ...this.mapPrismaToModel(module),
      lessons_count: module._count.lessons,
    }));

    return {
      data: mappedModules,
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

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Module>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
      filters = {},
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters["module_type"]) {
      where.moduleType = filters["module_type"];
    }

    const [modules, total] = await Promise.all([
      this.prisma.module.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { lessons: true },
          },
        },
      }),
      this.prisma.module.count({ where }),
    ]);

    const mappedModules = modules.map((module) => ({
      ...this.mapPrismaToModel(module),
      lessons_count: module._count.lessons,
    }));

    return {
      data: mappedModules,
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
