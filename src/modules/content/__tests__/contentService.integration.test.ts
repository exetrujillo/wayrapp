/**
 * Content Service Integration Tests
 * Tests the ContentService with actual database operations
 */
import { ContentService } from "../services/ContentService";
import { prisma } from "../../../shared/database/connection";

describe("ContentService Integration Tests", () => {
  let contentService: ContentService;

  beforeAll(() => {
    contentService = new ContentService(prisma);
  });

  
  let testCourse: any;
  let testLevel: any;
  let testSection: any;

  beforeEach(async () => {
    // Create the full data hierarchy IN ORDER for content service tests
    contentService = new ContentService(prisma);

    // 1. Create Course
    testCourse = await prisma.course.create({
      data: {
        id: "test-course-content",
        sourceLanguage: "en",
        targetLanguage: "es",
        name: "Test Course",
        description: "Test course for content service",
        isPublic: true,
      },
    });

    // 2. Create Level
    testLevel = await prisma.level.create({
      data: {
        id: "test-level-content",
        courseId: testCourse.id,
        code: "A1",
        name: "Beginner Level",
        order: 1,
      },
    });

    // 3. Create Section
    testSection = await prisma.section.create({
      data: {
        id: "test-section-content",
        levelId: testLevel.id,
        name: "Test Section",
        order: 1,
      },
    });

    // 4. Create Module
    await prisma.module.create({
      data: {
        id: "test-module-content",
        sectionId: testSection.id,
        moduleType: "basic_lesson",
        name: "Test Module",
        order: 1,
      },
    });
  });

  afterEach(async () => {
    // Clean up the database IN REVERSE ORDER of creation
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.section.deleteMany();
    await prisma.level.deleteMany();
    await prisma.course.deleteMany();
  });

  afterAll(async () => {
    // Close the test database connection
    await prisma.$disconnect();
  });

  describe("Course Management", () => {
    it("should create and retrieve a course", async () => {
      // Arrange: create additional course for this specific test
      const courseData = {
        id: "test-course-new",
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
      // Arrange: create additional courses for this specific test
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

      await contentService.createCourse(course1);
      await contentService.createCourse(course2);

      // Act - we now have 3 courses total (testCourse + 2 new ones)
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
      // Arrange: create additional course for this specific test
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
      // Act: use the existing testCourse and create additional structure
      const packagedCourse = await contentService.getPackagedCourse(testCourse.id);

      // Assert
      expect(packagedCourse).toBeDefined();
      expect(packagedCourse?.levels).toHaveLength(1);
      expect(packagedCourse?.levels?.[0]?.sections).toHaveLength(1);
      expect(packagedCourse?.levels?.[0]?.sections?.[0]?.modules).toHaveLength(1);
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
      // Arrange: try to create a course with the same ID as testCourse
      const courseData = {
        id: testCourse.id, // Use existing course ID to trigger duplicate error
        source_language: "en",
        target_language: "es",
        name: "Duplicate Course",
        is_public: true,
      };

      // Act & Assert
      await expect(contentService.createCourse(courseData)).rejects.toThrow(
        `Course with ID '${testCourse.id}' already exists`,
      );
    });
  });
});
