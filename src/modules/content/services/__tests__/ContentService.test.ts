// src/modules/content/services/__tests__/ContentService.test.ts

import { ContentService } from '../ContentService';
import { CourseRepository, LevelRepository, SectionRepository, ModuleRepository } from '../../repositories';
import { Course, Level, Section, Module, CreateCourseDto, CreateLevelDto, CreateSectionDto, CreateModuleDto, PackagedCourse } from '../../types';
import { PaginatedResult, QueryOptions } from '../../../../shared/types';
import { cacheService } from '../../../../shared/utils';
import { AppError } from '../../../../shared/middleware';
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

/**
 * Test suite for ContentService, covering hierarchical content management operations.
 * 
 * These tests verify that the ContentService correctly handles CRUD operations for the four-tier
 * content hierarchy (Courses → Levels → Sections → Modules) with proper validation, error handling,
 * and cache management. The test suite validates business logic including duplicate prevention,
 * parent-child relationship validation, cache invalidation, and proper error responses with
 * appropriate HTTP status codes and error codes.
 * 
 * @fileoverview Unit tests for ContentService business logic layer
 * @author Exequiel Trujillo
  * 
 * @since 1.0.0
 */
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
                    id: courseData.id!,
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

            it('should throw AppError if course with same ID already exists', async () => {
                const courseData: CreateCourseDto = CourseFactory.buildDto();

                mockCourseRepository.exists.mockResolvedValue(true);

                await expect(contentService.createCourse(courseData)).rejects.toThrow(AppError);
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
                const expectedCourse: Course & { levels_count: number } = {
                    id: courseId,
                    source_language: 'qu',
                    target_language: 'es-ES',
                    name: `Test Course ${courseId}`,
                    description: 'A test course for unit testing',
                    is_public: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                    levels_count: 0,
                };

                mockCourseRepository.findById.mockResolvedValue(expectedCourse);

                const result = await contentService.getCourse(courseId);

                expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
                expect(result).toEqual(expectedCourse);
            });

            it('should throw AppError when course not found', async () => {
                const courseId = 'non-existent-course';

                mockCourseRepository.findById.mockResolvedValue(null);

                await expect(contentService.getCourse(courseId)).rejects.toThrow(AppError);
                await expect(contentService.getCourse(courseId)).rejects.toThrow(
                    `Course with ID '${courseId}' not found`
                );

                expect(mockCourseRepository.findById).toHaveBeenCalledWith(courseId);
            });
        });

        describe('getCourses', () => {
            it('should return paginated courses', async () => {
                const options: QueryOptions = { page: 1, limit: 10 };
                const expectedResult: PaginatedResult<Course & { levels_count: number }> = {
                    data: [
                        {
                            id: 'test-course-1',
                            source_language: 'aym',
                            target_language: 'es-ES',
                            name: 'Test Course',
                            description: 'A test course',
                            is_public: true,
                            created_at: new Date(),
                            updated_at: new Date(),
                            levels_count: 0,
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
                const expectedResult: PaginatedResult<Course & { levels_count: number }> = {
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
                const expectedCourse: Course & { levels_count: number } = {
                    id: courseId,
                    source_language: 'pt-BR',
                    target_language: 'en',
                    name: updateData.name,
                    description: 'A test course',
                    is_public: true,
                    created_at: new Date(),
                    updated_at: new Date(),
                    levels_count: 0,
                };

                mockCourseRepository.exists.mockResolvedValue(true);
                mockCourseRepository.update.mockResolvedValue(expectedCourse);

                const result = await contentService.updateCourse(courseId, updateData);

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockCourseRepository.update).toHaveBeenCalledWith(courseId, updateData);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
                expect(result).toEqual(expectedCourse);
            });

            it('should throw AppError when course not found', async () => {
                const courseId = 'non-existent-course';
                const updateData = { name: 'Updated Course Name' };

                mockCourseRepository.exists.mockResolvedValue(false);

                await expect(contentService.updateCourse(courseId, updateData)).rejects.toThrow(AppError);
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

            it('should throw AppError when course not found', async () => {
                const courseId = 'non-existent-course';

                mockCourseRepository.exists.mockResolvedValue(false);

                await expect(contentService.deleteCourse(courseId)).rejects.toThrow(AppError);
                await expect(contentService.deleteCourse(courseId)).rejects.toThrow(
                    `Course with ID '${courseId}' not found`
                );

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockCourseRepository.delete).not.toHaveBeenCalled();
            });

            it('should throw AppError when delete operation fails', async () => {
                const courseId = 'test-course-1';

                mockCourseRepository.exists.mockResolvedValue(true);
                mockCourseRepository.delete.mockResolvedValue(false);

                await expect(contentService.deleteCourse(courseId)).rejects.toThrow(AppError);
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

            it('should throw AppError when parent course not found', async () => {
                const courseId = 'non-existent-course';
                const levelData: CreateLevelDto = LevelFactory.buildDto(courseId);

                mockCourseRepository.exists.mockResolvedValue(false);

                await expect(contentService.createLevel(levelData)).rejects.toThrow(AppError);
                await expect(contentService.createLevel(levelData)).rejects.toThrow(
                    `Course with ID '${courseId}' not found`
                );

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockLevelRepository.create).not.toHaveBeenCalled();
            });

            it('should throw AppError when level ID already exists', async () => {
                const courseId = 'test-course-1';
                const levelData: CreateLevelDto = LevelFactory.buildDto(courseId);

                mockCourseRepository.exists.mockResolvedValue(true);
                mockLevelRepository.exists.mockResolvedValue(true);

                await expect(contentService.createLevel(levelData)).rejects.toThrow(AppError);
                await expect(contentService.createLevel(levelData)).rejects.toThrow(
                    `Level with ID '${levelData.id}' already exists`
                );

                expect(mockLevelRepository.exists).toHaveBeenCalledWith(levelData.id);
                expect(mockLevelRepository.create).not.toHaveBeenCalled();
            });

            it('should throw AppError when level code already exists in course', async () => {
                const courseId = 'test-course-1';
                const levelData: CreateLevelDto = LevelFactory.buildDto(courseId);

                mockCourseRepository.exists.mockResolvedValue(true);
                mockLevelRepository.exists.mockResolvedValue(false);
                mockLevelRepository.existsInCourse.mockResolvedValue(true);

                await expect(contentService.createLevel(levelData)).rejects.toThrow(AppError);
                await expect(contentService.createLevel(levelData)).rejects.toThrow(
                    `Level with code '${levelData.code}' already exists in course '${courseId}'`
                );

                expect(mockLevelRepository.existsInCourse).toHaveBeenCalledWith(courseId, levelData.code);
                expect(mockLevelRepository.create).not.toHaveBeenCalled();
            });

            it('should throw AppError when level order already exists in course', async () => {
                const courseId = 'test-course-1';
                const levelData: CreateLevelDto = LevelFactory.buildDto(courseId);

                mockCourseRepository.exists.mockResolvedValue(true);
                mockLevelRepository.exists.mockResolvedValue(false);
                mockLevelRepository.existsInCourse.mockResolvedValue(false);
                mockLevelRepository.existsOrderInCourse.mockResolvedValue(true);

                await expect(contentService.createLevel(levelData)).rejects.toThrow(AppError);
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

            it('should throw AppError when level not found', async () => {
                const levelId = 'non-existent-level';

                mockLevelRepository.findById.mockResolvedValue(null);

                await expect(contentService.getLevel(levelId)).rejects.toThrow(AppError);
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

            it('should throw AppError when course not found', async () => {
                const courseId = 'non-existent-course';

                mockCourseRepository.exists.mockResolvedValue(false);

                await expect(contentService.getLevelsByCourse(courseId)).rejects.toThrow(AppError);
                await expect(contentService.getLevelsByCourse(courseId)).rejects.toThrow(
                    `Course with ID '${courseId}' not found`
                );

                expect(mockCourseRepository.exists).toHaveBeenCalledWith(courseId);
                expect(mockLevelRepository.findByCourseId).not.toHaveBeenCalled();
            });
        });

        describe('updateLevel', () => {
            it('should update level successfully', async () => {
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const updateData = { name: 'Updated Level Name' };
                const existingLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Original Level Name',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const updatedLevel: Level = {
                    ...existingLevel,
                    name: updateData.name,
                    updated_at: new Date(),
                };

                mockLevelRepository.findById.mockResolvedValue(existingLevel);
                mockLevelRepository.update.mockResolvedValue(updatedLevel);

                const result = await contentService.updateLevel(levelId, updateData);

                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockLevelRepository.update).toHaveBeenCalledWith(levelId, updateData);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
                expect(result).toEqual(updatedLevel);
            });

            it('should throw AppError when level not found', async () => {
                const levelId = 'non-existent-level';
                const updateData = { name: 'Updated Level Name' };

                mockLevelRepository.findById.mockResolvedValue(null);

                await expect(contentService.updateLevel(levelId, updateData)).rejects.toThrow(AppError);
                await expect(contentService.updateLevel(levelId, updateData)).rejects.toThrow(
                    `Level with ID '${levelId}' not found`
                );

                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockLevelRepository.update).not.toHaveBeenCalled();
            });

            it('should throw AppError when code conflicts with existing level', async () => {
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const updateData = { code: 'L2' };
                const existingLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockLevelRepository.findById.mockResolvedValue(existingLevel);
                mockLevelRepository.existsInCourse.mockResolvedValue(true);

                await expect(contentService.updateLevel(levelId, updateData)).rejects.toThrow(AppError);
                await expect(contentService.updateLevel(levelId, updateData)).rejects.toThrow(
                    `Level with code '${updateData.code}' already exists in course '${courseId}'`
                );

                expect(mockLevelRepository.existsInCourse).toHaveBeenCalledWith(courseId, updateData.code, levelId);
                expect(mockLevelRepository.update).not.toHaveBeenCalled();
            });

            it('should throw AppError when order conflicts with existing level', async () => {
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const updateData = { order: 2 };
                const existingLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockLevelRepository.findById.mockResolvedValue(existingLevel);
                mockLevelRepository.existsOrderInCourse.mockResolvedValue(true);

                await expect(contentService.updateLevel(levelId, updateData)).rejects.toThrow(AppError);
                await expect(contentService.updateLevel(levelId, updateData)).rejects.toThrow(
                    `Level with order '${updateData.order}' already exists in course '${courseId}'`
                );

                expect(mockLevelRepository.existsOrderInCourse).toHaveBeenCalledWith(courseId, updateData.order, levelId);
                expect(mockLevelRepository.update).not.toHaveBeenCalled();
            });
        });

        describe('deleteLevel', () => {
            it('should delete level successfully', async () => {
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const existingLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockLevelRepository.findById.mockResolvedValue(existingLevel);
                mockLevelRepository.delete.mockResolvedValue(true);

                await contentService.deleteLevel(levelId);

                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockLevelRepository.delete).toHaveBeenCalledWith(levelId);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
            });

            it('should throw AppError when level not found', async () => {
                const levelId = 'non-existent-level';

                mockLevelRepository.findById.mockResolvedValue(null);

                await expect(contentService.deleteLevel(levelId)).rejects.toThrow(AppError);
                await expect(contentService.deleteLevel(levelId)).rejects.toThrow(
                    `Level with ID '${levelId}' not found`
                );

                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockLevelRepository.delete).not.toHaveBeenCalled();
            });

            it('should throw AppError when delete operation fails', async () => {
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const existingLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockLevelRepository.findById.mockResolvedValue(existingLevel);
                mockLevelRepository.delete.mockResolvedValue(false);

                await expect(contentService.deleteLevel(levelId)).rejects.toThrow(AppError);
                await expect(contentService.deleteLevel(levelId)).rejects.toThrow(
                    `Failed to delete level with ID '${levelId}'`
                );

                expect(mockLevelRepository.delete).toHaveBeenCalledWith(levelId);
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

            it('should throw AppError when parent level not found', async () => {
                const levelId = 'non-existent-level';
                const sectionData: CreateSectionDto = SectionFactory.buildDto(levelId);

                mockLevelRepository.findById.mockResolvedValue(null);

                await expect(contentService.createSection(sectionData)).rejects.toThrow(AppError);
                await expect(contentService.createSection(sectionData)).rejects.toThrow(
                    `Level with ID '${levelId}' not found`
                );

                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockSectionRepository.create).not.toHaveBeenCalled();
            });
        });

        describe('getSection', () => {
            it('should return section when found', async () => {
                const sectionId = 'test-section-1';
                const expectedSection: Section = {
                    id: sectionId,
                    level_id: 'test-level-1',
                    name: `Test Section ${sectionId}`,
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockSectionRepository.findById.mockResolvedValue(expectedSection);

                const result = await contentService.getSection(sectionId);

                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
                expect(result).toEqual(expectedSection);
            });

            it('should throw AppError when section not found', async () => {
                const sectionId = 'non-existent-section';

                mockSectionRepository.findById.mockResolvedValue(null);

                await expect(contentService.getSection(sectionId)).rejects.toThrow(AppError);
                await expect(contentService.getSection(sectionId)).rejects.toThrow(
                    `Section with ID '${sectionId}' not found`
                );

                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
            });
        });

        describe('getSectionsByLevel', () => {
            it('should return sections for existing level', async () => {
                const levelId = 'test-level-1';
                const options: QueryOptions = { page: 1, limit: 10 };
                const expectedResult: PaginatedResult<Section> = {
                    data: [
                        {
                            id: 'test-section-1',
                            level_id: levelId,
                            name: 'Test Section 1',
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

                mockLevelRepository.exists.mockResolvedValue(true);
                mockSectionRepository.findByLevelId.mockResolvedValue(expectedResult);

                const result = await contentService.getSectionsByLevel(levelId, options);

                expect(mockLevelRepository.exists).toHaveBeenCalledWith(levelId);
                expect(mockSectionRepository.findByLevelId).toHaveBeenCalledWith(levelId, options);
                expect(result).toEqual(expectedResult);
            });

            it('should throw AppError when level not found', async () => {
                const levelId = 'non-existent-level';

                mockLevelRepository.exists.mockResolvedValue(false);

                await expect(contentService.getSectionsByLevel(levelId)).rejects.toThrow(AppError);
                await expect(contentService.getSectionsByLevel(levelId)).rejects.toThrow(
                    `Level with ID '${levelId}' not found`
                );

                expect(mockLevelRepository.exists).toHaveBeenCalledWith(levelId);
                expect(mockSectionRepository.findByLevelId).not.toHaveBeenCalled();
            });
        });

        describe('updateSection', () => {
            it('should update section successfully', async () => {
                const sectionId = 'test-section-1';
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const updateData = { name: 'Updated Section Name' };
                const existingSection: Section = {
                    id: sectionId,
                    level_id: levelId,
                    name: 'Original Section Name',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const updatedSection: Section = {
                    ...existingSection,
                    name: updateData.name,
                    updated_at: new Date(),
                };

                mockSectionRepository.findById.mockResolvedValue(existingSection);
                mockLevelRepository.findById.mockResolvedValue(mockLevel);
                mockSectionRepository.update.mockResolvedValue(updatedSection);

                const result = await contentService.updateSection(sectionId, updateData);

                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockSectionRepository.update).toHaveBeenCalledWith(sectionId, updateData);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
                expect(result).toEqual(updatedSection);
            });

            it('should throw AppError when section not found', async () => {
                const sectionId = 'non-existent-section';
                const updateData = { name: 'Updated Section Name' };

                mockSectionRepository.findById.mockResolvedValue(null);

                await expect(contentService.updateSection(sectionId, updateData)).rejects.toThrow(AppError);
                await expect(contentService.updateSection(sectionId, updateData)).rejects.toThrow(
                    `Section with ID '${sectionId}' not found`
                );

                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
                expect(mockSectionRepository.update).not.toHaveBeenCalled();
            });

            it('should throw AppError when order conflicts with existing section', async () => {
                const sectionId = 'test-section-1';
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const updateData = { order: 2 };
                const existingSection: Section = {
                    id: sectionId,
                    level_id: levelId,
                    name: 'Test Section',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockSectionRepository.findById.mockResolvedValue(existingSection);
                mockLevelRepository.findById.mockResolvedValue(mockLevel);
                mockSectionRepository.existsOrderInLevel.mockResolvedValue(true);

                await expect(contentService.updateSection(sectionId, updateData)).rejects.toThrow(AppError);
                await expect(contentService.updateSection(sectionId, updateData)).rejects.toThrow(
                    `Section with order '${updateData.order}' already exists in level '${levelId}'`
                );

                expect(mockSectionRepository.existsOrderInLevel).toHaveBeenCalledWith(levelId, updateData.order, sectionId);
                expect(mockSectionRepository.update).not.toHaveBeenCalled();
            });
        });

        describe('deleteSection', () => {
            it('should delete section successfully', async () => {
                const sectionId = 'test-section-1';
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const existingSection: Section = {
                    id: sectionId,
                    level_id: levelId,
                    name: 'Test Section',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockSectionRepository.findById.mockResolvedValue(existingSection);
                mockLevelRepository.findById.mockResolvedValue(mockLevel);
                mockSectionRepository.delete.mockResolvedValue(true);

                await contentService.deleteSection(sectionId);

                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockSectionRepository.delete).toHaveBeenCalledWith(sectionId);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
            });

            it('should throw AppError when section not found', async () => {
                const sectionId = 'non-existent-section';

                mockSectionRepository.findById.mockResolvedValue(null);

                await expect(contentService.deleteSection(sectionId)).rejects.toThrow(AppError);
                await expect(contentService.deleteSection(sectionId)).rejects.toThrow(
                    `Section with ID '${sectionId}' not found`
                );

                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
                expect(mockSectionRepository.delete).not.toHaveBeenCalled();
            });

            it('should throw AppError when delete operation fails', async () => {
                const sectionId = 'test-section-1';
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const existingSection: Section = {
                    id: sectionId,
                    level_id: levelId,
                    name: 'Test Section',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockSectionRepository.findById.mockResolvedValue(existingSection);
                mockLevelRepository.findById.mockResolvedValue(mockLevel);
                mockSectionRepository.delete.mockResolvedValue(false);

                await expect(contentService.deleteSection(sectionId)).rejects.toThrow(AppError);
                await expect(contentService.deleteSection(sectionId)).rejects.toThrow(
                    `Failed to delete section with ID '${sectionId}'`
                );

                expect(mockSectionRepository.delete).toHaveBeenCalledWith(sectionId);
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

            it('should throw AppError when parent section not found', async () => {
                const sectionId = 'non-existent-section';
                const moduleData: CreateModuleDto = ModuleFactory.buildDto(sectionId);

                mockSectionRepository.findById.mockResolvedValue(null);

                await expect(contentService.createModule(moduleData)).rejects.toThrow(AppError);
                await expect(contentService.createModule(moduleData)).rejects.toThrow(
                    `Section with ID '${sectionId}' not found`
                );

                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
                expect(mockModuleRepository.create).not.toHaveBeenCalled();
            });
        });

        describe('getModule', () => {
            it('should return module when found', async () => {
                const moduleId = 'test-module-1';
                const expectedModule: Module = {
                    id: moduleId,
                    section_id: 'test-section-1',
                    module_type: 'basic_lesson',
                    name: `Test Module ${moduleId}`,
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockModuleRepository.findById.mockResolvedValue(expectedModule);

                const result = await contentService.getModule(moduleId);

                expect(mockModuleRepository.findById).toHaveBeenCalledWith(moduleId);
                expect(result).toEqual(expectedModule);
            });

            it('should throw AppError when module not found', async () => {
                const moduleId = 'non-existent-module';

                mockModuleRepository.findById.mockResolvedValue(null);

                await expect(contentService.getModule(moduleId)).rejects.toThrow(AppError);
                await expect(contentService.getModule(moduleId)).rejects.toThrow(
                    `Module with ID '${moduleId}' not found`
                );

                expect(mockModuleRepository.findById).toHaveBeenCalledWith(moduleId);
            });
        });

        describe('getModulesBySection', () => {
            it('should return modules for existing section', async () => {
                const sectionId = 'test-section-1';
                const options: QueryOptions = { page: 1, limit: 10 };
                const expectedResult: PaginatedResult<Module> = {
                    data: [
                        {
                            id: 'test-module-1',
                            section_id: sectionId,
                            module_type: 'basic_lesson',
                            name: 'Test Module 1',
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

                mockSectionRepository.exists.mockResolvedValue(true);
                mockModuleRepository.findBySectionId.mockResolvedValue(expectedResult);

                const result = await contentService.getModulesBySection(sectionId, options);

                expect(mockSectionRepository.exists).toHaveBeenCalledWith(sectionId);
                expect(mockModuleRepository.findBySectionId).toHaveBeenCalledWith(sectionId, options);
                expect(result).toEqual(expectedResult);
            });

            it('should throw AppError when section not found', async () => {
                const sectionId = 'non-existent-section';

                mockSectionRepository.exists.mockResolvedValue(false);

                await expect(contentService.getModulesBySection(sectionId)).rejects.toThrow(AppError);
                await expect(contentService.getModulesBySection(sectionId)).rejects.toThrow(
                    `Section with ID '${sectionId}' not found`
                );

                expect(mockSectionRepository.exists).toHaveBeenCalledWith(sectionId);
                expect(mockModuleRepository.findBySectionId).not.toHaveBeenCalled();
            });
        });

        describe('updateModule', () => {
            it('should update module successfully', async () => {
                const moduleId = 'test-module-1';
                const sectionId = 'test-section-1';
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const updateData = { name: 'Updated Module Name' };
                const existingModule: Module = {
                    id: moduleId,
                    section_id: sectionId,
                    module_type: 'basic_lesson',
                    name: 'Original Module Name',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockSection: Section = {
                    id: sectionId,
                    level_id: levelId,
                    name: 'Test Section',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const updatedModule: Module = {
                    ...existingModule,
                    name: updateData.name,
                    updated_at: new Date(),
                };

                mockModuleRepository.findById.mockResolvedValue(existingModule);
                mockSectionRepository.findById.mockResolvedValue(mockSection);
                mockLevelRepository.findById.mockResolvedValue(mockLevel);
                mockModuleRepository.update.mockResolvedValue(updatedModule);

                const result = await contentService.updateModule(moduleId, updateData);

                expect(mockModuleRepository.findById).toHaveBeenCalledWith(moduleId);
                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockModuleRepository.update).toHaveBeenCalledWith(moduleId, updateData);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
                expect(result).toEqual(updatedModule);
            });

            it('should throw AppError when module not found', async () => {
                const moduleId = 'non-existent-module';
                const updateData = { name: 'Updated Module Name' };

                mockModuleRepository.findById.mockResolvedValue(null);

                await expect(contentService.updateModule(moduleId, updateData)).rejects.toThrow(AppError);
                await expect(contentService.updateModule(moduleId, updateData)).rejects.toThrow(
                    `Module with ID '${moduleId}' not found`
                );

                expect(mockModuleRepository.findById).toHaveBeenCalledWith(moduleId);
                expect(mockModuleRepository.update).not.toHaveBeenCalled();
            });

            it('should throw AppError when order conflicts with existing module', async () => {
                const moduleId = 'test-module-1';
                const sectionId = 'test-section-1';
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const updateData = { order: 2 };
                const existingModule: Module = {
                    id: moduleId,
                    section_id: sectionId,
                    module_type: 'basic_lesson',
                    name: 'Test Module',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockSection: Section = {
                    id: sectionId,
                    level_id: levelId,
                    name: 'Test Section',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockModuleRepository.findById.mockResolvedValue(existingModule);
                mockSectionRepository.findById.mockResolvedValue(mockSection);
                mockLevelRepository.findById.mockResolvedValue(mockLevel);
                mockModuleRepository.existsOrderInSection.mockResolvedValue(true);

                await expect(contentService.updateModule(moduleId, updateData)).rejects.toThrow(AppError);
                await expect(contentService.updateModule(moduleId, updateData)).rejects.toThrow(
                    `Module with order '${updateData.order}' already exists in section '${sectionId}'`
                );

                expect(mockModuleRepository.existsOrderInSection).toHaveBeenCalledWith(sectionId, updateData.order, moduleId);
                expect(mockModuleRepository.update).not.toHaveBeenCalled();
            });
        });

        describe('deleteModule', () => {
            it('should delete module successfully', async () => {
                const moduleId = 'test-module-1';
                const sectionId = 'test-section-1';
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const existingModule: Module = {
                    id: moduleId,
                    section_id: sectionId,
                    module_type: 'basic_lesson',
                    name: 'Test Module',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockSection: Section = {
                    id: sectionId,
                    level_id: levelId,
                    name: 'Test Section',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockModuleRepository.findById.mockResolvedValue(existingModule);
                mockSectionRepository.findById.mockResolvedValue(mockSection);
                mockLevelRepository.findById.mockResolvedValue(mockLevel);
                mockModuleRepository.delete.mockResolvedValue(true);

                await contentService.deleteModule(moduleId);

                expect(mockModuleRepository.findById).toHaveBeenCalledWith(moduleId);
                expect(mockSectionRepository.findById).toHaveBeenCalledWith(sectionId);
                expect(mockLevelRepository.findById).toHaveBeenCalledWith(levelId);
                expect(mockModuleRepository.delete).toHaveBeenCalledWith(moduleId);
                expect(cacheService.delete).toHaveBeenCalledWith(`packaged_course:${courseId}`);
            });

            it('should throw AppError when module not found', async () => {
                const moduleId = 'non-existent-module';

                mockModuleRepository.findById.mockResolvedValue(null);

                await expect(contentService.deleteModule(moduleId)).rejects.toThrow(AppError);
                await expect(contentService.deleteModule(moduleId)).rejects.toThrow(
                    `Module with ID '${moduleId}' not found`
                );

                expect(mockModuleRepository.findById).toHaveBeenCalledWith(moduleId);
                expect(mockModuleRepository.delete).not.toHaveBeenCalled();
            });

            it('should throw AppError when delete operation fails', async () => {
                const moduleId = 'test-module-1';
                const sectionId = 'test-section-1';
                const levelId = 'test-level-1';
                const courseId = 'test-course-1';
                const existingModule: Module = {
                    id: moduleId,
                    section_id: sectionId,
                    module_type: 'basic_lesson',
                    name: 'Test Module',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockSection: Section = {
                    id: sectionId,
                    level_id: levelId,
                    name: 'Test Section',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };
                const mockLevel: Level = {
                    id: levelId,
                    course_id: courseId,
                    code: 'L1',
                    name: 'Test Level',
                    order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                mockModuleRepository.findById.mockResolvedValue(existingModule);
                mockSectionRepository.findById.mockResolvedValue(mockSection);
                mockLevelRepository.findById.mockResolvedValue(mockLevel);
                mockModuleRepository.delete.mockResolvedValue(false);

                await expect(contentService.deleteModule(moduleId)).rejects.toThrow(AppError);
                await expect(contentService.deleteModule(moduleId)).rejects.toThrow(
                    `Failed to delete module with ID '${moduleId}'`
                );

                expect(mockModuleRepository.delete).toHaveBeenCalledWith(moduleId);
            });
        });
    });

    describe('Packaged Content Operations', () => {
        describe('getPackagedCourse', () => {
            it('should return cached packaged course when available', async () => {
                const courseId = 'test-course-1';
                const cachedPackagedCourse: PackagedCourse = {
                    course: {
                        id: courseId,
                        source_language: 'en',
                        target_language: 'es',
                        name: 'Test Course',
                        description: 'A test course',
                        is_public: true,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                    levels: [],
                    package_version: new Date().toISOString(),
                };

                (cacheService.get as jest.Mock).mockResolvedValue(cachedPackagedCourse);

                const result = await contentService.getPackagedCourse(courseId);

                expect(cacheService.get).toHaveBeenCalledWith(`packaged_course:${courseId}`);
                expect(result).toEqual(cachedPackagedCourse);
            });

            it('should return null when cached course is not modified since specified date', async () => {
                const courseId = 'test-course-1';
                const ifModifiedSince = '2024-01-02T00:00:00Z';
                const cachedPackagedCourse: PackagedCourse = {
                    course: {
                        id: courseId,
                        source_language: 'en',
                        target_language: 'es',
                        name: 'Test Course',
                        description: 'A test course',
                        is_public: true,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                    levels: [],
                    package_version: '2024-01-01T00:00:00Z', // Earlier than ifModifiedSince
                };

                (cacheService.get as jest.Mock).mockResolvedValue(cachedPackagedCourse);

                const result = await contentService.getPackagedCourse(courseId, ifModifiedSince);

                expect(result).toBeNull();
            });

            it('should throw AppError when course not found', async () => {
                const courseId = 'non-existent-course';

                (cacheService.get as jest.Mock).mockResolvedValue(null);
                mockPrisma.course.findUnique.mockResolvedValue(null);

                await expect(contentService.getPackagedCourse(courseId)).rejects.toThrow(AppError);
                await expect(contentService.getPackagedCourse(courseId)).rejects.toThrow(
                    `Course with ID '${courseId}' not found`
                );
            });

            it('should generate and cache packaged course when not cached', async () => {
                const courseId = 'test-course-1';
                const mockCourseWithTimestamp = {
                    id: courseId,
                    updatedAt: new Date('2024-01-01T00:00:00Z'),
                    levels: [{
                        updatedAt: new Date('2024-01-01T00:00:00Z'),
                        sections: [{
                            updatedAt: new Date('2024-01-01T00:00:00Z'),
                            modules: [{
                                updatedAt: new Date('2024-01-01T00:00:00Z'),
                                lessons: [{
                                    updatedAt: new Date('2024-01-01T00:00:00Z'),
                                    exercises: [{
                                        exercise: {
                                            updatedAt: new Date('2024-01-01T00:00:00Z')
                                        }
                                    }]
                                }]
                            }]
                        }]
                    }]
                };
                const mockPackagedCourseData = {
                    id: courseId,
                    sourceLanguage: 'en',
                    targetLanguage: 'es',
                    name: 'Test Course',
                    description: 'A test course',
                    isPublic: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    levels: []
                };

                (cacheService.get as jest.Mock).mockResolvedValue(null);
                mockPrisma.course.findUnique
                    .mockResolvedValueOnce(mockCourseWithTimestamp)
                    .mockResolvedValueOnce(mockPackagedCourseData);

                const result = await contentService.getPackagedCourse(courseId);

                expect(result).toBeDefined();
                expect(result?.course.id).toBe(courseId);
                expect(cacheService.set).toHaveBeenCalled();
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