// src/__tests__/integration/lesson-reorder.integration.test.ts

/**
 * Integration tests for lesson reordering functionality within modules.
 * 
 * Tests the complete flow of reordering lessons within a module, including
 * validation, authorization, and database operations. Covers both success
 * scenarios and error conditions to ensure robust lesson management.
 * 
 * @module LessonReorderIntegrationTest
 * @category Integration Tests
 * @category Lesson Management
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import request from 'supertest';
import app from '../../app';
import { TestFactory } from '../../shared/test/factories/testFactory';
import { CourseFactory, LevelFactory, SectionFactory, ModuleFactory } from '../../shared/test/factories/contentFactory';

const API_BASE = '/api/v1';

describe('Lesson Reorder Integration Tests', () => {
  let adminToken: string;
  let contentCreatorToken: string;
  let studentToken: string;
  let testSection: any;
  let testModule: any;

  beforeEach(async () => {
    await TestFactory.cleanupDatabase();

    // Create test users
    const { authToken: adminAuthToken } = await TestFactory.createUser({ role: 'admin' });
    const { authToken: contentCreatorAuthToken } = await TestFactory.createUser({ role: 'content_creator' });
    const { authToken: studentAuthToken } = await TestFactory.createUser({ role: 'student' });

    adminToken = adminAuthToken;
    contentCreatorToken = contentCreatorAuthToken;
    studentToken = studentAuthToken;

    // Create test content structure using API endpoints
    const courseData = CourseFactory.buildDto({
      id: 'test-course-reorder',
      name: 'Test Course for Reorder'
    });

    await request(app)
      .post(`${API_BASE}/courses`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(courseData)
      .expect(201);

    const levelData = LevelFactory.buildDto(courseData.id, {
      id: 'test-level-reorder',
      name: 'Test Level',
      order: 1
    });

    await request(app)
      .post(`${API_BASE}/courses/${courseData.id}/levels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(levelData)
      .expect(201);

    const sectionData = SectionFactory.buildDto(levelData.id, {
      id: 'test-section-reorder',
      name: 'Test Section',
      order: 1
    });

    await request(app)
      .post(`${API_BASE}/levels/${levelData.id}/sections`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sectionData)
      .expect(201);

    const moduleData = ModuleFactory.buildDto(sectionData.id, {
      id: 'test-module-reorder',
      name: 'Test Module',
      module_type: 'basic_lesson',
      order: 1
    });

    await request(app)
      .post(`${API_BASE}/sections/${sectionData.id}/modules`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(moduleData)
      .expect(201);

    // Store references for tests
    testSection = { id: sectionData.id };
    testModule = { id: moduleData.id };

    // Create test lessons using API
    const lesson1Data = {
      id: 'lesson-001',
      name: 'Lesson 1',
      experience_points: 10,
      order: 1
    };

    const lesson2Data = {
      id: 'lesson-002',
      name: 'Lesson 2',
      experience_points: 15,
      order: 2
    };

    const lesson3Data = {
      id: 'lesson-003',
      name: 'Lesson 3',
      experience_points: 20,
      order: 3
    };

    await request(app)
      .post(`${API_BASE}/modules/${moduleData.id}/lessons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(lesson1Data)
      .expect(201);

    await request(app)
      .post(`${API_BASE}/modules/${moduleData.id}/lessons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(lesson2Data)
      .expect(201);

    await request(app)
      .post(`${API_BASE}/modules/${moduleData.id}/lessons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(lesson3Data)
      .expect(201);
  });

  afterAll(async () => {
    await TestFactory.prisma.$disconnect();
  });

  describe('PUT /modules/:moduleId/lessons/reorder', () => {
    it('should successfully reorder lessons as admin', async () => {
      const newOrder = ['lesson-003', 'lesson-001', 'lesson-002'];
      
      const response = await request(app)
        .put(`${API_BASE}/modules/${testModule.id}/lessons/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lesson_ids: newOrder })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Module lessons reordered successfully');

      // Verify the new order in database
      const lessons = await TestFactory.prisma.lesson.findMany({
        where: { moduleId: testModule.id },
        orderBy: { order: 'asc' }
      });

      expect(lessons).toHaveLength(3);
      expect(lessons[0]?.id).toBe('lesson-003');
      expect(lessons[0]?.order).toBe(1);
      expect(lessons[1]?.id).toBe('lesson-001');
      expect(lessons[1]?.order).toBe(2);
      expect(lessons[2]?.id).toBe('lesson-002');
      expect(lessons[2]?.order).toBe(3);
    });

    it('should successfully reorder lessons as content creator', async () => {
      const newOrder = ['lesson-002', 'lesson-003', 'lesson-001'];
      
      const response = await request(app)
        .put(`${API_BASE}/modules/${testModule.id}/lessons/reorder`)
        .set('Authorization', `Bearer ${contentCreatorToken}`)
        .send({ lesson_ids: newOrder })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Module lessons reordered successfully');

      // Verify the new order in database
      const lessons = await TestFactory.prisma.lesson.findMany({
        where: { moduleId: testModule.id },
        orderBy: { order: 'asc' }
      });

      expect(lessons).toHaveLength(3);
      expect(lessons[0]?.id).toBe('lesson-002');
      expect(lessons[0]?.order).toBe(1);
      expect(lessons[1]?.id).toBe('lesson-003');
      expect(lessons[1]?.order).toBe(2);
      expect(lessons[2]?.id).toBe('lesson-001');
      expect(lessons[2]?.order).toBe(3);
    });

    it('should reject reorder request from student', async () => {
      const newOrder = ['lesson-001', 'lesson-002', 'lesson-003'];
      
      await request(app)
        .put(`${API_BASE}/modules/${testModule.id}/lessons/reorder`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ lesson_ids: newOrder })
        .expect(403);
    });

    it('should reject reorder request without authentication', async () => {
      const newOrder = ['lesson-001', 'lesson-002', 'lesson-003'];
      
      await request(app)
        .put(`${API_BASE}/modules/${testModule.id}/lessons/reorder`)
        .send({ lesson_ids: newOrder })
        .expect(401);
    });

    it('should reject reorder with non-existent module', async () => {
      const newOrder = ['lesson-001', 'lesson-002', 'lesson-003'];
      
      const response = await request(app)
        .put(`${API_BASE}/modules/non-existent-module/lessons/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lesson_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with lessons not in module', async () => {
      const newOrder = ['lesson-001', 'lesson-002', 'non-existent-lesson'];
      
      const response = await request(app)
        .put(`${API_BASE}/modules/${testModule.id}/lessons/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lesson_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with missing lessons', async () => {
      const newOrder = ['lesson-001', 'lesson-002']; // Missing lesson-003
      
      const response = await request(app)
        .put(`${API_BASE}/modules/${testModule.id}/lessons/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lesson_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with duplicate lesson IDs', async () => {
      const newOrder = ['lesson-001', 'lesson-002', 'lesson-001']; // Duplicate
      
      const response = await request(app)
        .put(`${API_BASE}/modules/${testModule.id}/lessons/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lesson_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with empty lesson array', async () => {
      const response = await request(app)
        .put(`${API_BASE}/modules/${testModule.id}/lessons/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lesson_ids: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with invalid request body', async () => {
      const response = await request(app)
        .put(`${API_BASE}/modules/${testModule.id}/lessons/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invalid_field: ['lesson-001'] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Lesson Reorder Edge Cases', () => {
    it('should handle reorder with single lesson', async () => {
      // Create a module with only one lesson
      const singleModuleData = ModuleFactory.buildDto(testSection.id, {
        id: 'single-lesson-module',
        name: 'Single Lesson Module',
        module_type: 'basic_lesson',
        order: 2
      });

      await request(app)
        .post(`${API_BASE}/sections/${testSection.id}/modules`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(singleModuleData)
        .expect(201);

      const singleLessonData = {
        id: 'single-lesson',
        name: 'Single Lesson',
        experience_points: 10,
        order: 1
      };

      await request(app)
        .post(`${API_BASE}/modules/${singleModuleData.id}/lessons`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(singleLessonData)
        .expect(201);

      const response = await request(app)
        .put(`${API_BASE}/modules/${singleModuleData.id}/lessons/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lesson_ids: ['single-lesson'] })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify lesson still has order 1
      const lesson = await TestFactory.prisma.lesson.findUnique({
        where: { id: 'single-lesson' }
      });
      expect(lesson?.order).toBe(1);
    });

    it('should maintain referential integrity during reorder', async () => {
      // Get initial lesson data
      const initialLessons = await TestFactory.prisma.lesson.findMany({
        where: { moduleId: testModule.id },
        orderBy: { order: 'asc' }
      });

      const newOrder = ['lesson-001', 'lesson-003', 'lesson-002'];
      
      await request(app)
        .put(`${API_BASE}/modules/${testModule.id}/lessons/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lesson_ids: newOrder })
        .expect(200);

      // Verify all lessons still exist and belong to correct module
      const finalLessons = await TestFactory.prisma.lesson.findMany({
        where: { moduleId: testModule.id },
        orderBy: { order: 'asc' }
      });

      expect(finalLessons).toHaveLength(initialLessons.length);
      finalLessons.forEach(lesson => {
        expect(lesson.moduleId).toBe(testModule.id);
      });

      // Verify no duplicate orders
      const orders = finalLessons.map(l => l.order);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(orders.length);
    });
  });
});