import { PrismaClient } from '@prisma/client';
import { ContentService } from '../services';
import { cacheService } from '../../../shared/utils';

// Mock the logger to avoid console output during tests
jest.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  }
}));

describe('Packaged Content API', () => {
  let prisma: PrismaClient;
  let contentService: ContentService;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env['DATABASE_URL'] || 'postgresql://test:test@localhost:5432/test_db'
        }
      }
    });
    contentService = new ContentService(prisma);
  });

  beforeEach(async () => {
    // Clear cache before each test
    await cacheService.clear();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getPackagedCourse', () => {
    const mockCourseData = {
      id: 'test-course-001',
      sourceLanguage: 'pt-BR',
      targetLanguage: 'en',
      name: 'Test Course',
      description: 'Test Description',
      isPublic: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      levels: [
        {
          id: 'test-level-001',
          courseId: 'test-course-001',
          code: 'L1',
          name: 'Level 1',
          order: 1,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T12:00:00Z'),
          sections: [
            {
              id: 'test-section-001',
              levelId: 'test-level-001',
              name: 'Section 1',
              order: 1,
              createdAt: new Date('2024-01-01T00:00:00Z'),
              updatedAt: new Date('2024-01-01T06:00:00Z'),
              modules: [
                {
                  id: 'test-module-001',
                  sectionId: 'test-section-001',
                  moduleType: 'basic_lesson' as const,
                  name: 'Module 1',
                  order: 1,
                  createdAt: new Date('2024-01-01T00:00:00Z'),
                  updatedAt: new Date('2024-01-01T03:00:00Z'),
                  lessons: [
                    {
                      id: 'test-lesson-001',
                      moduleId: 'test-module-001',
                      experiencePoints: 10,
                      order: 1,
                      createdAt: new Date('2024-01-01T00:00:00Z'),
                      updatedAt: new Date('2024-01-01T01:00:00Z'),
                      exercises: [
                        {
                          lessonId: 'test-lesson-001',
                          exerciseId: 'test-exercise-001',
                          order: 1,
                          exercise: {
                            id: 'test-exercise-001',
                            exerciseType: 'translation' as const,
                            data: {
                              source_text: 'Hello',
                              target_text: 'Hola'
                            },
                            createdAt: new Date('2024-01-01T00:00:00Z'),
                            updatedAt: new Date('2024-01-01T00:30:00Z')
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    beforeEach(() => {
      // Mock Prisma queries
      jest.spyOn(prisma.course, 'findUnique').mockImplementation((args: any) => {
        if (args?.include) {
          // Full packaged course query
          return Promise.resolve(mockCourseData as any) as any;
        } else if (args?.select) {
          // Timestamp query for versioning
          return Promise.resolve({
            id: mockCourseData.id,
            updatedAt: mockCourseData.updatedAt,
            levels: mockCourseData.levels.map(level => ({
              updatedAt: level.updatedAt,
              sections: level.sections.map(section => ({
                updatedAt: section.updatedAt,
                modules: section.modules.map(module => ({
                  updatedAt: module.updatedAt,
                  lessons: module.lessons.map(lesson => ({
                    updatedAt: lesson.updatedAt,
                    exercises: lesson.exercises.map(exercise => ({
                      exercise: {
                        updatedAt: exercise.exercise.updatedAt
                      }
                    }))
                  }))
                }))
              }))
            }))
          } as any) as any;
        }
        return Promise.resolve(null) as any;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return packaged course with correct structure', async () => {
      const result = await contentService.getPackagedCourse('test-course-001');

      expect(result).toBeDefined();
      if (result) {
        expect(result.course.id).toBe('test-course-001');
        expect(result.course.source_language).toBe('pt-BR');
        expect(result.course.target_language).toBe('en');
        expect(result.levels).toHaveLength(1);
        expect(result.levels[0]?.sections).toHaveLength(1);
        expect(result.levels[0]?.sections[0]?.modules).toHaveLength(1);
        expect(result.levels[0]?.sections[0]?.modules[0]?.lessons).toHaveLength(1);
        expect(result.levels[0]?.sections[0]?.modules[0]?.lessons[0]?.exercises).toHaveLength(1);
      }
    });

    it('should include correct package version timestamp', async () => {
      const result = await contentService.getPackagedCourse('test-course-001');

      expect(result?.package_version).toBeDefined();
      // The package version should be the latest update time from the hierarchy
      const expectedLatestTime = new Date('2024-01-02T00:00:00Z'); // Course updated time is latest
      expect(result?.package_version).toBe(expectedLatestTime.toISOString());
    });

    it('should cache the packaged course result', async () => {
      // First call
      const result1 = await contentService.getPackagedCourse('test-course-001');
      
      // Second call should use cache (Prisma should only be called once)
      const result2 = await contentService.getPackagedCourse('test-course-001');

      expect(result1).toEqual(result2);
      expect(prisma.course.findUnique).toHaveBeenCalledTimes(2); // Once for timestamp, once for full data
    });

    it('should return null when content is not modified (If-Modified-Since)', async () => {
      const ifModifiedSince = '2024-01-03T00:00:00Z'; // After the latest update
      
      const result = await contentService.getPackagedCourse('test-course-001', ifModifiedSince);

      expect(result).toBeNull();
    });

    it('should return content when it has been modified (If-Modified-Since)', async () => {
      const ifModifiedSince = '2024-01-01T00:00:00Z'; // Before the latest update
      
      const result = await contentService.getPackagedCourse('test-course-001', ifModifiedSince);

      expect(result).toBeDefined();
      expect(result?.course.id).toBe('test-course-001');
    });

    it('should throw error for non-existent course', async () => {
      jest.spyOn(prisma.course, 'findUnique').mockResolvedValue(null);

      await expect(contentService.getPackagedCourse('non-existent-course'))
        .rejects.toThrow("Course with ID 'non-existent-course' not found");
    });
  });

  describe('cache invalidation', () => {
    it('should have invalidatePackagedCourseCache method', async () => {
      const courseId = 'test-course-001';
      
      // Test that the method exists and can be called
      await expect(contentService.invalidatePackagedCourseCache(courseId)).resolves.not.toThrow();
    });

    it('should call invalidatePackagedCourseCache when cache service is available', async () => {
      const courseId = 'test-course-001';
      
      // Spy on the cache service delete method
      const deleteSpy = jest.spyOn(cacheService, 'delete');
      
      // Call the invalidation method
      await contentService.invalidatePackagedCourseCache(courseId);
      
      // Verify that cache.delete was called with the correct key
      expect(deleteSpy).toHaveBeenCalledWith(`packaged_course:${courseId}`);
      
      deleteSpy.mockRestore();
    });
  });
});