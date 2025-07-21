/**
 * ContentService Unit Tests
 * Tests for business logic in ContentService
 */

import { ContentService } from '../ContentService';
import { CourseRepository, LevelRepository, SectionRepository, ModuleRepository } from '../../repositories';
import { Course, Level, Section, Module, CreateCourseDto, CreateLevelDto, CreateSectionDto, CreateModuleDto } from '../../types';
import { PaginatedResult, QueryOptions } from '../../../../shared/types';
import { cacheService } from '../../../../shared/utils';
import { CourseFactory, LevelFactory, SectionFactory, ModuleFactory } from '../../../../shared/test/factories/contentFactory';

// Mock dependencies
jest.mock('../../repositories');
jest.mock('../../../../shared/utils', () => ({
    cacheService: {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
    },
    CACHE_KEYS: {
        PACKAGED_COURSE: (id: string) => `packaged_course:${id}`,
    },
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe('ContentService', () => {
    let contentService: ContentService;
    let mockPrisma: any;
    let mockCourseRepository: jest.Mocked<CourseRepository>;
    let mockLevelRepository: jest.Mocked<LevelRepository>;
    let mockSectionRepository: jest.Mocked<SectionRepository>;
    let mockModuleRepository: jest.Mocked<ModuleRepository>;

    beforeEach(() => {
        // Create mock Prisma client
        mockPrisma = {
            course: {
                findUnique: jest.fn(),
            },
        };

        // Create mocked repositories
        mockCourseRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
        } as any;

        mockLevelRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByCourseId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            existsInCourse: jest.fn(),
            existsOrderInCourse: jest.fn(),
        } as any;

        mockSectionRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByLevelId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            existsOrderInLevel: jest.fn(),
        } as any;

        mockModuleRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findBySectionId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            existsOrderInSection: jest.fn(),
        } as any;

        // Mock the repository constructors
        (CourseRepository as jest.MockedClass<typeof CourseRepository>).mockImplementation(() => mockCourseRepository);
        (LevelRepository as jest.MockedClass<typeof LevelRepository>).mockImplementation(() => mockLevelRepository);
        (SectionRepository as jest.MockedClass<typeof SectionRepository>).mockImplementation(() => mockSectionRepository);
        (ModuleRepository as jest.MockedClass<typeof ModuleRepository>).mockImplementation(() => mockModuleRepository);

        contentService = new ContentService(mockPrisma);

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('Course Operations', () => {
        describe('createCourse', () => {
            it('should create a course successfully', async () => {
                const courseData: CreateCourseDto = CourseFactory.buildDto();
                const expectedCourse: Course = {
                    id: courseData.id,
                    source_language: courseData.source_language,
                    target_language: courseData.target_language,
                    name: courseData.name,
                    description: courseData.description || '',
                    is_public: courseData.is_public || false,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockCourseRepository.exists.mockResolvedValue(false);
                mockCourseRepository.create.mockResolvedValue(expectedCourse);

                const result = await contentService.createCourse(courseData);

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseData.id);
                expect(mockCourseRepository.create).toHaveBeenCalledWith(courseData);
                expect(result).toEqual(expectedCourse);
            });

            it('should throw error if course with same ID already exists', async () => {
                const courseData: CreateCourseDto = CourseFactory.buildDto();

                mockCourseRepository.exists.mockResolvedValue(true);

                await expect(contentService.createCourse(courseData)).rejects.toThrow(
                    `Course with ID '${courseData.id}' already exists`
                );

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseData.id);
                expect(mockCourseRepository.create).not.toHaveBeenCalled();
            });
        });

        describe('getCourse', () => {
            it('should return course when found', async () => {
                const courseId = 'test-course-1';
                const expectedCourse: Course = {
                    id: courseId,
                    source_language: 'qu',
                    target_language: 'es-ES',
                    name: `Test Course ${courseId}`,
                    description: 'A test course for unit testing',
                    is_public: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockCourseRepository.findById.mockResolvedValue(expectedCourse);

                const result = await contentService.getCourse(courseId);

                expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
                expect(result).toEqual(expectedCourse);
            });

            it('should throw error when course not found', async () => {
                const courseId = 'non-existent-course';

                mockCourseRepository.findById.mockResolvedValue(null);

                await expect(contentService.getCourse(courseId)).rejects.toThrow(
                    `Course with ID '${courseId}' not found`
                );

                expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
            });
        });

        describe('getCourses', () => {
            it('should return paginated courses', async () => {
                const options: QueryOptions = { page: 1, limit: 10 };
                const expectedResult: PaginatedResult<Course> = {
                    data: [
                        {
                            id: 'test-course-1',
                            source_language: 'aym',
                            target_language: 'es-ES',
                            name: 'Test Course',
                            description: 'A test course',
                            is_public: true,
                            created_at: new Date(),
                            updated_at: new Date()
                        },
                    ],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 1,
                        totalPages: 1,
                        hasNext: false,
                        hasPrev: false,
                    },
                };

                mockCourseRepository.findAll.mockResolvedValue(expectedResult);

                const result = await contentService.getCourses(options);

                expect(mockCourseRepository.findAll).toHaveBeenCalledWith(options);
                expect(result).toEqual(expectedResult);
            });

            it('should use default options when none provided', async () => {
                const expectedResult: PaginatedResult<Course> = {
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 20,
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false,
                    },
                };

                mockCourseRepository.findAll.mockResolvedValue(expectedResult);

                const result = await contentService.getCourses();

                expect(mockCourseRepository.findAll).toHaveBeenCalledWith({});
                expect(result).toEqual(expectedResult);
            });
        });

        describe('updateCourse', () => {
            it('should update course successfully', async () => {
                const courseId = 'test-course-1';
                const updateData = { name: 'Updated Course Name' };
                const expectedCourse: Course = {
                    id: courseId,
                    source_language: 'pt-BR',
                    target_language: 'en',
                    name: updateData.name,
                    description: 'A test course',
                    is_public: true,
                    created_at: new Date(),
                    updated_at: new Date()
                };

                mockCourseRepository.exists.mockResolvedValue(true);
                mockCourseRepository.update.mockResolvedValue(expectedCourse);

                const result = await contentService.updateCourse(courseId, updateData);

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockCourseRepository.update).toHaveBeenCalledWith(courseId, updateData);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
                expect(result).toEqual(expectedCourse);
            });

            it('should throw error when course not found', async () => {
                const courseId = 'non-existent-course';
                const updateData = { name: 'Updated Course Name' };

                mockCourseRepository.exists.mockResolvedValue(false);

                await expect(contentService.updateCourse(courseId, updateData)).rejects.toThrow(
                    `Course with ID '${courseId}' not found`
                );

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockCourseRepository.update).not.toHaveBeenCalled();
            });
        });

        describe('deleteCourse', () => {
            it('should delete course successfully', async () => {
                const courseId = 'test-course-1';

                mockCourseRepository.exists.mockResolvedValue(true);
                mockCourseRepository.delete.mockResolvedValue(true);

                await contentService.deleteCourse(courseId);

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockCourseRepository.delete).toHaveBeenCalledWith(courseId);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
            });

            it('should throw error when course not found', async () => {
                const courseId = 'non-existent-course';

                mockCourseRepository.exists.mockResolvedValue(false);

                await expect(contentService.deleteCourse(courseId)).rejects.toThrow(
                    `Course with ID '${courseId}' not found`
                );

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockCourseRepository.delete).not.toHaveBeenCalled();
            });

            it('should throw error when delete operation fails', async () => {
                const courseId = 'test-course-1';

                mockCourseRepository.exists.mockResolvedValue(true);
                mockCourseRepository.delete.mockResolvedValue(false);

                await expect(contentService.deleteCourse(courseId)).rejects.toThrow(
                    `Failed to delete course with ID '${courseId}'`
                );

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockCourseRepository.delete).toHaveBeenCalledWith(courseId);
            });
        });
    });

    describe('Level Operations', () => {
        describe('createLevel', () => {
            it('should create level successfully', async () => {
                const courseId = 'test-course-1';
                const levelData: CreateLevelDto = LevelFactory.buildDto(courseId);
                const expectedLevel: Level = {
                    id: levelData.id,
                    course_id: levelData.course_id,
                    code: levelData.code,
                    name: levelData.name,
                    order: levelData.order,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockCourseRepository.exists.mockResolvedValue(true);
                mockLevelRepository.exists.mockResolvedValue(false);
                mockLevelRepository.existsInCourse.mockResolvedValue(false);
                mockLevelRepository.existsOrderInCourse.mockResolvedValue(false);
                mockLevelRepository.create.mockResolvedValue(expectedLevel);

                const result = await contentService.createLevel(levelData);

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(levelData.course_id);
                expect(mockLevelRepository.exists).toHaveBeenCalledWith(levelData.id);
                expect(mockLevelRepository.existsInCourse).toHaveBeenCalledWith(levelData.course_id, levelData.code);
                expect(mockLevelRepository.existsOrderInCourse).toHaveBeenCalledWith(levelData.course_id, levelData.order);
                expect(mockLevelRepository.create).toHaveBeenCalledWith(levelData);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${levelData.course_id}`);
                expect(result).toEqual(expectedLevel);
            });

            it('should throw error when parent course not found', async () => {
                const courseId = 'non-existent-course';
                const levelData: CreateLevelDto = LevelFactory.buildDto(courseId);

                mockCourseRepository.exists.mockResolvedValue(false);

                await expect(contentService.createLevel(levelData)).rejects.toThrow(
                    `Course with ID '${courseId}' not found`
                );

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockLevelRepository.create).not.toHaveBeenCalled();
            });

            it('should throw error when level ID already exists', async () => {
                const courseId = 'test-course-1';
                const levelData: CreateLevelDto = LevelFactory.buildDto(courseId);

                mockCourseRepository.exists.mockResolvedValue(true);
                mockLevelRepository.exists.mockResolvedValue(true);

                await expect(contentService.createLevel(levelData)).rejects.toThrow(
                    `Level with ID '${levelData.id}' already exists`
                );

                expect(mockLevelRepository.exists).toHaveBeenCalledWith(levelData.id);
                expect(mockLevelRepository.create).not.toHaveBeenCalled();
            });

            it('should throw error when level code already exists in course', async () => {
                const courseId = 'test-course-1';
                const levelData: CreateLevelDto = LevelFactory.buildDto(courseId);

                mockCourseRepository.exists.mockResolvedValue(true);
                mockLevelRepository.exists.mockResolvedValue(false);
                mockLevelRepository.existsInCourse.mockResolvedValue(true);

                await expect(contentService.createLevel(levelData)).rejects.toThrow(
                    `Level with code '${levelData.code}' already exists in course '${courseId}'`
                );

                expect(mockLevelRepository.existsInCourse).toHaveBeenCalledWith(courseId, levelData.code);
                expect(mockLevelRepository.create).not.toHaveBeenCalled();
            });

            it('should throw error when level order already exists in course', async () => {
                const courseId = 'test-course-1';
                const levelData: CreateLevelDto = LevelFactory.buildDto(courseId);

                mockCourseRepository.exists.mockResolvedValue(true);
                mockLevelRepository.exists.mockResolvedValue(false);
                mockLevelRepository.existsInCourse.mockResolvedValue(false);
                mockLevelRepository.existsOrderInCourse.mockResolvedValue(true);

                await expect(contentService.createLevel(levelData)).rejects.toThrow(
                    `Level with order '${levelData.order}' already exists in course '${courseId}'`
                );

                expect(mockLevelRepository.existsOrderInCourse).toHaveBeenCalledWith(courseId, levelData.order);
                expect(mockLevelRepository.create).not.toHaveBeenCalled();
            });
        });

        describe('getLevel', () => {
            it('should return level when found', async () => {
                const levelId = 'test-level-1';
                const expectedLevel: Level = {
                    id: levelId,
                    course_id: 'test-course-1',
                    code: 'L1',
                    name: `Test Level ${levelId}`,
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockLevelRepository.findById.mockResolvedValue(expectedLevel);

                const result = await contentService.getLevel(levelId);

                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(result).toEqual(expectedLevel);
            });

            it('should throw error when level not found', async () => {
                const levelId = 'non-existent-level';

                mockLevelRepository.findById.mockResolvedValue(null);

                await expect(contentService.getLevel(levelId)).rejects.toThrow(
                    `Level with ID '${levelId}' not found`
                );

                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
            });
        });

        describe('getLevelsByCourse', () => {
            it('should return levels for existing course', async () => {
                const courseId = 'test-course-1';
                const options: QueryOptions = { page: 1, limit: 10 };
                const expectedResult: PaginatedResult<Level> = {
                    data: [
                        {
                            id: 'test-level-1',
                            course_id: courseId,
                            code: 'L1',
                            name: 'Test Level 1',
                            order: 1,
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                    ],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 1,
                        totalPages: 1,
                        hasNext: false,
                        hasPrev: false,
                    },
                };

                mockCourseRepository.exists.mockResolvedValue(true);
                mockLevelRepository.findByCourseId.mockResolvedValue(expectedResult);

                const result = await contentService.getLevelsByCourse(courseId, options);

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockLevelRepository.findByCourseId).toHaveBeenCalledWith(courseId, options);
                expect(result).toEqual(expectedResult);
            });

            it('should throw error when course not found', async () => {
                const courseId = 'non-existent-course';

                mockCourseRepository.exists.mockResolvedValue(false);

                await expect(contentService.getLevelsByCourse(courseId)).rejects.toThrow(
                    `Course with ID '${courseId}' not found`
                );

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockLevelRepository.findByCourseId).not.toHaveBeenCalled();
            });
        });
    });

    describe('Section Operations', () => {
        describe('createSection', () => {
            it('should create section successfully', async () => {
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const sectionData: CreateSectionDto = SectionFactory.buildDto(levelId);
                const expectedSection: Section = {
                    id: sectionData.id,
                    level_id: sectionData.level_id,
                    name: sectionData.name,
                    order: sectionData.order,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: `Test Level ${levelId}`,
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockLevelRepository.findById.mockResolvedValue(mockLevel);
                mockSectionRepository.exists.mockResolvedValue(false);
                mockSectionRepository.existsOrderInLevel.mockResolvedValue(false);
                mockSectionRepository.create.mockResolvedValue(expectedSection);

                const result = await contentService.createSection(sectionData);

                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockSectionRepository.exists).toHaveBeenCalledWith(sectionData.id);
                expect(mockSectionRepository.existsOrderInLevel).toHaveBeenCalledWith(levelId, sectionData.order);
                expect(mockSectionRepository.create).toHaveBeenCalledWith(sectionData);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
                expect(result).toEqual(expectedSection);
            });

            it('should throw error when parent level not found', async () => {
                const levelId = 'non-existent-level';
                const sectionData: CreateSectionDto = SectionFactory.buildDto(levelId);

                mockLevelRepository.findById.mockResolvedValue(null);

                await expect(contentService.createSection(sectionData)).rejects.toThrow(
                    `Level with ID '${levelId}' not found`
                );

                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockSectionRepository.create).not.toHaveBeenCalled();
            });
        });
    });

    describe('Module Operations', () => {
        describe('createModule', () => {
            it('should create module successfully', async () => {
                const sectionId = 'test-section-1';
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const moduleData: CreateModuleDto = ModuleFactory.buildDto(sectionId);
                const expectedModule: Module = {
                    id: moduleData.id,
                    section_id: moduleData.section_id,
                    module_type: moduleData.module_type,
                    name: moduleData.name,
                    order: moduleData.order,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockSection: Section = {
                    id: sectionId,
                    level_id: levelId,
                    name: `Test Section ${sectionId}`,
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: `Test Level ${levelId}`,
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockSectionRepository.findById.mockResolvedValue(mockSection);
                mockLevelRepository.findById.mockResolvedValue(mockLevel);
                mockModuleRepository.exists.mockResolvedValue(false);
                mockModuleRepository.existsOrderInSection.mockResolvedValue(false);
                mockModuleRepository.create.mockResolvedValue(expectedModule);

                const result = await contentService.createModule(moduleData);

                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockModuleRepository.exists).toHaveBeenCalledWith(moduleData.id);
                expect(mockModuleRepository.existsOrderInSection).toHaveBeenCalledWith(sectionId, moduleData.order);
                expect(mockModuleRepository.create).toHaveBeenCalledWith(moduleData);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
                expect(result).toEqual(expectedModule);
            });

            it('should throw error when parent section not found', async () => {
                const sectionId = 'non-existent-section';
                const moduleData: CreateModuleDto = ModuleFactory.buildDto(sectionId);

                mockSectionRepository.findById.mockResolvedValue(null);

                await expect(contentService.createModule(moduleData)).rejects.toThrow(
                    `Section with ID '${sectionId}' not found`
                );

                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
                expect(mockModuleRepository.create).not.toHaveBeenCalled();
            });
        });
    });

    describe('Cache Invalidation', () => {
        describe('invalidatePackagedCourseCache', () => {
            it('should invalidate cache for given course', async () => {
                const courseId = 'test-course-1';

                await contentService.invalidatePackagedCourseCache(courseId);

                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
            });
        });
    });
});