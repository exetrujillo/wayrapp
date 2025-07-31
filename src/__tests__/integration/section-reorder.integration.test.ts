// src/__tests__/integration/section-reorder.integration.test.ts

/**
 * Integration tests for section reordering functionality within levels.
 * 
 * Tests the complete flow of reordering sections within a level, including
 * validation, authorization, and database operations. Covers both success
 * scenarios and error conditions to ensure robust section management.
 * 
 * @module SectionReorderIntegrationTest
 * @category Integration Tests
 * @category Section Management
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import request from 'supertest';
import app from '../../app';
import { TestFactory } from '../../shared/test/factories/testFactory';
import { CourseFactory, LevelFactory, SectionFactory } from '../../shared/test/factories/contentFactory';

const API_BASE = '/api/v1';

describe('Section Reorder Integration Tests', () => {
  let adminToken: string;
  let contentCreatorToken: string;
  let studentToken: string;
  let testCourse: any;
  let testLevel: any;

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
      id: 'test-course-sec-ord',
      name: 'Test Course for Section Reorder'
    });

    await request(app)
      .post(`${API_BASE}/courses`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testCourseData)
      .expect(201);

    const testLevelData = LevelFactory.buildDto(testCourseData.id, {
      id: 'test-level-section-reorder',
      name: 'Test Level',
      order: 1
    });

    await request(app)
      .post(`${API_BASE}/courses/${testCourseData.id}/levels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testLevelData)
      .expect(201);

    // Store references for tests
    testCourse = { id: testCourseData.id };
    testLevel = { id: testLevelData.id };

    // Create test sections using API
    const section1Data = SectionFactory.buildDto(testLevelData.id, {
      id: 'section-001',
      name: 'Section 1',
      order: 1
    });

    const section2Data = SectionFactory.buildDto(testLevelData.id, {
      id: 'section-002',
      name: 'Section 2',
      order: 2
    });

    const section3Data = SectionFactory.buildDto(testLevelData.id, {
      id: 'section-003',
      name: 'Section 3',
      order: 3
    });

    await request(app)
      .post(`${API_BASE}/levels/${testLevelData.id}/sections`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(section1Data)
      .expect(201);

    await request(app)
      .post(`${API_BASE}/levels/${testLevelData.id}/sections`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(section2Data)
      .expect(201);

    await request(app)
      .post(`${API_BASE}/levels/${testLevelData.id}/sections`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(section3Data)
      .expect(201);
  });

  afterAll(async () => {
    await TestFactory.prisma.$disconnect();
  });

  describe('PUT /levels/:levelId/sections/reorder', () => {
    it('should successfully reorder sections as admin', async () => {
      const newOrder = ['section-003', 'section-001', 'section-002'];

      const response = await request(app)
        .put(`${API_BASE}/levels/${testLevel.id}/sections/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section_ids: newOrder })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Level sections reordered successfully');

      // Verify the new order in database
      const sections = await TestFactory.prisma.section.findMany({
        where: { levelId: testLevel.id },
        orderBy: { order: 'asc' }
      });

      expect(sections).toHaveLength(3);
      expect(sections[0]?.id).toBe('section-003');
      expect(sections[0]?.order).toBe(1);
      expect(sections[1]?.id).toBe('section-001');
      expect(sections[1]?.order).toBe(2);
      expect(sections[2]?.id).toBe('section-002');
      expect(sections[2]?.order).toBe(3);
    });

    it('should successfully reorder sections as content creator', async () => {
      const newOrder = ['section-002', 'section-003', 'section-001'];

      const response = await request(app)
        .put(`${API_BASE}/levels/${testLevel.id}/sections/reorder`)
        .set('Authorization', `Bearer ${contentCreatorToken}`)
        .send({ section_ids: newOrder })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Level sections reordered successfully');

      // Verify the new order in database
      const sections = await TestFactory.prisma.section.findMany({
        where: { levelId: testLevel.id },
        orderBy: { order: 'asc' }
      });

      expect(sections).toHaveLength(3);
      expect(sections[0]?.id).toBe('section-002');
      expect(sections[0]?.order).toBe(1);
      expect(sections[1]?.id).toBe('section-003');
      expect(sections[1]?.order).toBe(2);
      expect(sections[2]?.id).toBe('section-001');
      expect(sections[2]?.order).toBe(3);
    });

    it('should reject reorder request from student', async () => {
      const newOrder = ['section-001', 'section-002', 'section-003'];

      await request(app)
        .put(`${API_BASE}/levels/${testLevel.id}/sections/reorder`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ section_ids: newOrder })
        .expect(403);
    });

    it('should reject reorder request without authentication', async () => {
      const newOrder = ['section-001', 'section-002', 'section-003'];

      await request(app)
        .put(`${API_BASE}/levels/${testLevel.id}/sections/reorder`)
        .send({ section_ids: newOrder })
        .expect(401);
    });

    it('should reject reorder with non-existent level', async () => {
      const newOrder = ['section-001', 'section-002', 'section-003'];

      const response = await request(app)
        .put(`${API_BASE}/levels/non-existent-level/sections/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with sections not in level', async () => {
      const newOrder = ['section-001', 'section-002', 'non-existent-section'];

      const response = await request(app)
        .put(`${API_BASE}/levels/${testLevel.id}/sections/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with missing sections', async () => {
      const newOrder = ['section-001', 'section-002']; // Missing section-003

      const response = await request(app)
        .put(`${API_BASE}/levels/${testLevel.id}/sections/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with duplicate section IDs', async () => {
      const newOrder = ['section-001', 'section-002', 'section-001']; // Duplicate

      const response = await request(app)
        .put(`${API_BASE}/levels/${testLevel.id}/sections/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with empty section array', async () => {
      const response = await request(app)
        .put(`${API_BASE}/levels/${testLevel.id}/sections/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section_ids: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with invalid request body', async () => {
      const response = await request(app)
        .put(`${API_BASE}/levels/${testLevel.id}/sections/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invalid_field: ['section-001'] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Section Reorder Edge Cases', () => {
    it('should handle reorder with single section', async () => {
      // Create a level with only one section
      const singleSectionLevelData = LevelFactory.buildDto(testCourse.id, {
        id: 'single-section-level',
        name: 'Single Section Level',
        order: 2
      });

      await request(app)
        .post(`${API_BASE}/courses/${testCourse.id}/levels`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(singleSectionLevelData)
        .expect(201);

      const singleSectionData = SectionFactory.buildDto(singleSectionLevelData.id, {
        id: 'single-section',
        name: 'Single Section',
        order: 1
      });

      await request(app)
        .post(`${API_BASE}/levels/${singleSectionLevelData.id}/sections`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(singleSectionData)
        .expect(201);

      const response = await request(app)
        .put(`${API_BASE}/levels/${singleSectionLevelData.id}/sections/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section_ids: ['single-section'] })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify section still has order 1
      const section = await TestFactory.prisma.section.findUnique({
        where: { id: 'single-section' }
      });
      expect(section?.order).toBe(1);
    });

    it('should maintain referential integrity during reorder', async () => {
      // Get initial section data
      const initialSections = await TestFactory.prisma.section.findMany({
        where: { levelId: testLevel.id },
        orderBy: { order: 'asc' }
      });

      const newOrder = ['section-001', 'section-003', 'section-002'];

      await request(app)
        .put(`${API_BASE}/levels/${testLevel.id}/sections/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ section_ids: newOrder })
        .expect(200);

      // Verify all sections still exist and belong to correct level
      const finalSections = await TestFactory.prisma.section.findMany({
        where: { levelId: testLevel.id },
        orderBy: { order: 'asc' }
      });

      expect(finalSections).toHaveLength(initialSections.length);
      finalSections.forEach(section => {
        expect(section.levelId).toBe(testLevel.id);
      });

      // Verify no duplicate orders
      const orders = finalSections.map(s => s.order);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(orders.length);
    });
  });
});