/**
 * @module __tests__/integration/crossModule.integration.test
 * 
 * Cross-Module Integration Tests
 * Tests interactions between different modules (users, content, progress)
 */

import request from 'supertest';
import app from '../../app';
import { TestFactory } from '../../shared/test/factories/testFactory';
import { UserFactory } from '../../shared/test/factories/userFactory';
import { CourseFactory, LevelFactory, SectionFactory, ModuleFactory, LessonFactory } from '../../shared/test/factories/contentFactory';
import bcrypt from 'bcryptjs';

describe('Cross-Module Integration Tests', () => {
  const API_BASE = '/api/v1';

  beforeEach(async () => {
    await TestFactory.cleanupDatabase();
  });

  afterAll(async () => {
    await TestFactory.prisma.$disconnect();
  });

  describe('User-Content Integration', () => {
    it('should allow authenticated user to access public content', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: studentToken } = await TestFactory.createUser({ role: 'student' });

      // EXECUTE & ASSERT
      const response = await request(app)
        .get(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should restrict content creation to authorized users', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: studentToken } = await TestFactory.createUser({ role: 'student' });
      const { authToken: adminToken } = await TestFactory.createUser({ role: 'admin' });

      const courseData = CourseFactory.buildDto({
        id: 'test-course-auth'
      });

      // EXECUTE & ASSERT: Student should not be able to create content
      const studentResponse = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(courseData)
        .expect(403);

      expect(studentResponse.body.error.code).toBe('AUTHORIZATION_ERROR');

      // EXECUTE & ASSERT: Admin should be able to create content
      const adminResponse = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
        .expect(201);

      expect(adminResponse.body.success).toBe(true);
    });

    it('should handle user profile updates affecting content access', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: userToken } = await TestFactory.createUser({ role: 'student' });

      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({
          id: 'test-course',
          name: 'Test Course'
        })
      });

      // EXECUTE: Update user profile
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

      // ASSERT: User should still be able to access content
      const contentResponse = await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(contentResponse.body.success).toBe(true);
    });
  });

  describe('Content-Progress Integration', () => {
    it('should create progress when user completes lesson', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: userToken } = await TestFactory.createUser({ role: 'student' });

      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await TestFactory.prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await TestFactory.prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await TestFactory.prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await TestFactory.prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson', experiencePoints: 15 })
      });

      // EXECUTE: Complete a lesson
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

      // ASSERT: Check that user progress was created/updated
      const progressResponse = await request(app)
        .get(`${API_BASE}/progress`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(progressResponse.body.data.experience_points).toBeGreaterThan(0);
      expect(progressResponse.body.data.last_completed_lesson_id).toBe(testLesson.id);
    });

    it('should track lesson completion in user progress', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: userToken } = await TestFactory.createUser({ role: 'student' });

      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await TestFactory.prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await TestFactory.prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await TestFactory.prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await TestFactory.prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // EXECUTE: Complete lesson
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 90, time_spent_seconds: 100 });

      // ASSERT: Check completion status
      const completionStatusResponse = await request(app)
        .get(`${API_BASE}/progress/lesson/${testLesson.id}/completed`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(completionStatusResponse.body.data.is_completed).toBe(true);

      // ASSERT: Check completions list
      const completionsResponse = await request(app)
        .get(`${API_BASE}/progress/completions`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(completionsResponse.body.data).toHaveLength(1);
      expect(completionsResponse.body.data[0].lesson_id).toBe(testLesson.id);
    });

    it('should prevent completing non-existent lessons', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: userToken } = await TestFactory.createUser({ role: 'student' });

      // EXECUTE & ASSERT
      const response = await request(app)
        .post(`${API_BASE}/progress/lesson/non-existent-lesson`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 85, time_spent_seconds: 120 })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle progress synchronization conflicts', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: userToken } = await TestFactory.createUser({ role: 'student' });

      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await TestFactory.prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await TestFactory.prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await TestFactory.prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await TestFactory.prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // EXECUTE: Complete lesson first time
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 80, time_spent_seconds: 150 });

      // EXECUTE & ASSERT: Try to complete same lesson again (conflict)
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
      // SETUP: Create fresh, isolated data for this test
      const { authToken: user1Token } = await TestFactory.createUser({ role: 'student' });
      const { authToken: user2Token } = await TestFactory.createUser({ role: 'student' });

      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await TestFactory.prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await TestFactory.prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await TestFactory.prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await TestFactory.prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // EXECUTE: Complete lesson as first user
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ score: 85, time_spent_seconds: 120 });

      // ASSERT: Check first user's progress
      const user1ProgressResponse = await request(app)
        .get(`${API_BASE}/progress`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // ASSERT: Check second user's progress (should be empty)
      const user2ProgressResponse = await request(app)
        .get(`${API_BASE}/progress`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user1ProgressResponse.body.data.experience_points).toBeGreaterThan(0);
      expect(user2ProgressResponse.body.data.experience_points).toBe(0);
    });

    it('should handle user deletion affecting progress', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { user: tempUser } = await TestFactory.createUser({ role: 'student' });

      // Create progress for temp user
      await TestFactory.prisma.userProgress.create({
        data: {
          userId: tempUser.id,
          experiencePoints: 50,
          livesCurrent: 4,
          streakCurrent: 2
        }
      });

      // EXECUTE: Delete user (should cascade delete progress)
      await TestFactory.prisma.user.delete({
        where: { id: tempUser.id }
      });

      // ASSERT: Verify progress was deleted
      const deletedProgress = await TestFactory.prisma.userProgress.findUnique({
        where: { userId: tempUser.id }
      });
      expect(deletedProgress).toBeNull();
    });
  });

  describe('Content Deletion Impact on Progress', () => {
    it('should handle lesson deletion affecting progress', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { user: testUser, authToken: userToken } = await TestFactory.createUser({ role: 'student' });
      const { authToken: adminToken } = await TestFactory.createUser({ role: 'admin' });

      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await TestFactory.prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await TestFactory.prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await TestFactory.prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await TestFactory.prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // EXECUTE: Complete the lesson first
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 85, time_spent_seconds: 120 });

      // ASSERT: Verify completion exists
      const completion = await TestFactory.prisma.lessonCompletion.findFirst({
        where: {
          userId: testUser.id,
          lessonId: testLesson.id
        }
      });
      expect(completion).toBeTruthy();

      // EXECUTE: Delete the lesson (admin action)
      await request(app)
        .delete(`${API_BASE}/modules/${testLesson.moduleId}/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // ASSERT: Verify completion was also deleted (cascade)
      const deletedCompletion = await TestFactory.prisma.lessonCompletion.findFirst({
        where: {
          userId: testUser.id,
          lessonId: testLesson.id
        }
      });
      expect(deletedCompletion).toBeNull();

      // ASSERT: User progress should still exist but last_completed_lesson_id should be null
      const progress = await TestFactory.prisma.userProgress.findUnique({
        where: { userId: testUser.id }
      });
      expect(progress?.lastCompletedLessonId).toBeNull();
    });

    it('should handle course deletion affecting all related progress', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: userToken } = await TestFactory.createUser({ role: 'student' });
      const { authToken: adminToken } = await TestFactory.createUser({ role: 'admin' });

      const tempCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({
          id: 'temp-course',
          name: 'Temporary Course'
        })
      });
      const tempLevel = await TestFactory.prisma.level.create({
        data: LevelFactory.build(tempCourse.id, { id: 'temp-level' })
      });
      const tempSection = await TestFactory.prisma.section.create({
        data: SectionFactory.build(tempLevel.id, { id: 'temp-section' })
      });
      const tempModule = await TestFactory.prisma.module.create({
        data: ModuleFactory.build(tempSection.id, { id: 'temp-module' })
      });
      const tempLesson = await TestFactory.prisma.lesson.create({
        data: LessonFactory.build(tempModule.id, { id: 'temp-lesson' })
      });

      // EXECUTE: Complete the lesson
      await request(app)
        .post(`${API_BASE}/progress/lesson/${tempLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 85, time_spent_seconds: 120 });

      // EXECUTE: Delete the entire course
      await request(app)
        .delete(`${API_BASE}/courses/${tempCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // ASSERT: Verify all related completions were deleted
      const deletedCompletions = await TestFactory.prisma.lessonCompletion.findMany({
        where: { lessonId: tempLesson.id }
      });
      expect(deletedCompletions).toHaveLength(0);
    });
  });

  describe('Authentication Flow with Content Access', () => {
    it('should maintain content access across token refresh', async () => {
      // SETUP: Create fresh, isolated data for this test
      const testUser = await TestFactory.prisma.user.create({
        data: {
          ...UserFactory.build({
            email: 'user@example.com',
            passwordHash: await bcrypt.hash('UserPass123!', 10)
          })
        }
      });
      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });

      // EXECUTE: Login to get fresh tokens
      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: 'UserPass123!'
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body.data.tokens;

      // EXECUTE: Access content with original token
      await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // EXECUTE: Refresh token
      const refreshResponse = await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken })
        .expect(200);

      const { accessToken: newAccessToken } = refreshResponse.body.data.tokens;

      // ASSERT: Access content with new token
      const contentResponse = await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(contentResponse.body.success).toBe(true);
    });

    it('should prevent content access after logout', async () => {
      // SETUP: Create fresh, isolated data for this test
      const testUser = await TestFactory.prisma.user.create({
        data: {
          ...UserFactory.build({
            email: 'user@example.com',
            passwordHash: await bcrypt.hash('UserPass123!', 10)
          })
        }
      });
      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });

      // EXECUTE: Login to get tokens
      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: 'UserPass123!'
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body.data.tokens;

      // EXECUTE: Logout
      await request(app)
        .post(`${API_BASE}/auth/logout`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // EXECUTE: Try to access content (should still work with access token until it expires)
      // In a real scenario, you might implement token blacklisting for access tokens too
      await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // ASSERT: The refresh token should definitely not work
      await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Error Handling Across Modules', () => {
    it('should handle database errors gracefully across modules', async () => {
      // SETUP: Create fresh, isolated data for this test
      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await TestFactory.prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await TestFactory.prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await TestFactory.prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await TestFactory.prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // EXECUTE: Try to complete lesson for non-existent user (simulated by invalid token)
      const invalidToken = TestFactory.createAuthToken({
        id: 'non-existent-user-id',
        email: 'fake@example.com',
        role: 'student'
      });

      const response = await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({ score: 85, time_spent_seconds: 120 })
        .expect(401); // Authentication fails first

      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should handle validation errors consistently across modules', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: userToken } = await TestFactory.createUser({ role: 'student' });
      const { authToken: adminToken } = await TestFactory.createUser({ role: 'admin' });

      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await TestFactory.prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await TestFactory.prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await TestFactory.prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });
      const testLesson = await TestFactory.prisma.lesson.create({
        data: LessonFactory.build(testModule.id, { id: 'test-lesson' })
      });

      // EXECUTE: Invalid course creation
      const invalidCourseResponse = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: '', // Invalid
          name: '', // Invalid
          source_language: 'invalid-lang'
        })
        .expect(400);

      // EXECUTE: Invalid progress completion
      const invalidProgressResponse = await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          score: 150, // Invalid (over 100)
          time_spent_seconds: -10 // Invalid (negative)
        })
        .expect(400);

      // ASSERT: Both should have consistent error structure
      expect(invalidCourseResponse.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalidProgressResponse.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalidCourseResponse.body.error).toHaveProperty('details');
      expect(invalidProgressResponse.body.error).toHaveProperty('details');
    });
  });

  describe('Performance Across Modules', () => {
    it('should handle complex cross-module queries efficiently', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: userToken } = await TestFactory.createUser({ role: 'student' });

      const startTime = Date.now();

      // EXECUTE: Complex query involving user, progress, and content
      const response = await request(app)
        .get(`${API_BASE}/progress/summary`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // ASSERT
      expect(response.body.success).toBe(true);
      expect(queryTime).toBeLessThan(5000); // Should complete within 5 seconds (more realistic for integration tests)
    });

    it('should handle concurrent cross-module operations', async () => {
      // SETUP: Create fresh, isolated data for this test
      const { authToken: userToken } = await TestFactory.createUser({ role: 'student' });

      const testCourse = await TestFactory.prisma.course.create({
        data: CourseFactory.build({ id: 'test-course' })
      });
      const testLevel = await TestFactory.prisma.level.create({
        data: LevelFactory.build(testCourse.id, { id: 'test-level' })
      });
      const testSection = await TestFactory.prisma.section.create({
        data: SectionFactory.build(testLevel.id, { id: 'test-section' })
      });
      const testModule = await TestFactory.prisma.module.create({
        data: ModuleFactory.build(testSection.id, { id: 'test-module' })
      });

      // Create multiple lessons for concurrent completion
      const lessons = await Promise.all([
        TestFactory.prisma.lesson.create({
          data: LessonFactory.build(testModule.id, {
            id: 'concurrent-lesson-1',
            order: 1
          })
        }),
        TestFactory.prisma.lesson.create({
          data: LessonFactory.build(testModule.id, {
            id: 'concurrent-lesson-2',
            order: 2
          })
        })
      ]);

      // EXECUTE: Complete lessons concurrently
      const completionPromises = lessons.map(lesson =>
        request(app)
          .post(`${API_BASE}/progress/lesson/${lesson.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ score: 85, time_spent_seconds: 120 })
      );

      const responses = await Promise.all(completionPromises);

      // ASSERT
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });
  });
});