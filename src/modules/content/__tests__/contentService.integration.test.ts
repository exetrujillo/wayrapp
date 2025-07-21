/**
 * Content Service Integration Tests
 * Tests the ContentService with actual database operations
 */
import { ContentService } from "../services/ContentService";
import { getTestDb, cleanupTestDb } from "@/shared/test/testDb";

describe("ContentService Integration Tests", () => {
  let contentService: ContentService;
  let testDb: any;

  beforeAll(async () => {
    // Set up test database
    testDb = await getTestDb();
    contentService = new ContentService(testDb.getClient());
  });

  afterAll(async () => {
    // Clean up test database
    await cleanupTestDb();
  });

  beforeEach(async () => {
    // Clean up data before each test
    const prisma = testDb.getClient();
    await prisma.module.deleteMany();
    await prisma.section.deleteMany();
    await prisma.level.deleteMany();
    await prisma.course.deleteMany();
  });

  describe("Course Management", () => {
    it("should create and retrieve a course", async () => {
      // Arrange
      const courseData = {
        id: "test-course-1",
        source_language: "qu",
        target_language: "es-ES",
        name: "Quechua to Spanish Course",
        description: "Learn Spanish from Quechua",
        is_public: true,
      };

      // Act
      const createdCourse = await contentService.createCourse(courseData);
      const retrievedCourse = await contentService.getCourse(createdCourse.id);

      // Assert
      expect(createdCourse).toBeDefined();
      expect(createdCourse.name).toBe(courseData.name);
      expect(createdCourse.source_language).toBe(courseData.source_language);
      expect(createdCourse.target_language).toBe(courseData.target_language);

      expect(retrievedCourse).toBeDefined();
      expect(retrievedCourse?.id).toBe(createdCourse.id);
      expect(retrievedCourse?.name).toBe(courseData.name);
    });

    it("should list all courses with pagination", async () => {
      // Arrange
      const course1 = {
        id: "course-1",
        source_language: "aym",
        target_language: "es-ES",
        name: "Course 1",
        is_public: true,
      };
      const course2 = {
        id: "course-2",
        source_language: "qu",
        target_language: "pt-BR",
        name: "Course 2",
        is_public: true,
      };
      const course3 = {
        id: "course-3",
        source_language: "es-419",
        target_language: "de",
        name: "Course 3",
        is_public: true,
      };

      await contentService.createCourse(course1);
      await contentService.createCourse(course2);
      await contentService.createCourse(course3);

      // Act
      const result = await contentService.getCourses({ page: 1, limit: 2 });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });

  describe("Course Structure", () => {
    it("should create a complete course structure", async () => {
      // Arrange
      const courseData = {
        id: "course-struct",
        source_language: "en",
        target_language: "es",
        name: "Test Course Structure",
        is_public: true,
      };

      // Act
      const course = await contentService.createCourse(courseData);

      const levelData = {
        id: "level-1",
        course_id: course.id,
        code: "A1",
        name: "Beginner Level",
        order: 1,
      };
      const level = await contentService.createLevel(levelData);

      const sectionData = {
        id: "section-1",
        level_id: level.id,
        name: "Introduction",
        order: 1,
      };
      const section = await contentService.createSection(sectionData);

      const moduleData = {
        id: "module-1",
        section_id: section.id,
        name: "Basic Greetings",
        module_type: "basic_lesson" as const,
        order: 1,
      };
      const module = await contentService.createModule(moduleData);

      // Assert
      expect(course).toBeDefined();
      expect(level).toBeDefined();
      expect(level.course_id).toBe(course.id);
      expect(section).toBeDefined();
      expect(section.level_id).toBe(level.id);
      expect(module).toBeDefined();
      expect(module.section_id).toBe(section.id);
    });

    it("should retrieve course with packaged structure", async () => {
      // Arrange
      const courseData = {
        id: "packaged-course",
        source_language: "en",
        target_language: "es",
        name: "Test Packaged Course",
        is_public: true,
      };
      const course = await contentService.createCourse(courseData);

      const levelData = {
        id: "level-2",
        course_id: course.id,
        code: "A1",
        name: "Beginner Level",
        order: 1,
      };
      const level = await contentService.createLevel(levelData);

      const sectionData = {
        id: "section-2",
        level_id: level.id,
        name: "Introduction",
        order: 1,
      };
      const section = await contentService.createSection(sectionData);

      const moduleData = {
        id: "module-2",
        section_id: section.id,
        name: "Basic Greetings",
        module_type: "basic_lesson" as const,
        order: 1,
      };
      await contentService.createModule(moduleData);

      // Act
      const packagedCourse = await contentService.getPackagedCourse(course.id);

      // Assert
      expect(packagedCourse).toBeDefined();
      expect(packagedCourse?.levels).toHaveLength(1);
      expect(packagedCourse?.levels?.[0]?.sections).toHaveLength(1);
      expect(packagedCourse?.levels?.[0]?.sections?.[0]?.modules).toHaveLength(
        1,
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent course retrieval", async () => {
      // Act & Assert
      await expect(contentService.getCourse("non-existent-id")).rejects.toThrow(
        "Course with ID 'non-existent-id' not found",
      );
    });

    it("should handle duplicate course creation", async () => {
      // Arrange
      const courseData = {
        id: "duplicate-course",
        source_language: "en",
        target_language: "es",
        name: "Duplicate Course",
        is_public: true,
      };
      await contentService.createCourse(courseData);

      // Act & Assert
      await expect(contentService.createCourse(courseData)).rejects.toThrow(
        "Course with ID 'duplicate-course' already exists",
      );
    });
  });
});
