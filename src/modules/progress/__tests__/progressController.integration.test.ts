/**
 * Progress Controller Integration Tests
 * Integration tests for progress API endpoints
 */

import request from "supertest";
import app from "../../../app";
import { prisma } from "../../../shared/database/connection";
import jwt from "jsonwebtoken";

describe("Progress API Integration Tests", () => {
  let authToken: string;
  let testUser: any;
  let testCourse: any;
  let testLevel: any;
  let testSection: any;
  let testModule: any;
  let testLesson: any;

  beforeEach(async () => {
    // Create the full data hierarchy IN ORDER
    
    // 1. Create User
    testUser = await prisma.user.create({
      data: {
        email: "progress-test@example.com",
        username: "progresstest",
        role: "student",
      },
    });

    // 2. Create Course
    testCourse = await prisma.course.create({
      data: {
        id: "test-course-prog",
        sourceLanguage: "en",
        targetLanguage: "es",
        name: "Test Course",
        description: "Test course",
        isPublic: true,
      },
    });

    // 3. Create Level
    testLevel = await prisma.level.create({
      data: {
        id: "test-level-prog",
        courseId: testCourse.id,
        code: "A1",
        name: "Beginner Level",
        order: 1,
      },
    });

    // 4. Create Section
    testSection = await prisma.section.create({
      data: {
        id: "test-section-prog",
        levelId: testLevel.id,
        name: "Test Section",
        order: 1,
      },
    });

    // 5. Create Module
    testModule = await prisma.module.create({
      data: {
        id: "test-module-prog",
        sectionId: testSection.id,
        moduleType: "basic_lesson",
        name: "Test Module",
        order: 1,
      },
    });

    // 6. Create Lesson
    testLesson = await prisma.lesson.create({
      data: {
        id: "test-lesson-prog",
        moduleId: testModule.id,
        experiencePoints: 10,
        order: 1,
      },
    });

    // Generate JWT token
    const jwtSecret = process.env["JWT_SECRET"] || "test-secret";
    authToken = jwt.sign(
      {
        sub: testUser.id,
        email: testUser.email,
        role: testUser.role,
      },
      jwtSecret,
      { expiresIn: "1h" },
    );
  });

  afterEach(async () => {
    // Clean up the database IN REVERSE ORDER of creation
    await prisma.lessonCompletion.deleteMany();
    await prisma.userProgress.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.section.deleteMany();
    await prisma.level.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Close the test database connection
    await prisma.$disconnect();
  });

  describe("GET /api/v1/progress", () => {
    it("should return user progress", async () => {
      const response = await request(app)
        .get("/api/v1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user_id", testUser.id);
      expect(response.body.data).toHaveProperty("experience_points", 0);
      expect(response.body.data).toHaveProperty("lives_current", 5);
      expect(response.body.data).toHaveProperty("streak_current", 0);
    });

    it("should require authentication", async () => {
      await request(app).get("/api/v1/progress").expect(401);
    });
  });

  describe("POST /api/v1/progress/lesson/:id", () => {
    it("should complete a lesson successfully", async () => {
      const response = await request(app)
        .post(`/api/v1/progress/lesson/${testLesson.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          score: 85,
          time_spent_seconds: 120,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("progress");
      expect(response.body.data).toHaveProperty("completion");
      expect(response.body.data).toHaveProperty("experience_gained");
      expect(response.body.data.experience_gained).toBe(11); // 10 * 1.1 for score 85
    });

    it("should prevent duplicate lesson completion", async () => {
      // First complete the lesson
      await request(app)
        .post(`/api/v1/progress/lesson/${testLesson.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          score: 85,
          time_spent_seconds: 120,
        })
        .expect(201);

      // Try to complete the same lesson again
      await request(app)
        .post(`/api/v1/progress/lesson/${testLesson.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          score: 90,
          time_spent_seconds: 100,
        })
        .expect(409); // Conflict - already completed
    });

    it("should require authentication", async () => {
      await request(app)
        .post(`/api/v1/progress/lesson/${testLesson.id}`)
        .send({
          score: 85,
          time_spent_seconds: 120,
        })
        .expect(401);
    });
  });

  describe("GET /api/v1/progress/summary", () => {
    it("should return progress summary", async () => {
      const response = await request(app)
        .get("/api/v1/progress/summary")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user_id", testUser.id);
      expect(response.body.data).toHaveProperty("experience_points");
      expect(response.body.data).toHaveProperty("lessons_completed");
      expect(response.body.data.lessons_completed).toBeGreaterThanOrEqual(0);
    });
  });

  describe("GET /api/v1/progress/lesson/:id/completed", () => {
    it("should check if lesson is completed", async () => {
      // Arrange: create the specific state for this test
      await prisma.lessonCompletion.create({
        data: {
          userId: testUser.id,
          lessonId: testLesson.id,
          completedAt: new Date(),
          score: 85,
          timeSpentSeconds: 120,
        },
      });

      // Act & Assert
      const response = await request(app)
        .get(`/api/v1/progress/lesson/${testLesson.id}/completed`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("lesson_id", testLesson.id);
      expect(response.body.data.is_completed).toBe(true);
    });
  });

  describe("GET /api/v1/progress/completions", () => {
    it("should return user lesson completions with pagination", async () => {
      // Arrange: create the specific state for this test
      await prisma.lessonCompletion.create({
        data: {
          userId: testUser.id,
          lessonId: testLesson.id,
          completedAt: new Date(),
          score: 85,
          timeSpentSeconds: 120,
        },
      });
      
      // Act & Assert
      const response = await request(app)
        .get("/api/v1/progress/completions")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(1);
    });
  });
});
