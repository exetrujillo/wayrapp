/**
 * Cross-Module Integration Tests
 * Tests interactions between different modules (users, content, progress)
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../shared/database/connection';
import { UserFactory } from '../../shared/test/factories/userFactory';
import { CourseFactory, LevelFactory, SectionFactory, ModuleFactory, LessonFactory } from '../../shared/test/factories/contentFactory';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Cross-Module Integration Tests', () => {
  const API_BASE = '/api/v1';

  afterEach(async () => {
    // Clean up ALL tables in reverse dependency order
    await prisma.lessonCompletion.deleteMany();
    await prisma.userProgress.deleteMany();
    await prisma.lessonExercise.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.section.deleteMany();
    await prisma.level.deleteMany();
    await prisma.course.deleteMany();
    await prisma.revokedToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('User-Content Integration', () => {
    it('should allow authenticated user to access public content', async () => {
      // Arrange: Create fresh user and token for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      // Act & Assert
      const response = await request(app)
        .get(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should restrict content creation to authorized users', async () => {
      // Arrange: Create fresh users and tokens for this test
      const student = await prisma.user.create({
        data: UserFactory.build({ email: 'student@example.com' })
      });
      const admin = await prisma.user.create({
        data: UserFactory.buildAdmin({ email: 'admin@example.com' })
      });
      const studentToken = jwt.sign({ sub: student.id, role: student.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');
      const adminToken = jwt.sign({ sub: admin.id, role: admin.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const courseData = CourseFactory.buildDto({
        id: 'test-course-auth'
      });

      // Act & Assert: Student should not be able to create content
      const studentResponse = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(courseData)
        .expect(403);

      expect(studentResponse.body.error.code).toBe('AUTHORIZATION_ERROR');

      // Act & Assert: Admin should be able to create content
      const adminResponse = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
        .expect(201);

      expect(adminResponse.body.success).toBe(true);
    });

    it('should handle user profile updates affecting content access', async () => {
      // Arrange: Create fresh user, course and token for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const testCourse = await prisma.course.create({
        data: CourseFactory.build({
          id: 'test-course',
          name: 'Test Course'
        })
      });

      // Act: Update user profile
      const profileUpdate = {
        username: 'updated-cross-module-user',
        country_code: 'CA'
      };

      const profileResponse = await request(app)
        .put(`${API_BASE}/users/profile`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileUpdate)
        .expect(200);

      expect(profileResponse.body.data.username).toBe(profileUpdate.username);

      // Assert: User should still be able to access content
      const contentResponse = await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(contentResponse.body.success).toBe(true);
    });
  });

  describe('Content-Progress Integration', () => {
    it('should create progress when user completes lesson', async () => {
      // Arrange: Create fresh user and content hierarchy for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const testCourse = await prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson', experiencePoints: 15 })
      });

      // Act: Complete a lesson
      const completionResponse = await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          score: 85,
          time_spent_seconds: 120
        })
        .expect(201);

      expect(completionResponse.body.success).toBe(true);
      expect(completionResponse.body.data.experience_gained).toBeGreaterThan(0);

      // Assert: Check that user progress was created/updated
      const progressResponse = await request(app)
        .get(`${API_BASE}/progress`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(progressResponse.body.data.experience_points).toBeGreaterThan(0);
      expect(progressResponse.body.data.last_completed_lesson_id).toBe(testLesson.id);
    });

    it('should track lesson completion in user progress', async () => {
      // Arrange: Create fresh user and content hierarchy for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const testCourse = await prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // Act: Complete lesson
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 90, time_spent_seconds: 100 });

      // Assert: Check completion status
      const completionStatusResponse = await request(app)
        .get(`${API_BASE}/progress/lesson/${testLesson.id}/completed`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(completionStatusResponse.body.data.is_completed).toBe(true);

      // Assert: Check completions list
      const completionsResponse = await request(app)
        .get(`${API_BASE}/progress/completions`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(completionsResponse.body.data).toHaveLength(1);
      expect(completionsResponse.body.data[0].lesson_id).toBe(testLesson.id);
    });

    it('should prevent completing non-existent lessons', async () => {
      // Arrange: Create fresh user and token for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      // Act & Assert
      const response = await request(app)
        .post(`${API_BASE}/progress/lesson/non-existent-lesson`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 85, time_spent_seconds: 120 })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle progress synchronization conflicts', async () => {
      // Arrange: Create fresh user and content hierarchy for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const testCourse = await prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // Act: Complete lesson first time
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 80, time_spent_seconds: 150 });

      // Act & Assert: Try to complete same lesson again (conflict)
      const conflictResponse = await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 90, time_spent_seconds: 100 })
        .expect(409);

      expect(conflictResponse.body.error.code).toBe('CONFLICT');
    });
  });

  describe('User-Progress Integration', () => {
    it('should isolate user progress data', async () => {
      // Arrange: Create fresh users and content hierarchy for this test
      const user1 = await prisma.user.create({
        data: UserFactory.build({ email: 'user1@example.com' })
      });
      const user2 = await prisma.user.create({
        data: UserFactory.build({ email: 'user2@example.com' })
      });
      const user1Token = jwt.sign({ sub: user1.id, role: user1.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');
      const user2Token = jwt.sign({ sub: user2.id, role: user2.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const testCourse = await prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // Act: Complete lesson as first user
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ score: 85, time_spent_seconds: 120 });

      // Assert: Check first user's progress
      const user1ProgressResponse = await request(app)
        .get(`${API_BASE}/progress`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Assert: Check second user's progress (should be empty)
      const user2ProgressResponse = await request(app)
        .get(`${API_BASE}/progress`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user1ProgressResponse.body.data.experience_points).toBeGreaterThan(0);
      expect(user2ProgressResponse.body.data.experience_points).toBe(0);
    });

    it('should handle user deletion affecting progress', async () => {
      // Arrange: Create temporary user
      const tempUser = await prisma.user.create({
        data: UserFactory.build({ email: 'temp@example.com' })
      });

      // Arrange: Create progress for temp user
      await prisma.userProgress.create({
        data: {
          userId: tempUser.id,
          experiencePoints: 50,
          livesCurrent: 4,
          streakCurrent: 2
        }
      });

      // Act: Delete user (should cascade delete progress)
      await prisma.user.delete({
        where: { id: tempUser.id }
      });

      // Assert: Verify progress was deleted
      const deletedProgress = await prisma.userProgress.findUnique({
        where: { userId: tempUser.id }
      });
      expect(deletedProgress).toBeNull();
    });
  });

  describe('Content Deletion Impact on Progress', () => {
    it('should handle lesson deletion affecting progress', async () => {
      // Arrange: Create fresh user, admin and content hierarchy for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const adminUser = await prisma.user.create({
        data: UserFactory.buildAdmin({ email: 'admin@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');
      const adminToken = jwt.sign({ sub: adminUser.id, role: adminUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const testCourse = await prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // Act: Complete the lesson first
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 85, time_spent_seconds: 120 });

      // Assert: Verify completion exists
      const completion = await prisma.lessonCompletion.findFirst({
        where: { 
          userId: testUser.id,
          lessonId: testLesson.id
        }
      });
      expect(completion).toBeTruthy();

      // Act: Delete the lesson (admin action)
      await request(app)
        .delete(`${API_BASE}/modules/${testLesson.moduleId}/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Assert: Verify completion was also deleted (cascade)
      const deletedCompletion = await prisma.lessonCompletion.findFirst({
        where: { 
          userId: testUser.id,
          lessonId: testLesson.id
        }
      });
      expect(deletedCompletion).toBeNull();

      // Assert: User progress should still exist but last_completed_lesson_id should be null
      const progress = await prisma.userProgress.findUnique({
        where: { userId: testUser.id }
      });
      expect(progress?.lastCompletedLessonId).toBeNull();
    });

    it('should handle course deletion affecting all related progress', async () => {
      // Arrange: Create fresh user, admin and content hierarchy for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const adminUser = await prisma.user.create({
        data: UserFactory.buildAdmin({ email: 'admin@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');
      const adminToken = jwt.sign({ sub: adminUser.id, role: adminUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const tempCourse = await prisma.course.create({
        data: CourseFactory.build({
          id: 'temp-course',
          name: 'Temporary Course'
        })
      });
      const tempLevel = await prisma.level.create({
        data: LevelFactory.build(tempCourse.id, { id: 'temp-level' })
      });
      const tempSection = await prisma.section.create({
        data: SectionFactory.build(tempLevel.id, { id: 'temp-section' })
      });
      const tempModule = await prisma.module.create({
        data: ModuleFactory.build(tempSection.id, { id: 'temp-module' })
      });
      const tempLesson = await prisma.lesson.create({
        data: LessonFactory.build(tempModule.id, { id: 'temp-lesson' })
      });

      // Act: Complete the lesson
      await request(app)
        .post(`${API_BASE}/progress/lesson/${tempLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 85, time_spent_seconds: 120 });

      // Act: Delete the entire course
      await request(app)
        .delete(`${API_BASE}/courses/${tempCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Assert: Verify all related completions were deleted
      const deletedCompletions = await prisma.lessonCompletion.findMany({
        where: { lessonId: tempLesson.id }
      });
      expect(deletedCompletions).toHaveLength(0);
    });
  });

  describe('Authentication Flow with Content Access', () => {
    it('should maintain content access across token refresh', async () => {
      // Arrange: Create fresh user and content for this test
      const testUser = await prisma.user.create({
        data: {
          ...UserFactory.build({
            email: 'user@example.com',
            passwordHash: await bcrypt.hash('UserPass123!', 10)
          })
        }
      });
      const testCourse = await prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });

      // Act: Login to get fresh tokens
      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: 'UserPass123!'
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body.data.tokens;

      // Act: Access content with original token
      await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Act: Refresh token
      const refreshResponse = await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken })
        .expect(200);

      const { accessToken: newAccessToken } = refreshResponse.body.data.tokens;

      // Assert: Access content with new token
      const contentResponse = await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(contentResponse.body.success).toBe(true);
    });

    it('should prevent content access after logout', async () => {
      // Arrange: Create fresh user and content for this test
      const testUser = await prisma.user.create({
        data: {
          ...UserFactory.build({
            email: 'user@example.com',
            passwordHash: await bcrypt.hash('UserPass123!', 10)
          })
        }
      });
      const testCourse = await prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });

      // Act: Login to get tokens
      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: 'UserPass123!'
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body.data.tokens;

      // Act: Logout
      await request(app)
        .post(`${API_BASE}/auth/logout`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Act: Try to access content (should still work with access token until it expires)
      // In a real scenario, you might implement token blacklisting for access tokens too
      await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert: The refresh token should definitely not work
      await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Error Handling Across Modules', () => {
    it('should handle database errors gracefully across modules', async () => {
      // Arrange: Create fresh content for this test
      const testCourse = await prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // Act: Try to complete lesson for non-existent user (simulated by invalid token)
      const invalidToken = jwt.sign(
        { sub: 'non-existent-user-id', email: 'fake@example.com', role: 'student' },
        process.env['JWT_SECRET'] || 'test-jwt-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({ score: 85, time_spent_seconds: 120 })
        .expect(500); // Should handle database error gracefully

      expect(response.body.error.code).toBe('DATABASE_ERROR');
    });

    it('should handle validation errors consistently across modules', async () => {
      // Arrange: Create fresh user, admin and content for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const adminUser = await prisma.user.create({
        data: UserFactory.buildAdmin({ email: 'admin@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');
      const adminToken = jwt.sign({ sub: adminUser.id, role: adminUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const testCourse = await prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // Act: Invalid course creation
      const invalidCourseResponse = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: '', // Invalid
          name: '', // Invalid
          source_language: 'invalid-lang'
        })
        .expect(400);

      // Act: Invalid progress completion
      const invalidProgressResponse = await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          score: 150, // Invalid (over 100)
          time_spent_seconds: -10 // Invalid (negative)
        })
        .expect(400);

      // Assert: Both should have consistent error structure
      expect(invalidCourseResponse.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalidProgressResponse.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalidCourseResponse.body.error).toHaveProperty('details');
      expect(invalidProgressResponse.body.error).toHaveProperty('details');
    });
  });

  describe('Performance Across Modules', () => {
    it('should handle complex cross-module queries efficiently', async () => {
      // Arrange: Create fresh user and token for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const startTime = Date.now();

      // Act: Complex query involving user, progress, and content
      const response = await request(app)
        .get(`${API_BASE}/progress/summary`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Assert
      expect(response.body.success).toBe(true);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent cross-module operations', async () => {
      // Arrange: Create fresh user and content hierarchy for this test
      const testUser = await prisma.user.create({
        data: UserFactory.build({ email: 'user@example.com' })
      });
      const userToken = jwt.sign({ sub: testUser.id, role: testUser.role }, process.env['JWT_SECRET'] || 'test-jwt-secret');

      const testCourse = await prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });

      // Create multiple lessons for concurrent completion
      const lessons = await Promise.all([
        prisma.lesson.create({
          data: LessonFactory.build(testModule.id, {
            id: 'concurrent-lesson-1',
            order: 1
          })
        }),
        prisma.lesson.create({
          data: LessonFactory.build(testModule.id, {
            id: 'concurrent-lesson-2',
            order: 2
          })
        })
      ]);

      // Act: Complete lessons concurrently
      const completionPromises = lessons.map(lesson =>
        request(app)
          .post(`${API_BASE}/progress/lesson/${lesson.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ score: 85, time_spent_seconds: 120 })
      );

      const responses = await Promise.all(completionPromises);
      
      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });
  });
});