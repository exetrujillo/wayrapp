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
import { cacheService, CACHE_KEYS, logger } from '../../../shared/utils';
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
    console.log('--- getCourses Service ---');
    console.log('Fetching courses with options:', JSON.stringify(options, null, 2));
    
    const result = await this.courseRepository.findAll(options);
    
    console.log(`Repository returned ${result.data.length} courses`);
    console.log('First course (if any):', result.data[0]);
    console.log('Pagination info:', result.pagination);
    
    return result;
  }

  async updateCourse(id: string, data: Partial<CreateCourseDto>): Promise<Course> {
    // Check if course exists
    const existingCourse = await this.courseRepository.exists(id);
    if (!existingCourse) {
      throw new Error(`Course with ID '${id}' not found`);
    }

    const result = await this.courseRepository.update(id, data);
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(id);
    
    return result;
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
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(id);
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

    const result = await this.levelRepository.create(data);
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(data.course_id);
    
    return result;
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

    const result = await this.levelRepository.update(id, data);
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(existingLevel.course_id);
    
    return result;
  }

  async deleteLevel(id: string): Promise<void> {
    // Get the level to find the course ID for cache invalidation
    const existingLevel = await this.levelRepository.findById(id);
    if (!existingLevel) {
      throw new Error(`Level with ID '${id}' not found`);
    }

    const success = await this.levelRepository.delete(id);
    if (!success) {
      throw new Error(`Failed to delete level with ID '${id}'`);
    }
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(existingLevel.course_id);
  }

  // Section operations
  async createSection(data: CreateSectionDto): Promise<Section> {
    // Check if parent level exists
    const level = await this.levelRepository.findById(data.level_id);
    if (!level) {
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

    const result = await this.sectionRepository.create(data);
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);
    
    return result;
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

    // Get the level to find the course ID for cache invalidation
    const level = await this.levelRepository.findById(existingSection.level_id);
    if (!level) {
      throw new Error(`Level with ID '${existingSection.level_id}' not found`);
    }

    // Check if new order conflicts with existing sections in the same level
    if (data.order !== undefined) {
      const orderExists = await this.sectionRepository.existsOrderInLevel(existingSection.level_id, data.order, id);
      if (orderExists) {
        throw new Error(`Section with order '${data.order}' already exists in level '${existingSection.level_id}'`);
      }
    }

    const result = await this.sectionRepository.update(id, data);
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);
    
    return result;
  }

  async deleteSection(id: string): Promise<void> {
    // Get the section to find the level and course ID for cache invalidation
    const existingSection = await this.sectionRepository.findById(id);
    if (!existingSection) {
      throw new Error(`Section with ID '${id}' not found`);
    }

    // Get the level to find the course ID for cache invalidation
    const level = await this.levelRepository.findById(existingSection.level_id);
    if (!level) {
      throw new Error(`Level with ID '${existingSection.level_id}' not found`);
    }

    const success = await this.sectionRepository.delete(id);
    if (!success) {
      throw new Error(`Failed to delete section with ID '${id}'`);
    }
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);
  }

  // Module operations
  async createModule(data: CreateModuleDto): Promise<Module> {
    // Check if parent section exists and get its level info for cache invalidation
    const section = await this.sectionRepository.findById(data.section_id);
    if (!section) {
      throw new Error(`Section with ID '${data.section_id}' not found`);
    }

    // Get the level to find the course ID for cache invalidation
    const level = await this.levelRepository.findById(section.level_id);
    if (!level) {
      throw new Error(`Level with ID '${section.level_id}' not found`);
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

    const result = await this.moduleRepository.create(data);
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);
    
    return result;
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

    // Get the section and level to find the course ID for cache invalidation
    const section = await this.sectionRepository.findById(existingModule.section_id);
    if (!section) {
      throw new Error(`Section with ID '${existingModule.section_id}' not found`);
    }

    const level = await this.levelRepository.findById(section.level_id);
    if (!level) {
      throw new Error(`Level with ID '${section.level_id}' not found`);
    }

    // Check if new order conflicts with existing modules in the same section
    if (data.order !== undefined) {
      const orderExists = await this.moduleRepository.existsOrderInSection(existingModule.section_id, data.order, id);
      if (orderExists) {
        throw new Error(`Module with order '${data.order}' already exists in section '${existingModule.section_id}'`);
      }
    }

    const result = await this.moduleRepository.update(id, data);
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);
    
    return result;
  }

  async deleteModule(id: string): Promise<void> {
    // Get the module to find the section and course ID for cache invalidation
    const existingModule = await this.moduleRepository.findById(id);
    if (!existingModule) {
      throw new Error(`Module with ID '${id}' not found`);
    }

    // Get the section and level to find the course ID for cache invalidation
    const section = await this.sectionRepository.findById(existingModule.section_id);
    if (!section) {
      throw new Error(`Section with ID '${existingModule.section_id}' not found`);
    }

    const level = await this.levelRepository.findById(section.level_id);
    if (!level) {
      throw new Error(`Level with ID '${section.level_id}' not found`);
    }

    const success = await this.moduleRepository.delete(id);
    if (!success) {
      throw new Error(`Failed to delete module with ID '${id}'`);
    }
    
    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);
  }

  // Packaged content for offline support with caching and versioning
  async getPackagedCourse(courseId: string, ifModifiedSince?: string): Promise<PackagedCourse | null> {
    const cacheKey = CACHE_KEYS.PACKAGED_COURSE(courseId);
    
    try {
      // Check cache first
      const cachedResult = await cacheService.get<PackagedCourse>(cacheKey);
      if (cachedResult) {
        logger.debug(`Returning cached packaged course: ${courseId}`);
        
        // If client provided If-Modified-Since header, check if content has been modified
        if (ifModifiedSince) {
          const clientVersion = new Date(ifModifiedSince);
          const packageVersion = new Date(cachedResult.package_version);
          
          if (packageVersion <= clientVersion) {
            logger.debug(`Course ${courseId} not modified since ${ifModifiedSince}`);
            return null; // Return null to indicate 304 Not Modified
          }
        }
        
        return cachedResult;
      }

      // Get the latest updated timestamp for the entire course hierarchy
      const courseWithTimestamp = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          updatedAt: true,
          levels: {
            select: {
              updatedAt: true,
              sections: {
                select: {
                  updatedAt: true,
                  modules: {
                    select: {
                      updatedAt: true,
                      lessons: {
                        select: {
                          updatedAt: true,
                          exercises: {
                            select: {
                              exercise: {
                                select: {
                                  updatedAt: true
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
          }
        }
      });

      if (!courseWithTimestamp) {
        throw new Error(`Course with ID '${courseId}' not found`);
      }

      // Calculate the most recent update timestamp across the entire hierarchy
      const allTimestamps = [
        courseWithTimestamp.updatedAt,
        ...courseWithTimestamp.levels.flatMap(level => [
          level.updatedAt,
          ...level.sections.flatMap(section => [
            section.updatedAt,
            ...section.modules.flatMap(module => [
              module.updatedAt,
              ...module.lessons.flatMap(lesson => [
                lesson.updatedAt,
                ...lesson.exercises.map(le => le.exercise.updatedAt)
              ])
            ])
          ])
        ])
      ];

      const latestUpdateTime = new Date(Math.max(...allTimestamps.map(t => t.getTime())));

      // Check if client's version is up to date
      if (ifModifiedSince) {
        const clientVersion = new Date(ifModifiedSince);
        if (latestUpdateTime <= clientVersion) {
          logger.debug(`Course ${courseId} not modified since ${ifModifiedSince}`);
          return null; // Return null to indicate 304 Not Modified
        }
      }

      // Fetch the complete packaged course data with optimized query
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
        package_version: latestUpdateTime.toISOString()
      };

      // Cache the result for 15 minutes (packaged courses are large and expensive to generate)
      await cacheService.set(cacheKey, result, 15 * 60 * 1000);
      
      logger.info(`Generated and cached packaged course: ${courseId}, version: ${result.package_version}`);
      return result;

    } catch (error) {
      logger.error(`Error generating packaged course ${courseId}:`, error);
      throw error;
    }
  }

  // Method to invalidate packaged course cache when content is updated
  async invalidatePackagedCourseCache(courseId: string): Promise<void> {
    const cacheKey = CACHE_KEYS.PACKAGED_COURSE(courseId);
    await cacheService.delete(cacheKey);
    logger.debug(`Invalidated packaged course cache: ${courseId}`);
  }
}