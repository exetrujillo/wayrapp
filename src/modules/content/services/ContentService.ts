import { PrismaClient } from '@prisma/client';
import { 
  CourseRepository, 
  LevelRepository, 
  SectionRepository, 
  ModuleRepository 
} from '../repositories';
import { 
  Course, 
  Level, 
  Section, 
  Module,
  CreateCourseDto,
  CreateLevelDto,
  CreateSectionDto,
  CreateModuleDto,
  PackagedCourse
} from '../types';
import { PaginatedResult, QueryOptions } from '../../../shared/types';
// import { ErrorCodes } from '../../../shared/types';

export class ContentService {
  private courseRepository: CourseRepository;
  private levelRepository: LevelRepository;
  private sectionRepository: SectionRepository;
  private moduleRepository: ModuleRepository;

  constructor(private prisma: PrismaClient) {
    this.courseRepository = new CourseRepository(prisma);
    this.levelRepository = new LevelRepository(prisma);
    this.sectionRepository = new SectionRepository(prisma);
    this.moduleRepository = new ModuleRepository(prisma);
  }

  // Course operations
  async createCourse(data: CreateCourseDto): Promise<Course> {
    // Check if course with same ID already exists
    const existingCourse = await this.courseRepository.exists(data.id);
    if (existingCourse) {
      throw new Error(`Course with ID '${data.id}' already exists`);
    }

    return await this.courseRepository.create(data);
  }

  async getCourse(id: string): Promise<Course> {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new Error(`Course with ID '${id}' not found`);
    }
    return course;
  }

  async getCourses(options: QueryOptions = {}): Promise<PaginatedResult<Course>> {
    return await this.courseRepository.findAll(options);
  }

  async updateCourse(id: string, data: Partial<CreateCourseDto>): Promise<Course> {
    // Check if course exists
    const existingCourse = await this.courseRepository.exists(id);
    if (!existingCourse) {
      throw new Error(`Course with ID '${id}' not found`);
    }

    return await this.courseRepository.update(id, data);
  }

  async deleteCourse(id: string): Promise<void> {
    const existingCourse = await this.courseRepository.exists(id);
    if (!existingCourse) {
      throw new Error(`Course with ID '${id}' not found`);
    }

    const success = await this.courseRepository.delete(id);
    if (!success) {
      throw new Error(`Failed to delete course with ID '${id}'`);
    }
  }

  // Level operations
  async createLevel(data: CreateLevelDto): Promise<Level> {
    // Check if parent course exists
    const courseExists = await this.courseRepository.exists(data.course_id);
    if (!courseExists) {
      throw new Error(`Course with ID '${data.course_id}' not found`);
    }

    // Check if level with same ID already exists
    const existingLevel = await this.levelRepository.exists(data.id);
    if (existingLevel) {
      throw new Error(`Level with ID '${data.id}' already exists`);
    }

    // Check if level code already exists in the course
    const codeExists = await this.levelRepository.existsInCourse(data.course_id, data.code);
    if (codeExists) {
      throw new Error(`Level with code '${data.code}' already exists in course '${data.course_id}'`);
    }

    // Check if order already exists in the course
    const orderExists = await this.levelRepository.existsOrderInCourse(data.course_id, data.order);
    if (orderExists) {
      throw new Error(`Level with order '${data.order}' already exists in course '${data.course_id}'`);
    }

    return await this.levelRepository.create(data);
  }

  async getLevel(id: string): Promise<Level> {
    const level = await this.levelRepository.findById(id);
    if (!level) {
      throw new Error(`Level with ID '${id}' not found`);
    }
    return level;
  }

  async getLevelsByCourse(courseId: string, options: QueryOptions = {}): Promise<PaginatedResult<Level>> {
    // Check if course exists
    const courseExists = await this.courseRepository.exists(courseId);
    if (!courseExists) {
      throw new Error(`Course with ID '${courseId}' not found`);
    }

    return await this.levelRepository.findByCourseId(courseId, options);
  }

  async updateLevel(id: string, data: Partial<Omit<CreateLevelDto, 'id' | 'course_id'>>): Promise<Level> {
    // Check if level exists
    const existingLevel = await this.levelRepository.findById(id);
    if (!existingLevel) {
      throw new Error(`Level with ID '${id}' not found`);
    }

    // Check if new code conflicts with existing levels in the same course
    if (data.code) {
      const codeExists = await this.levelRepository.existsInCourse(existingLevel.course_id, data.code, id);
      if (codeExists) {
        throw new Error(`Level with code '${data.code}' already exists in course '${existingLevel.course_id}'`);
      }
    }

    // Check if new order conflicts with existing levels in the same course
    if (data.order !== undefined) {
      const orderExists = await this.levelRepository.existsOrderInCourse(existingLevel.course_id, data.order, id);
      if (orderExists) {
        throw new Error(`Level with order '${data.order}' already exists in course '${existingLevel.course_id}'`);
      }
    }

    return await this.levelRepository.update(id, data);
  }

  async deleteLevel(id: string): Promise<void> {
    const existingLevel = await this.levelRepository.exists(id);
    if (!existingLevel) {
      throw new Error(`Level with ID '${id}' not found`);
    }

    const success = await this.levelRepository.delete(id);
    if (!success) {
      throw new Error(`Failed to delete level with ID '${id}'`);
    }
  }

  // Section operations
  async createSection(data: CreateSectionDto): Promise<Section> {
    // Check if parent level exists
    const levelExists = await this.levelRepository.exists(data.level_id);
    if (!levelExists) {
      throw new Error(`Level with ID '${data.level_id}' not found`);
    }

    // Check if section with same ID already exists
    const existingSection = await this.sectionRepository.exists(data.id);
    if (existingSection) {
      throw new Error(`Section with ID '${data.id}' already exists`);
    }

    // Check if order already exists in the level
    const orderExists = await this.sectionRepository.existsOrderInLevel(data.level_id, data.order);
    if (orderExists) {
      throw new Error(`Section with order '${data.order}' already exists in level '${data.level_id}'`);
    }

    return await this.sectionRepository.create(data);
  }

  async getSection(id: string): Promise<Section> {
    const section = await this.sectionRepository.findById(id);
    if (!section) {
      throw new Error(`Section with ID '${id}' not found`);
    }
    return section;
  }

  async getSectionsByLevel(levelId: string, options: QueryOptions = {}): Promise<PaginatedResult<Section>> {
    // Check if level exists
    const levelExists = await this.levelRepository.exists(levelId);
    if (!levelExists) {
      throw new Error(`Level with ID '${levelId}' not found`);
    }

    return await this.sectionRepository.findByLevelId(levelId, options);
  }

  async updateSection(id: string, data: Partial<Omit<CreateSectionDto, 'id' | 'level_id'>>): Promise<Section> {
    // Check if section exists
    const existingSection = await this.sectionRepository.findById(id);
    if (!existingSection) {
      throw new Error(`Section with ID '${id}' not found`);
    }

    // Check if new order conflicts with existing sections in the same level
    if (data.order !== undefined) {
      const orderExists = await this.sectionRepository.existsOrderInLevel(existingSection.level_id, data.order, id);
      if (orderExists) {
        throw new Error(`Section with order '${data.order}' already exists in level '${existingSection.level_id}'`);
      }
    }

    return await this.sectionRepository.update(id, data);
  }

  async deleteSection(id: string): Promise<void> {
    const existingSection = await this.sectionRepository.exists(id);
    if (!existingSection) {
      throw new Error(`Section with ID '${id}' not found`);
    }

    const success = await this.sectionRepository.delete(id);
    if (!success) {
      throw new Error(`Failed to delete section with ID '${id}'`);
    }
  }

  // Module operations
  async createModule(data: CreateModuleDto): Promise<Module> {
    // Check if parent section exists
    const sectionExists = await this.sectionRepository.exists(data.section_id);
    if (!sectionExists) {
      throw new Error(`Section with ID '${data.section_id}' not found`);
    }

    // Check if module with same ID already exists
    const existingModule = await this.moduleRepository.exists(data.id);
    if (existingModule) {
      throw new Error(`Module with ID '${data.id}' already exists`);
    }

    // Check if order already exists in the section
    const orderExists = await this.moduleRepository.existsOrderInSection(data.section_id, data.order);
    if (orderExists) {
      throw new Error(`Module with order '${data.order}' already exists in section '${data.section_id}'`);
    }

    return await this.moduleRepository.create(data);
  }

  async getModule(id: string): Promise<Module> {
    const module = await this.moduleRepository.findById(id);
    if (!module) {
      throw new Error(`Module with ID '${id}' not found`);
    }
    return module;
  }

  async getModulesBySection(sectionId: string, options: QueryOptions = {}): Promise<PaginatedResult<Module>> {
    // Check if section exists
    const sectionExists = await this.sectionRepository.exists(sectionId);
    if (!sectionExists) {
      throw new Error(`Section with ID '${sectionId}' not found`);
    }

    return await this.moduleRepository.findBySectionId(sectionId, options);
  }

  async updateModule(id: string, data: Partial<Omit<CreateModuleDto, 'id' | 'section_id'>>): Promise<Module> {
    // Check if module exists
    const existingModule = await this.moduleRepository.findById(id);
    if (!existingModule) {
      throw new Error(`Module with ID '${id}' not found`);
    }

    // Check if new order conflicts with existing modules in the same section
    if (data.order !== undefined) {
      const orderExists = await this.moduleRepository.existsOrderInSection(existingModule.section_id, data.order, id);
      if (orderExists) {
        throw new Error(`Module with order '${data.order}' already exists in section '${existingModule.section_id}'`);
      }
    }

    return await this.moduleRepository.update(id, data);
  }

  async deleteModule(id: string): Promise<void> {
    const existingModule = await this.moduleRepository.exists(id);
    if (!existingModule) {
      throw new Error(`Module with ID '${id}' not found`);
    }

    const success = await this.moduleRepository.delete(id);
    if (!success) {
      throw new Error(`Failed to delete module with ID '${id}'`);
    }
  }

  // Packaged content for offline support
  async getPackagedCourse(courseId: string): Promise<PackagedCourse> {
    // const course = await this.getCourse(courseId);
    
    // Get all levels with their nested content
    const packagedCourse = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        levels: {
          orderBy: { order: 'asc' },
          include: {
            sections: {
              orderBy: { order: 'asc' },
              include: {
                modules: {
                  orderBy: { order: 'asc' },
                  include: {
                    lessons: {
                      orderBy: { order: 'asc' },
                      include: {
                        exercises: {
                          orderBy: { order: 'asc' },
                          include: {
                            exercise: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!packagedCourse) {
      throw new Error(`Course with ID '${courseId}' not found`);
    }

    // Transform the data to match the PackagedCourse interface
    const result: PackagedCourse = {
      course: {
        id: packagedCourse.id,
        source_language: packagedCourse.sourceLanguage,
        target_language: packagedCourse.targetLanguage,
        name: packagedCourse.name,
        description: packagedCourse.description ?? '',
        is_public: packagedCourse.isPublic,
        created_at: packagedCourse.createdAt,
        updated_at: packagedCourse.updatedAt
      },
      levels: packagedCourse.levels.map(level => ({
        id: level.id,
        course_id: level.courseId,
        code: level.code,
        name: level.name,
        order: level.order,
        created_at: level.createdAt,
        updated_at: level.updatedAt,
        sections: level.sections.map(section => ({
          id: section.id,
          level_id: section.levelId,
          name: section.name,
          order: section.order,
          created_at: section.createdAt,
          updated_at: section.updatedAt,
          modules: section.modules.map(module => ({
            id: module.id,
            section_id: module.sectionId,
            module_type: module.moduleType as 'informative' | 'basic_lesson' | 'reading' | 'dialogue' | 'exam',
            name: module.name,
            order: module.order,
            created_at: module.createdAt,
            updated_at: module.updatedAt,
            lessons: module.lessons.map(lesson => ({
              id: lesson.id,
              module_id: lesson.moduleId,
              experience_points: lesson.experiencePoints,
              order: lesson.order,
              created_at: lesson.createdAt,
              updated_at: lesson.updatedAt,
              exercises: lesson.exercises.map(lessonExercise => ({
                lesson_id: lessonExercise.lessonId,
                exercise_id: lessonExercise.exerciseId,
                order: lessonExercise.order,
                exercise: {
                  id: lessonExercise.exercise.id,
                  exercise_type: lessonExercise.exercise.exerciseType as 'translation' | 'fill-in-the-blank' | 'vof' | 'pairs' | 'informative' | 'ordering',
                  data: lessonExercise.exercise.data,
                  created_at: lessonExercise.exercise.createdAt,
                  updated_at: lessonExercise.exercise.updatedAt
                }
              }))
            }))
          }))
        }))
      })),
      package_version: packagedCourse.updatedAt.toISOString()
    };

    return result;
  }
}