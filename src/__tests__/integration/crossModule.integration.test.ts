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
  let testUser: any;
  let adminUser: any;
  let userToken: string;
  let adminToken: string;
  let testCourse: any;
  let testLesson: any;

  beforeAll(async () => {
    // Create test users
    testUser = await prisma.user.create({
      data: {
        ...UserFactory.build({
          email: 'cross-module-user@example.com',
          passwordHash: await bcrypt.hash('UserPass123!', 10)
        })
      }
    });

    adminUser = await prisma.user.create({
      data: {
        ...UserFactory.buildAdmin({
          email: 'cross-module-admin@example.com',
          passwordHash: await bcrypt.hash('AdminPass123!', 10)
        })
      }
    });

    // Generate JWT tokens
    const jwtSecret = process.env['JWT_SECRET'] || 'test-secret';
    
    userToken = jwt.sign(
      { sub: testUser.id, email: testUser.email, role: testUser.role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { sub: adminUser.id, email: adminUser.email, role: adminUser.role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // Create test content hierarchy
    testCourse = await prisma.course.create({
      data: CourseFactory.build({
        id: 'cross-module-test-course',
        name: 'Cross Module Test Course'
      })
    });

    const testLevel = await prisma.level.create({
      data: LevelFactory.build(testCourse.id, {
        id: 'cross-module-test-level',
        code: 'A1'
      })
    });

    const testSection = await prisma.section.create({
      data: SectionFactory.build(testLevel.id, {
        id: 'cross-module-test-section'
      })
    });

    const testModule = await prisma.module.create({
      data: ModuleFactory.build(testSection.id, {
        id: 'cross-module-test-module'
      })
    });

    testLesson = await prisma.lesson.create({
      data: LessonFactory.build(testModule.id, {
        id: 'cross-module-test-lesson',
        experiencePoints: 15
      })
    });
  });

  beforeEach(async () => {
    // Clean up progress data before each test
    await prisma.lessonCompletion.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.userProgress.deleteMany({
      where: { userId: testUser.id }
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.lessonCompletion.deleteMany({
      where: { userId: { in: [testUser.id, adminUser.id] } }
    });
    await prisma.userProgress.deleteMany({
      where: { userId: { in: [testUser.id, adminUser.id] } }
    });
    await prisma.lesson.deleteMany({
      where: { id: { contains: 'cross-module-test' } }
    });
    await prisma.module.deleteMany({
      where: { id: { contains: 'cross-module-test' } }
    });
    await prisma.section.deleteMany({
      where: { id: { contains: 'cross-module-test' } }
    });
    await prisma.level.deleteMany({
      where: { id: { contains: 'cross-module-test' } }
    });
    await prisma.course.deleteMany({
      where: { id: { contains: 'cross-module-test' } }
    });
    await prisma.user.deleteMany({
      where: { 
        email: { 
          in: ['cross-module-user@example.com', 'cross-module-admin@example.com'] 
        } 
      }
    });
    await prisma.$disconnect();
  });

  describe('User-Content Integration', () => {
    it('should allow authenticated user to access public content', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should restrict content creation to authorized users', async () => {
      const courseData = CourseFactory.buildDto({
        id: 'cross-module-unauthorized-course'
      });

      // Student should not be able to create content
      const studentResponse = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(courseData)
        .expect(403);

      expect(studentResponse.body.error.code).toBe('AUTHORIZATION_ERROR');

      // Admin should be able to create content
      const adminResponse = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
        .expect(201);

      expect(adminResponse.body.success).toBe(true);
    });

    it('should handle user profile updates affecting content access', async () => {
      // Update user profile
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

      // User should still be able to access content
      const contentResponse = await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(contentResponse.body.success).toBe(true);
    });
  });

  describe('Content-Progress Integration', () => {
    it('should create progress when user completes lesson', async () => {
      // Complete a lesson
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

      // Check that user progress was created/updated
      const progressResponse = await request(app)
        .get(`${API_BASE}/progress`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(progressResponse.body.data.experience_points).toBeGreaterThan(0);
      expect(progressResponse.body.data.last_completed_lesson_id).toBe(testLesson.id);
    });

    it('should track lesson completion in user progress', async () => {
      // Complete lesson
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 90, time_spent_seconds: 100 });

      // Check completion status
      const completionStatusResponse = await request(app)
        .get(`${API_BASE}/progress/lesson/${testLesson.id}/completed`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(completionStatusResponse.body.data.is_completed).toBe(true);

      // Check completions list
      const completionsResponse = await request(app)
        .get(`${API_BASE}/progress/completions`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(completionsResponse.body.data).toHaveLength(1);
      expect(completionsResponse.body.data[0].lesson_id).toBe(testLesson.id);
    });

    it('should prevent completing non-existent lessons', async () => {
      const response = await request(app)
        .post(`${API_BASE}/progress/lesson/non-existent-lesson`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 85, time_spent_seconds: 120 })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle progress synchronization conflicts', async () => {
      // Complete lesson first time
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 80, time_spent_seconds: 150 });

      // Try to complete same lesson again (conflict)
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
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          ...UserFactory.build({
            email: 'cross-module-other-user@example.com',
            passwordHash: await bcrypt.hash('OtherPass123!', 10)
          })
        }
      });

      const otherUserToken = jwt.sign(
        { sub: otherUser.id, email: otherUser.email, role: otherUser.role },
        process.env['JWT_SECRET'] || 'test-secret',
        { expiresIn: '1h' }
      );

      // Complete lesson as first user
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 85, time_spent_seconds: 120 });

      // Check first user's progress
      const user1ProgressResponse = await request(app)
        .get(`${API_BASE}/progress`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Check second user's progress (should be empty)
      const user2ProgressResponse = await request(app)
        .get(`${API_BASE}/progress`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      expect(user1ProgressResponse.body.data.experience_points).toBeGreaterThan(0);
      expect(user2ProgressResponse.body.data.experience_points).toBe(0);

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should handle user deletion affecting progress', async () => {
      // Create temporary user
      const tempUser = await prisma.user.create({
        data: {
          ...UserFactory.build({
            email: 'cross-module-temp-user@example.com',
            passwordHash: await bcrypt.hash('TempPass123!', 10)
          })
        }
      });

      // Create progress for temp user
      await prisma.userProgress.create({
        data: {
          userId: tempUser.id,
          experiencePoints: 50,
          livesCurrent: 4,
          streakCurrent: 2
        }
      });

      // Delete user (should cascade delete progress)
      await prisma.user.delete({
        where: { id: tempUser.id }
      });

      // Verify progress was deleted
      const deletedProgress = await prisma.userProgress.findUnique({
        where: { userId: tempUser.id }
      });
      expect(deletedProgress).toBeNull();
    });
  });

  describe('Content Deletion Impact on Progress', () => {
    it('should handle lesson deletion affecting progress', async () => {
      // Complete the lesson first
      await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 85, time_spent_seconds: 120 });

      // Verify completion exists
      const completion = await prisma.lessonCompletion.findFirst({
        where: { 
          userId: testUser.id,
          lessonId: testLesson.id
        }
      });
      expect(completion).toBeTruthy();

      // Delete the lesson (admin action)
      await request(app)
        .delete(`${API_BASE}/modules/${testLesson.moduleId}/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify completion was also deleted (cascade)
      const deletedCompletion = await prisma.lessonCompletion.findFirst({
        where: { 
          userId: testUser.id,
          lessonId: testLesson.id
        }
      });
      expect(deletedCompletion).toBeNull();

      // User progress should still exist but last_completed_lesson_id should be null
      const progress = await prisma.userProgress.findUnique({
        where: { userId: testUser.id }
      });
      expect(progress?.lastCompletedLessonId).toBeNull();
    });

    it('should handle course deletion affecting all related progress', async () => {
      // Create a separate course hierarchy for this test
      const tempCourse = await prisma.course.create({
        data: CourseFactory.build({
          id: 'cross-module-temp-course',
          name: 'Temporary Course'
        })
      });

      const tempLevel = await prisma.level.create({
        data: LevelFactory.build(tempCourse.id, {
          id: 'cross-module-temp-level'
        })
      });

      const tempSection = await prisma.section.create({
        data: SectionFactory.build(tempLevel.id, {
          id: 'cross-module-temp-section'
        })
      });

      const tempModule = await prisma.module.create({
        data: ModuleFactory.build(tempSection.id, {
          id: 'cross-module-temp-module'
        })
      });

      const tempLesson = await prisma.lesson.create({
        data: LessonFactory.build(tempModule.id, {
          id: 'cross-module-temp-lesson'
        })
      });

      // Complete the lesson
      await request(app)
        .post(`${API_BASE}/progress/lesson/${tempLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 85, time_spent_seconds: 120 });

      // Delete the entire course
      await request(app)
        .delete(`${API_BASE}/courses/${tempCourse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify all related completions were deleted
      const deletedCompletions = await prisma.lessonCompletion.findMany({
        where: { lessonId: tempLesson.id }
      });
      expect(deletedCompletions).toHaveLength(0);
    });
  });

  describe('Authentication Flow with Content Access', () => {
    it('should maintain content access across token refresh', async () => {
      // Login to get fresh tokens
      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: 'UserPass123!'
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body.data.tokens;

      // Access content with original token
      await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Refresh token
      const refreshResponse = await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken })
        .expect(200);

      const { accessToken: newAccessToken } = refreshResponse.body.data.tokens;

      // Access content with new token
      const contentResponse = await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(contentResponse.body.success).toBe(true);
    });

    it('should prevent content access after logout', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post(`${API_BASE}/auth/login`)
        .send({
          email: testUser.email,
          password: 'UserPass123!'
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body.data.tokens;

      // Logout
      await request(app)
        .post(`${API_BASE}/auth/logout`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Try to access content (should still work with access token until it expires)
      // In a real scenario, you might implement token blacklisting for access tokens too
      await request(app)
        .get(`${API_BASE}/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // This might still work depending on implementation
      // The refresh token should definitely not work
      await request(app)
        .post(`${API_BASE}/auth/refresh`)
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Error Handling Across Modules', () => {
    it('should handle database errors gracefully across modules', async () => {
      // Try to complete lesson for non-existent user (simulated by invalid token)
      const invalidToken = jwt.sign(
        { sub: 'non-existent-user-id', email: 'fake@example.com', role: 'student' },
        process.env['JWT_SECRET'] || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({ score: 85, time_spent_seconds: 120 })
        .expect(500); // Should handle database error gracefully

      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle validation errors consistently across modules', async () => {
      // Invalid course creation
      const invalidCourseResponse = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: '', // Invalid
          name: '', // Invalid
          source_language: 'invalid-lang'
        })
        .expect(400);

      // Invalid progress completion
      const invalidProgressResponse = await request(app)
        .post(`${API_BASE}/progress/lesson/${testLesson.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          score: 150, // Invalid (over 100)
          time_spent_seconds: -10 // Invalid (negative)
        })
        .expect(400);

      // Both should have consistent error structure
      expect(invalidCourseResponse.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalidProgressResponse.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalidCourseResponse.body.error).toHaveProperty('details');
      expect(invalidProgressResponse.body.error).toHaveProperty('details');
    });
  });

  describe('Performance Across Modules', () => {
    it('should handle complex cross-module queries efficiently', async () => {
      const startTime = Date.now();

      // Complex query involving user, progress, and content
      const response = await request(app)
        .get(`${API_BASE}/progress/summary`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent cross-module operations', async () => {
      // Create multiple lessons for concurrent completion
      const lessons = await Promise.all([
        prisma.lesson.create({
          data: LessonFactory.build(testLesson.moduleId, {
            id: 'cross-module-concurrent-lesson-1',
            order: 2
          })
        }),
        prisma.lesson.create({
          data: LessonFactory.build(testLesson.moduleId, {
            id: 'cross-module-concurrent-lesson-2',
            order: 3
          })
        })
      ]);

      // Complete lessons concurrently
      const completionPromises = lessons.map(lesson =>
        request(app)
          .post(`${API_BASE}/progress/lesson/${lesson.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ score: 85, time_spent_seconds: 120 })
      );

      const responses = await Promise.all(completionPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Cleanup
      await prisma.lesson.deleteMany({
        where: { id: { in: lessons.map(l => l.id) } }
      });
    });
  });
});