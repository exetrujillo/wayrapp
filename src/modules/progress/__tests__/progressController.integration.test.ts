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
  let adminAuthToken: string;
  let testUser: any;
  let adminUser: any;
  let testCourse: any;
  let testLevel: any;
  let testSection: any;
  let testModule: any;
  let testLesson: any;

  beforeEach(async () => {
    // Create the full data hierarchy IN ORDER
    
    // 1. Create Users
    testUser = await prisma.user.create({
      data: {
        email: "progress-test@example.com",
        username: "progresstest",
        role: "student",
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: "admin-test@example.com",
        username: "admintest",
        role: "admin",
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
        name: "Test Lesson for Progress",
        experiencePoints: 10,
        order: 1,
      },
    });

    // Generate JWT tokens
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

    adminAuthToken = jwt.sign(
      {
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
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

    it("should reject empty lesson ID parameter", async () => {
      await request(app)
        .post("/api/v1/progress/lesson/")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          score: 85,
          time_spent_seconds: 120,
        })
        .expect(400); // Validation middleware now correctly returns 400 for invalid input
    });

    it("should reject invalid score in request body", async () => {
      await request(app)
        .post(`/api/v1/progress/lesson/${testLesson.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          score: 150, // Invalid score > 100
          time_spent_seconds: 120,
        })
        .expect(400);
    });

    it("should reject negative time_spent_seconds", async () => {
      await request(app)
        .post(`/api/v1/progress/lesson/${testLesson.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          score: 85,
          time_spent_seconds: -10, // Invalid negative time
        })
        .expect(400);
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

    it("should reject invalid pagination parameters", async () => {
      await request(app)
        .get("/api/v1/progress/completions?page=0") // Invalid page number
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });

    it("should reject invalid limit parameter", async () => {
      await request(app)
        .get("/api/v1/progress/completions?limit=invalid") // Invalid limit
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe("PUT /api/v1/progress", () => {
    it("should reject invalid experience_points", async () => {
      await request(app)
        .put("/api/v1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          experience_points: -10, // Invalid negative experience
        })
        .expect(400);
    });

    it("should reject invalid lives_current", async () => {
      await request(app)
        .put("/api/v1/progress")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          lives_current: 15, // Invalid lives > 10
        })
        .expect(400);
    });
  });

  describe("PUT /api/v1/progress/sync", () => {
    it("should reject invalid sync data", async () => {
      await request(app)
        .put("/api/v1/progress/sync")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          completions: "invalid", // Should be array
          last_sync_timestamp: "invalid-date",
        })
        .expect(400);
    });

    it("should reject invalid completion data in sync", async () => {
      await request(app)
        .put("/api/v1/progress/sync")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          completions: [
            {
              lesson_id: "", // Invalid empty lesson ID
              completed_at: "2024-01-01T10:00:00Z",
              score: 85,
              time_spent_seconds: 120,
            }
          ],
          last_sync_timestamp: "2024-01-01T09:00:00Z",
        })
        .expect(400);
    });
  });

  describe("PUT /api/v1/progress/lives", () => {
    it("should reject invalid lives_change", async () => {
      await request(app)
        .put("/api/v1/progress/lives")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          lives_change: "invalid", // Should be number
        })
        .expect(400);
    });
  });

  describe("GET /api/v1/progress/lesson/:id/completed", () => {
    it("should reject very long lesson ID parameter", async () => {
      const veryLongId = "a".repeat(70); // Exceeds 60 character limit
      await request(app)
        .get(`/api/v1/progress/lesson/${veryLongId}/completed`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe("POST /api/v1/progress/bonus (Admin)", () => {
    it("should reject non-admin user with 403 Forbidden", async () => {
      const response = await request(app)
        .post("/api/v1/progress/bonus")
        .set("Authorization", `Bearer ${authToken}`) // Using student token
        .send({
          target_user_id: testUser.id,
          bonus_points: 100,
          reason: "Test bonus",
        })
        .expect(403);

      expect(response.body.error.message).toBe("Insufficient permissions");
      expect(response.body.error.code).toBe("AUTHORIZATION_ERROR");
    });

    it("should reject invalid target_user_id", async () => {
      await request(app)
        .post("/api/v1/progress/bonus")
        .set("Authorization", `Bearer ${adminAuthToken}`)
        .send({
          target_user_id: "invalid-uuid", // Invalid UUID format
          bonus_points: 100,
          reason: "Test bonus",
        })
        .expect(400);
    });

    it("should reject invalid bonus_points", async () => {
      await request(app)
        .post("/api/v1/progress/bonus")
        .set("Authorization", `Bearer ${adminAuthToken}`)
        .send({
          target_user_id: testUser.id,
          bonus_points: -10, // Invalid negative points
          reason: "Test bonus",
        })
        .expect(400);
    });

    it("should reject missing reason", async () => {
      await request(app)
        .post("/api/v1/progress/bonus")
        .set("Authorization", `Bearer ${adminAuthToken}`)
        .send({
          target_user_id: testUser.id,
          bonus_points: 100,
          // Missing reason
        })
        .expect(400);
    });
  });

  describe("POST /api/v1/progress/reset (Admin)", () => {
    it("should reject non-admin user with 403 Forbidden", async () => {
      const response = await request(app)
        .post("/api/v1/progress/reset")
        .set("Authorization", `Bearer ${authToken}`) // Using student token
        .send({
          target_user_id: testUser.id,
        })
        .expect(403);

      expect(response.body.error.message).toBe("Insufficient permissions");
      expect(response.body.error.code).toBe("AUTHORIZATION_ERROR");
    });

    it("should reject invalid target_user_id", async () => {
      await request(app)
        .post("/api/v1/progress/reset")
        .set("Authorization", `Bearer ${adminAuthToken}`)
        .send({
          target_user_id: "invalid-uuid", // Invalid UUID format
        })
        .expect(400);
    });

    it("should reject missing target_user_id", async () => {
      await request(app)
        .post("/api/v1/progress/reset")
        .set("Authorization", `Bearer ${adminAuthToken}`)
        .send({
          // Missing target_user_id
        })
        .expect(400);
    });
  });

  describe("GET /api/v1/progress/lesson/:id/stats (Admin/Content Creator)", () => {
    it("should reject very long lesson ID parameter", async () => {
      const veryLongId = "a".repeat(70); // Exceeds 60 character limit
      await request(app)
        .get(`/api/v1/progress/lesson/${veryLongId}/stats`)
        .set("Authorization", `Bearer ${adminAuthToken}`)
        .expect(400);
    });
  });
});
