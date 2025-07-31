// src/__tests__/integration/module-reorder.integration.test.ts
/**
 * Integration tests for module reordering functionality within sections.
 * 
 * Tests the complete flow of reordering modules within a section, including
 * validation, authorization, and database operations. Covers both success
 * scenarios and error conditions to ensure robust module management.
 * 
 * @module ModuleReorderIntegrationTest
 * @category Integration Tests
 * @category Module Management
 * @author Exequiel Trujillo
 * @since 1.0.0
 */
import request from 'supertest';
import app from '../../app';
import { TestFactory } from '../../shared/test/factories/testFactory';
import { CourseFactory, LevelFactory, SectionFactory, ModuleFactory } from '../../shared/test/factories/contentFactory';

const API_BASE = '/api/v1';

describe('Module Reorder Integration Tests', () => {
  let adminToken: string;
  let contentCreatorToken: string;
  let studentToken: string;
  let testLevel: any;
  let testSection: any;

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
    const testCourse = CourseFactory.buildDto({
      id: 'test-course-mod-ord',
      name: 'Test Course for Module Reorder'
    });

    await request(app)
      .post(`${API_BASE}/courses`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testCourse)
      .expect(201);

    const testLevelData = LevelFactory.buildDto(testCourse.id, {
      id: 'test-level-module-reorder',
      name: 'Test Level',
      order: 1
    });

    await request(app)
      .post(`${API_BASE}/courses/${testCourse.id}/levels`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testLevelData)
      .expect(201);

    const testSectionData = SectionFactory.buildDto(testLevelData.id, {
      id: 'test-section-module-reorder',
      name: 'Test Section',
      order: 1
    });

    await request(app)
      .post(`${API_BASE}/levels/${testLevelData.id}/sections`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testSectionData)
      .expect(201);

    // Store references for tests
    testLevel = { id: testLevelData.id };
    testSection = { id: testSectionData.id };

    // Create test modules using API
    const module1Data = ModuleFactory.buildDto(testSectionData.id, {
      id: 'module-001',
      name: 'Module 1',
      module_type: 'basic_lesson',
      order: 1
    });

    const module2Data = ModuleFactory.buildDto(testSectionData.id, {
      id: 'module-002',
      name: 'Module 2',
      module_type: 'reading',
      order: 2
    });

    const module3Data = ModuleFactory.buildDto(testSectionData.id, {
      id: 'module-003',
      name: 'Module 3',
      module_type: 'dialogue',
      order: 3
    });

    await request(app)
      .post(`${API_BASE}/sections/${testSectionData.id}/modules`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(module1Data)
      .expect(201);

    await request(app)
      .post(`${API_BASE}/sections/${testSectionData.id}/modules`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(module2Data)
      .expect(201);

    await request(app)
      .post(`${API_BASE}/sections/${testSectionData.id}/modules`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(module3Data)
      .expect(201);
  });

  afterAll(async () => {
    await TestFactory.prisma.$disconnect();
  });

  describe('PUT /sections/:sectionId/modules/reorder', () => {
    it('should successfully reorder modules as admin', async () => {
      const newOrder = ['module-003', 'module-001', 'module-002'];

      const response = await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ module_ids: newOrder })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Section modules reordered successfully');

      // Verify the new order in database
      const modules = await TestFactory.prisma.module.findMany({
        where: { sectionId: testSection.id },
        orderBy: { order: 'asc' }
      });

      expect(modules).toHaveLength(3);
      expect(modules[0]?.id).toBe('module-003');
      expect(modules[0]?.order).toBe(1);
      expect(modules[1]?.id).toBe('module-001');
      expect(modules[1]?.order).toBe(2);
      expect(modules[2]?.id).toBe('module-002');
      expect(modules[2]?.order).toBe(3);
    });

    it('should successfully reorder modules as content creator', async () => {
      const newOrder = ['module-002', 'module-003', 'module-001'];

      const response = await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .set('Authorization', `Bearer ${contentCreatorToken}`)
        .send({ module_ids: newOrder })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Section modules reordered successfully');

      // Verify the new order in database
      const modules = await TestFactory.prisma.module.findMany({
        where: { sectionId: testSection.id },
        orderBy: { order: 'asc' }
      });

      expect(modules).toHaveLength(3);
      expect(modules[0]?.id).toBe('module-002');
      expect(modules[0]?.order).toBe(1);
      expect(modules[1]?.id).toBe('module-003');
      expect(modules[1]?.order).toBe(2);
      expect(modules[2]?.id).toBe('module-001');
      expect(modules[2]?.order).toBe(3);
    });

    it('should reject reorder request from student', async () => {
      const newOrder = ['module-001', 'module-002', 'module-003'];

      await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ module_ids: newOrder })
        .expect(403);
    });

    it('should reject reorder request without authentication', async () => {
      const newOrder = ['module-001', 'module-002', 'module-003'];

      await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .send({ module_ids: newOrder })
        .expect(401);
    });

    it('should reject reorder with non-existent section', async () => {
      const newOrder = ['module-001', 'module-002', 'module-003'];

      const response = await request(app)
        .put(`${API_BASE}/sections/non-existent-section/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ module_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with modules not in section', async () => {
      const newOrder = ['module-001', 'module-002', 'non-existent-module'];

      const response = await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ module_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with missing modules', async () => {
      const newOrder = ['module-001', 'module-002']; // Missing module-003

      const response = await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ module_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with duplicate module IDs', async () => {
      const newOrder = ['module-001', 'module-002', 'module-001']; // Duplicate

      const response = await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ module_ids: newOrder })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with empty module array', async () => {
      const response = await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ module_ids: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject reorder with invalid request body', async () => {
      const response = await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invalid_field: ['module-001'] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Module Reorder Edge Cases', () => {
    it('should handle reorder with single module', async () => {
      // Create a section with only one module
      const singleModuleSectionData = SectionFactory.buildDto(testLevel.id, {
        id: 'single-module-section',
        name: 'Single Module Section',
        order: 2
      });

      await request(app)
        .post(`${API_BASE}/levels/${testLevel.id}/sections`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(singleModuleSectionData)
        .expect(201);

      const singleModuleData = ModuleFactory.buildDto(singleModuleSectionData.id, {
        id: 'single-module',
        name: 'Single Module',
        module_type: 'basic_lesson',
        order: 1
      });

      await request(app)
        .post(`${API_BASE}/sections/${singleModuleSectionData.id}/modules`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(singleModuleData)
        .expect(201);

      const response = await request(app)
        .put(`${API_BASE}/sections/${singleModuleSectionData.id}/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ module_ids: ['single-module'] })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify module still has order 1
      const module = await TestFactory.prisma.module.findUnique({
        where: { id: 'single-module' }
      });
      expect(module?.order).toBe(1);
    });

    it('should maintain referential integrity during reorder', async () => {
      // Get initial module data
      const initialModules = await TestFactory.prisma.module.findMany({
        where: { sectionId: testSection.id },
        orderBy: { order: 'asc' }
      });

      const newOrder = ['module-001', 'module-003', 'module-002'];

      await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ module_ids: newOrder })
        .expect(200);

      // Verify all modules still exist and belong to correct section
      const finalModules = await TestFactory.prisma.module.findMany({
        where: { sectionId: testSection.id },
        orderBy: { order: 'asc' }
      });

      expect(finalModules).toHaveLength(initialModules.length);
      finalModules.forEach(module => {
        expect(module.sectionId).toBe(testSection.id);
      });

      // Verify no duplicate orders
      const orders = finalModules.map(m => m.order);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(orders.length);
    });

    it('should preserve module types during reorder', async () => {
      const newOrder = ['module-002', 'module-001', 'module-003'];

      await request(app)
        .put(`${API_BASE}/sections/${testSection.id}/modules/reorder`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ module_ids: newOrder })
        .expect(200);

      // Verify module types are preserved
      const modules = await TestFactory.prisma.module.findMany({
        where: { sectionId: testSection.id },
        orderBy: { order: 'asc' }
      });

      expect(modules[0]?.moduleType).toBe('reading'); // module-002
      expect(modules[1]?.moduleType).toBe('basic_lesson'); // module-001
      expect(modules[2]?.moduleType).toBe('dialogue'); // module-003
    });
  });
});