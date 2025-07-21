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
  let testUserId: string;
  let testLessonId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: "progress-test@example.com",
        username: "progresstest",
        role: "student",
      },
    });
    testUserId = testUser.id;

    // Create test course structure
    const testCourse = await prisma.course.create({
      data: {
        id: "test-course-progress",
        sourceLanguage: "aym",
        targetLanguage: "es-ES",
        name: "Test Course for Progress",
        description: "Test course for progress tracking",
      },
    });

    const testLevel = await prisma.level.create({
      data: {
        id: "test-level-progress",
        courseId: testCourse.id,
        code: "L1",
        name: "Test Level",
        order: 1,
      },
    });

    const testSection = await prisma.section.create({
      data: {
        id: "test-section-progress",
        levelId: testLevel.id,
        name: "Test Section",
        order: 1,
      },
    });

    const testModule = await prisma.module.create({
      data: {
        id: "test-module-progress",
        sectionId: testSection.id,
        moduleType: "basic_lesson",
        name: "Test Module",
        order: 1,
      },
    });

    const testLesson = await prisma.lesson.create({
      data: {
        id: "test-lesson-progress",
        moduleId: testModule.id,
        experiencePoints: 10,
        order: 1,
      },
    });
    testLessonId = testLesson.id;

    // Generate JWT token
    const jwtSecret = process.env["JWT_SECRET"] || "test-secret";
    authToken = jwt.sign(
      {
        sub: testUserId,
        email: testUser.email,
        role: testUser.role,
      },
      jwtSecret,
      { expiresIn: "1h" },
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.lessonCompletion.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.userProgress.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.lesson.deleteMany({
      where: { id: testLessonId },
    });
    await prisma.module.deleteMany({
      where: { id: "test-module-progress" },
    });
    await prisma.section.deleteMany({
      where: { id: "test-section-progress" },
    });
    await prisma.level.deleteMany({
      where: { id: "test-level-progress" },
    });
    await prisma.course.deleteMany({
      where: { id: "test-course-progress" },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });

    // Close the test database connection
    await prisma.$disconnect();
  });

  describe("GET /api/progress", () => {
    it("should return user progress", async () => {
      const response = await request(app)
        .get("/api/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user_id", testUserId);
      expect(response.body.data).toHaveProperty("experience_points", 0);
      expect(response.body.data).toHaveProperty("lives_current", 5);
      expect(response.body.data).toHaveProperty("streak_current", 0);
    });

    it("should require authentication", async () => {
      await request(app).get("/api/progress").expect(401);
    });
  });

  describe("POST /api/progress/lesson/:id", () => {
    it("should complete a lesson successfully", async () => {
      const response = await request(app)
        .post(`/api/progress/lesson/${testLessonId}`)
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
      await request(app)
        .post(`/api/progress/lesson/${testLessonId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          score: 90,
          time_spent_seconds: 100,
        })
        .expect(409); // Conflict - already completed
    });

    it("should require authentication", async () => {
      await request(app)
        .post(`/api/progress/lesson/${testLessonId}`)
        .send({
          score: 85,
          time_spent_seconds: 120,
        })
        .expect(401);
    });
  });

  describe("GET /api/progress/summary", () => {
    it("should return progress summary", async () => {
      const response = await request(app)
        .get("/api/progress/summary")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user_id", testUserId);
      expect(response.body.data).toHaveProperty("experience_points");
      expect(response.body.data).toHaveProperty("lessons_completed");
      expect(response.body.data.lessons_completed).toBe(1);
    });
  });

  describe("GET /api/progress/lesson/:id/completed", () => {
    it("should check if lesson is completed", async () => {
      const response = await request(app)
        .get(`/api/progress/lesson/${testLessonId}/completed`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("lesson_id", testLessonId);
      expect(response.body.data).toHaveProperty("is_completed", true);
    });
  });

  describe("GET /api/progress/completions", () => {
    it("should return user lesson completions with pagination", async () => {
      const response = await request(app)
        .get("/api/progress/completions")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("total", 1);
    });
  });
});
