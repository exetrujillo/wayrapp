// src/__tests__/integration/level-reorder.integration.test.ts

/**
 * Integration tests for level reordering functionality within courses.
 * 
 * Tests the complete flow of reordering levels within a course, including
 * validation, authorization, and database operations. Covers both success
 * scenarios and error conditions to ensure robust level management.
 * 
 * @module LevelReorderIntegrationTest
 * @category Integration Tests
 * @category Level Management
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import request from 'supertest';
import app from '../../app';
import { TestFactory } from '../../shared/test/factories/testFactory';
import { CourseFactory, LevelFactory } from '../../shared/test/factories/contentFactory';

const API_BASE = '/api/v1';

describe('Level Reorder Integration Tests', () => {
  let adminToken: string;
  let contentCreatorToken: string;
  let studentToken: string;
  let testCourse: any;

  beforeEach(async () => {
    await TestFactory.cleanupDatabase();

    // Create test users
    const { authToken: adminAuthToken } = await TestFactory.createUser({ role: 'admin' });
    const { authToken: contentCreatorAuthToken } = await TestFactory.createUser({ role: 'content_creator' });
    const { authToken: studentAuthToken } = await TestFactory.createUser({ role: 'student' });

    adminToken = adminAuthToken;
    contentCreatorToken = contentCreatorAuthToken;
    studentToken = studentAuthToken;

    // Create test content structure
    const testCourseData = CourseFactory.buildDto({
      id: 'test-course-lvl-ord',
      name: 'Test Course for Level Reorder'
    });

    await request(app)
      .post(`${API_BASE}/courses`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testCourseData)
      .expect(201);

    // Store reference for tests
    testCourse = { id: testCourseData.id };

    // Create test levels using API
    const level1Data = LevelFactory.buildDto(testCourseData.id, {
      id: 'level-001',
      code: 'L1',
      name: 'Level 1',
      order: 1
    });

    const level2Data = LevelFactory.buildDto(testCourseData.id, {
      id: 'level-002',
      code: 'L2',
      name: 'Level 2',
      order: 2
    });

    const level3Data = LevelFactory.buildDto(testCourseData.id, {
      id: 'level-003',
      code: 'L3',
      name: 'Level 3',
      order: 3
    });

    await request(app)
      .post(`${API_BASE}/courses/${testCourseData.id}/levels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(level1Data)
      .expect(201);

    await request(app)
      .post(`${API_BASE}/courses/${testCourseData.id}/levels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(level2Data)
      .expect(201);

    await request(app)
      .post(`${API_BASE}/courses/${testCourseData.id}/levels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(level3Data)
      .expect(201);
  });

  afterAll(async () => {
    await TestFactory.prisma.$disconnect();
  });

  describe('PUT /courses/:courseId/levels/reorder', () => {
    it('should successfully reorder levels as admin', async () => {
      const newOrder = ['level-003', 'level-001', 'level-002'];

      const response = await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level_ids: newOrder })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Course levels reordered successfully');

      // Verify the new order in database
      const levels = await TestFactory.prisma.level.findMany({
        where: { courseId: testCourse.id },
        orderBy: { order: 'asc' }
      });

      expect(levels).toHaveLength(3);
      expect(levels[0]?.id).toBe('level-003');
      expect(levels[0]?.order).toBe(1);
      expect(levels[1]?.id).toBe('level-001');
      expect(levels[1]?.order).toBe(2);
      expect(levels[2]?.id).toBe('level-002');
      expect(levels[2]?.order).toBe(3);
    });

    it('should successfully reorder levels as content creator', async () => {
      const newOrder = ['level-002', 'level-003', 'level-001'];

      const response = await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .set('Authorization', `Bearer ${contentCreatorToken}`)
        .send({ level_ids: newOrder })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Course levels reordered successfully');

      // Verify the new order in database
      const levels = await TestFactory.prisma.level.findMany({
        where: { courseId: testCourse.id },
        orderBy: { order: 'asc' }
      });

      expect(levels).toHaveLength(3);
      expect(levels[0]?.id).toBe('level-002');
      expect(levels[0]?.order).toBe(1);
      expect(levels[1]?.id).toBe('level-003');
      expect(levels[1]?.order).toBe(2);
      expect(levels[2]?.id).toBe('level-001');
      expect(levels[2]?.order).toBe(3);
    });

    it('should reject reorder request from student', async () => {
      const newOrder = ['level-001', 'level-002', 'level-003'];

      await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ level_ids: newOrder })
        .expect(403);
    });

    it('should reject reorder request without authentication', async () => {
      const newOrder = ['level-001', 'level-002', 'level-003'];

      await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .send({ level_ids: newOrder })
        .expect(401);
    });

    it('should reject reorder with non-existent course', async () => {
      const newOrder = ['level-001', 'level-002', 'level-003'];

      const response = await request(app)
        .put(`${API_BASE}/courses/non-existent-course/levels/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with levels not in course', async () => {
      const newOrder = ['level-001', 'level-002', 'non-existent-level'];

      const response = await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with missing levels', async () => {
      const newOrder = ['level-001', 'level-002']; // Missing level-003

      const response = await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with duplicate level IDs', async () => {
      const newOrder = ['level-001', 'level-002', 'level-001']; // Duplicate

      const response = await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with empty level array', async () => {
      const response = await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level_ids: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with invalid request body', async () => {
      const response = await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invalid_field: ['level-001'] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Level Reorder Edge Cases', () => {
    it('should handle reorder with single level', async () => {
      // Create a course with only one level
      const singleLevelCourseData = CourseFactory.buildDto({
        id: 'single-level-course',
        name: 'Single Level Course'
      });

      await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(singleLevelCourseData)
        .expect(201);

      const singleLevelData = LevelFactory.buildDto(singleLevelCourseData.id, {
        id: 'single-level',
        code: 'SL',
        name: 'Single Level',
        order: 1
      });

      await request(app)
        .post(`${API_BASE}/courses/${singleLevelCourseData.id}/levels`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(singleLevelData)
        .expect(201);

      const response = await request(app)
        .put(`${API_BASE}/courses/${singleLevelCourseData.id}/levels/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level_ids: ['single-level'] })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify level still has order 1
      const level = await TestFactory.prisma.level.findUnique({
        where: { id: 'single-level' }
      });
      expect(level?.order).toBe(1);
    });

    it('should maintain referential integrity during reorder', async () => {
      // Get initial level data
      const initialLevels = await TestFactory.prisma.level.findMany({
        where: { courseId: testCourse.id },
        orderBy: { order: 'asc' }
      });

      const newOrder = ['level-001', 'level-003', 'level-002'];

      await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level_ids: newOrder })
        .expect(200);

      // Verify all levels still exist and belong to correct course
      const finalLevels = await TestFactory.prisma.level.findMany({
        where: { courseId: testCourse.id },
        orderBy: { order: 'asc' }
      });

      expect(finalLevels).toHaveLength(initialLevels.length);
      finalLevels.forEach(level => {
        expect(level.courseId).toBe(testCourse.id);
      });

      // Verify no duplicate orders
      const orders = finalLevels.map(l => l.order);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(orders.length);
    });

    it('should preserve level codes during reorder', async () => {
      const newOrder = ['level-002', 'level-001', 'level-003'];

      await request(app)
        .put(`${API_BASE}/courses/${testCourse.id}/levels/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ level_ids: newOrder })
        .expect(200);

      // Verify level codes are preserved
      const levels = await TestFactory.prisma.level.findMany({
        where: { courseId: testCourse.id },
        orderBy: { order: 'asc' }
      });

      expect(levels[0]?.code).toBe('L2'); // level-002
      expect(levels[1]?.code).toBe('L1'); // level-001
      expect(levels[2]?.code).toBe('L3'); // level-003
    });
  });
});